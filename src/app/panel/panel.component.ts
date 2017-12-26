import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
const { shell } = (<any>window).require('electron');
import { SentenceModel } from '../services/model/sentence.model';
import { TranslateModel } from '../services/model/translate.model';
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
    this.sentence.target = this.sentence.refers[refer_index].target_text;
    this.selectedChangeEvent.emit();
  }

  clone(refer_index: number): void {
    if (!this.sentence.custom) {
      const copy = new TranslateModel();
      this.sentence.custom = copy;

      const orig = this.sentence.refers[refer_index];

      copy.engine_name = orig.engine_name;
      copy.source_lang = orig.source_lang;
      copy.target_lang = orig.target_lang;
      copy.source_text = orig.source_text;
      copy.target_text = orig.target_text;

    }

    this.selectedChangeEvent.emit();
    $('#custom-editor').focus();
  }

  onExLink(engine_name: string): void {
    shell.openExternal(engines[engine_name].site);
  }

  getEngineIcon(engine_name: string): string {
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
