const electron = require('electron');
// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;
const fs = require('fs');
const url = require('url');
const path = require('path');
const loki = require('lokijs');

const ipc = electron.ipcMain;
const dialog = electron.dialog;
const Menu = electron.Menu;
const MenuItem = electron.MenuItem;

// app-settings, app-status
const appDb = new loki(path.join(__dirname, 'database', 'app.db'), {
  autoload: true,
  autosave: false
});

// doc-groups
const docDb = new loki(path.join(__dirname, 'database', 'doc.db'), {
  autoload: true,
  autosave: false
});

function sleep(msec) {
  return new Promise(resolve => setTimeout(resolve, msec));
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow () {
  // Create the browser window.
  // electron.Menu.setApplicationMenu(null);  // 隐藏菜单栏
  mainWindow = new BrowserWindow({width: 800, height: 600, minWidth: 800, minHeight: 600});

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'dist', 'index.html'),
    protocol: 'file:',
    slashes: true
  }));

  /*
  mainWindow.on('close', function () {
    console.log('Main window close.');
  });
  */

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
});

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

function readFile (event, files) {
  if (files) {
    const filePath = files[0];
    fs.readFile(filePath, 'utf8', function(err, data) {
      event.sender.send('file-read', err, data, filePath);
    });
  }
}

// 同步通信，如果不设置event.returnValue，界面会僵住
function readFileSync (event, files) {
  if (files) {
    const filePath = files[0];
    fs.readFile(filePath, 'utf8', function(err, data) {
      if (err) {
        event.returnValue = err.message;
      } else {
        event.returnValue = data;
      }
    });
  }
}

