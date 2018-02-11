import {Component, OnInit, ChangeDetectorRef, ViewChild, HostListener} from '@angular/core';
import {Title} from '@angular/platform-browser';

const electron = (<any>window).require('electron');
const ipc = electron.ipcRenderer;
const dialog = electron.remote.dialog;

import {ExLinksModule} from '../services/utils/ex-links.module';

import { FunctionUtils } from '../services/utils/function-utils';
import {SentenceModel, SentenceStatus} from '../services/model/sentence.model';
import {TranslateModel, TranslateState} from '../services/model/translate.model';
import {ParserManagerService} from '../parsers/manager/parser-manager.service';
import {EngineManagerService} from '../providers/manager/engine-manager.service';
import engines from '../providers/manager/engines';
import {HomeComponent} from '../home/home.component';
import {AboutComponent} from '../about/about.component';
import {SettingsComponent} from '../settings/settings.component';
import {StatisticsModel} from '../services/model/statistics.model';


@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
  providers: [EngineManagerService, ParserManagerService]
})
export class MainComponent implements OnInit {
  cur_index = -1;
  cur_page = 0;
  page_size = 50;
  search_text = '';
  search_result = [];
  filter = '';  // ''(all), skipped, checked, translated, untranslated
  visibility = 0;  // 0-显示所有 1-只显示原文 2-只显示译文，搜索时visibility自动重置

  @ViewChild(HomeComponent) child_home: HomeComponent;
  @ViewChild(SettingsComponent) child_settings: SettingsComponent;
  @ViewChild(AboutComponent) child_about: AboutComponent;

  // 一段无解的代码，在ipcRenderer和ipcMain之间传递的userData不能承载this对象

  constructor(private cdr: ChangeDetectorRef,
              private title: Title,
              private ems: EngineManagerService,
              private pms: ParserManagerService) {
  }

  reset(): void {
    this.cur_page = 0;
    if (this.cur_index !== -1) {
      $(`#item-${this.cur_index}`).css('background-color', 'white');
    }
    this.cur_index = -1;
    this.search_text = '';
    $('#main-search').val('');
    $('#trans-list').unhighlight();
    this.search_result = [];
  }

  // ipcRenderer与ipcMain同步通信
  importFile(event: any): void {
    let group_id = null;
    const group = this.child_home.getCurSelGroup();
    if (event) {
      group_id = event.group_id;
    } else if (group) {
      group_id = group.id;
    } else {
      group_id = 'my-translations';
    }


    const options = {
      title: 'Open a Structured Text File',
      filters: [
        {name: 'Text Files', extensions: ['txt', 'html', 'md', 'po']}
      ]
    };

    dialog.showOpenDialog(options, (files) => {
      if (files) {
        this.reset();
        ipc.send('read-file', files, group_id);  // ('read-file', files, this);  进程之间不能传递对象
      }
    });
  }

  exportFile(): void {
    if (!this.child_home.cur_doc) {
      return;
    }

    const segments = [];
    const parser = this.pms.getParser(this.child_home.cur_doc.data_type);
    parser.load(this.child_home.cur_doc.file_data);

    for (let index = 0; index < this.child_home.cur_doc.sentences.length; ++index) {
      let target_text = '';
      const current = this.child_home.cur_doc.sentences[index];
      if (!current.ignore && current.target !== -2) {
        if (current.target === -1) {
          target_text = current.custom.target_text;
        } else {
          target_text = current.refers[current.target].target_text;
        }
      }
      segments[index] = target_text;
    }
    parser.update(segments);

    const expInfo = this.pms.getExportInfo(this.child_home.cur_doc.data_type);
    const options = {
      title: expInfo.title,
      filters: expInfo.filters
    };
    dialog.showSaveDialog(options, (filename) => {
      if (filename) {
        const fileExt = FunctionUtils.getExtName(filename).toLowerCase();
        ipc.send('save-file', filename, parser.getLastData(fileExt));
      }
    });
  }

