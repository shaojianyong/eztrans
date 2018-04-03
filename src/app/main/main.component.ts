import {Component, OnInit, ChangeDetectorRef, ViewChild, HostListener} from '@angular/core';
import {Title} from '@angular/platform-browser';

const {ipcRenderer, remote} = (<any>window).require('electron');
const {dialog, Menu, MenuItem} = remote;
const { JSDOM } = (<any>window).require('jsdom');

import {ExLinksModule} from '../services/utils/ex-links.module';
import { FunctionUtils } from '../services/utils/function-utils';
import {VersionModel, SentenceModel, SentenceStatus} from '../services/model/sentence.model';
import {TranslateModel, TranslateState} from '../services/model/translate.model';
import {ParserManagerService} from '../parsers/manager/parser-manager.service';
import {EngineManagerService} from '../providers/manager/engine-manager.service';
import {HomeComponent} from '../home/home.component';
import {AboutComponent} from '../about/about.component';
import {SettingsComponent} from '../settings/settings.component';
import {StatisticsModel} from '../services/model/statistics.model';
import {OpenComponent} from '../open/open.component';
import {setNodeTexts} from '../parsers/html/html-parser.service';


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
  }

  exportFile(): void {
    if (!this.child_home.cur_doc || !this.child_home.cur_doc.id) {
      return;
    }

    const expInfo = this.pms.getExportInfo(this.child_home.cur_doc.data_type);
    const options = {
      title: expInfo.title,
      filters: expInfo.filters,
      defaultPath: this.child_home.getDocInfo(this.child_home.cur_doc.id).name
    };
    dialog.showSaveDialog(options, (filename) => {
      if (filename) {
        const fileExt = FunctionUtils.getExtName(filename).toLowerCase();
        ipcRenderer.send('save-file', filename, this.getLastFileData(fileExt));
      }
    });
  }

  getLastTransData(forPreview = false): Array<string> {
    let segments = [];
    for (const sentence of this.child_home.cur_doc.sentences) {
      if (sentence.target === -2) {
        segments = segments.concat(sentence.source);
      } else {
        if (sentence.ignore) {
          segments = segments.concat(sentence.source);
        } else if (sentence.target === -1) {
          for (const slice of sentence.custom) {
            if (forPreview && !slice.trim()) {
              segments.push('[x]');  // 将文本节点置空时(空格会被忽略)，也就是把它给删除了
            } else {
              segments.push(slice);
            }
          }
        } else {
          const refer = sentence.refers[sentence.target];
          if (sentence.source.length === 1) {
            segments.push(refer.target.target_text);
          } else if (refer.divides.length === sentence.source.length + 1) {
            for (let i = 0; i < sentence.source.length; ++i) {
              segments.push(refer.target.target_text.substring(refer.divides[i], refer.divides[i + 1]));
            }
          } else {
            for (const slice of refer.slices) {
              segments.push(slice.target_text);
            }
          }
        }
      }
    }
    return segments;
  }

  getLastFileData(fileType: string, forPreview = false): string {
    const parser = this.pms.getParser(this.child_home.cur_doc.data_type);
    parser.load(this.child_home.cur_doc.file_data);
    parser.update(this.getLastTransData(forPreview));
    return parser.getLastData(fileType);
  }

  // ipcRenderer与ipcMain同步通信，在JavaScript中，同步代码好丑陋
  // 同步通信，如果ipcMain没有返回，界面会僵住

  onItemClick(index: number): void {
    if (index === this.cur_index) {
      return;
    }

    this.cur_index = index;
    this.rerender();
    this.syncPreview();
  }

  onItemContextMenu(index: number): void {
    this.onItemClick(index);
    const sentence = this.child_home.cur_doc.sentences[index];
    const status = this.getSentenceStatus(sentence);
    ipcRenderer.send('show-item-context-menu', {
      page_count: this.getPageCount(),
      cur_page: this.cur_page,
      target: sentence.target,
      skipped: sentence.ignore,
      checked: sentence.marked,
      retrans: (status === SentenceStatus.WARNING || status === SentenceStatus.FAILURE)
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
      this.showPreview();
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

    const states = [];
    for (const refer of sentence.refers) {
      if (refer.target) {
        states.push(refer.target.trans_state);
      }
      for (const slice of refer.slices) {
        states.push(slice.trans_state);
      }
    }

    const totalNum = states.length;
    for (const state of states) {
      if (state === TranslateState.SUCCESS) {
        ++successNum;
      } else if (state === TranslateState.FAILURE) {
        ++failureNum;
      } else if (state === TranslateState.INITIAL) {
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
    const docId = this.child_home.cur_doc.id;
    for (const engine of this.ems.engine_list) {
      let refIdx = -1;
      for (let i = 0; i < sentence.refers.length; ++i) {
        if (sentence.refers[i].engine === engine.getEngineName()) {
          refIdx = i;
          break;
        }
      }

      let refer = null;
      if (refIdx !== -1) {
        refer = sentence.refers[refIdx];
        if (refer.target.trans_state === TranslateState.SUCCESS && refer.target.target_text) {
          continue;  // 不发重复请求
        } else {
          refer.target.trans_state = TranslateState.REQUESTED;
        }
      } else {
        refer = new VersionModel({
          engine: engine.getEngineName(),
          target: new TranslateModel({
            trans_state: TranslateState.REQUESTED
          })
        });
        refIdx = sentence.refers.length;
        sentence.refers.push(refer);
      }

      this.rerender();  // 展示旋转图标
      engine.translateX(sentence.source.join(' '), refer.target, this.child_home.getCurDocInfo()).subscribe(
        res => {
          if (res.result === 'ok' && refer.target.target_text) {
            refer.target.trans_state = TranslateState.SUCCESS;
            if (sentence.source.length === 1) {
              // 根据评分选用最佳翻译
              if (sentence.target === -2) {
                sentence.target = refIdx;
              } else if (sentence.target !== -1) {
                if (refer.target.trans_grade > sentence.refers[sentence.target].target.trans_grade) {
                  sentence.target = refIdx;
                }
              }
              if (sentence.target === refIdx && res.doc_id === docId) {
                this.updatePreview();
              }
            } else {
              this.translateReferSlices(index, sentence, refIdx, docId);
            }
          } else {
            refer.target.trans_state = TranslateState.FAILURE;
          }
          if (res.doc_id === docId && this.getPageRange().indexOf(index) !== -1) {
            this.rerender();
          }
        },
        err => {
          refer.target.trans_state = TranslateState.FAILURE;
          if (err.doc_id === docId && this.getPageRange().indexOf(index) !== -1) {
            this.rerender();
          }
        }
      );
    }
  }

  translateReferSlices(index: number, sentence: SentenceModel, refIdx: number, docId: string): void {
    const refer = sentence.refers[refIdx];
    for (let i = 0; i < sentence.source.length; ++i) {
      if (refer.slices[i]) {
        if (refer.slices[i].trans_state === TranslateState.SUCCESS && refer.slices[i].target_text) {
          continue;  // 不发重复请求
        }
      } else {
        refer.slices[i] = new TranslateModel({trans_state: TranslateState.REQUESTED});
      }

      const engine = this.ems.getEngine(refer.engine);
      engine.translateX(sentence.source[i], refer.slices[i], this.child_home.getCurDocInfo()).subscribe(
        res => {
          if (res.result === 'ok' && refer.slices[i].target_text) {
            refer.slices[i].trans_state = TranslateState.SUCCESS;

            // 最后一个分片返回，并且所有分片都翻译成功
            if (refer.slices.length === sentence.source.length &&
              refer.target.trans_state === TranslateState.SUCCESS
              && this.checkAllSliceStates(refer)) {
              // 根据评分选用最佳翻译
              if (sentence.target === -2) {
                sentence.target = refIdx;
              } else if (sentence.target !== -1) {
                if (refer.target.trans_grade > sentence.refers[sentence.target].target.trans_grade) {
                  sentence.target = refIdx;
                }
              }
              this.divideIntegratedTranslation(refer);
              if (sentence.target === refIdx && res.doc_id === docId) {
                this.updatePreview();
              }
            }
          } else {
            refer.slices[i].trans_state = TranslateState.FAILURE;
          }
          // 如果文档没有切换，更新视图，否则，不需要更新
          if (res.doc_id === docId && this.getPageRange().indexOf(index) !== -1) {
            this.rerender();
          }
        },
        err => {
          refer.slices[i].trans_state = TranslateState.FAILURE;
          if (err.doc_id === docId && this.getPageRange().indexOf(index) !== -1) {
            this.rerender();
          }
        }
      );
    }
  }

  oneSliceDivide(refer: VersionModel, index: number): void {
    const wholeStr = refer.target.target_text;
    const sliceStr = refer.slices[index].target_text;
    const oldBegPos = refer.divides[index];
    const oldEndPos = refer.divides[index + 1];

    let intersection = null;
    if (index <= refer.slices.length / 2) {
      intersection = FunctionUtils.findLongerOverlap(wholeStr, sliceStr);
    } else {
      intersection = FunctionUtils.reverseFindLongerOverlap(wholeStr, sliceStr);
    }
    if (intersection) {
      let newBegPos = intersection[0];
      let newEndPos = intersection[1];

      let prevPos = null;
      if (index > 0) {
        prevPos = refer.divides[index - 1];
      }
      let nextPos = null;
      if (index + 2 < refer.divides.length) {
        nextPos = refer.divides[index + 2];
      }

      // 避免交叉重叠
      if (index === 0) {
        newBegPos = 0;
      } else if (oldBegPos && oldBegPos !== -1) {
        newBegPos = oldBegPos;
      } else if (prevPos && newBegPos < prevPos) {
        newBegPos = prevPos + 1;
      }

      if (oldEndPos && oldEndPos !== -1) {
        newEndPos = oldEndPos;
      } else if (nextPos && newEndPos > nextPos) {
        newEndPos = nextPos - 1;
      }

      refer.divides[index] = newBegPos;
      if (index + 1 !== refer.slices.length) {
        refer.divides[index + 1] = newEndPos;  // 确认标记：分片完成后才添加
      }
    } else {
      if (!oldBegPos) {
        refer.divides[index] = -1;
      }
    }
  }

  isDivideComplete(refer: VersionModel): boolean {
    let res = true;
    for (let i = 1; i < refer.slices.length; ++i) {
      if (!refer.divides[i] || refer.divides[i] === -1) {
        res = false;
        break;
      }
    }
    return res;
  }

  getNextSlice(refer: VersionModel): number {
    let res = -1;
    for (let i = 0; i < refer.slices.length; ++i) {
      // 在这个位置切分失败了
      if (refer.divides[i] === -1) {
        continue;
      }
      // 已经切分过了，并且切分成功了
      if (refer.divides[i] && (i + 1 >= refer.slices.length || (refer.divides[i + 1] && refer.divides[i + 1] !== -1))) {
        continue;
      }
      // 优先按短片切分
      if (res === -1 || refer.slices[i].target_text.length < refer.slices[res].target_text.length) {
        res = i;
      }
    }
    return res;
  }

  // 暂时不考虑引擎之间交叉引用，同义词...
  // 根据分片翻译，切分整体翻译，递归算法
  // 按分片大小顺序切割，直到切分完成
  divideIntegratedTranslation(refer: VersionModel): void {
    if (refer.target.target_text.length < refer.slices.length) {
      return;
    }

    let count = 0;
    let done = true;
    while (!this.isDivideComplete(refer)) {
      const index = this.getNextSlice(refer);
      if (index === -1) {
        done = false;
        break;
      } else {
        this.oneSliceDivide(refer, index);
        count++;
      }
    }

    if (done) {
      refer.divides[0] = 0;
      refer.divides[refer.slices.length] = refer.target.target_text.length;
    }
  }

  checkAllSliceStates(vm: VersionModel): boolean {
    let res = true;
    for (const slice of vm.slices) {
      if (slice.trans_state !== TranslateState.SUCCESS) {
        res = false;
        break;
      }
    }
    return res;
  }

  toggleSkipOver(index: number): void {
    const sentence = this.child_home.cur_doc.sentences[index];
    sentence.ignore = !sentence.ignore;
    this.rerender();
    this.updatePreview();
  }

  toggleCheckMark(index: number): void {
    const sentence = this.child_home.cur_doc.sentences[index];
    if (sentence.target !== -2 && !sentence.ignore) {
      sentence.marked = !sentence.marked;
      this.rerender();
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

  onClickSourceLeft(index: number): void {
    const icon = this.getSourceLeftIcon(index);
    if (icon === 'green quote left link icon' || icon === 'violet quote left link icon') {
      this.toggleSkipOver(index);
    }
  }

  getSourceRightIcon(index: number): string {
    const sentence = this.child_home.cur_doc.sentences[index];
    const status = this.getSentenceStatus(sentence);
    let res = 'placeholder icon';
    if (index === this.cur_index) {
      if (sentence.target === -1 || sentence.ignore || sentence.marked) {
        res = 'placeholder icon';
      } else if (status === SentenceStatus.INITIAL) {
        res = 'violet translate link icon';
      } else if (status === SentenceStatus.WARNING || status === SentenceStatus.FAILURE) {
        res = 'violet repeat link icon';
      } else {
        res = 'placeholder icon';
      }
    }
    return res;
  }

  onClickSourceRight(index: number): void {
    const icon = this.getSourceRightIcon(index);
    if (icon === 'violet translate link icon' || icon === 'violet repeat link icon') {
      this.translate(index, this.child_home.cur_doc.sentences[index]);
    }
  }

  toggleLeftSide(): void {
    $('#left-side').sidebar({
      context: 'body',
      dimPage: false
    }).sidebar('toggle');
  }

  toggleRightSide(): void {

  }

  checkCustomTrans(sentence: SentenceModel): any {
    const checkResult = { fake: false, empty: false };
    if (sentence.source.length === 1) {
      for (const refer of sentence.refers) {
        if (refer.target && sentence.custom[0] === refer.target.target_text) {
          checkResult.fake = true;
          break;
        }
      }
      checkResult.empty = (sentence.custom[0].trim().length === 0);
    } else {
      for (const refer of sentence.refers) {
        if (refer.slices.length === sentence.source.length
          && sentence.custom.length === sentence.source.length) {
          let allSame = true;
          for (let i = 0; i < sentence.source.length; ++i) {
            if (sentence.custom[i].trim().length === 0) {
              checkResult.empty = true;
            }
            if (sentence.custom[i] !== refer.slices[i].target_text) {
              allSame = false;
              break;
            }
          }
          if (allSame) {
            checkResult.fake = true;
          }
        }
      }
    }
    return checkResult;
  }

  getTargetLeftIcon(index: number): string {
    const sentence = this.child_home.cur_doc.sentences[index];
    if (sentence.target !== -1) {
      return 'placeholder icon';
    }

    let res = '';
    const checkRsult = this.checkCustomTrans(sentence);
    if (checkRsult.empty) {
      res = 'teal eraser icon';
    } else if (checkRsult.fake) {
      res = 'red help icon';
    } else {
      res = 'green idea icon';
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

  onClickTargetRight(index: number): void {
    const icon = this.getTargetRightIcon(index);
    if (icon === 'green checkmark link icon' || icon === 'blue asterisk link icon') {
      this.toggleCheckMark(index);
    }
  }

  getSourceHtml(index: number): string {
    const sentence = this.child_home.cur_doc.sentences[index];
    if (sentence.source.length === 1) {
      return sentence.source[0];
    }

    const frag = JSDOM.fragment(sentence.elhtml);
    return frag.firstChild.innerHTML;
  }

  getTargetText(index: number): string {
    if (!this.isTargetVisible(index)) {
      return '';
    }
    return this.getTgtSliceTexts(index).join(' ');
  }

  getTgtSliceTexts(index: number): Array<string> {
    const sentence = this.child_home.cur_doc.sentences[index];
    if (sentence.target === -1) {
      return sentence.custom;
    }

    const refer = sentence.refers[sentence.target];
    if (sentence.source.length === 1) {
      return [refer.target.target_text];
    }

    const tgtTexts = [];
    if (refer.divides.length === sentence.source.length + 1) {
      for (let i = 0; i < sentence.source.length; ++i) {
        tgtTexts.push(refer.target.target_text.substring(refer.divides[i], refer.divides[i + 1]));
      }
    } else {
      for (const slice of refer.slices) {
        tgtTexts.push(slice.target_text);
      }
    }
    return tgtTexts;
  }

  getTargetHtml(index: number): string {
    const sentence = this.child_home.cur_doc.sentences[index];
    const tgtTexts = this.getTgtSliceTexts(index);

    if (tgtTexts.length === 1) {
      return tgtTexts[0];
    }

    const frag = JSDOM.fragment(sentence.elhtml);
    const newData = {
      texts: tgtTexts,
      index: 0
    };
    setNodeTexts(frag.firstChild, newData);
    return frag.firstChild.innerHTML;
  }

  // 根据是否为TEXT_NODE节点设定对应的span背景色
  isSliceTextNode(index: number, slice: number): boolean {
    const sentence = this.child_home.cur_doc.sentences[index];
    if (sentence.source.length === 1) {
      return true;
    }
    const frag = JSDOM.fragment(sentence.elhtml);
    return (frag.firstChild.childNodes[slice].nodeType === Node.TEXT_NODE);
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
      this.onItemClick(this.getPageRange()[0]);
      if (this.search_text) {
        $('#trans-list').highlight(this.search_text);
      }
    }
  }

  prevPage(): void {
    if (this.cur_page > 0) {
      this.cur_page--;
      document.getElementById('trans-list').scrollTop = 0;
      this.onItemClick(this.getPageRange()[0]);
      if (this.search_text) {
        $('#trans-list').highlight(this.search_text);
      }
    }
  }

  getPageIndex(index: number): number {
    let pos = -1;
    if (this.search_text || this.filter) {
      if ((!this.search_text || this.searchTest(index)) && (!this.filter || this.filterTest(index))) {
        pos = this.search_result.indexOf(index);
      }
    } else {
      pos = index;
    }

    let page = -1;
    if (pos !== -1) {
      page = Math.floor(pos / this.page_size);
    }
    return page;
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
    $('#more-dropdown').dropdown({
      action: 'hide',  // 隐藏选中标记
      on: 'hover'
    });

    $('#filter-dropdown').dropdown({
      on: 'hover',
      onChange: (lower_item_str, item_str, item_obj) => {
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
    const source_text = this.child_home.cur_doc.sentences[index].source.join(' ').toLowerCase();
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

  onSliceEditInput(sliceSpan: HTMLSpanElement, index: number, slieceNo: number): void {
    const sentence = this.child_home.cur_doc.sentences[index];
    if (sentence.target !== -1) {
      sentence.custom = this.getTgtSliceTexts(index);
      sentence.target = -1;
    }
    sentence.custom[slieceNo] = sliceSpan.textContent;
    this.forceRerender({forceShowSelected: true});
    this.updatePreview();
  }

  onSliceEditFocus(index: number): void {
    if (this.search_text) {
      $(`#table-${index}>tbody>tr>td.target-cell`).unhighlight();
    }
  }

  onSliceEditBlur(index: number): void {
    if (this.search_text) {
      $(`#table-${index}>tbody>tr>td.target-cell`).highlight(this.search_text);
    }
  }

  endSliceEditEnterKeyDown(sliceSpan: HTMLSpanElement, event: KeyboardEvent): void {
    sliceSpan.blur();
    event.preventDefault();
  }

  isTargetVisible(index: number): boolean {
    const sentence = this.child_home.cur_doc.sentences[index];
    return (sentence.target !== -2 && !sentence.ignore);
  }

  initPreview(): void {
    const webview = document.getElementsByTagName('webview')[0];
    (<any>webview).addEventListener('dom-ready', () => {
      (<any>webview).openDevTools();
    });

    (<any>webview).addEventListener('ipc-message', (event: any) => {
      const hit = event.args[0];
      if (hit === this.cur_index) {
        return;
      }
      const page = this.getPageIndex(hit);
      if (page !== -1) {
        this.cur_index = hit;
        this.cur_page = page;  // flip page
        this.rerender();
        this.showSelectedItem();
      }
    });
  }

  showPreview(): void {
    const webview = document.getElementsByTagName('webview')[0];
    if (this.child_home.cur_doc && this.child_home.cur_doc.id) {

      let fileData = this.getLastFileData('html', true);
      fileData = fileData.replace(/\r\n|\n/g, ' ');  // WebView会把换行符吃掉，导致单词黏连在一起
      (<any>webview).loadURL(`data:text/html,${fileData}`);
    } else {
      (<any>webview).loadURL('data:text/html,<html><body></body></html>');
    }
  }

  updatePreview(): void {
    const webview = document.getElementsByTagName('webview')[0];
    (<any>webview).send('update-preview', this.getLastTransData(true));
  }

  syncPreview(): void {
    const webview = document.getElementsByTagName('webview')[0];
    (<any>webview).send('scroll-to', this.cur_index);
  }

  updateTargetFile(event: any): void {
    if (event.sync) {
      ipcRenderer.sendSync('save-file', event.target, this.getLastFileData(event.type));
    } else {
      ipcRenderer.send('save-file', event.target, this.getLastFileData(event.type));
    }
  }

  ngOnInit() {
    const self = this;

    ipcRenderer.on('file-read', (event, data, filePath, fileName, group_id, doc_id) => {
      const docId = this.child_home.addDocument(filePath, fileName, data, group_id, doc_id);
      self.reset();
      const ext_name = FunctionUtils.getExtName(fileName);
      const parser = this.pms.getParser(ext_name);
      parser.load(data);
      parser.parse().subscribe(
        res => {
          /*let srcText = res.source;
          srcText = srcText.replace(/\r\n|\n/g, ' ');
          srcText = srcText.replace(/\s{2,}/g, ' ').trim();*/

          const sentence = new SentenceModel({ source: res.source, elhtml: res.elhtml });
          if (docId in self.child_home.cache_docs) {
            const doc = self.child_home.cache_docs[docId];
            doc.sentences.push(sentence);
          }
        },
        error => {
          alert(`${ext_name} parser error: ${error}`);
        },
        () => {
          this.reset();
          this.showPreview();
          self.rerender();
          $('#trans-list').unhighlight();
        }
      );
    });

    ipcRenderer.on('next_page', (event) => {
      self.nextPage();
    });

    ipcRenderer.on('previous_page', (event) => {
      self.prevPage();
    });

    this.initPreview();

    // 安装弹出提示
    self.installPopupTips();

    // 安装外部链接
    ExLinksModule.applyExLinks();
  }

}
