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
  @Input() index: number;
  @Input() search: string;
  @Input() sentence: SentenceModel;
  @Output() rerenderEvent = new EventEmitter<any>();
  @Output() refreshEvent = new EventEmitter<any>();

  constructor() {
  }

  selectTranslation(refer_index: number): void {
    this.disableHighlight();
    this.sentence.target = refer_index;
    this.rerenderEvent.emit({forceShowSelected: true});
    this.enableHighlight();
  }

  clone(refer_index: number): void {
    this.disableHighlight();
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
    this.rerenderEvent.emit({forceShowSelected: true});
    const ce = $('#custom-editor');
    ce.text(this.sentence.custom.target_text);
    ce.attr('contenteditable', 'true');
    ce.focus();
    // this.enableHighlight();  不需要重复，onEditBlur将做这个事情
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
    this.disableHighlight();
    this.sentence.custom = null;
    if (this.sentence.refers && this.sentence.refers.length > 0) {
      this.sentence.target = 0;  // TODO: 选中第一个，还是默认引擎？
    } else {
      this.sentence.target = -2;
    }
    this.rerenderEvent.emit({forceShowSelected: true});
    this.enableHighlight();
  }

  getFlagIcon(sentence: SentenceModel): string {
    let icon = 'checkmark icon';
    if (sentence.marked) {
      icon = 'green checkmark icon';
    }
    return icon;
  }

  changeFlagIcon(): void {
    if (this.sentence.target !== -2 && !this.sentence.ignore) {
      this.sentence.marked = !this.sentence.marked;
      this.rerenderEvent.emit({forceShowSelected: true});
    }
  }

  onEditInput(): void {
    this.sentence.custom.target_text = $('#custom-editor').text();
    this.rerenderEvent.emit({forceShowSelected: true});
  }

  onEditFocus(): void {
    if (this.search && this.sentence.target === -1) {
      this.disableHighlight();
    }
  }

  onEditBlur(): void {
    if (this.search && this.sentence.target === -1) {
      this.enableHighlight();
    }
  }

  refresh(): void {
    this.refreshEvent.emit({forceShowSelected: true});
  }

  ignore(): void {
    this.sentence.ignore = !this.sentence.ignore;
    this.rerenderEvent.emit({forceShowSelected: true});
  }

  enableHighlight(): void {
    $(`#table-${this.index}>tbody>tr>td.target-cell`).highlight(this.search);
  }

  disableHighlight(): void {
    $(`#table-${this.index}>tbody>tr>td.target-cell`).unhighlight();
  }

  ngOnInit() {
  }

}
