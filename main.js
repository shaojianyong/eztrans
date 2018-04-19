const { app, BrowserWindow, BrowserView, ipcMain, dialog, Menu, MenuItem } = require('electron');
const { JSDOM } = require('jsdom');

const fs = require('fs');
const url = require('url');
const del = require('del');
const path = require('path');
const { ncp } = require('ncp');
const loki = require('lokijs');
const xmldom = require('xmldom');
const moment = require('moment');
var zipFolder = require('zip-folder');
const unzip = require('extract-zip');

const EPUB_CONTAINER_FILE = 'META-INF/container.xml';

// app-settings, app-status
const appDb = new loki(path.join(__dirname, 'database', 'app.db'), {
  autoload: true,
  autosave: false
});

// doc-groups
const dgsDb = new loki(path.join(__dirname, 'database', 'dgs.db'), {
  autoload: true,
  autosave: false
});

// opened documents
let openedDocs = {};

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
// let transView;
// let loginView;

function createWindow() {
  // Create the browser window.
  // electron.Menu.setApplicationMenu(null);  // 隐藏菜单栏
  mainWindow = new BrowserWindow({width: 800, height: 600, minWidth: 800, minHeight: 600});

  /*
  loginView = new BrowserView();
  mainWindow.setBrowserView(loginView);
  const wcb = mainWindow.getContentBounds();
  loginView.setBounds({x: 0, y: 0, width: wcb.width, height: wcb.height});
  loginView.setAutoResize({width: true, height: true});
  transView.webContents.loadURL(url.format({
    pathname: path.join(__dirname, 'dist', 'index.html'),
    protocol: 'file:',
    slashes: true
  }));
  loginView.webContents.loadURL('https://www.whitehouse.gov/articles/great-debate-presidents-day-washingtons-birthday/');
  mainWindow.setBrowserView(null);  // 切换回默认视图
  */

  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'dist', 'index.html'),
    protocol: 'file:',
    slashes: true
  }));

  // Open the DevTools.
  // transView.webContents.openDevTools();
  // mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
});

