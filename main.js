const electron = require('electron');
// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;
const fs = require('fs');
const url = require('url');
const path = require('path');

const ipc = electron.ipcMain;
const dialog = electron.dialog;
const Menu = electron.Menu;
const MenuItem = electron.MenuItem;

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

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
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

function saveFile (event, currentFile, content) {
  fs.writeFile(currentFile, content, function(err) {
    event.sender.send('file-saved', err);
  });
}

const contextMenu = new Menu();
contextMenu.append(new MenuItem({ label: 'Translate', click: translate, icon: './dist/assets/images/icons/trans-16.png' }));
contextMenu.append(new MenuItem({ type: 'separator' }));
contextMenu.append(new MenuItem({ label: 'Merge Up', role: 'mergeUp' }));  // 拆分，合并，删除，修改
contextMenu.append(new MenuItem({ label: 'Merge Dn', role: 'mergeDn' }));  // 拆分，合并，删除，修改
contextMenu.append(new MenuItem({ label: 'Split', role: 'split' }));  // 支持手动修改和选取翻译结果
contextMenu.append(new MenuItem({ label: 'Delete', role: 'delete' }));  // 删除
contextMenu.append(new MenuItem({ type: 'separator' }));
contextMenu.append(new MenuItem({ label: 'Toggle Flag', role: 'toggleFlag' }));  // 标星，加备注

function translate(menuItem, browserWindow) {
  browserWindow.send('translate');
}

function showItemContextMenu(event) {
  const win = BrowserWindow.fromWebContents(event.sender);
  contextMenu.popup(win);
}

// Handles reading the contents of a file
ipc.on('read-file', readFile);
ipc.on('read-file-sync', readFileSync);
ipc.on('save-file', saveFile);
ipc.on('show-item-context-menu', showItemContextMenu);