  // ipcRenderer与ipcMain同步通信，在JavaScript中，同步代码好丑陋
  // 同步通信，如果ipcMain没有返回，界面会僵住

  onItemClick(index: number): void {
    if (index === this.cur_index) {
      return;
    }

    this.cur_index = index;
    this.rerender();
  }

  onItemContextMenu(index: number): void {
    this.onItemClick(index);
    const sentence = this.child_home.cur_doc.sentences[index];
    ipc.send('show-item-context-menu', {
      page_count: this.getPageCount(),
      cur_page: this.cur_page,
      target: sentence.target,
      skipped: sentence.ignore,
      checked: sentence.marked
    });
  }

  // TODO: 只翻译当前页面的语句？？用户搜索过滤了怎么办？自动撤销搜索翻译？？
  autoTranslate(): void {
    for (let index = 0; index < this.child_home.cur_doc.sentences.length; ++index) {
      const sentence = this.child_home.cur_doc.sentences[index];
      if (sentence.ignore || sentence.marked) {  // 不要动用户的劳动成果
        continue;
      }
      this.translate(index, sentence);
    }
  }

  rerender(): void {
    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }

  forceRerender(event: any): void {
    if (event.hasOwnProperty('resetDocument') && event.resetDocument) {
      this.reset();
    }

    if (event.forceShowSelected) {
      this.showSelectedItem();
    }
    this.rerender();
  }

  findRefer(sentence: SentenceModel, engineName: string): any {
    let res = null;
    let index = 0;
    for (const refer of sentence.refers) {
      if (refer.engine_name === engineName) {
        res = {index: index, refer: refer};
        break;
      }
      ++index;
    }
    return res;
  }

  updateSentenceStatus(sentence: SentenceModel, tranState: string): boolean {
    let changed = false;
    if (tranState !== TranslateState.SUCCESS && tranState !== TranslateState.FAILURE) {
      alert('Bad translate state for update sentence status: ' + tranState);
    }

    if (sentence.status === SentenceStatus.IN_PROC) {
      sentence.status = (tranState === TranslateState.SUCCESS ? SentenceStatus.SUCCESS : SentenceStatus.FAILURE);
      changed = true;
    } else if (sentence.status === SentenceStatus.SUCCESS) {
      if (tranState === TranslateState.FAILURE) {
        sentence.status = SentenceStatus.WARNING;
        changed = true;
      }
    } else if (sentence.status === SentenceStatus.WARNING) {
      // 不需要改变
    } else if (sentence.status === SentenceStatus.FAILURE) {
      if (tranState === TranslateState.SUCCESS) {
        sentence.status = SentenceStatus.WARNING;
        changed = true;
      }
    }
    return changed;
  }