app.on('activate', function() {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// TODO: 文本替换是有副作用的
function normalizeXmlTag(xml) {
  var reg = /<(\/?)([A-Za-z0-9_]+)\s+>/g;
  xml = xml.replace(reg,'<$1$2>');

  // reg = /<\s+(\/?)([A-Za-z0-9_]+)>/g;
  // xml = xml.replace(reg,'<$1$2>');

  // reg = /<(\/?)\s+([A-Za-z0-9_]+)>/g;
  // xml = xml.replace(reg,'<$1$2>');
  return xml;
}

function getBaseURL(webUrl) {
  let index = webUrl.lastIndexOf('/');
  if (index === -1) {
    index = webUrl.lastIndexOf('\\');
  }
  let res = webUrl;
  if (index !== -1) {
    res = webUrl.substr(0, index + 1);
  }
  return res;
}

function getFileName(filePath) {
  let res = null;
  const ns = filePath.split(/\/|\\/);
  if (ns.length) {
    res = ns[ns.length - 1];
  }
  return res;
}

function readFile(event, fileUrl, group_id) {
  if (fileUrl.length > 9
    && (fileUrl.substr(0, 7).toLowerCase() === 'http://'
      || fileUrl.substr(0, 8).toLowerCase() === 'https://')) {
    JSDOM.fromURL(fileUrl).then(function(dom) {
      // TODO: 对dom.window.document.head和firstElementChild做些检查
      const baseNode = dom.window.document.createElement('base');
      baseNode.setAttribute('href', getBaseURL(fileUrl));
      dom.window.document.head.insertBefore(baseNode, dom.window.document.head.firstElementChild);

      let fileName = dom.window.document.title.toLowerCase().replace(/ /g, '-') + '.html';
      if (fileUrl.endsWith('.html') || fileUrl.endsWith('.HTML')) {
        const index = fileUrl.lastIndexOf('/');
        fileName = fileUrl.substr(index + 1);
      }
      const docStr = normalizeXmlTag(dom.serialize());
      event.sender.send('file-read', docStr, fileUrl, fileName, group_id, null);
    });
  } else if (fileUrl.toLowerCase().endsWith('.epub')) {
    const bookId = 'b' + moment().format('YYYYMMDDHHmmssSSS');
    const bookSrc = path.join(__dirname, 'datafile', bookId, 'src');
    const bookDst = path.join(__dirname, 'datafile', bookId, 'dst');
    unzip(fileUrl, {dir: bookSrc}, function (err) {
      if (err) {
        throw new Error('Unzip ePub file error: ' + err);
      } else {
        ncp.limit = 16;
        ncp(bookSrc, bookDst, function (err) {
          if (err) {
            throw new Error('Fail to clone book source files: ' + bookSrc);
          }
          fs.readFile(path.join(bookSrc, EPUB_CONTAINER_FILE), function(err, data) {
            if (err) {
              throw new Error('Read container file error: ' + err);
            }
            event.sender.send('load-epub-container', data.toString(), bookId);
          });
          fs.mkdir(path.join(__dirname, 'datafile', bookId, 'dbs'), 0777, function (err) {
            if (err) {
              throw new Error('Fail to mkdir dbs');
            }
          });
        });
      }
    });

  } else {
    fs.readFile(fileUrl, 'utf8', function(err, data) {
      if (err) {
        throw new Error('Read doc file error: ' + err);
      } else {
        event.sender.send('file-read', data, fileUrl, getFileName(fileUrl), group_id, null);
      }
    });
  }
}

function saveFile(event, filePath, content) {
  fs.writeFile(filePath, content, function(err) {
    if (err) {
      event.returnValue = err;
      throw new Error('Write file error: ' + err);
    }
    event.returnValue = 'ok';
  });
}

function retranslate(menuItem, browserWindow) {
  browserWindow.send('retranslate');
}

function skipOver(menuItem, browserWindow) {
  browserWindow.send('skip_over');
}

function nextPage(menuItem, browserWindow) {
  browserWindow.send('next_page');
}

function prevPage(menuItem, browserWindow) {
  browserWindow.send('previous_page');
}

function toggleFlag(menuItem, browserWindow) {
  browserWindow.send('toggle-flag');
}

function transInFlight(menuItem, browserWindow) {
  browserWindow.send('trans-in-flight');
}

function docRename(menuItem, browserWindow) {
  browserWindow.send('doc-rename');
}

function docRemove(menuItem, browserWindow) {
  browserWindow.send('doc-remove');
}

function docMoveUp(menuItem, browserWindow) {
  browserWindow.send('doc-move-up');
}

function docMoveDown(menuItem, browserWindow) {
  browserWindow.send('doc-move-down');
}

function docMoveTo(menuItem, browserWindow) {
  browserWindow.send('doc-move-to', menuItem.group_id);
}

function docExport(menuItem, browserWindow) {
  browserWindow.send('doc-export');
}

function docOpen(menuItem, browserWindow) {
  browserWindow.send('doc-open');
}

function groupRename(menuItem, browserWindow) {
  browserWindow.send('group-rename', menuItem.group_id);
}

function groupRemove(menuItem, browserWindow) {
  browserWindow.send('group-remove', menuItem.group_id);
}

function groupMoveUp(menuItem, browserWindow) {
  browserWindow.send('group-move-up', menuItem.group_id);
}

function groupMoveDown(menuItem, browserWindow) {
  browserWindow.send('group-move-down', menuItem.group_id);
}

function exportBookReq(menuItem, browserWindow) {
  browserWindow.send('export-book-req', menuItem.group_id);
}

function importDoc(menuItem, browserWindow) {
  browserWindow.send('import-doc', menuItem.group_id);
}

function emptyRecycleBin(menuItem, browserWindow) {
  browserWindow.send('empty-recycle-bin');
}

function docRestore(menuItem, browserWindow) {
  browserWindow.send('doc-restore');
}

function docDelete(menuItem, browserWindow) {
  browserWindow.send('doc-delete');
}

function groupRestore(menuItem, browserWindow) {
  browserWindow.send('group-restore', menuItem.group_id);
}

function groupDelete(menuItem, browserWindow) {
  browserWindow.send('group-delete', menuItem.group_id);
}

// target, skipped
function showItemContextMenu(event, params) {
  const contextMenu = new Menu();

  if (params.target !== -2 && !params.skipped) {
    contextMenu.append(new MenuItem({
      label: 'Toggle Check Mark',
      click: toggleFlag,
      icon: './dist/assets/images/icons/checkmark.png'
    }));
  }

  if (params.target !== -2) {
    contextMenu.append(new MenuItem({
      label: 'Toggle Skip Over',  // keep original text
      click: skipOver,
      icon: './dist/assets/images/icons/quoteleft.png'
    }));
  }

  if (!params.skipped && !params.checked && params.target !== -1 && (params.target === -2 || params.retrans)) {
    if (contextMenu.items.length) {
      contextMenu.append(new MenuItem({type: 'separator'}));
    }
    contextMenu.append(new MenuItem({
      label: (params.target === -2) ? 'Translate' : 'Re-translate',
      click: retranslate,
      icon: params.target === -2 ? './dist/assets/images/icons/translate.png' : './dist/assets/images/icons/repeat.png'
    }));
  }

  if (params.target === -2 && !params.skipped) {
    contextMenu.append(new MenuItem({
      label: 'Translate in Flight',
      click: transInFlight,
      icon: './dist/assets/images/icons/plane.png'
    }));
  }

  if (params.target === -2) {
    if (contextMenu.items.length) {
      contextMenu.append(new MenuItem({type: 'separator'}));
    }
    contextMenu.append(new MenuItem({
      label: 'Toggle Skip Over',  // keep original text
      click: skipOver,
      icon: './dist/assets/images/icons/quoteleft.png'
    }));
  }

  if (params.page_count > 1) {
    contextMenu.append(new MenuItem({type: 'separator'}));
    contextMenu.append(new MenuItem({
      label: 'Next Page',
      click: nextPage,
      enabled: params.cur_page + 1 < params.page_count,
      icon: './dist/assets/images/icons/' + (params.cur_page + 1 < params.page_count ? 'arrowright.png' : 'arrowright0.png')
    }));
    contextMenu.append(new MenuItem({
      label: 'Previous Page',
      click: prevPage,
      enabled: params.cur_page > 0,
      icon: './dist/assets/images/icons/' + (params.cur_page > 0 ? 'arrowleft.png' : 'arrowleft0.png')
    }));
  }


  /*
  contextMenu.append(new MenuItem({ type: 'separator' }));
  contextMenu.append(new MenuItem({ label: 'Merge Up', icon: './dist/assets/images/icons/arrowup.png' }));
  contextMenu.append(new MenuItem({ label: 'Merge Down', icon: './dist/assets/images/icons/arrowdown.png' }));
  contextMenu.append(new MenuItem({ label: 'Split Segment', icon: './dist/assets/images/icons/split.png' }));
  contextMenu.append(new MenuItem({ label: 'Delete', icon: './dist/assets/images/icons/delete.png' }));
  */

  // const bv = BrowserView.fromWebContents(event.sender);
  // const win1 = BrowserWindow.fromWebContents(event.sender);  undefined!
  // const win2 = BrowserWindow.fromBrowserView(bv);
  const win = BrowserWindow.getFocusedWindow();  // win === win2
  contextMenu.popup(win);
}

function showDocContextMenu(event, docInfo, curGroup, allGroup, opened) {
  const contextMenu = new Menu();
  if (docInfo.type === 'article') {
    const subMenuItems = [];
    for (const group of allGroup) {
      if (group.id === curGroup.id || group.id === 'recycle' || group.type === 'book') {
        continue;
      }
      subMenuItems.push({
        label: group.name,
        click: docMoveTo,
        icon: './dist/assets/images/icons/folder.png',
        group_id: group.id
      });
    }

    if (!opened) {
      contextMenu.append(new MenuItem({
        label: 'Open',
        click: docOpen,
        icon: './dist/assets/images/icons/edit.png'
      }));
      contextMenu.append(new MenuItem({type: 'separator'}));
    }

    contextMenu.append(new MenuItem({
      label: 'Rename',
      click: docRename,
      icon: './dist/assets/images/icons/rename.png'
    }));

    contextMenu.append(new MenuItem({
      label: 'Remove',
      click: docRemove,
      icon: './dist/assets/images/icons/trash.png'
    }));

    if (subMenuItems.length || curGroup.documents.length > 1) {
      contextMenu.append(new MenuItem({type: 'separator'}));
    }
    if (subMenuItems.length) {
      contextMenu.append(new MenuItem({
        label: 'Move To',
        icon: './dist/assets/images/icons/moveto.png',
        submenu: subMenuItems
      }));
    }

    let docIdx = 0;
    for (const di of curGroup.documents) {
      if (di.id === docInfo.id) {
        break;
      }
      docIdx++;
    }

    if (docIdx !== 0) {
      contextMenu.append(new MenuItem({
        label: 'Move Up',
        click: docMoveUp,
        icon: './dist/assets/images/icons/arrowup.png'
      }));
    }

    if (docIdx !== curGroup.documents.length - 1) {
      contextMenu.append(new MenuItem({
        label: 'Move Down',
        click: docMoveDown,
        icon: './dist/assets/images/icons/arrowdown.png'
      }));
    }

    if (opened) {
      contextMenu.append(new MenuItem({type: 'separator'}));
      contextMenu.append(new MenuItem({
        label: 'Export',
        click: docExport,
        icon: './dist/assets/images/icons/export.png'
      }));
    }
  } else {
    if (!opened) {
      contextMenu.append(new MenuItem({
        label: 'Open',
        click: docOpen,
        icon: './dist/assets/images/icons/edit.png'
      }));
    }
  }

  if (contextMenu.items.length) {
    const win = BrowserWindow.fromWebContents(event.sender);
    contextMenu.popup(win);
  }
}

function showGroupContextMenu(event, group, index, length) {
  const contextMenu = new Menu();

  if (group.type === 'book') {
    contextMenu.append(new MenuItem({
      label: 'Export',
      click: exportBookReq,
      icon: './dist/assets/images/icons/export.png',
      group_id: group.id
    }));
  } else {
    contextMenu.append(new MenuItem({
      label: 'Import',
      click: importDoc,
      icon: './dist/assets/images/icons/import.png',
      group_id: group.id
    }));
  }

  contextMenu.append(new MenuItem({type: 'separator'}));
  contextMenu.append(new MenuItem({
    label: 'Rename',
    click: groupRename,
    icon: './dist/assets/images/icons/rename.png',
    group_id: group.id
  }));

  if (group.id !== 'default') {
    contextMenu.append(new MenuItem({
      label: 'Remove',
      click: groupRemove,
      icon: './dist/assets/images/icons/delete.png',
      group_id: group.id
    }));
  }

  // index of 0 is recycle bin
  if (index !== 1 && index !== 2) {
    contextMenu.append(new MenuItem({type: 'separator'}));
    contextMenu.append(new MenuItem({
      label: 'Move Up',
      click: groupMoveUp,
      icon: './dist/assets/images/icons/arrowup.png',
      group_id: group.id
    }));
  }

  if (index !== 1 && index !== length - 1) {
    contextMenu.append(new MenuItem({
      label: 'Move Down',
      click: groupMoveDown,
      icon: './dist/assets/images/icons/arrowdown.png',
      group_id: group.id
    }));
  }

  const win = BrowserWindow.fromWebContents(event.sender);
  contextMenu.popup(win);
}

function showRecycleDocContextMenu(event) {
  const contextMenu = new Menu();

  contextMenu.append(new MenuItem({
    label: 'Restore',
    click: docRestore,
    icon: './dist/assets/images/icons/restore.png'
  }));

  contextMenu.append(new MenuItem({type: 'separator'}));

  contextMenu.append(new MenuItem({
    label: 'Delete',
    click: docDelete,
    icon: './dist/assets/images/icons/delete.png'
  }));

  const win = BrowserWindow.fromWebContents(event.sender);
  contextMenu.popup(win);
}

function showRecycleGroupContextMenu(event, group) {
  const contextMenu = new Menu();

  contextMenu.append(new MenuItem({
    label: 'Restore',
    click: groupRestore,
    icon: './dist/assets/images/icons/restore.png',
    group_id: group.id
  }));

  contextMenu.append(new MenuItem({type: 'separator'}));

  contextMenu.append(new MenuItem({
    label: 'Delete',
    click: groupDelete,
    icon: './dist/assets/images/icons/delete.png',
    group_id: group.id
  }));

  const win = BrowserWindow.fromWebContents(event.sender);
  contextMenu.popup(win);
}

function showRecycleBinContextMenu(event) {
  const contextMenu = new Menu();
  contextMenu.append(new MenuItem({
    label: 'Empty Recycle Bin',
    click: emptyRecycleBin,
    icon: './dist/assets/images/icons/brush.png'
  }));

  const win = BrowserWindow.fromWebContents(event.sender);
  contextMenu.popup(win);
}

// TODO: 为了提升软件开启时的加载速度，考虑将appData存放到dgsDb，并和docGroups一次性返回给前端页面
function reqAppData(event) {
  const adc = appDb.getCollection('appData');
  if (adc) {
    var obj = adc.get(1);  // 获取集合中的首个元素
    event.sender.send('rsp-app-data', obj);
  } else {
    event.sender.send('rsp-app-data', null);
  }
}

function saveAppData(event, appData) {
  var adc = appDb.getCollection('appData');
  if (!adc) {
    adc = appDb.addCollection('appData');
  }

  var obj = adc.get(1);  // 获取集合中的首个元素
  if (obj) {
    appData['$loki'] = obj['$loki'];
    appData['meta'] = obj['meta'];
    adc.update(appData);
  } else {
    adc.insert(appData);
  }

  appDb.saveDatabase(function() {
    event.returnValue = 'ok';
    appDb.close();
  });
}

function reqDocGroups(event) {
  const docGroups = dgsDb.getCollection('docGroups');
  if (docGroups) {
    event.sender.send('rsp-doc-groups', docGroups.data);
  } else {
    event.sender.send('rsp-doc-groups', null);
  }
}

function saveDocGroups(event, params) {
  let dgc = dgsDb.getCollection('docGroups');
  if (!dgc) {
    dgc = dgsDb.addCollection('docGroups', {indices: ['id']});
    dgc.ensureUniqueIndex('id');
  }

  for (const g1 of dgc.data) {
    let exists = false;
    for (const g2 of params.data) {
      if (g1.id === g2.id) {
        exists = true;
        break;
      }
    }

    if (!exists) {
      dgc.remove(g1);
    }
  }

  for (const group of params.data) {
    let obj = dgc.findObject({'id': group.id});
    if (obj) {
      // https://github.com/techfort/LokiJS/issues/297
      group['$loki'] = obj['$loki'];
      group['meta'] = obj['meta'];
      dgc.update(group);
    } else {
      dgc.insert(group);
    }
  }

  dgsDb.saveDatabase(function() {
    if (params.sync) {
      event.returnValue = 'ok';
      dgsDb.close();
    }
  });

  /* event.returnValue 放这里不行，文件保存可能不完全，进程就退出了
  if (params.sync) {
    dgsDb.close();
    console.log('Sync saveDocGroups ...');
    event.returnValue = 'ok';
  }
  */
}

function openDocDb(fullDbPath, docId, event) {
  docDb = new loki(fullDbPath, {
    autoload: false,
    autosave: false
  });
  openedDocs[docId] = docDb;
  docDb.loadDatabase({}, function() {
    const dsc = docDb.getCollection('documents');
    if (dsc) {
      event.sender.send('rsp-document', dsc.data[0]);
    }
  });
}

// 文档作为单个元素保存，Collection中只有一个元素
function reqDocument(event, groupId, docId, docType, filePath) {
  let docDb = null;
  if (docId in openedDocs) {
    docDb = openedDocs[docId];
  } else if (docType === 'article') {
    openDocDb(path.join(__dirname, 'database', docId + '.db'), docId, event);
  } else if (docType === 'chapter') {
    const bookDbs = path.join(__dirname, 'datafile', groupId, 'dbs');
    const dbFile = path.join(bookDbs, docId + '.db');
    fs.exists(dbFile, function(exists) {
      if (exists) {
        openDocDb(dbFile, docId, event);
      } else {
        fs.readFile(filePath, 'utf8', function(err, data) {
          if (err) {
            throw new Error('Read doc file error: ' + err);
          } else {
            const parser = new xmldom.DOMParser();
            const xmldoc = parser.parseFromString(data.toString(), 'application/xhtml+xml');
            const headel = xmldoc.getElementsByTagName('head')[0];
            const baseel = xmldoc.createElement('base');
            const metael = xmldoc.createElement('meta');
            const baseHref = 'file:///' + getBaseURL(filePath).replace(/\\/g, '/');
            baseel.setAttribute('href', baseHref);
            metael.setAttribute('charset', 'utf-8');
            headel.insertBefore(baseel, headel.firstChild);
            headel.insertBefore(metael, headel.firstChild);

            const serial = new xmldom.XMLSerializer();
            const docStr = normalizeXmlTag(serial.serializeToString(xmldoc));
            console.log('-------->', docStr);
            event.sender.send('file-read', docStr, filePath, getFileName(filePath), groupId, docId);
          }
        });
      }
    });
  } else {
    throw new Error('Invalid doc type: ' + docType);
  }
}

function saveDocument(event, params) {
  let docDb = null;
  const doc = params.data;

  if (doc.id in openedDocs) {
    docDb = openedDocs[doc.id];
  } else if (params.type === 'article') {
    docDb = new loki(path.join(__dirname, 'database', doc.id + '.db'), {
      autoload: true,
      autosave: false
    });
    openedDocs[doc.id] = docDb;
  } else if (params.type === 'chapter') {
    const bookDbs = path.join(__dirname, 'datafile', params.group_id, 'dbs');
    const dbFile = path.join(bookDbs, doc.id + '.db');
    docDb = new loki(dbFile, {
      autoload: false,
      autosave: false
    });
    openedDocs[doc.id] = docDb;
  } else {
    throw new Error('Invalid doc type: ' + params.type);
  }

  let dsc = docDb.getCollection('documents');
  if (!dsc) {
    dsc = docDb.addCollection('documents', {indices: ['id']});
    dsc.ensureUniqueIndex('id');
  }

  const obj = dsc.findObject({'id': doc.id});
  if (obj) {
    // https://github.com/techfort/LokiJS/issues/297
    doc['$loki'] = obj['$loki'];
    doc['meta'] = obj['meta'];
    dsc.update(doc);
  } else {
    dsc.insert(doc);
  }

  docDb.saveDatabase(function() {
    if (params.sync) {
    event.returnValue = 'ok';
    docDb.close();
    }
  });
}

function deleteDocFile(event, doc_id) {
  // close database
  const docDb = openedDocs[doc_id];
  if (docDb) {
    docDb.close();
  }

  // delete db-file
  const filePath = path.join(__dirname, 'database', doc_id + '.db');
  if (fs.existsSync(filePath)) {
    fs.unlink(filePath, function (err) {
      if (err) {
        throw new Error('Fail to delete file: ' + filePath);
      }
    });
  }
}

function readEpubPkgFile(event, opfPath, bookId) {
  const bookSrc = path.join(__dirname, 'datafile', bookId, 'src');
  fs.readFile(path.join(bookSrc, opfPath), function(err, data) {
    if (err) {
      throw new Error('Read package file error: ' + err);
    } else {
      event.sender.send('load-epub-package', data.toString(), bookId);
    }
  });
}

function readEpubNavFile(event, pkgDir, ncxPath, bookId) {
  const bookSrc = path.join(__dirname, 'datafile', bookId, 'src');
  fs.readFile(path.join(bookSrc, pkgDir, ncxPath), function(err, data) {
    if (err) {
      throw new Error('Read navigation file error: ' + err);
    } else {
      const fullPkgDir = path.join(bookSrc, pkgDir);
      event.sender.send('load-epub-navigation', data.toString(), bookId, fullPkgDir);
    }
  });
}

function exportBook(event, bookId) {
  const bookDst = path.join(__dirname, 'datafile', bookId, 'dst');
  const options = {
    title: 'Export eBook File',
    filters: [{name: 'eBooks (*.epub)', extensions: ['epub']}],
    defaultPath: 'output_ebook.epub'  // TODO: default name and path!
  };
  dialog.showSaveDialog(options, function(filename) {
    if (filename) {
      zipFolder(bookDst, filename, function(err) {
        if(err) {
          throw new Error('Zip compress error: ' + err);
        }
      });
    }
  });
}

function deleteBookFolder(event, bookId) {
  const bookdir = path.join(__dirname, 'datafile', bookId);
  del([bookdir]).then(function(paths) {
    console.log('Book folder deleted: ' + bookId);
  });
}

function deleteGroupFiles(event, documents) {
  for (const doc of documents) {
    deleteDocFile(null, doc.id);
  }
}

// 定时器放入renderer进程回导致页面刷新
function autoSaveRequest(event) {
  const timeoutObj = setTimeout(function() {
    event.sender.send('auto-save-schedule');
    clearTimeout(timeoutObj);
  }, 60000);  // 一分钟自动保存一次
}

// Handles reading the contents of a file
ipcMain.on('read-file', readFile);
ipcMain.on('save-file', saveFile);
ipcMain.on('show-item-context-menu', showItemContextMenu);
ipcMain.on('show-doc-context-menu', showDocContextMenu);
ipcMain.on('show-group-context-menu', showGroupContextMenu);
ipcMain.on('show-recycle-bin-context-menu', showRecycleBinContextMenu);
ipcMain.on('show-recycle-doc-context-menu', showRecycleDocContextMenu);
ipcMain.on('show-recycle-group-context-menu', showRecycleGroupContextMenu);
ipcMain.on('req-app-data', reqAppData);
ipcMain.on('save-app-data', saveAppData);
ipcMain.on('req-doc-groups', reqDocGroups);
ipcMain.on('save-doc-groups', saveDocGroups);
ipcMain.on('req-document', reqDocument);
ipcMain.on('save-document', saveDocument);
ipcMain.on('delete-document-file', deleteDocFile);
ipcMain.on('read-epub-pkg-file', readEpubPkgFile);
ipcMain.on('read-epub-nav-file', readEpubNavFile);
ipcMain.on('export-book', exportBook);
ipcMain.on('delete-book-folder', deleteBookFolder);
ipcMain.on('delete-group-files', deleteGroupFiles);
ipcMain.on('auto-save-request', autoSaveRequest);
