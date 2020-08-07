const QiniuManager = require('./src/utils/QiniuManager');
const path = require('path');
// 定义好其中的鉴权对象mac
const accessKey = '74rXiMW7B4K4UdD5zB5Zr1ImsdTh7wyyMJuG6lO1';
const secretKey = 'CFvL5cBRTMmYbUHWsDvNVhkSM7D40CdmuAFWyBWP';
var localFile = "C:/Users/10443/Desktop/mds-and-cloud-doc/mds/first1123.md";
var key='first1123.md'; //上传以后的文件名
// const downloadPath = path.join(__dirname, key);
const manager = new QiniuManager(accessKey, secretKey, 'kclouddoc')
// manager.uploadFile(key, localFile).then((res) => {
//   console.log('上传成功', res);
// })
manager.downloadFile(key, 'C:/Users/10443/Desktop/mds-and-cloud-doc/mds2/first1123.md').then(() => {
  console.log('下载写入完毕')
});