  translate(index: number, sentence: SentenceModel): void {
    sentence.status = SentenceStatus.IN_PROC;
    $(`#src-right-${index}`).attr('class', 'large spinner loading icon');

    for (const engine of this.ems.engine_list) {
      let trans = null;
      let rfidx = 0;
      const result = this.findRefer(sentence, engine.getEngineName());
      if (result && result.refer) {
        rfidx = result.index;
        if (result.refer.trans_state === TranslateState.SUCCESS && result.refer.target_text) {  // TODO: 并且翻译语言没有切换
          continue;  // 不发重复请求
        } else {
          trans = result.refer;
          trans.target_text = 'Waiting for response...';
          trans.trans_state = TranslateState.REQUESTED;
        }
      } else {
        trans = new TranslateModel({
          engine_name: engine.getEngineName(),
          source_lang: this.ems.getSourceLanguage(),
          target_lang: this.ems.getTargetLanguage(),
          source_text: sentence.source,
          target_text: 'Waiting for response...',  // 简化处理
          trans_state: TranslateState.REQUESTED
        });
        rfidx = sentence.refers.length;
        sentence.refers.push(trans);
      }

      engine.translateX(trans, this.child_home.cur_doc.id).subscribe(
        res => {
          if (res.result === 'ok' && trans.target_text) {
            trans.trans_state = TranslateState.SUCCESS;
            // 修正语句的状态
            const statusChanged = this.updateSentenceStatus(sentence, trans.trans_state);

            // 根据评分选用最佳翻译
            let targetChanged = false;
            if (sentence.target === -2) {
              sentence.target = 0;
              targetChanged = true;
            } else if (sentence.target !== -1) {
              if (trans.trans_grade > sentence.refers[sentence.target].trans_grade) {
                sentence.target = rfidx;
                targetChanged = true;
              }
            }

            // 如果文档没有切换，更新视图，否则，不需要更新
            if (res.doc_id === this.child_home.cur_doc.id && (statusChanged || targetChanged)
              && this.getPageRange().indexOf(index) !== -1) {
              this.rerender();
            }
          } else {
            // TODO: 失败的选项，禁止选用！！
            trans.trans_state = TranslateState.FAILURE;
            const statusChanged = this.updateSentenceStatus(sentence, trans.trans_state);
            if (res.doc_id === this.child_home.cur_doc.id && statusChanged
              && this.getPageRange().indexOf(index) !== -1) {
              this.rerender();
            }
            // alert(`Translate failed: ${res.result}`);
          }
        },
        err => {
          trans.trans_state = TranslateState.FAILURE;
          const statusChanged = this.updateSentenceStatus(sentence, trans.trans_state);
          if (err.doc_id === this.child_home.cur_doc.id && statusChanged
            && this.getPageRange().indexOf(index) !== -1) {
            this.rerender();
          }
          // alert(`Translate failed: ${err.result}`);
        }
      );
    }
  }

  getSourceLeftIcon(index: number): string {
    const sentence = this.child_home.cur_doc.sentences[index];
    let icon = 'placeholder icon';  // 占位符
    if (sentence.ignore) {
      icon = 'blue quote left icon';
    } else if (sentence.target === -1) {
      icon = 'placeholder icon';  // 占位符
    } else if (sentence.status === SentenceStatus.INITIAL) {
      icon = 'placeholder icon';  // 占位符
    } else if (sentence.status === SentenceStatus.IN_PROC) {
      icon = 'send icon';
    } else if (sentence.status === SentenceStatus.SUCCESS) {
      icon = 'placeholder icon';  // 占位符
    } else if (sentence.status === SentenceStatus.WARNING) {
      icon = 'orange warning circle icon';
    } else if (sentence.status === SentenceStatus.FAILURE) {
      icon = 'red remove circle icon';
    }
    return icon;
  }

  getSourceRightIcon(index: number): string {
    let icon = 'placeholder icon';
    const sentence = this.child_home.cur_doc.sentences[index];
    for (const refer of sentence.refers) {
      if (refer.trans_state !== TranslateState.SUCCESS && refer.trans_state !== TranslateState.FAILURE) {
        icon = 'spinner loading icon';
        break;
      }
    }
    return icon;
  }

  toggleLeftSide(): void {
    $('#left-side').sidebar({
      context: 'body',
      dimPage: false
    }).sidebar('toggle');
  }

  toggleRightSide(): void {
    $('#right-side').sidebar({
      context: 'body',
      dimPage: false,
      transition: 'overlay'
    }).sidebar('toggle');
  }

  getTargetLeftIcon(index: number): string {
    let res = '';
    const sentence = this.child_home.cur_doc.sentences[index];
    if (sentence.target === -1) {
      let fake = false;
      for (const trans of sentence.refers) {
        if (trans.target_text === sentence.custom.target_text) {
          fake = true;
          break;
        }
      }
      if (fake || !sentence.custom.target_text) {
        res = 'red help icon';
      } else {
        res = 'green idea icon';
      }
    } else {
      res = 'placeholder icon';
    }
    return res;
  }

