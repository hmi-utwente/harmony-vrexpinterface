import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ExpdeviceService } from './services/expdevice.service';
import { ButtonModule } from 'primeng/button';
import { Parser } from 'binary-parser';
import * as THREE from 'three';
import { DialogModule } from 'primeng/dialog';
import { FormsModule } from '@angular/forms';
import { PostScreenSpecComponent } from './postscreenspec/postscreenspec.component';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ToggleButtonChangeEvent, ToggleButtonModule } from 'primeng/togglebutton';
import { InputNumberModule } from 'primeng/inputnumber';

interface StimulusSpec {
  name: string;
  timeScale: number;
  instructions: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    FormsModule,
    RouterOutlet,
    ButtonModule,
    ToggleButtonModule,
    PostScreenSpecComponent,
    InputTextareaModule,
    InputNumberModule,
    DialogModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})


export class AppComponent implements OnInit {
  title = 'experiment_interface';

  last_status : any | undefined = undefined;
  stimulus_spec : StimulusSpec[] = [];  //{ [id: string] : any; } = {};

  circle? : THREE.Mesh;
  circleR? : THREE.Mesh;
  box? : THREE.Mesh;

  renderer? : THREE.WebGLRenderer;
  scene? : THREE.Scene;
  camera? : THREE.Camera;

  screenspec : string = "";
  screenspecid : number = 0;

  hiddenStimuli : string[] = [];

  showHidden : boolean = false;

  timeScaleSetting : number = 1.0;

  JSON:any=JSON;

  setTimeScale(value : number, stimulus? : string) {
    if (stimulus) {
      this.eds.send_device("settimescale\t"+value.toFixed(2)+"\t"+stimulus);
    } else {
      this.eds.send_device("settimescale\t"+value.toFixed(2));
    }
  }

  readSpecEvent(specId : number) {
    this.eds.send_device("readscreenspec\t"+specId);
  }

  setSpecEvent(specId : number) {
    this.eds.send_device("setdefaultscreenspec\t"+specId);
  }

  writeSpecEvent(specId : number) {
    this.eds.send_device("setscreenspec\t"+specId+"\t"+this.screenspec);
  }

  trackStimulusSpec(index: number, spec: StimulusSpec) {
    return spec.name;
  }

  parseStatusV0 = new Parser().endianness("little")
    .int8("ver")
    .int32("PID")
    .floatle("time")
    .floatle("timescale")
    .string("stimulus_name", { length: 32, stripNull: true })
    .floatle("stimulus_time")
    .string("experiment_state", { length: 32, stripNull: true })
    .int32("replay_counter")
    .floatle("fps")
    .uint8("write_log")
    .uint8("write_audio")
    .array("participant_head_transform", {
      type: "floatle",
      length: 7
    })
    .array("participant_lefthand_transform", {
      type: "floatle",
      length: 7
    })
    .array("participant_righthand_transform", {
      type: "floatle",
      length: 7
    })
    .array("robot_transform", {
      type: "floatle",
      length: 7
    })
    .array("return_transform", {
      type: "floatle",
      length: 7
    })
    .array("participant_xyz_yaw", {
      type: "floatle",
      length: 4
    })
    .array("participant_robot_angledist", {
      type: "floatle",
      length: 2
    })
    .array("participant_actor1_angledist", {
      type: "floatle",
      length: 2
    })
    .array("participant_actor2_angledist", {
      type: "floatle",
      length: 2
    })

  loadHiddenStimuli() {
    let _hidden = localStorage.getItem("hiddenStimuli");
    if (_hidden) {
      this.hiddenStimuli = JSON.parse(_hidden);
    }
  }

  storeHiddenStimuli() {
    localStorage.setItem("hiddenStimuli", JSON.stringify(this.hiddenStimuli));
  }

  stimulusHidden(name : string) : boolean {
    let idx = this.hiddenStimuli.indexOf(name);
    return idx >= 0;
  }

  setHidden(name : string, value : ToggleButtonChangeEvent) {
    if (value.checked) {
      this.hideStimulus(name);
    } else {
      this.unhideStimulus(name);
    }
    console.log(name, value);

  }

  hideStimulus(name : string) {
    if (!this.stimulusHidden(name)) {
      this.hiddenStimuli.push(name);
      this.storeHiddenStimuli();
    }
  }

  unhideStimulus(name : string) {
    let idx = this.hiddenStimuli.indexOf(name);
    if (idx >= 0) {
      this.hiddenStimuli.splice(idx, 1);
      this.storeHiddenStimuli();
    }
  }

