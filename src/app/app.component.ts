import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ExpdeviceService } from './services/expdevice.service';
import { ButtonModule } from 'primeng/button';
import { Parser } from 'binary-parser';

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

export class AppComponent {
  title = 'experiment_interface';

  last_status : any | undefined = undefined;
  stimulus_spec : StimulusSpec[] = [];  //{ [id: string] : any; } = {};

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
    });

    eds.send_device("sendstimuli");
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
