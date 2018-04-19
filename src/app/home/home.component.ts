import { Component, OnInit, Output, EventEmitter, ViewChild } from '@angular/core';
import {Title} from '@angular/platform-browser';
const path = (<any>window).require('path');
const moment = (<any>window).require('moment');
const electron = (<any>window).require('electron');
const ipc = electron.ipcRenderer;

import Epub from '../services/epub/epub';
import { FunctionUtils } from '../services/utils/function-utils';
import { AppdataModel } from '../services/model/appdata.model';
import { DocumentModel } from '../services/model/document.model';
import { TranslateState } from '../services/model/translate.model';
import { GroupType, GroupModel } from '../services/model/group.model';
import { DocType, DocInfoModel } from '../services/model/doc-info.model';
import {MsgboxComponent} from '../msgbox/msgbox.component';


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  @Output() rerenderEvent = new EventEmitter<any>();
  @Output() exportEvent = new EventEmitter<any>();
  @Output() importEvent = new EventEmitter<any>();
  @Output() updateTargetFileEvent = new EventEmitter<any>();

  @ViewChild(MsgboxComponent) child_msgbox: MsgboxComponent;

  doc_groups = [];
  cache_docs = {};
  sel_doc: DocInfoModel = null;
  cur_doc = new DocumentModel();  // 指向一个空文档
  dgtree_changed = false;
  sel_eid = '';  // 当前选中html元素的id
  search_text = '';
  books = {};
  app_data: AppdataModel;


  constructor(private title: Title) {

  }

  select(doc: DocInfoModel): void {
    const new_sel = `#doc-${doc.id}`;
    if (new_sel === this.sel_eid) {
      return;
    }

    if (this.sel_eid) {
      $(this.sel_eid).toggleClass('selected_document');
    }
    this.sel_eid = new_sel;
    $(this.sel_eid).toggleClass('selected_document');

    if (!this.sel_doc || this.sel_doc.id !== doc.id) {
      this.sel_doc = doc;
    }
  }

  onClickGroup(group_id: string): void {
    const new_sel = `#group-${group_id}`;
    if (new_sel === this.sel_eid) {
      return;
    }

    if (this.sel_eid) {
      $(this.sel_eid).toggleClass('selected_document');
    }
    this.sel_eid = new_sel;
    $(this.sel_eid).toggleClass('selected_document');
  }

  toggleExpandGroup(g_idx: number): void {
    $('.ui.accordion').accordion('toggle', g_idx);
  }

  // 切换当前打开文档前，要先保存
  openDoc(rerender = true): void {
    if (this.cur_doc.id === this.sel_doc.id) {
      return;
    }

    if (this.sel_doc.id in this.cache_docs) {
      if (this.cur_doc && this.cur_doc.id) {
        this.saveDocument(this.cur_doc, false);
      }

      this.cur_doc = this.cache_docs[this.sel_doc.id];
      this.updateTitle();
      if (rerender) {
        this.rerenderEvent.emit({forceShowSelected: false, resetDocument: true});
      }
    } else {
      ipc.send('req-document', this.sel_doc.group_id, this.sel_doc.id, this.sel_doc.type, this.sel_doc.file_path);
    }
  }

  renameDoc(): void {
    const doc_name = $(`#doc-${this.sel_doc.id}>td.doc-name`);
    doc_name.attr('contenteditable', 'true');
    doc_name.focus();
  }

  endDocRename(event: KeyboardEvent): void {
    const doc_name = $(`#doc-${this.sel_doc.id}>td.doc-name`);
    doc_name.attr('contenteditable', 'false');
    this.sel_doc.name = doc_name.text();
    this.dgtree_changed = true;
    this.updateTitle();
    event.preventDefault();
  }

  removeDoc(): void {
    this.sel_doc.x_state = 1;  // 标记删除
    this.dgtree_changed = true;
    if (this.sel_doc.id === this.cur_doc.id) {
      this.cur_doc = new DocumentModel();  // 指向一个空文档
      this.updateTitle();
      this.rerenderEvent.emit({forceShowSelected: false, resetDocument: true});
    } else {
      this.rerenderEvent.emit({forceShowSelected: false, resetDocument: false});
    }
  }

  updateTitle(): void {
    if (this.cur_doc.id) {
      this.title.setTitle(`Eztrans - [${this.getGroup(this.sel_doc.group_id).name}] ${this.sel_doc.name}`);
    } else {
      this.title.setTitle('Eztrans');
    }
  }

  moveUpDoc(): void {
    const group = this.getCurSelGroup();
    const index = group.documents.indexOf(this.sel_doc);
    if (index <= 0) {
      throw new Error('Cannot move up the top doc!');
    }

    let prev = index - 1;
    while (prev >= 0 && group.documents[prev].x_state !== 0) {
      --prev;
    }

    if (prev === -1) {
      throw new Error('Cannot find the previous doc!');
    }

    const temp = group.documents[index];
    group.documents[index] = group.documents[index - 1];
    group.documents[index - 1] = temp;
    this.dgtree_changed = true;
    this.rerenderEvent.emit({forceShowSelected: false, resetDocument: false});
  }

  moveDownDoc(): void {
    const group = this.getCurSelGroup();
    const index = group.documents.indexOf(this.sel_doc);
    if (index >= group.documents.length - 1) {
      throw new Error('Cannot move down the bottom doc!');
    }

    let next = index + 1;
    while (next < group.documents.length && group.documents[next].x_state !== 0) {
      ++next;
    }
    if (next === group.documents.length) {
      throw new Error('Cannot find the next doc!');
    }

    const temp = group.documents[index];
    group.documents[index] = group.documents[index + 1];
    group.documents[index + 1] = temp;
    this.dgtree_changed = true;
    this.rerenderEvent.emit({forceShowSelected: false, resetDocument: false});
  }

  moveTo(group_id: string): void {
    const toGroup = this.getGroup(group_id);
    const frGroup = this.getCurSelGroup();
    const index = frGroup.documents.indexOf(this.sel_doc);

    toGroup.documents.push(this.sel_doc);
    frGroup.documents.splice(index, 1);
    this.dgtree_changed = true;
    this.sel_doc.group_id = toGroup.id;

    this.rerenderEvent.emit({forceShowSelected: false, resetDocument: false});
  }

  exportDoc(): void {
    this.exportEvent.emit();
  }

  importDoc(group_id: string): void {
    this.importEvent.emit({group_id: group_id});
  }

  getNormalGroups(): Array<GroupModel> {
    const res = [];
    for (const group of this.doc_groups) {
      if (group.x_state === 0 && group.id !== 'recycle') {
        res.push(group);
      }
    }
    return res;
  }

  getRemovedGroups(): Array<GroupModel> {
    const res = [];
    for (const group of this.doc_groups) {
      if (group.x_state === 1) {
        res.push(group);
      }
    }
    return res;
  }

  renameGroup(group_id: string): void {
    const group_name = $(`#group-${group_id}>span.group-name`);
    group_name.attr('contenteditable', 'true');
    group_name.focus();
  }

  endGroupRename(event: any, group_id: string): void {
    const group_name = $(`#group-${group_id}>span.group-name`);
    group_name.attr('contenteditable', 'false');
    this.getGroup(group_id).name = group_name.text();
    this.dgtree_changed = true;

    event.preventDefault();
  }

  removeGroup(group_id: string): void {
    const group = this.getGroup(group_id);
    group.x_state = 1;  // 标记删除
    this.dgtree_changed = true;
    if (this.cur_doc.id && this.getDocInfo(this.cur_doc.id).group_id === group_id) {
      this.cur_doc = new DocumentModel();  // 指向一个空文档
      this.updateTitle();
      this.rerenderEvent.emit({forceShowSelected: false, resetDocument: true});
    } else {
      this.rerenderEvent.emit({forceShowSelected: false, resetDocument: false});
    }
  }

  restoreGroup(group_id: string): void {
    this.getGroup(group_id).x_state = 0;
    this.dgtree_changed = true;
    this.rerenderEvent.emit({forceShowSelected: false, resetDocument: false});
  }

  onDeleteGroup(group_id: string): void {
    this.child_msgbox.setType(0);
    this.child_msgbox.setHead('Delete Group');
    this.child_msgbox.setBody('Are you sure you want to delete the group permanently?');
    this.child_msgbox.setButtonStyle('approve', 'Delete', 'red');
    this.child_msgbox.setButtonStyle('deny', 'Cancel', 'green');
    this.rerenderEvent.emit({forceShowSelected: false, resetDocument: false});

    this.child_msgbox.show(() => {
      this.deleteGroup(group_id);
      this.rerenderEvent.emit({forceShowSelected: false, resetDocument: false});
    });
  }

  // stackoverflow.com/questions/208105/how-do-i-remove-a-property-from-a-javascript-object
  deleteGroup(group_id: string): void {
    const group = this.getGroup(group_id);

    // 删除缓存文档对象
    for (const docId in this.cache_docs) {
      if (this.cache_docs.hasOwnProperty(docId)) {
        const docInfo = this.getDocInfo(docId);
        if (docInfo.group_id === group_id) {
          delete this.cache_docs[docId];
        }
      }
    }

    // 删除组和组内文件
    if (group.type === 'book') {
      delete this.books[group_id];
      ipc.send('delete-book-folder', group.id);
    } else {
      ipc.send('delete-group-files', group.documents);
    }

    // 删除对应的数组元素
    const index = this.doc_groups.indexOf(group);
    this.doc_groups.splice(index, 1);
    this.dgtree_changed = true;
  }

  moveUpGroup(group_id: string): void {
    const group = this.getGroup(group_id);
    const index = this.doc_groups.indexOf(group);
    if (index <= 0) {
      throw new Error('Cannot move up the top group!');
    }

    let prev = index - 1;
    while (prev >= 0 && this.doc_groups[prev].x_state !== 0) {
      --prev;
    }
    if (prev === -1) {
      throw new Error('Cannot find the previous group!');
    }

    const temp = this.doc_groups[index];
    this.doc_groups[index] = this.doc_groups[prev];
    this.doc_groups[prev] = temp;
    this.dgtree_changed = true;
    this.rerenderEvent.emit({forceShowSelected: false, resetDocument: false});
  }

  moveDownGroup(group_id: string): void {
    const group = this.getGroup(group_id);
    const index = this.doc_groups.indexOf(group);
    if (index >= this.doc_groups.length - 1) {
      throw new Error('Cannot move down the bottom group!');
    }
    let next = index + 1;
    while (next < this.doc_groups.length && this.doc_groups[next].x_state !== 0) {
      ++next;
    }
    if (next === this.doc_groups.length) {
      throw new Error('Cannot find the next group!');
    }

    const temp = this.doc_groups[index];
    this.doc_groups[index] = this.doc_groups[next];
    this.doc_groups[next] = temp;
    this.dgtree_changed = true;
    this.rerenderEvent.emit({forceShowSelected: false, resetDocument: false});
  }

  getCurSelGroup(): GroupModel {
    let res = null;
    if (this.sel_doc) {
      res = this.getGroup(this.sel_doc.group_id);
    }
    return res;
  }

  restoreDoc(): void {
    this.sel_doc.x_state = 0;
    this.dgtree_changed = true;
    this.rerenderEvent.emit({forceShowSelected: false, resetDocument: false});
  }

  onDeleteDoc(): void {
    this.child_msgbox.setType(0);
    this.child_msgbox.setHead('Delete Document');
    this.child_msgbox.setBody('Are you sure you want to delete the document permanently?');
    this.child_msgbox.setButtonStyle('approve', 'Delete', 'red');
    this.child_msgbox.setButtonStyle('deny', 'Cancel', 'green');
    this.rerenderEvent.emit({forceShowSelected: false, resetDocument: false});

    this.child_msgbox.show(() => {
      this.deleteDoc(this.sel_doc);
      this.rerenderEvent.emit({forceShowSelected: false, resetDocument: false});
    });
  }

  deleteDoc(docInfo: DocInfoModel): void {
    ipc.send('delete-document-file', docInfo.id);
    const group = this.getGroup(docInfo.group_id);
    const index = group.documents.indexOf(docInfo);
    group.documents.splice(index, 1);
    this.dgtree_changed = true;
  }

  getNormalDocs(group: GroupModel): Array<DocInfoModel> {
    const res = [];
    for (const doc of group.documents) {
      if (doc.x_state === 0
        && (!this.search_text || doc.name.toLowerCase().indexOf(this.search_text.toLowerCase()) !== -1)) {
        res.push(doc);
      }
    }
    return res;
  }

  getRemovedDocs(): Array<DocInfoModel> {
    const res = [];
    for (const group of this.doc_groups) {
      for (const doc of group.documents) {
        if (doc.x_state === 1
          && (!this.search_text || doc.name.toLowerCase().indexOf(this.search_text.toLowerCase()) !== -1)) {
          res.push(doc);
        }
      }
    }
    return res;
  }

  onDocContextMenu(doc: DocInfoModel, group: GroupModel): void {
    let count = 0;
    let index = 0;
    const moveto = [];
    const opened = (doc.id === this.cur_doc.id);
    if (doc.type === DocType.ARTICLE) {
      for (const di of group.documents) {
        if (di.x_state === 0) {
          if (di.id === doc.id) {
            index = count;
          }
          ++count;
        }
      }

      for (const grp of this.doc_groups) {
        if (grp.x_state !== 0 || grp.id === group.id || grp.id === 'recycle' || grp.type === 'book') {
          continue;
        }
        moveto.push({id: grp.id, name: grp.name});
      }
    }

    this.select(doc);
    ipc.send('show-doc-context-menu', doc.type, index, count, moveto, opened);
  }

  onGroupContextMenu(group: GroupModel): void {
    let count = 0;
    let index = 0;
    for (const temp of this.doc_groups) {
      if (temp.x_state === 0) {
        if (temp.id === group.id) {
          index = count;
        }
        ++count;
      }
    }
    this.onClickGroup(group.id);
    ipc.send('show-group-context-menu', group, index, count);
  }

  onRecycleBinContextMenu(): void {
    this.onClickGroup('recycle');
    if (this.getRemovedDocs().length + this.getRemovedGroups().length) {
      ipc.send('show-recycle-bin-context-menu');
    }
  }

  onRecycleDocContextMenu(doc: DocInfoModel): void {
    this.select(doc);
    ipc.send('show-recycle-doc-context-menu');
  }

  onRecycleGroupContextMenu(group: GroupModel): void {
    this.onClickGroup(group.id);
    ipc.send('show-recycle-group-context-menu', group);
  }

  emptyRecycleBin(): void {
    this.child_msgbox.setType(0);
    this.child_msgbox.setHead('Empty Recycle Bin');
    this.child_msgbox.setBody('Are you sure you want to empty the recycle bin?');
    this.child_msgbox.setButtonStyle('approve', 'Empty Recycle Bin', 'red');
    this.child_msgbox.setButtonStyle('deny', 'Cancel', 'green');
    this.rerenderEvent.emit({forceShowSelected: false, resetDocument: false});

    this.child_msgbox.show(() => {
      for (const group of this.getRemovedGroups()) {
        this.deleteGroup(group.id);
      }

      for (const doc of this.getRemovedDocs()) {
        this.deleteDoc(doc);
      }
      this.rerenderEvent.emit({forceShowSelected: false, resetDocument: false});
    });
  }

  loadAppData(appData: AppdataModel) {
    if (appData) {
      this.app_data = appData;
    } else {
      this.app_data = new AppdataModel();
    }
  }

  loadDocGroups(docGroups: any): void {
    if (docGroups && docGroups.length) {
      this.doc_groups = docGroups;
      const docInfo = this.app_data.last_open_doc_id ? this.getDocInfo(this.app_data.last_open_doc_id) : null;
      if (docInfo) {
        this.sel_doc = docInfo;
        this.openDoc();
      }
    } else {
      this.doc_groups.push(new GroupModel({id: 'recycle', name: 'Recycle Bin'}));  // 回收站
      this.doc_groups.push(new GroupModel());  // 默认分组
      this.dgtree_changed = true;
    }
  }

  addDocument(filePath: string, fileName: string, fileData: string, group_id: string, doc_id: string): string {
    let docId = doc_id;
    let docInfo = null;
    if (docId) {
      docInfo = this.getDocInfo(docId);
    } else {
      docId = 'd' + moment().format('YYYYMMDDHHmmssSSS');
      docInfo = new DocInfoModel({
        id: docId,
        name: fileName,
        type: DocType.ARTICLE,
        group_id: group_id,
        file_path: filePath
      });
      this.getGroup(group_id).documents.push(docInfo);
    }

    const dataType = FunctionUtils.getExtName(fileName).toLowerCase();
    this.cache_docs[docId] = new DocumentModel({id: docId, file_data: fileData, data_type: dataType});
    this.dgtree_changed = true;

    this.select(docInfo);
    this.openDoc(false);
    return docId;
  }

  getDocInfo(docId: string): DocInfoModel {
    let res = null;
    for (const group of this.doc_groups) {
      for (const doc of group.documents) {
        if (doc.id === docId) {
          res = doc;
          break;
        }
      }
    }
    return res;
  }

  getCurDocInfo(): DocInfoModel {
    let res = null;
    if (this.cur_doc.id) {
      res = this.getDocInfo(this.cur_doc.id);
    }
    return res;
  }

  setTransModifiedFlag(docId: string): void {
    if (docId in this.cache_docs) {
      this.cache_docs[docId].modified = true;
    }
  }

  saveDocument(doc: DocumentModel, sync: boolean) {
    if (!doc.modified) {
      return;
    }
    const docInfo = this.getDocInfo(doc.id);
    if (sync) {
      ipc.sendSync('save-document', {
        data: doc,
        type: docInfo.type,
        group_id: docInfo.group_id,
        sync: true
      });
    } else {
      ipc.send('save-document', {
        data: doc,
        type: docInfo.type,
        group_id: docInfo.group_id,
        sync: false
      });
    }
    // 同步更新翻译结果文件
    if (docInfo.type === DocType.CHAPTER) {
      this.updateTargetFile(doc.id, sync);
    }
    doc.modified = false;
  }

  // save all modified documents
  saveAllDocuments(sync: boolean): void {
    for (const docId in this.cache_docs) {
      if (this.cache_docs.hasOwnProperty(docId)) {
        this.saveDocument(this.cache_docs[docId], sync);
      }
    }
  }

  updateTargetFile(docId: string, sync: boolean): void {
    const di = this.getDocInfo(docId);
    const filePath = di.file_path.replace(path.join(di.group_id, 'src'), path.join(di.group_id, 'dst'));
    this.updateTargetFileEvent.emit({sync: sync, target: filePath, type: 'xhtml'});
  }

  // save doc-group tree
  saveDGTree(sync: boolean): void {
    if (this.dgtree_changed) {
      if (sync) {
        const res = ipc.sendSync('save-doc-groups', {
          data: this.doc_groups,
          sync: true
        });
        if (res === 'ok') {
          this.dgtree_changed = false;
        }
      } else {
        ipc.send('save-doc-groups', {
          data: this.doc_groups,
          sync: false
        });
        this.dgtree_changed = false;
      }
    }
  }

  saveAppData(): void {
    this.app_data.last_open_doc_id = this.cur_doc.id;
    const res = ipc.sendSync('save-app-data', this.app_data);
    if (res !== 'ok') {
      alert('Save app data failed!');
    }
  }

  addGroup(): void {
    const ts = moment().format('YYYYMMDDHHmmssSSS');
    const group_id = 'g' + ts;
    this.doc_groups.push(new GroupModel({
      id: group_id,
      name: 'Group-' + ts.substr(2)
    }));
    this.dgtree_changed = true;

    this.rerenderEvent.emit({forceShowSelected: false, resetDocument: false});
    this.renameGroup(group_id);
  }

  getGroup(group_id: string): GroupModel {
    let res = null;
    for (const group of this.doc_groups) {
      if (group.id === group_id) {
        res = group;
        break;
      }
    }
    return res;
  }

  onSearchInput(inputBox: HTMLInputElement): void {
    const text = inputBox.value.trim();
    if (text) {
      if (text === this.search_text) {
        return;
      }

      this.search_text = text;
      this.rerenderEvent.emit({forceShowSelected: false, resetDocument: false});
      const tables = $('#left-side-list').find('table');
      tables.unhighlight();
      tables.highlight(this.search_text);
    } else {
      this.onCloseSearch(inputBox);
    }
  }

  onCloseSearch(inputBox: HTMLInputElement): void {
    inputBox.value = '';
    this.search_text = '';
    this.rerenderEvent.emit({forceShowSelected: false, resetDocument: false});
    const tables = $('#left-side-list').find('table');
    tables.unhighlight();
  }

  loadEpubContainer(data: string, bookId: string): void {
    this.books[bookId] = new Epub();
    this.books[bookId].loadContainer(data);
    ipc.send('read-epub-pkg-file', this.books[bookId].container.packagePath, bookId);
  }

  loadEpubPackage(data: string, bookId: string): void {
    this.books[bookId].loadPackaging(data);
    let navFile = this.books[bookId].packaging.ncxPath;
    if (!navFile) {
      navFile = this.books[bookId].packaging.navPath;
    }

    if (navFile) {
      const pkgDir = FunctionUtils.getBaseDir(this.books[bookId].container.packagePath);
      ipc.send('read-epub-nav-file', pkgDir, navFile, bookId);
    }
  }

  loadEpubNavigation(data: string, bookId: string, fullPkgDir: string): void {
    let str = data;
    const pkg = this.books[bookId].packaging;
    if (pkg.ncxPath && str.indexOf('<ncx:') !== -1) {
      str = data.replace(/<ncx:/g, '<');
      str = str.replace(/<\/ncx:/g, '</');
    }
    this.books[bookId].loadNavigation(str);
    const nav = this.books[bookId].navigation;

    const book = new GroupModel({
      id: bookId,
      name: pkg.metadata.title,
      type: GroupType.BOOK
    });
    this.doc_groups.push(book);
    this.dgtree_changed = true;

    for (const itemref of pkg.spine) {
      const rid = itemref['idref'];
      const href = pkg.manifest[rid].href;

      let label = href;
      if (rid in nav.id2Label) {
        label = nav.id2Label[rid];
      } else if (href in nav.href2Label) {
        label = nav.href2Label[href];
      }

      const diNew = new DocInfoModel({
        id: bookId + '-' + rid,
        name: label.trim(),
        type: DocType.CHAPTER,
        group_id: bookId,
        file_path: path.join(fullPkgDir, href)
      });
      book.documents.push(diNew);
      this.dgtree_changed = true;
    }

    if (book.documents.length) {
      book.open = true;
      this.sel_doc = book.documents[0];
      this.openDoc();
    } else {
      this.rerenderEvent.emit({forceShowSelected: false, resetDocument: false});
    }
  }

  exportBook(bookId: string): void {
    if (this.cur_doc.id) {
      this.updateTargetFile(this.cur_doc.id, true);
    }
    ipc.send('export-book', bookId);
  }

  // 修正从文件中读取的文档翻译状态
  reviseTransState(doc: DocumentModel): void {
    for (const sentence of doc.sentences) {
      for (const refer of sentence.refers) {
        if (refer.target.trans_state === TranslateState.REQUESTED
          || refer.target.trans_state === TranslateState.RECEIVED) {
          refer.target.trans_state = TranslateState.FAILURE;
        }
        for (const slice of refer.slices) {
          if (slice.trans_state === TranslateState.REQUESTED
            || slice.trans_state === TranslateState.RECEIVED) {
            slice.trans_state = TranslateState.FAILURE;
          }
        }
      }
    }
  }

  ngOnInit() {
    $('.ui.accordion')
      .accordion({
        exclusive: false,
        selector: {
          trigger: '.icon'
        },
        onOpening: () => {  // 相比onOpen，onOpening可以获得更好的视觉效果
          if (this.sel_eid.startsWith('#group-')) {
            const groupId = this.sel_eid.substr('#group-'.length);
            const group = this.getGroup(groupId);
            group.open = true;

            if (group.type === 'clip') {
              $(`${this.sel_eid}>i`).addClass('open');
            } else if (group.type === 'book') {
              $(`${this.sel_eid}>i`).removeClass('book');
              $(`${this.sel_eid}>i`).addClass('leanpub');
            } else if (groupId === 'recycle') {
              $(`${this.sel_eid}>i`).addClass('alternate outline');
            }
          } else {
            alert('No opened group found!');
          }
        },
        onClose: () => {
          if (this.sel_eid.startsWith('#group-')) {
            const groupId = this.sel_eid.substr('#group-'.length);
            const group = this.getGroup(groupId);
            group.open = false;

            if (group.type === 'clip') {
              $(`${this.sel_eid}>i`).removeClass('open');
            } else if (group.type === 'book') {
              $(`${this.sel_eid}>i`).addClass('book');
              $(`${this.sel_eid}>i`).removeClass('leanpub');
            } else if (groupId === 'recycle') {
              $(`${this.sel_eid}>i`).removeClass('alternate outline');
            }
          } else {
            alert('No closed group found!');
          }
        }
      });

    ipc.send('req-app-data');

    ipc.on('rsp-app-data', (event, data) => {
      this.loadAppData(data);
      ipc.send('req-doc-groups');
    });

    ipc.on('rsp-doc-groups', (event, data) => {
      this.loadDocGroups(data);
    });

    ipc.on('doc-open', (event) => {
      this.openDoc();
    });

    ipc.on('doc-rename', (event) => {
      this.renameDoc();
    });

    ipc.on('doc-remove', (event) => {
      this.removeDoc();
    });

    ipc.on('doc-move-up', (event) => {
      this.moveUpDoc();
    });

    ipc.on('doc-move-down', (event) => {
      this.moveDownDoc();
    });

    ipc.on('doc-move-to', (event, group_id) => {
      this.moveTo(group_id);
    });

    ipc.on('doc-export', (event) => {
      this.exportDoc();
    });

    ipc.on('empty-recycle-bin', (event) => {
      this.emptyRecycleBin();
    });

    ipc.on('doc-restore', (event) => {
      this.restoreDoc();
    });

    ipc.on('doc-delete', (event) => {
      this.onDeleteDoc();
    });

    ipc.on('group-restore', (event, group_id) => {
      this.restoreGroup(group_id);
    });

    ipc.on('group-delete', (event, group_id) => {
      this.onDeleteGroup(group_id);
    });

    ipc.on('import-doc', (event, group_id) => {
      this.importDoc(group_id);
    });

    ipc.on('group-rename', (event, group_id) => {
      this.renameGroup(group_id);
    });

    ipc.on('group-remove', (event, group_id) => {
      this.removeGroup(group_id);
    });

    ipc.on('group-move-up', (event, group_id) => {
      this.moveUpGroup(group_id);
    });

    ipc.on('group-move-down', (event, group_id) => {
      this.moveDownGroup(group_id);
    });

    ipc.on('load-epub-container', (event, data, bookId) => {
      this.loadEpubContainer(data, bookId);
    });

    ipc.on('load-epub-package', (event, data, bookId) => {
      this.loadEpubPackage(data, bookId);
    });

    ipc.on('load-epub-navigation', (event, data, bookId, fullPkgDir) => {
      this.loadEpubNavigation(data, bookId, fullPkgDir);
    });

    ipc.on('rsp-document', (event, doc) => {
      this.cache_docs[this.sel_doc.id] = doc;
      this.reviseTransState(this.cache_docs[this.sel_doc.id]);
      this.openDoc();
    });

    ipc.on('export-book-req', (event, group_id) => {
      this.exportBook(group_id);
    });

    ipc.send('auto-save-request');
    ipc.on('auto-save-schedule', (event) => {
      try {
        this.saveAllDocuments(false);
        this.saveDGTree(false);
      } finally {
        ipc.send('auto-save-request');
      }
    });

    window.onbeforeunload = () => {
      this.saveAllDocuments(true);
      this.saveDGTree(true);
      this.saveAppData();
    };
  }

}
