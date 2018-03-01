import {Component, OnInit, ChangeDetectorRef, ViewChild, HostListener} from '@angular/core';
import {Title} from '@angular/platform-browser';

const {ipcRenderer, remote} = (<any>window).require('electron');
const {dialog, Menu, MenuItem} = remote;

import {ExLinksModule} from '../services/utils/ex-links.module';

import { FunctionUtils } from '../services/utils/function-utils';
import {SentenceModel, SentenceStatus} from '../services/model/sentence.model';
import {TranslateModel, TranslateState} from '../services/model/translate.model';
import {ParserManagerService} from '../parsers/manager/parser-manager.service';
import {EngineManagerService} from '../providers/manager/engine-manager.service';
import {HomeComponent} from '../home/home.component';
import {AboutComponent} from '../about/about.component';
import {SettingsComponent} from '../settings/settings.component';
import {StatisticsModel} from '../services/model/statistics.model';
import {OpenComponent} from '../open/open.component';


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
  @ViewChild(OpenComponent) child_open: OpenComponent;
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
    this.cur_index = -1;
    document.getElementById('trans-list').scrollTop = 0;
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

    this.child_open.show(() => {
      const url = this.child_open.getDocUrl();
      const tid = this.child_open.getTypeId();

      if (url) {
        this.reset();
        ipcRenderer.send('read-file', url, group_id);
      } else {
        alert(tid === 'first' ? 'Please input an internet web URL.' : 'Please input a local file path.');
        return false;
      }
    });

    /*
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
        ipcRenderer.send('read-file', files, group_id);  // ('read-file', files, this);  进程之间不能传递对象
      }
    });
    */
  }

  exportFile(): void {
    if (!this.child_home.cur_doc || !this.child_home.cur_doc.id) {
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
      filters: expInfo.filters,
      defaultPath: this.child_home.getDocInfo(this.child_home.cur_doc.id).name
    };
    dialog.showSaveDialog(options, (filename) => {
      if (filename) {
        const fileExt = FunctionUtils.getExtName(filename).toLowerCase();
        ipcRenderer.send('save-file', filename, parser.getLastData(fileExt));
      }
    });
  }

  savePreviewFile(): void {
    if (!this.child_home.cur_doc || !this.child_home.cur_doc.id) {
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

    ipcRenderer.send('save-preview-file', this.child_home.cur_doc.id, parser.getLastData('html'));
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
    ipcRenderer.send('show-item-context-menu', {
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

  getSentenceStatus(sentence: SentenceModel): string {
    let res = SentenceStatus.INITIAL;
    let successNum = 0;
    let failureNum = 0;
    let initialNum = 0;
    const totalNum = sentence.refers.length;

    for (const refer of sentence.refers) {
      if (refer.trans_state === TranslateState.SUCCESS) {
        ++successNum;
      } else if (refer.trans_state === TranslateState.FAILURE) {
        ++failureNum;
      } else if (refer.trans_state === TranslateState.INITIAL) {
        ++initialNum;
      }
    }

    if (totalNum === 0) {
      res = SentenceStatus.INITIAL;
    } else if (successNum === totalNum) {
      res = SentenceStatus.SUCCESS;
    } else if (failureNum === totalNum) {
      res = SentenceStatus.FAILURE;
    } else if (successNum + failureNum === totalNum) {
      res = SentenceStatus.WARNING;
    } else if (initialNum === totalNum) {
      res = SentenceStatus.INITIAL;
    } else {
      res = SentenceStatus.IN_PROC;
    }
    return res;
  }

  translate(index: number, sentence: SentenceModel): void {
    for (const engine of this.ems.engine_list) {
      let refer_idx = -1;
      for (let i = 0; i < sentence.refers.length; ++i) {
        if (sentence.refers[i].engine_name === engine.getEngineName()) {
          refer_idx = i;
          break;
        }
      }

      let trans_obj = null;
      if (refer_idx !== -1) {
        trans_obj = sentence.refers[refer_idx];
        if (trans_obj.trans_state === TranslateState.SUCCESS && trans_obj.target_text) {  // TODO: 并且翻译语言没有切换
          continue;  // 不发重复请求
        } else {
          trans_obj.trans_state = TranslateState.REQUESTED;
        }
      } else {
        trans_obj = new TranslateModel({
          engine_name: engine.getEngineName(),
          source_lang: this.ems.getSourceLanguage(),
          target_lang: this.ems.getTargetLanguage(),
          source_text: sentence.source,
          trans_state: TranslateState.REQUESTED
        });
        refer_idx = sentence.refers.length;
        sentence.refers.push(trans_obj);
      }

      this.rerender();  // 展示旋转图标

      engine.translateX(trans_obj, this.child_home.cur_doc.id).subscribe(
        res => {
          if (res.result === 'ok' && trans_obj.target_text) {
            trans_obj.trans_state = TranslateState.SUCCESS;

            // 根据评分选用最佳翻译
            if (sentence.target === -2) {
              sentence.target = refer_idx;
            } else if (sentence.target !== -1) {
              if (trans_obj.trans_grade > sentence.refers[sentence.target].trans_grade) {
                sentence.target = refer_idx;
              }
            }

            // 如果文档没有切换，更新视图，否则，不需要更新
            if (res.doc_id === this.child_home.cur_doc.id && this.getPageRange().indexOf(index) !== -1) {
              this.rerender();
            }
          } else {
            // TODO: 失败的选项，禁止选用！！
            trans_obj.trans_state = TranslateState.FAILURE;
            if (res.doc_id === this.child_home.cur_doc.id && this.getPageRange().indexOf(index) !== -1) {
              this.rerender();
            }
            // alert(`Translate failed: ${res.result}`);
          }
        },
        err => {
          trans_obj.trans_state = TranslateState.FAILURE;
          if (err.doc_id === this.child_home.cur_doc.id && this.getPageRange().indexOf(index) !== -1) {
            this.rerender();
          }
          // alert(`Translate failed: ${err.result}`);
        }
      );
    }
  }

  getSourceLeftIcon(index: number): string {
    const sentence = this.child_home.cur_doc.sentences[index];
    const status = this.getSentenceStatus(sentence);
    let icon = 'placeholder icon';  // 占位符
    if (sentence.ignore) {
      icon = 'green quote left link icon';
    } else if (sentence.marked) {
      icon = 'placeholder icon';  // 隐藏状态
    } else if (sentence.target === -1) {
      icon = 'placeholder icon';  // 占位符
    } else if (status === SentenceStatus.INITIAL) {
      icon = (index === this.cur_index) ? 'violet quote left link icon' : 'placeholder icon';
    } else if (status === SentenceStatus.IN_PROC) {
      icon = 'spinner loading icon';
    } else if (status === SentenceStatus.SUCCESS) {
      icon = (index === this.cur_index) ? 'violet quote left link icon' : 'placeholder icon';
    } else if (status === SentenceStatus.WARNING) {
      icon = 'orange warning circle icon';
    } else if (status === SentenceStatus.FAILURE) {
      icon = 'red remove circle icon';
    }
    return icon;
  }

  getSourceRightIcon(index: number): string {
    const sentence = this.child_home.cur_doc.sentences[index];
    const status = this.getSentenceStatus(sentence);
    let res = 'placeholder icon';
    if (index === this.cur_index) {
      if (status === SentenceStatus.INITIAL) {
        res = 'violet translate link icon';
      } else if (status === SentenceStatus.WARNING || status === SentenceStatus.FAILURE) {
        res = 'violet repeat link icon';
      } else {
        res = 'placeholder icon';
      }
    }
    return res;
  }

  toggleLeftSide(): void {
    $('#left-side').sidebar({
      context: 'body',
      dimPage: false
    }).sidebar('toggle');
  }

  toggleRightSide(): void {

  }

  preview(): void {
    this.savePreviewFile();
  }

  showPreview(filePath: string): void {
    filePath.replace(/\\/g, '/');
    $('#preview-context>webview').attr('src', 'file:///' + filePath);

    $('#preview-side').sidebar({
      context: 'body',
      dimPage: true,
      transition: 'overlay'
    }).sidebar('toggle');

    $('#preview-close').sticky({
      context: '#preview-context'
    });
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
      res = 'green checkmark link icon';
    } else if (sentence.target !== -2) {
      res = 'blue asterisk link icon';
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

    /* TODO: 需要强制重新翻译？重新翻译下放到引擎，可以指定引擎进行重新翻译！！
    if (sentence.target !== -1) {
      sentence.target = -2;
    }
    sentence.refers = [];
    */

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
    $('#import-dropdown').dropdown({
      action: 'hide',  // 隐藏选中标记
      on: 'hover'
    });

    $('#more-dropdown').dropdown({
      action: 'hide',
      on: 'hover'
    });

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
      on: 'hover',  // click
      hoverable: true,
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
    console.log('sync...');
    webview.loadURL(data);
  }

  ngOnInit() {
    const self = this;

    ipcRenderer.on('file-read', (event, err, data, filePath, fileName, group_id) => {
      if (!this.child_home.addDocument(filePath, fileName, data, group_id)) {
        return;
      }
      self.reset();
      const ext_name = FunctionUtils.getExtName(fileName);
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

    ipcRenderer.on('file-saved', (event, err) => {
      console.log('File Saved!');  // TODO: 自动打开文件？
    });

    ipcRenderer.on('preview-file-saved', (event, err, filePath) => {
      self.showPreview(filePath);
    });

    ipcRenderer.on('next_page', (event) => {
      self.nextPage();
    });

    ipcRenderer.on('previous_page', (event) => {
      self.prevPage();
    });

    // 预览视图
    $('#preview-close-button').on('click', () => {
      self.preview();
    });

    $('#preview-export-button').on('click', () => {
      self.exportFile();
    });

    // 安装弹出提示
    self.installPopupTips();

    // 安装外部链接
    ExLinksModule.applyExLinks();
  }

}
