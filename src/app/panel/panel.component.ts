import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
const { shell } = (<any>window).require('electron');
import { SentenceModel } from '../services/model/sentence.model';
import { TranslateModel } from '../services/model/translate.model';
import engines from '../providers/manager/engines';

@Component({
  selector: 'app-panel',
  templateUrl: './panel.component.html',
  styleUrls: ['./panel.component.scss']
})
export class PanelComponent implements OnInit {
  @Input() sentence: SentenceModel;
  @Output() rerenderEvent = new EventEmitter<any>();

  constructor() {
  }

  select(refer_index: number): void {
    this.sentence.target = refer_index;
    this.rerenderEvent.emit();
  }

  clone(refer_index: number): void {
    const orig = this.sentence.refers[refer_index];

    if (this.sentence.custom) {
      this.sentence.custom.engine_name = orig.engine_name;
      this.sentence.custom.source_lang = orig.source_lang;
      this.sentence.custom.target_lang = orig.target_lang;
      this.sentence.custom.source_text = orig.source_text;
      this.sentence.custom.target_text = orig.target_text;

    } else {
      const copy = new TranslateModel();
      copy.engine_name = orig.engine_name;
      copy.source_lang = orig.source_lang;
      copy.target_lang = orig.target_lang;
      copy.source_text = orig.source_text;
      copy.target_text = orig.target_text;
      this.sentence.custom = copy;
    }

    this.sentence.target = -1;  // 默认选中定制翻译
    this.rerenderEvent.emit();
    $('#custom-editor').text(this.sentence.custom.target_text);
    $('#custom-editor').attr('contenteditable', 'true');
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
    if (this.sentence.target === refer_index) {
      heart = 'heart icon';
    }
    return heart;
  }

  removeCustom(): void {
    this.sentence.target = 0;  // 选中第一个，还是默认引擎？
    this.sentence.custom = null;
    this.rerenderEvent.emit();
  }

  getFlagIcon(sentence: SentenceModel): string {
    let icon = 'flag outline icon';
    if (sentence.marked) {
      icon = 'flag icon';
    }
    return icon;
  }

  changeFlagIcon(sentence: SentenceModel): void {
    sentence.marked = !sentence.marked;
    this.rerenderEvent.emit();
  }

  onEditInput(): void {
    this.sentence.custom.target_text = $('#custom-editor').text();
    this.rerenderEvent.emit();
  }

  refresh(idx: number, sentence: SentenceModel): void {
    console.log('re-translate');
  }

  ngOnInit() {
  }

}
