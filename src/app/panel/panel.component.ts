import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
const { shell, ipcRenderer } = (<any>window).require('electron');
const { JSDOM } = (<any>window).require('jsdom');
import { VersionModel, SentenceModel } from '../services/model/sentence.model';
import { TranslateModel } from '../services/model/translate.model';
import {EngineManagerService} from '../providers/manager/engine-manager.service';
import {setNodeTexts} from '../parsers/html/html-parser.service';
import {FunctionUtils} from '../services/utils/function-utils';
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

  getSliceTexts(refer: VersionModel): Array<string> {
    const res = [];
    if (this.sentence.source.length === 1) {
      res[0] = refer.target.target_text;
    } else if (refer.divides.length === this.sentence.source.length + 1) {
      for (let i = 0; i < this.sentence.source.length; ++i) {
        res.push(refer.target.target_text.substring(refer.divides[i], refer.divides[i + 1]));
      }
    } else {
      for (const slice of refer.slices) {
        res.push(slice.target_text);
      }
    }
    return res;
  }

  // deep copy: stackoverflow.com/questions/122102/what-is-the-most-efficient-way-to-deep-clone-an-object-in-javascript
  getTargetHtml(refer: VersionModel): string {
    const sliceTexts = this.getSliceTexts(refer);
    if (sliceTexts.length === 1) {
      return sliceTexts[0];
    }

    const newData = {
      texts: sliceTexts,
      index: 0
    };
    const frag = JSDOM.fragment(this.sentence.elhtml);
    setNodeTexts(frag.firstChild, newData);
    return frag.firstChild.innerHTML;
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

  getCustomHtml(): string {
    if (this.sentence.source.length === 1) {
      return this.sentence.custom[0];
    }

    const frag = JSDOM.fragment(this.sentence.elhtml);
    const newData = {
      texts: this.sentence.custom,
      index: 0
    };
    setNodeTexts(frag.firstChild, newData);
    return frag.firstChild.innerHTML;
  }

  updateCustomView(): void {
    const customView = document.getElementById('custom-trans-view');
    if (customView) {
      customView.innerHTML = this.getCustomHtml();
    }
  }

  // 在网络不可用的情况下，可以纯手工翻译(空手翻)
  emptyHandTrans(): void {
    /*this.disableHighlight();
    this.sentence.custom = new TranslateModel({
      engine_name: 'user',
    });

    this.sentence.target = -1;  // 选中定制翻译
    this.rerenderEvent.emit({forceShowSelected: true});
    const ce = $('#custom-editor');
    ce.text(this.sentence.custom.target_text);
    ce.attr('contenteditable', 'true');
    ce.focus();
    this.targetChangedEvent.emit();*/
    // this.enableHighlight();  不需要重复，onEditBlur将做这个事情
  }

  onExLink(engine_name: string): void {
    const srcLang = 'en';
    const dstLang = 'zh-CN';
    let link = engines[engine_name].site;
    if (engine_name === 'Google') {
      link += `/#${srcLang}/${dstLang}/${encodeURIComponent(this.sentence.source.join(' '))}`;
    } else if (engine_name === 'Baidu') {
      const slc = FunctionUtils.baiduLangCode(srcLang);
      const dlc = FunctionUtils.baiduLangCode(dstLang);
      link += `/#${slc}/${dlc}/${encodeURIComponent(this.sentence.source.join(' '))}`;
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
    this.sentence.custom = [];
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

  reTranslate(): void {
    this.refreshEvent.emit({forceShowSelected: true});
  }

  enableHighlight(): void {
    $(`#table-${this.index}>tbody>tr>td.target-cell`).highlight(this.search);
  }

  disableHighlight(): void {
    $(`#table-${this.index}>tbody>tr>td.target-cell`).unhighlight();
  }

  disableDocLink(event: MouseEvent) {
    event.preventDefault();
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
