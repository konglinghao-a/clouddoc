const { app, ipcMain, Menu, dialog } = require('electron');
const isDev = require('electron-is-dev');
const path = require('path')
const menuTemplate = require('./src/menuTemplate');
const AppWindow = require('./src/AppWindow');
const Store = require('electron-store');
const settingsStore = new Store({ name: 'Settings' });
const QiniuManager = require('./src/utils/QiniuManager');
const fileStore = new Store({ name: 'files data' });
let mainWindow, settingsWindow;

const createManager = () => {
  const savedQiniuConfig = settingsStore.get('savedQiniuConfig');
  const accessKey = savedQiniuConfig['access-key'];
  const secretKey = savedQiniuConfig['secret-key'];
  const bucketName = savedQiniuConfig['bucket'];
  return new QiniuManager(accessKey, secretKey, bucketName);
}

app.on('ready', () => {
  const mainWindowConfig = {
    width: 1140,
    height: 768
  }
  //判断是否是生产环境然后再load url
  const urlLocation = isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, './index.html')}`;
  mainWindow = new AppWindow(mainWindowConfig, urlLocation);
  // 小小的优化，关闭的时候卸载
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  //set the menu
  let menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  // hook up main events
  ipcMain.on('open-settings-window', () => {
    const settingsWindowConfig = {
      width: 500,
      height: 400,
      parent: mainWindow
    };
    const settingsFileLocation = `file://${path.join(__dirname, './settings/settings.html')}`;
    settingsWindow = new AppWindow(settingsWindowConfig, settingsFileLocation);
    settingsWindow.removeMenu();
    settingsWindow.on('closed', () => {
      settingsWindow = null;
    });
  })

  ipcMain.on('upload-file', (event, data) => {
    const manager = createManager();
    manager.uploadFile(data.key, data.path).then(val => {
      mainWindow.webContents.send('active-file-uploaded');
    }).catch(() => {
      dialog.showErrorBox('同步失败', '请检查七牛云配置');
    })
  })

  ipcMain.on('download-file', (event, data) => {
    const manager = createManager();
    const filesObj = fileStore.get('files');
    const { key, path, id } = data;
    manager.getStat(data.key).then(res => {
      const serverUpdatedTime = Math.round(res.putTime / 10000);
      const localUpdatedTime = filesObj[id].updatedAt || 0;
      // console.log(localUpdatedTime, serverUpdatedTime);
      if (serverUpdatedTime > localUpdatedTime) {
        manager.downloadFile(key, path).then(() => {
          mainWindow.webContents.send('file-downloaded', { status: 'download-success', id });
        })
      } else {
        console.log('no-new-file')
        mainWindow.webContents.send('file-downloaded', { status: 'no-new-file', id });
      }

    }, err => {
      console.log(err);
      if (err.statusCode === 612) {
        mainWindow.webContents.send('file-downloaded', { status: 'no-file' });
      }
    })
  })

  ipcMain.on('upload-all-to-qiniu', () => {
    mainWindow.webContents.send('loading-status', true);
    const manager = createManager();
    const filesObj = fileStore.get('files') || {};
    const uploadPromiseArr = Object.keys(filesObj).map(key => {
      const file = filesObj[key];
      return manager.uploadFile(`${file.title}.md`, file.path);
    })
    Promise.all(uploadPromiseArr).then(result => {
      // console.log(result);
      dialog.showMessageBox({
        type: 'info',
        title: `成功上传了${result.length}个文件`,
        message: `成功上传了${result.length}个文件`
      })
      mainWindow.webContents.send('files-uploaded');
    }).catch(() => {
      dialog.showErrorBox('同步失败', '请检查七牛云配置是否正确');
    }).finally(() => {
      mainWindow.webContents.send('loading-status', false);
    })
    // setTimeout(() => {
    // }, 3000)
  })

  ipcMain.on('config-is-saved', () => {
    let qiniuMenu = process.platform === 'darwin' ? menu.items[3] : menu.items[2];
    const switchItems = (toggle) => {
      [1, 2, 3].forEach(num => {
        qiniuMenu.submenu.items[num].enabled = toggle;
      })
    }
    const qiniuIsConfiged = ['access-key', 'secret-key', 'bucket'].every(id => {
      let savedQiniuConfig = settingsStore.get('savedQiniuConfig');
      return !!savedQiniuConfig[id];
    })
    // qiniuMenu.submenu.items[1].enabled = true;
    if (qiniuIsConfiged) {
      switchItems(true);
    } else {
      switchItems(false);
    }

  })

})