  getTargetRightIcon(index: number): string {
    let res = '';
    const sentence = this.child_home.cur_doc.sentences[index];
    if (sentence.marked) {
      res = 'green checkmark icon';
    } else if (sentence.target !== -2) {
      res = 'teal asterisk icon';
    } else {
      res = 'placeholder icon';
    }
    return res;
  }

  getTargetText(index: number): string {
    const sentence = this.child_home.cur_doc.sentences[index];
    if (sentence.ignore) {
      return '';
    }

    let target_text = '';
    if (sentence.target === -2) {
      target_text = '';
    } else if (sentence.target === -1) {
      target_text = sentence.custom.target_text;
    } else {
      target_text = sentence.refers[sentence.target].target_text;
    }
    return target_text;
  }

  getPageCount(): number {
    let count = 0;
    if (this.search_text || this.filter) {
      count = this.search_result.length;
    } else {
      count = this.child_home.cur_doc.sentences.length;
    }
    return Math.floor(count / this.page_size) + ((count % this.page_size) ? 1 : 0);
  }

  getPageRange(): Array<number> {
    let indexArray = [];
    if (this.search_text || this.filter) {
      indexArray = this.search_result;
    } else {
      indexArray = Array.from(new Array(this.child_home.cur_doc.sentences.length), (x, i) => i);
    }
    return indexArray.slice(this.cur_page * this.page_size, (this.cur_page + 1) * this.page_size);
  }

  getLineCount(): number {
    let res = 0;
    if (this.search_text || this.filter) {
      res = this.search_result.length;
    } else {
      res = this.child_home.cur_doc.sentences.length;
    }
    return res;
  }

  showAbout(): void {
    this.child_about.show();
  }

  retranslate(): void {
    const sentence = this.child_home.cur_doc.sentences[this.cur_index];
    if (sentence.ignore || sentence.marked) {
      return;
    }

    if (sentence.target !== -1) {
      sentence.target = -2;
    }
    sentence.refers = [];  // TODO: 需要强制重新翻译？
    this.translate(this.cur_index, sentence);
  }

  forceRetranslate(event: any): void {
    if (event.forceShowSelected) {
      this.showSelectedItem();
    }
    this.retranslate();
  }

  @HostListener('window:keydown.arrowright', ['$event'])
  onArrowRight(event: KeyboardEvent): void {
    if (document.activeElement.getAttribute('contenteditable') || this.cur_index === -1) {
      return;
    }

    // const next = this.cur_index + 1;
    const range = this.getPageRange();
    const index = range.indexOf(this.cur_index);
    if (index < range.length - 1) {
      const next = range[index + 1];
      this.onItemClick(next);

      const tran_list = document.getElementById('trans-list');
      const next_item = document.getElementById(`item-${next}`);
      if (tran_list.scrollTop < next_item.offsetTop + next_item.clientHeight - tran_list.clientHeight) {
        tran_list.scrollTop = next_item.offsetTop + next_item.clientHeight - tran_list.clientHeight;
      } else if (tran_list.scrollTop > next_item.offsetTop) {
        tran_list.scrollTop = next_item.offsetTop;
      }
      event.preventDefault();
    }
  }

  @HostListener('window:keydown.arrowleft', ['$event'])
  onArrowLeft(event: KeyboardEvent): void {
    if (document.activeElement.getAttribute('contenteditable') || this.cur_index === -1) {
      return;
    }

    const range = this.getPageRange();
    const index = range.indexOf(this.cur_index);
    if (index > 0) {
      const prev = range[index - 1];
      this.onItemClick(prev);

      const tran_list = document.getElementById('trans-list');
      const prev_item = document.getElementById(`item-${prev}`);
      if (tran_list.scrollTop > prev_item.offsetTop) {
        tran_list.scrollTop = prev_item.offsetTop;
      } else if (tran_list.scrollTop < prev_item.offsetTop + prev_item.clientHeight - tran_list.clientHeight) {
        tran_list.scrollTop = prev_item.offsetTop + prev_item.clientHeight - tran_list.clientHeight;
      }
      event.preventDefault();
    }
  }

