import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ExpdeviceService } from './services/expdevice.service';
import { ButtonModule } from 'primeng/button';
import { Parser } from 'binary-parser';
import * as THREE from 'three';

interface StimulusSpec {
  name: string;
  instructions: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    ButtonModule
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

  trackStimulusSpec(index: number, spec: StimulusSpec) {
    return spec.name;
  }

  parseStatusV0 = new Parser().endianness("little")
    .int8("ver")
    .int32("PID")
    .floatle("time")
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



  constructor(private eds: ExpdeviceService) {
    eds.connect();
    eds.message.subscribe(msg => {
      console.log(msg);
    });
    eds.stimulusspec.subscribe(msg => {
      var els = msg.split("\t");
      this.stimulus_spec.push({
        name: els[0],
        instructions: els[1]
      });
    });
    eds.status.subscribe(msg => {
      var arr =Uint8Array.from(atob(msg), c => c.charCodeAt(0));
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

}
