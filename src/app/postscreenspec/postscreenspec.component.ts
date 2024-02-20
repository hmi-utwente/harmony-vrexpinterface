import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { PostScreen } from '../postscreen';
import { PostScreenSpec } from '../postscreenspec';
import { PostScreenComponent } from '../postscreen/postscreen.component';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';

@Component({
  selector: 'app-postscreenspec',
  standalone: true,
  imports: [
    FormsModule,
    ButtonModule,
    InputNumberModule,
    PostScreenComponent
  ],
  templateUrl: './postscreenspec.component.html',
  styleUrl: './postscreenspec.component.css'
})
export class PostScreenSpecComponent {
  _spec : string = "";
  @Input() id! : number;
  @Input() set spec(val : string) {
    this.parseSpec(val); 
    this.specChange.emit(val);
    this._spec = val;
  }
  get spec() {
    return this._spec;
  }
  @Output()
  specChange: EventEmitter<string> = new EventEmitter<string>();
  model : PostScreenSpec = new PostScreenSpec();

  @Output() readSpecEvent = new EventEmitter<number>();
  @Output() writeSpecEvent = new EventEmitter<number>();
  @Output() setSpecEvent = new EventEmitter<number>();

  addScreen(index : number) {
    this.model.screens.splice(index+1, 0, new PostScreen());
    this.rebuildSpec();
  }

  rebuildSpec() {
    this.spec = this.serialize(this.model);
  }

  removeScreen(index : number) {
    //this.model.screens = 
    this.model.screens.splice(index, 1);
    this.rebuildSpec();
  }

  serialize(model : PostScreenSpec) : string {
    return model.screens.map(this.serializeScreen).join("\t");
  }

  serializeScreen(ps : PostScreen) : string {
    return ps.title+"|"+ps.body+"|"+ps.responses.join(";");
  }

  parseSpec(spec : string) {
    this.model.screens = spec.split("\t").filter(i => i).map(this.parseScreen).filter(i => i);
  }

  parseScreen(sspec : string) : PostScreen {
    let els = sspec.split("|");
    let res : PostScreen = new PostScreen;

    res.title = els[0];
    res.body = els[1];
    res.responses = els[2].split(";").filter(i => i);

    return res;
  }
}