  nextPage(): void {
    if (this.cur_page + 1 < this.getPageCount()) {
      this.cur_page++;
      document.getElementById('trans-list').scrollTop = 0;
      this.cur_index = this.getPageRange()[0];
      this.rerender();
      if (this.search_text) {
        $('#trans-list').highlight(this.search_text);
      }
    }
  }

  prevPage(): void {
    if (this.cur_page > 0) {
      this.cur_page--;
      document.getElementById('trans-list').scrollTop = 0;
      this.cur_index = this.getPageRange()[0];
      this.rerender();
      if (this.search_text) {
        $('#trans-list').highlight(this.search_text);
      }
    }
  }

  showSelectedItem(): void {
    if (this.cur_index !== -1) {
      const tran_list = document.getElementById('trans-list');
      const tran_item = document.getElementById(`item-${this.cur_index}`);
      if (tran_list.scrollTop > tran_item.offsetTop) {
        tran_list.scrollTop = tran_item.offsetTop;
      } else if (tran_list.scrollTop < tran_item.offsetTop + tran_item.clientHeight - tran_list.clientHeight) {
        tran_list.scrollTop = tran_item.offsetTop + tran_item.clientHeight - tran_list.clientHeight;
      }
    }
  }

  getStatistics(): StatisticsModel {
    const stats = new StatisticsModel();
    for (const sentence of this.child_home.cur_doc.sentences) {
      if (sentence.ignore) {
        ++stats.skipped;
      } else if (sentence.target === -2) {
        ++stats.initial;
      } else {
        // 纬度1：未确认/已确认
        if (sentence.marked) {
          ++stats.checked;
        } else {
          ++stats.transed;
        }
        // 纬度2：自翻译/机翻译
        if (sentence.target === -1) {
          ++stats.revised;
        } else {
          ++stats.directs;
        }
      }
    }
    return stats;
  }

  installPopupTips(): void {
    $('#filter-dropdown').dropdown({
      on: 'hover',
      onChange: (lower_item_str, item_str, item_obj) => {
        // console.log('===>', item_obj.children('i').attr("class"));
        const value = item_obj[0].getAttribute('value');
        if (value !== this.filter) {
          this.cur_page = 0;
          this.filter = value;
          if (this.filter || this.search_text) {
            this.filterSearch();
          }  else {
            this.search_result = [];
          }

          if (this.cur_index !== -1) {
            if (this.getPageRange().indexOf(this.cur_index) === -1) {
              this.cur_index = -1;
            }
          }
          this.rerender();
          if (this.search_text) {
            const transList = $('#trans-list');
            transList.unhighlight();
            transList.highlight(this.search_text);
          }
        }
      }
    });

    $('#statusbar-stat-item').popup({
      popup: '#stat-popup',
      on: 'click',
      observeChanges: false  // https://github.com/Semantic-Org/Semantic-UI/issues/4860
    });
  }

  getFilterIcon(): string {
    let res = '';
    switch (this.filter) {
      case '':
        res = 'filter icon';
        break;
      case 'skipped':
        res = 'quote left icon';
        break;
      case 'checked':
        res = 'checkmark icon';
        break;
      case 'translated':
        res = 'asterisk icon';
        break;
      case 'untranslated':
        res = 'circle icon';
        break;
      default:
        alert(`Bad filter value: ${this.filter}`);
        break;
    }
    return res;
  }

  // ''(all), skipped, checked, translated, untranslated
  filterTest(index: number): boolean {
    let res = false;
    const sentence = this.child_home.cur_doc.sentences[index];
    switch (this.filter) {
      case '':
        res = true;
        break;
      case 'skipped':
        res = sentence.ignore;
        break;
      case 'checked':
        res = (!sentence.ignore  && sentence.marked);
        break;
      case 'translated':
        res = (!sentence.ignore && !sentence.marked && sentence.target !== -2);
        break;
      case 'untranslated':
        res = (!sentence.ignore && !sentence.marked && sentence.target === -2);
        break;
      default:
        alert(`Bad filter value: ${this.filter}`);
        break;
    }
    return res;
  }

