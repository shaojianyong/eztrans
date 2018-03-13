import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
const { shell, ipcRenderer } = (<any>window).require('electron');
import { SentenceModel } from '../services/model/sentence.model';
import { TranslateModel } from '../services/model/translate.model';
import {EngineManagerService} from '../providers/manager/engine-manager.service';
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
  @Output() targetChangedEvent = new EventEmitter<any>();

  constructor(private ems: EngineManagerService) {
  }

  selectTranslation(refer_index: number): void {
    if (this.sentence.target === refer_index) {
      return;
    }
    this.disableHighlight();
    this.sentence.target = refer_index;
    this.sentence.marked = false;
    this.rerenderEvent.emit({forceShowSelected: true});
    this.targetChangedEvent.emit();
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
      this.sentence.custom = new TranslateModel({
        engine_name: orig.engine_name,
        source_lang: orig.source_lang,
        target_lang: orig.target_lang,
        source_text: orig.source_text,
        target_text: orig.target_text
      });
    }

    this.sentence.target = -1;  // 选中定制翻译
    this.sentence.marked = false;
    this.rerenderEvent.emit({forceShowSelected: true});
    const ce = $('#custom-editor');
    ce.text(this.sentence.custom.target_text);
    ce.attr('contenteditable', 'true');
    ce.focus();
    this.targetChangedEvent.emit();
    // this.enableHighlight();  不需要重复，onEditBlur将做这个事情
  }

  // 在网络不可用的情况下，可以纯手工翻译(空手翻)
  emptyHandTrans() {
    this.disableHighlight();
    this.sentence.custom = new TranslateModel({
      engine_name: 'user',
      source_lang: this.ems.getSourceLanguage(),
      target_lang: this.ems.getTargetLanguage(),
      source_text: this.sentence.source,
    });

    this.sentence.target = -1;  // 选中定制翻译
    this.rerenderEvent.emit({forceShowSelected: true});
    const ce = $('#custom-editor');
    ce.text(this.sentence.custom.target_text);
    ce.attr('contenteditable', 'true');
    ce.focus();
    this.targetChangedEvent.emit();
    // this.enableHighlight();  不需要重复，onEditBlur将做这个事情
  }

  onExLink(engine_name: string): void {
    const srcLang = 'en';
    const dstLang = 'zh-CN';
    let link = engines[engine_name].site;
    if (engine_name === 'Google') {
      link += `#${srcLang}/${dstLang}/${encodeURIComponent(this.sentence.source)}`;
    }
    console.log(link);
    shell.openExternal(link);
  }

  getEngineIcon(engine_name: string): string {
    return engines[engine_name].icon;
  }

  getHeartIcon(refer_index: number): string {
    let heart = 'heart outline icon';
    if (this.sentence.target === refer_index) {
      heart = 'heart icon';
    }
    return heart;
  }

  removeCustom(): void {
    this.disableHighlight();
    this.sentence.custom = null;
    if (this.sentence.target === -1) {
      if (this.sentence.refers && this.sentence.refers.length > 0) {
        this.sentence.target = 0;
      } else {
        this.sentence.target = -2;
      }
      this.sentence.marked = false;
      this.targetChangedEvent.emit();
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

  skipOver(): void {
    this.sentence.ignore = !this.sentence.ignore;
    this.rerenderEvent.emit({forceShowSelected: true});
    this.targetChangedEvent.emit();
  }

  changeFlagIcon(): void {
    if (this.sentence.target !== -2 && !this.sentence.ignore) {
      this.sentence.marked = !this.sentence.marked;
      this.rerenderEvent.emit({forceShowSelected: true});
    }
  }

  onEditInput(): void {
    this.sentence.custom.target_text = $('#custom-editor').text();
    if (this.sentence.target === -1) {
      this.rerenderEvent.emit({forceShowSelected: true});
      this.targetChangedEvent.emit();
    }
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

  endEditEnterKeyDown(event: KeyboardEvent): void {
    $('#custom-editor').blur();
    event.preventDefault();
  }

  reTranslate(): void {
    this.refreshEvent.emit({forceShowSelected: true});
  }

  enableHighlight(): void {
    $(`#table-${this.index}>tbody>tr>td.target-cell`).highlight(this.search);
  }

  disableHighlight(): void {
    $(`#table-${this.index}>tbody>tr>td.target-cell`).unhighlight();
  }

  ngOnInit() {
    ipcRenderer.on('trans-in-flight', (event) => {
      this.emptyHandTrans();
    });

    ipcRenderer.on('skip_over', (event) => {
      this.skipOver();
    });

    ipcRenderer.on('toggle-flag', (event) => {
      this.changeFlagIcon();
    });

    ipcRenderer.on('retranslate', (event) => {
      this.reTranslate();
    });

  }
}
