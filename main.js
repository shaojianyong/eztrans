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
contextMenu.append(new MenuItem({ label: 'Translate', click: translate, icon: './dist/assets/images/icons/translate.png' }));
contextMenu.append(new MenuItem({ type: 'separator' }));
contextMenu.append(new MenuItem({ label: 'Merge to Up', icon: './dist/assets/images/icons/arrowup.png' }));
contextMenu.append(new MenuItem({ label: 'Merge to Down', icon: './dist/assets/images/icons/arrowdown.png' }));
contextMenu.append(new MenuItem({ label: 'Split Sentence' }));
contextMenu.append(new MenuItem({ label: 'Delete', icon: './dist/assets/images/icons/delete.png' }));
contextMenu.append(new MenuItem({ type: 'separator' }));
contextMenu.append(new MenuItem({ label: 'Toggle Mark', click: toggleFlag, icon: './dist/assets/images/icons/flag.png' }));

function translate(menuItem, browserWindow) {
  browserWindow.send('translate');
}

function toggleFlag(menuItem, browserWindow) {
  browserWindow.send('toggle-flag');
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
