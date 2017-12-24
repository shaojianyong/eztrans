import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
const { shell } = (<any>window).require('electron');
import { SentenceModel } from '../services/model/sentence.model';
import engines from '../../assets/engines';

@Component({
  selector: 'app-panel',
  templateUrl: './panel.component.html',
  styleUrls: ['./panel.component.scss']
})
export class PanelComponent implements OnInit {
  @Input() sentence: SentenceModel;
  @Output() selectedChangeEvent = new EventEmitter<any>();

  constructor() {
  }

  select(refer_index: number): void {
    console.log(refer_index);
    this.sentence.target = this.sentence.refers[refer_index].target_text;
    this.selectedChangeEvent.emit();
  }

  onExLink(engine_name: string): void {
    shell.openExternal(engines[engine_name].site);
  }

  getnEngineIcon(engine_name: string): string {
    return engines[engine_name].icon;
  }

  getHeartIcon(refer_index: number): string {
    let heart = 'empty heart icon';
    if (this.sentence.target === this.sentence.refers[refer_index].target_text) {
      heart = 'heart icon';
    }
    return heart;
  }

  ngOnInit() {
  }

}
