import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PostScreen } from '../postscreen';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-postscreen',
  standalone: true,
  imports: [
    FormsModule,
    ButtonModule,
    InputTextModule
  ],
  templateUrl: './postscreen.component.html',
  styleUrl: './postscreen.component.css'
})
export class PostScreenComponent {
  _screen : PostScreen = new PostScreen();
  @Input() 
  set screen(val : PostScreen) {
    //this.screenChange.emit(val);
    this._screen = val;
  }
  get screen() {
    return this._screen;
  }

  @Output()
  screenChange: EventEmitter<PostScreen> = new EventEmitter<PostScreen>();

  editing : boolean = false;

  startEdit() {
    this.editing = true;
  }

  removeResponse(responseIndex : number) {
    //this._screenEdit.responses = 
    this._screen.responses.splice(responseIndex, 1);
  }

  addResponse() {
    this._screen.responses.push("");
  }

  saveEdit() {
    this.editing = false;
    this.screenChange.emit(this._screen);
  }

}
