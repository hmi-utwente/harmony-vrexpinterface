import { Injectable } from '@angular/core';
import { Socket, SocketIoConfig } from 'ngx-socket-io';

const config: SocketIoConfig = { 
    url: 'http://:4444', 
    options: {
        autoConnect: false
    } 
};

@Injectable({
  providedIn: 'root'
})
export class ExpdeviceService extends Socket {

  message = this.fromEvent<string>('devicemsg');
  stimulusspec = this.fromEvent<string>('stimulusspec');
  status = this.fromEvent<string>('devicestatus');

  constructor() {
    console.log("init socketio");
    super(config);
  }

  send_device(msg : string) {
    this.emit('command', msg);
  }
}
