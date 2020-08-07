const { remote, ipcRenderer } = require('electron');
const Store = require('electron-store');
const settingsStore = new Store({name: 'Settings'});
const qiniuConfigArr = ['access-key', 'secret-key', 'bucket'];

const $ = (id) => {
  return document.getElementById(id);
}

document.addEventListener('DOMContentLoaded', () => {
  let savedLocation = settingsStore.get('savedFilesLocation');
  let savedQiniuConfig = settingsStore.get('savedQiniuConfig');

  if (savedLocation) {
    $('saved-file-location').value = savedLocation;
  }

  if (savedQiniuConfig) {
    qiniuConfigArr.forEach(id => {
      $(id).value = savedQiniuConfig[id];
    })
  }

  $('select-new-location').addEventListener('click', () => {
    remote.dialog.showOpenDialog({
      properties: ['openDirectory'],
      message: '选择文件的储存路径'
    }).then(result => {
      // console.log(result.filePaths);
      if (Array.isArray(result.filePaths)) {
        $('saved-file-location').value = result.filePaths[0];
        savedLocation = result.filePaths[0];
      }
    })
  })

  $('settings-form').addEventListener('submit', () => {
    settingsStore.set('savedFilesLocation', savedLocation);
    remote.getCurrentWindow().close();
  })

  //控制tab的显隐
  $('file-locate').addEventListener('click', () => {
    $('settings-form').style.display = 'block';
    $('qiniu-settings-form').style.display = 'none';
    $('file-locate').className = 'btn btn-primary';
    $('qiniu-config').className = 'btn btn-default';
  })

   //控制tab的显隐
   $('qiniu-config').addEventListener('click', () => {
    $('settings-form').style.display = 'none';
    $('qiniu-settings-form').style.display = 'block';
    $('file-locate').className = 'btn btn-default';
    $('qiniu-config').className = 'btn btn-primary';
  })

  //提交表单
  $('qiniu-settings-form').addEventListener('submit', (e) => {
    e.preventDefault()
    let configObj = {}
    qiniuConfigArr.forEach(id => {
      configObj[id] = $(id).value;
    })
    settingsStore.set('savedQiniuConfig', configObj);
    //menuItem改变后发信息到main.js动态修改菜单。
    ipcRenderer.send('config-is-saved');
    remote.getCurrentWindow().close();
  })
})