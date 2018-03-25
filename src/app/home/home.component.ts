import { Component, OnInit, Output, EventEmitter, ViewChild } from '@angular/core';
import {Title} from '@angular/platform-browser';
const path = (<any>window).require('path');
const moment = (<any>window).require('moment');
const electron = (<any>window).require('electron');
const ipc = electron.ipcRenderer;

import Epub from '../services/epub/epub';
import { FunctionUtils } from '../services/utils/function-utils';
import { DocumentModel } from '../services/model/document.model';
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
  modified_flag = false;
  sel_eid = '';  // 当前选中html元素的id
  search_text = '';
  books = {};

  constructor(private title: Title) { }


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

  onClickGroup(group_id: string) {
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

  // 切换当前打开文档前，要先保存
  openDoc(rerender = true): void {
    if (this.cur_doc.id === this.sel_doc.id) {
      return;
    }

    if (this.sel_doc.id in this.cache_docs) {
      if (this.cur_doc && this.cur_doc.id) {
        this.saveCurDocument(false);
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
    this.updateTitle();
    event.preventDefault();
    this.modified_flag = true;
  }

  removeDoc(): void {
    this.sel_doc.x_state = 1;  // 标记删除，实现逻辑：切换到已删除分组
    if (this.sel_doc.id === this.cur_doc.id) {
      this.cur_doc = new DocumentModel();  // 指向一个空文档
      this.updateTitle();
      this.rerenderEvent.emit({forceShowSelected: false, resetDocument: true});
    } else {
      this.rerenderEvent.emit({forceShowSelected: false, resetDocument: false});
    }
    this.modified_flag = true;
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
    if (index > 0) {
      const temp = group.documents[index];
      group.documents[index] = group.documents[index - 1];
      group.documents[index - 1] = temp;

      this.rerenderEvent.emit({forceShowSelected: false, resetDocument: false});
      this.modified_flag = true;
    }
  }

  moveDownDoc(): void {
    const group = this.getCurSelGroup();
    const index = group.documents.indexOf(this.sel_doc);
    if (index < group.documents.length - 1) {
      const temp = group.documents[index];
      group.documents[index] = group.documents[index + 1];
      group.documents[index + 1] = temp;

      this.rerenderEvent.emit({forceShowSelected: false, resetDocument: false});
      this.modified_flag = true;
    }
  }

  moveTo(group_id: string): void {
    const toGroup = this.getGroup(group_id);
    const frGroup = this.getCurSelGroup();
    const index = frGroup.documents.indexOf(this.sel_doc);

    toGroup.documents.push(this.sel_doc);
    frGroup.documents.splice(index, 1);
    this.sel_doc.group_id = toGroup.id;

    this.rerenderEvent.emit({forceShowSelected: false, resetDocument: false});
    this.modified_flag = true;
  }

  exportDoc(): void {
    this.exportEvent.emit();
  }

  importDoc(group_id: string): void {
    this.importEvent.emit({group_id: group_id});
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

    event.preventDefault();
    this.modified_flag = true;
  }

  deleteGroup(group_id: string): void {
    let frIndex = 0;
    for (const group of this.doc_groups) {
      if (group.id === group_id) {
        frIndex++;
        break;
      }
    }

    this.child_msgbox.setType(0);
    this.child_msgbox.setHead('Delete Group');
    this.child_msgbox.setBody('Are you sure you want to delete the group permanently?');
    this.child_msgbox.setButtonStyle('approve', 'Delete', 'red');
    this.child_msgbox.setButtonStyle('deny', 'Cancel', 'green');
    this.rerenderEvent.emit({forceShowSelected: false, resetDocument: false});

    this.child_msgbox.show(() => {
      // 文档的组织关系挂到默认分组中，同时把文档放入回收站(从回收站撤回时，返回到默认分组中)
      const toGroup = this.getGroup('my-translations');
      for (const doc of this.doc_groups[frIndex].documents) {
        doc.x_state = 1;  // 小组中的文档放入回收站，对于已放入回收站的文档没有影响
        doc.group_id = toGroup.id;
        toGroup.documents.push(doc);
      }
      this.doc_groups.splice(frIndex, 1);
      this.rerenderEvent.emit({forceShowSelected: false, resetDocument: false});
      this.modified_flag = true;
    });
  }

  moveUpGroup(group_id: string): void {
    const group = this.getGroup(group_id);
    const index = this.doc_groups.indexOf(group);
    if (index > 0) {
      const temp = this.doc_groups[index];
      this.doc_groups[index] = this.doc_groups[index - 1];
      this.doc_groups[index - 1] = temp;

      this.rerenderEvent.emit({forceShowSelected: false, resetDocument: false});
      this.modified_flag = true;
    }
  }

  moveDownGroup(group_id: string): void {
    const group = this.getGroup(group_id);
    const index = this.doc_groups.indexOf(group);
    if (index < this.doc_groups.length - 1) {
      const temp = this.doc_groups[index];
      this.doc_groups[index] = this.doc_groups[index + 1];
      this.doc_groups[index + 1] = temp;

      this.rerenderEvent.emit({forceShowSelected: false, resetDocument: false});
      this.modified_flag = true;
    }
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
    this.rerenderEvent.emit({forceShowSelected: false, resetDocument: false});
    this.modified_flag = true;
  }

  deleteDoc(): void {
    this.child_msgbox.setType(0);
    this.child_msgbox.setHead('Delete Document');
    this.child_msgbox.setBody('Are you sure you want to delete the document permanently?');
    this.child_msgbox.setButtonStyle('approve', 'Delete', 'red');
    this.child_msgbox.setButtonStyle('deny', 'Cancel', 'green');
    this.rerenderEvent.emit({forceShowSelected: false, resetDocument: false});

    this.child_msgbox.show(() => {
      this.sel_doc.x_state = 2;  // 彻底删除
      ipc.send('delete-document-file', this.sel_doc.id);
      this.rerenderEvent.emit({forceShowSelected: false, resetDocument: false});
      this.modified_flag = true;
    });
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

  hasRemovedDocs(): boolean {
    let res = false;
    for (const group of this.doc_groups) {
      for (const doc of group.documents) {
        if (doc.x_state === 1) {
          res = true;
          break;
        }
      }
    }
    return res;
  }

  onDocContextMenu(doc: DocInfoModel, group: GroupModel): void {
    this.select(doc);
    const opened = (doc.id === this.cur_doc.id);
    ipc.send('show-doc-context-menu', group, this.doc_groups, opened);
  }

  onGroupContextMenu(group: GroupModel): void {
    this.onClickGroup(group.id);
    ipc.send('show-group-context-menu', group.id);
  }

  onRecycleBinContextMenu(): void {
    this.onClickGroup('recycle');
    if (this.hasRemovedDocs()) {
      ipc.send('show-recycle-bin-context-menu');
    }
  }

  onRecycleDocContextMenu(doc: DocInfoModel): void {
    this.select(doc);
    ipc.send('show-recycle-doc-context-menu');
  }

  emptyRecycleBin(): void {
    this.child_msgbox.setType(0);
    this.child_msgbox.setHead('Empty Recycle Bin');
    this.child_msgbox.setBody('Are you sure you want to empty the recycle bin?');
    this.child_msgbox.setButtonStyle('approve', 'Empty Recycle Bin', 'red');
    this.child_msgbox.setButtonStyle('deny', 'Cancel', 'green');
    this.rerenderEvent.emit({forceShowSelected: false, resetDocument: false});

    this.child_msgbox.show(() => {
      for (const doc of this.getRemovedDocs()) {
        doc.x_state = 2;  // 彻底删除
        ipc.send('delete-document-file', doc.id);
      }
      this.rerenderEvent.emit({forceShowSelected: false, resetDocument: false});
      this.modified_flag = true;
    });
  }

  loadDocGroups(docGroups: any): void {
    if (docGroups && docGroups.length) {
      this.doc_groups = docGroups;
    } else {
      this.doc_groups.push(new GroupModel());
    }
  }

  addDocument(filePath: string, fileName: string, fileData: string, group_id: string, doc_id: string): boolean {
    let docId = null;
    let docInfo = null;
    if (doc_id) {
      docId = doc_id;
      docInfo = this.getDocInfo(docId);
    } else {
      const doc = this.findDocInfo(filePath);
      if (doc && doc.name.toLowerCase() === fileName.toLowerCase()) {  // 已导入，并且没有重命名
        if (doc.id === this.cur_doc.id) {
          this.child_msgbox.setType(1);  // info
          this.child_msgbox.setHead('Duplicate Documents');
          this.child_msgbox.setBody(`The file ${fileName} has been imported. It's the current document.`);
          this.child_msgbox.setButtonStyle('close', 'Close', 'violet');
          this.rerenderEvent.emit({forceShowSelected: false, resetDocument: false});
          this.child_msgbox.show();
        } else {
          this.child_msgbox.setType(0);
          this.child_msgbox.setHead('Duplicate Documents');
          this.child_msgbox.setBody(`The file ${fileName} has been imported. Open it now?`);
          this.child_msgbox.setButtonStyle('approve', 'Yes', 'violet');
          this.child_msgbox.setButtonStyle('deny', 'No', 'green');
          this.rerenderEvent.emit({forceShowSelected: false, resetDocument: false});
          this.child_msgbox.show(() => {
            this.select(doc);
            this.openDoc();
          });
        }
        return false;
      }

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

    this.select(docInfo);
    this.openDoc(false);
    this.modified_flag = true;
    return true;
  }

  findDocInfo(filePath: string): DocInfoModel {
    let res = null;
    for (const group of this.doc_groups) {
      for (const doc of group.documents) {
        if (doc.file_path.toLowerCase() === filePath.toLowerCase() && doc.x_state === 0) {
          res = doc;
          break;
        }
      }
    }
    return res;
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

  // save current document
  saveCurDocument(sync: boolean) {
    if (!this.cur_doc.id) {
      return;
    }
    const docInfo = this.getDocInfo(this.cur_doc.id);
    if (sync) {
      ipc.sendSync('save-document', {
        data: this.cur_doc,
        type: docInfo.type,
        group_id: docInfo.group_id,
        sync: true
      });
    } else {
      ipc.send('save-document', {
        data: this.cur_doc,
        type: docInfo.type,
        group_id: docInfo.group_id,
        sync: false
      });
    }
    // 同步更新翻译结果文件
    this.updateTargetFile(sync);
  }

  updateTargetFile(sync: boolean): void {
    const di = this.getDocInfo(this.cur_doc.id);
    const filePath = di.file_path.replace(path.join(di.group_id, 'src'), path.join(di.group_id, 'dst'));
    this.updateTargetFileEvent.emit({sync: sync, target: filePath, type: 'xhtml'});
  }

  // save doc-groups
  saveDocGroups(sync: boolean): void {
    if (this.modified_flag) {
      if (sync) {
        const res = ipc.sendSync('save-doc-groups', {
          data: this.doc_groups,
          sync: true
        });
        if (res === 'ok') {
          this.modified_flag = false;
        }
      } else {
        ipc.send('save-doc-groups', {
          data: this.doc_groups,
          sync: false
        });
        this.modified_flag = false;
      }
    }
  }

  addGroup(): void {
    const ts = moment().format('YYYYMMDDHHmmssSSS');
    const group_id = 'g' + ts;
    this.doc_groups.push(new GroupModel({
      id: group_id,
      name: 'Group-' + ts.substr(2)
    }));

    this.rerenderEvent.emit({forceShowSelected: false, resetDocument: false});
    this.modified_flag = true;
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

    this.doc_groups.push(new GroupModel({
      id: bookId,
      name: pkg.metadata.title,
      type: GroupType.BOOK
    }));

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
      this.getGroup(bookId).documents.push(diNew);
    }

    this.rerenderEvent.emit({forceShowSelected: false, resetDocument: false});
    this.modified_flag = true;
  }

  exportBook(bookId: string): void {
    // TODO: this.updateTargetFile(true);
    ipc.send('export-book', bookId);
  }

  ngOnInit() {
    $('.ui.accordion')
      .accordion({
        exclusive: false
      });

    ipc.send('req-doc-groups');

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
      this.deleteDoc();
    });

    ipc.on('import-doc', (event, group_id) => {
      this.importDoc(group_id);
    });

    ipc.on('group-rename', (event, group_id) => {
      this.renameGroup(group_id);
    });

    ipc.on('group-delete', (event, group_id) => {
      this.deleteGroup(group_id);
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
      this.openDoc();
    });

    ipc.on('export-book-req', (event, group_id) => {
      this.exportBook(group_id);
    });

    // auto save all user data
    const autoSave = setInterval(() => {
      this.saveCurDocument(false);
      this.saveDocGroups(false);
    }, 1000 * 5);


    window.onbeforeunload = () => {
      clearInterval(autoSave);
      this.saveCurDocument(true);
      this.saveDocGroups(true);
    };
  }

}