  searchTest(index: number): boolean {
    const str = this.search_text.toLowerCase();
    const source_text = this.child_home.cur_doc.sentences[index].source.toLowerCase();
    const target_text = this.getTargetText(index).toLowerCase();
    return (source_text.indexOf(str) !== -1 || target_text.indexOf(str) !== -1);
  }

  filterSearch(): void {
    if (this.filter || this.search_text) {
      this.cur_page = 0;
      this.search_result = [];
      for (let index = 0; index < this.child_home.cur_doc.sentences.length; ++index) {
        if ((!this.search_text || this.searchTest(index)) && (!this.filter || this.filterTest(index))) {
          this.search_result.push(index);
        }
      }
    }
  }

  // TODO: 添加在原文中搜索还是在译文中搜索选项；添加是否忽略大小写选项；添加是否搜索单词选项
  onSearchInput(inputBox: HTMLInputElement): void {
    const text = inputBox.value.trim();
    if (text) {
      if (text === this.search_text) {
        return;
      }

      this.search_text = text;
      this.filterSearch();

      if (this.cur_index !== -1) {
        if (this.getPageRange().indexOf(this.cur_index) === -1) {
          this.cur_index = -1;
        }
      }
      this.rerender();
      const transList = $('#trans-list');
      transList.unhighlight();
      transList.highlight(this.search_text);
    } else {
      this.onCloseSearch(inputBox);
    }
  }

  onCloseSearch(inputBox: HTMLInputElement): void {
    inputBox.value = '';
    this.search_text = '';
    this.cur_page = 0;

    if (this.filter) {
      this.filterSearch();
    } else {
      this.search_result = [];
    }

    if (this.cur_index !== -1) {
      if (this.getPageRange().indexOf(this.cur_index) === -1) {
        this.cur_index = -1;
      }
    }
    this.rerender();
    $('#trans-list').unhighlight();
  }

  isSourceVisible(index: number) {
    // const sentence = this.child_home.cur_doc.sentences[index];
    // return (!sentence.marked || sentence.ignore);
    return true;
  }

  isTargetVisible(index: number) {
    const sentence = this.child_home.cur_doc.sentences[index];
    return (sentence.target !== -2 && !sentence.ignore);
  }

  sync(): void {
    // 与翻译云同步
  }

  ngOnInit() {
    const self = this;

    ipc.on('file-read', (event, err, data, filePath, group_id) => {
      if (!this.child_home.addDocument(filePath, data, group_id)) {
        return;
      }
      self.reset();
      const ext_name = FunctionUtils.getExtName(filePath);
      const parser = this.pms.getParser(ext_name);
      parser.load(data);
      parser.parse().subscribe(
        res => {
          const sentence = new SentenceModel({source: res.source});
          if (res.target) {
            sentence.target = -1;
            sentence.custom = new TranslateModel({
              source_lang: self.ems.getSourceLanguage(),
              target_lang: self.ems.getTargetLanguage(),
              source_text: res.source,
              target_text: res.target,
              engine_name: 'user'
            });
          }

          // TODO: 返回时，携带文档ID
          self.child_home.cur_doc.sentences[self.child_home.cur_doc.sentences.length] = sentence;
        },
        error => {
          console.log(error);  // TODO: 提供错误信息展示方案
        },
        () => {
          self.rerender();
          $('#trans-list').unhighlight();
        }
      );
      self.rerender();
    });

    ipc.on('file-saved', (event, err) => {
      console.log('File Saved!');  // TODO: 自动打开文件？
    });

    ipc.on('next_page', (event) => {
      self.nextPage();
    });

    ipc.on('previous_page', (event) => {
      self.prevPage();
    });

    self.installPopupTips();

    // 安装外部链接
    ExLinksModule.applyExLinks();
  }

}
