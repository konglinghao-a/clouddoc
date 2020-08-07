const { app, shell, ipcMain } = require('electron');
const Store = require('electron-store');
const settingsStore = new Store({ name: 'Settings' });

const qiniuIsConfiged = ['access-key', 'secret-key', 'bucket'].every(id => {
  let savedQiniuConfig = settingsStore.get('savedQiniuConfig');
  return !!savedQiniuConfig[id];
})


let template = [{
  label: '文件',
  submenu: [{
    label: '新建',
    accelerator: 'CmdOrCtrl+N',
    click: (menuItem, browserWindow, event) => {
      //发送消息
      browserWindow.webContents.send('create-new-file');
    }
  },{
    label: '保存',
    accelerator: 'CmdOrCtrl+S',
    click: (menuItem, browserWindow, event) => {
      browserWindow.webContents.send('save-edit-file');
    }
  },{
    label: '搜索',
    accelerator: 'CmdOrCtrl+F',
    click: (menuItem, browserWindow, event) => {
      browserWindow.webContents.send('search-file');
    }
  },{
    label: '导入',
    accelerator: 'CmdOrCtrl+O',
    click: (menuItem, browserWindow, event) => {
      browserWindow.webContents.send('import-file');
    }
  }]
}, {
  label: '编辑',
  submenu: [
    {
      label: '撤销',
      accelerator: 'CmdOrCtrl+Z',
      role: 'undo'
    },{
      label: '重做',
      accelerator: 'Shift+CmdOrCtrl+Z',
      role: 'redo'
    },{
      label: '剪切',
      accelerator: 'CmdOrCtrl+X',
      role: 'cut'
    },{
      label: '复制',
      accelerator: 'CmdOrCtrl+C',
      role: 'copy'
    },{
      label: '粘贴',
      accelerator: 'CmdOrCtrl+V',
      role: 'paste'
    },{
      label: '全选',
      accelerator: 'CmdOrCtrl+A',
      role: 'selectall'
    },
  ]
}, {
  label: '云同步',
  submenu: [{
    label: '设置',
    accelerator: 'CmdOrCtrl+,',
    click: () => {
      ipcMain.emit('open-settings-window');
    }
  }, {
    label: '自动同步',
    type: 'checkbox',
    enabled: qiniuIsConfiged,
    checked: settingsStore.get('enableAutoSync'),
    click: () => {
      settingsStore.set('enableAutoSync', !settingsStore.get('enableAutoSync'));
    }
  }, {
    label: '全部同步至云端',
    enabled: qiniuIsConfiged,
    click: () => {
      ipcMain.emit('upload-all-to-qiniu');
    }
  }, {
    label: '从云端下载到本地',
    enabled: qiniuIsConfiged,
    click: () => {

    }
  }]

},{
  label: '视图',
  submenu: [
    {
      label: '刷新当前页面',
      accelerator: 'CmdOrCtrl+R',
      click: (item, focusedWindow) => {
        if (focusedWindow)
          focusedWindow.reload();
      }
    },{
      label: '切换全屏幕',
      accelerator: (() => {
        if (process.platform === 'darwin')
          return 'Ctrl+Command+F';
        else
          return 'F11';
      })(),
      click: (item, focusedWindow) => {
        if (focusedWindow)
          focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
      }
    },{
      label: '切换开发者工具',
      accelerator: (() => {
        if (process.platform === 'darwin')
          return 'Alt+Command+I';
        else
          return 'Ctrl+Shift+I';
      })(),
      click: (item, focusedWindow) => {
        if (focusedWindow)
          focusedWindow.toggleDevTools();
      }
    }
  ]
}, {
  label: '窗口',
  role: 'window',
  submenu: [{
    label: '最小化',
    accelerator: 'CmdOrCtrl+M',
    role: 'minimize'
  },{
    label: '关闭',
    accelerator: 'CmdOrCtrl+W',
    role: 'close'
  }]
}, {
  label: '帮助',
  role: 'help',
  submenu: [
    {
      label: '学习更多',
      click: () => { shell.openExternal('http://electron.atom.io')}
    }
  ]
}]

// 如果是mac就在最前面添加一项
if (process.platform === 'darwin') {
  const name = app.getName();
  template.unshift({
    label: name,
    submenu: [{
      label: `关于 ${name}`,
      role: 'about'
    }, {
      type: 'separator'
    }, {
      label: '设置',
      accelerator: 'Command+,',
      click: () => {
        ipcMain.emit('open-settings-window');
      }
    }, {
      label: `服务`,
      role: 'services',
      submenu: []
    }, {
      type: 'separator'
    }, {
      label: `隐藏其他`,
      accelerator: 'Command+Alt+H',
      role: 'hideothers',
    },{
      label: `显示全部`,
      role: 'unhide',
    },{
      type: 'separator'
    }, {
      label: '退出',
      accelerator: 'Command+Q',
      click: () => {
        app.quit()
      }
    }]
  })
} else {
  template[0].submenu.push({
    label: '设置',
      accelerator: 'Ctrl+,',
      click: () => {
        ipcMain.emit('open-settings-window');
      }
  })
}
module.exports = template;