  constructor(private eds: ExpdeviceService) {
    eds.connect();
    eds.message.subscribe(msg => {
      console.log(msg);
    });
    eds.screenspec.subscribe(msg => {
      //let els = msg.split("\t");
      this.screenspec = msg.substring(msg.indexOf('\t') + 1);
    })
    eds.stimulusspec.subscribe(msg => {
      let els = msg.split("\t");
      let obj = {
          name: els[0],
          timeScale: parseFloat(els[1]),
          instructions: els[2]
      };
      let idx = this.stimulus_spec.findIndex(spec => spec.name == obj.name);
      if (idx >= 0) {
        this.stimulus_spec[idx] = obj;
      } else {
        this.stimulus_spec.push(obj);
      }
    });
    eds.status.subscribe(msg => {
      let arr =Uint8Array.from(atob(msg), c => c.charCodeAt(0));
      this.last_status = this.parseStatusV0.parse(arr);


      if (this.renderer && this.scene && this.camera && this.circle) {
        this.circle.position.set(
          this.last_status.participant_xyz_yaw[0],
          this.last_status.participant_xyz_yaw[2],
          0);
        this.circle.setRotationFromAxisAngle(new THREE.Vector3(0,0,1), THREE.MathUtils.degToRad(-this.last_status.participant_xyz_yaw[3]-30));
        this.renderer.render(this.scene, this.camera);

      }
    });

    eds.send_device("sendstimuli");
    this.loadHiddenStimuli();
  }
  ngOnInit(): void {
    this.createThreeJsBox();
  }

  createThreeJsBox(): void {
    const canvas = document.getElementById('canvas-box');
    this.scene = new THREE.Scene();

    const mBox = new THREE.MeshBasicMaterial({ color: "#a2ad9c" });
    const mUser = new THREE.MeshBasicMaterial({ color: "#e85325" });
    const mRobot = new THREE.MeshBasicMaterial({ color: "#0ee6e2" });


   this.box = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 4, 0.1), 
      mBox
   );

   this.circle = new THREE.Mesh(
      new THREE.CircleGeometry( 0.2 , 3 ),
      mUser
   );

   this.circleR = new THREE.Mesh(
      new THREE.CircleGeometry( 0.15 , 24 ),
      mRobot
   );

   this.scene.add(this.circle, this.circleR, this.box);
   this.box.position.set(0, 1.5, -0.06);
   this.circle.position.set(0, 0, 0);
   this.circleR.position.set(0, 30, 0); // Not shown

  const canvasSizes = {
    width: 150,
    height: 200
   };

  const orthoScale = 70;
  this.camera = new THREE.OrthographicCamera(
    canvasSizes.width / - orthoScale,
    canvasSizes.width / orthoScale,
    canvasSizes.height / orthoScale,
    canvasSizes.height / - orthoScale,
  1, 20);

   /*
   const camera = new THREE.PerspectiveCamera(
    75,
    canvasSizes.width / canvasSizes.height,
    0.001,
    1000
   );
   */
   this.camera.position.y = 1.65;
   this.camera.position.z = 10;
   this.scene.add(this.camera);

   if (!canvas) {
    return;
   }

   this.renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
   });
   this.renderer.setClearColor(0x111111, 1);
   this.renderer.setSize(canvasSizes.width, canvasSizes.height);
   this.renderer.render(this.scene, this.camera);
  }

  refreshStimuli() {
    this.stimulus_spec = [];
    this.eds.send_device("sendstimuli");
  }

  readyStimulus(name : string) {
    this.eds.send_device("ready\t"+name);
  }

  playStimulus(name : string) {
    this.eds.send_device("play\t"+name);
  }

  startInterview() {
    this.eds.send_device("startinterview");
  }

  stopInterview() {
    this.eds.send_device("stopinterview");
  }

  nextParticipant() {
    console.log("next pid");
    this.eds.send_device("nextparticipant");
  }

  editingStimulus : boolean = false;
  editingStimulusName : string | null = null;
  editingStimulusTimeScale : number | null = null;
  editingStimulusInstructions : string | null = null;

  editStimulus(name : string, ts: number, instr : string) {
    this.editingStimulus = true; 
    this.editingStimulusName = name;
    this.editingStimulusTimeScale = ts;
    this.editingStimulusInstructions = instr;
  }

  
  /*
  stopEditingStimulus() {
    this.editingStimulusName = null;
  }
  */

  saveChangedStimulusInstructions() {
    if (this.editingStimulus && this.editingStimulusInstructions != null && this.editingStimulusName != null) {
      if (this.editingStimulusTimeScale != null && this.editingStimulusTimeScale >= 0.1 && this.editingStimulusTimeScale <= 2.0) {
        this.setTimeScale(this.editingStimulusTimeScale, this.editingStimulusName);
      }
      this.eds.send_device("setinstructions\t"+this.editingStimulusName+"\t"+this.editingStimulusInstructions);
      this.editingStimulus = false;
      this.editingStimulusName = null;
      this.editingStimulusInstructions = null;

    }
  }

}