function saveFile (event, filePath, content) {
  fs.writeFile(filePath, content, function(err) {
    event.sender.send('file-saved', err);
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

function docRename(menuItem, browserWindow) {
  browserWindow.send('doc-rename');
}

function docDelete(menuItem, browserWindow) {
  browserWindow.send('doc-delete');
}

function docMoveUp(menuItem, browserWindow) {
  browserWindow.send('doc-move-up');
}

function docMoveDown(menuItem, browserWindow) {
  browserWindow.send('doc-move-down');
}

function docMoveTo(menuItem, browserWindow) {
  console.log(menuItem.group_id);
  browserWindow.send('doc-move-to', menuItem.group_id);
}

function docExport(menuItem, browserWindow) {
  browserWindow.send('doc-export');
}

function docOpen(menuItem, browserWindow) {
  browserWindow.send('doc-open');
}

function groupRename(menuItem, browserWindow) {
  browserWindow.send('group-rename');
}

function groupDelete(menuItem, browserWindow) {
  browserWindow.send('group-delete');
}

function importDoc(menuItem, browserWindow) {
  browserWindow.send('import-doc');
}

function showItemContextMenu(event, page_count, cur_page) {
  const contextMenu = new Menu();
  contextMenu.append(new MenuItem({
    label: 'Re-translate',
    click: retranslate,
    icon: './dist/assets/images/icons/repeat.png'
  }));
  contextMenu.append(new MenuItem({
    label: 'Toggle Skip',
    click: skipOver,
    icon: './dist/assets/images/icons/ban.png'
  }));
  if (page_count > 1) {
    contextMenu.append(new MenuItem({type: 'separator'}));
    contextMenu.append(new MenuItem({
      label: 'Next Page',
      click: nextPage,
      enabled: cur_page + 1 < page_count,
      icon: './dist/assets/images/icons/' + (cur_page + 1 < page_count ? 'arrowright.png' : 'arrowright0.png')
    }));
    contextMenu.append(new MenuItem({
      label: 'Previous Page',
      click: prevPage,
      enabled: cur_page > 0,
      icon: './dist/assets/images/icons/' + (cur_page > 0 ? 'arrowleft.png' : 'arrowleft0.png')
    }));
  }
  contextMenu.append(new MenuItem({ type: 'separator' }));
  contextMenu.append(new MenuItem({
    label: 'Toggle Mark',
    click: toggleFlag,
    icon: './dist/assets/images/icons/flag.png'
  }));

  /*
  contextMenu.append(new MenuItem({ type: 'separator' }));
  contextMenu.append(new MenuItem({ label: 'Merge Up', icon: './dist/assets/images/icons/arrowup.png' }));
  contextMenu.append(new MenuItem({ label: 'Merge Down', icon: './dist/assets/images/icons/arrowdown.png' }));
  contextMenu.append(new MenuItem({ label: 'Split Segment', icon: './dist/assets/images/icons/split.png' }));
  contextMenu.append(new MenuItem({ label: 'Delete', icon: './dist/assets/images/icons/delete.png' }));
  */

  const win = BrowserWindow.fromWebContents(event.sender);
  contextMenu.popup(win);
}

function showDocContextMenu(event, moveTo) {
  const subMenuItems = [];
  for (const group of moveTo) {
    subMenuItems.push({
      label: group.name,
      click: docMoveTo,
      icon: './dist/assets/images/icons/folder.png',
      group_id: group.id
    });
  }

  const contextMenu = new Menu();

  contextMenu.append(new MenuItem({
    label: 'Open',
    click: docOpen,
    icon: './dist/assets/images/icons/edit.png'
  }));

  contextMenu.append(new MenuItem({type: 'separator'}));
  contextMenu.append(new MenuItem({
    label: 'Rename',
    click: docRename,
    icon: './dist/assets/images/icons/rename.png'
  }));

  contextMenu.append(new MenuItem({
    label: 'Delete',
    click: docDelete,
    icon: './dist/assets/images/icons/delete.png'
  }));

  contextMenu.append(new MenuItem({type: 'separator'}));
  contextMenu.append(new MenuItem({
    label: 'Move Up',
    click: docMoveUp,
    icon: './dist/assets/images/icons/arrowup.png'
  }));

  contextMenu.append(new MenuItem({
    label: 'Move Down',
    click: docMoveDown,
    icon: './dist/assets/images/icons/arrowdown.png'
  }));

  if (subMenuItems.length) {
    contextMenu.append(new MenuItem({
      label: 'Move To',
      icon: './dist/assets/images/icons/moveto.png',
      submenu: subMenuItems
    }));
  }
  contextMenu.append(new MenuItem({type: 'separator'}));
  contextMenu.append(new MenuItem({
    label: 'Export',
    click: docExport,
    icon: './dist/assets/images/icons/export.png'
  }));

  const win = BrowserWindow.fromWebContents(event.sender);
  contextMenu.popup(win);
}

function showGroupContextMenu(event) {
  const contextMenu = new Menu();

  contextMenu.append(new MenuItem({
    label: 'Import',
    click: importDoc,
    icon: './dist/assets/images/icons/import.png'
  }));

  contextMenu.append(new MenuItem({type: 'separator'}));
  contextMenu.append(new MenuItem({
    label: 'Rename',
    click: groupRename,
    icon: './dist/assets/images/icons/rename.png'
  }));

  contextMenu.append(new MenuItem({
    label: 'Delete',
    click: groupDelete,
    icon: './dist/assets/images/icons/delete.png'
  }));

  contextMenu.append(new MenuItem({type: 'separator'}));
  contextMenu.append(new MenuItem({
    label: 'Move Up',
    click: docMoveTo,
    icon: './dist/assets/images/icons/arrowup.png'
  }));

  contextMenu.append(new MenuItem({
    label: 'Move Down',
    click: docMoveTo,
    icon: './dist/assets/images/icons/arrowdown.png'
  }));

  const win = BrowserWindow.fromWebContents(event.sender);
  contextMenu.popup(win);
}

function reqDocGroups(event) {
  const docGroups = docDb.getCollection('docGroups');
  if (docGroups) {
    event.sender.send('rsp-doc-groups', docGroups.data);
  } else {
    event.sender.send('rsp-doc-groups', null);
  }
}

function saveDocGroups(event, params) {
  let dgc = docDb.getCollection('docGroups');
  if (!dgc) {
    dgc = docDb.addCollection('docGroups', {indices: ['id']});
    dgc.ensureUniqueIndex('id');
  }

  for(const group of params.data) {
    if (dgc.by('id', group.id)) {
      dgc.update(group);
    } else {
      dgc.insert(group);
    }
  }

  docDb.saveDatabase(() => {
    if (params.sync) {
      event.returnValue = 'ok';
      docDb.close();
    }
  });

  /* event.returnValue 放这里不行，文件保存可能不完全，进程就退出了
  if (params.sync) {
    docDb.close();
    console.log('Sync saveDocGroups ...');
    event.returnValue = 'ok';
  }
  */
}

function docRepeatInquiry(event, doc) {
  const options = {
    type: 'info',
    title: 'EZtrans',
    message: "The file already imported. Open it now?",
    buttons: ['Yes', 'No']
  };

  dialog.showMessageBox(options, function(index) {
    event.sender.send('doc-repeat-reply', index, doc)
  });
}

// Handles reading the contents of a file
ipc.on('read-file', readFile);
ipc.on('read-file-sync', readFileSync);
ipc.on('save-file', saveFile);
ipc.on('show-item-context-menu', showItemContextMenu);
ipc.on('show-doc-context-menu', showDocContextMenu);
ipc.on('show-group-context-menu', showGroupContextMenu);
ipc.on('req-doc-groups', reqDocGroups);
ipc.on('save-doc-groups', saveDocGroups);
ipc.on('doc-repeat-inquiry', docRepeatInquiry);
