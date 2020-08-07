const qiniu = require('qiniu');
const axios = require('axios');
const fs = require('fs');

class QiniuManager {
  //通用的地方写到构造函数里面
  constructor(accessKey, secretKey, bucket) {
    // 定义好其中的鉴权对象mac
    this.mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
    this.bucket = bucket;

    // 初始化配置类
    this.config = new qiniu.conf.Config();
    // 空间对应的机房
    this.config.zone = qiniu.zone.Zone_z0; //这是华东的机房
    this.bucketManager = new qiniu.rs.BucketManager(this.mac, this.config);
  }

  //上传文件
  uploadFile(key, localFilePath) {
    var options = {
      //覆盖上传的凭证
      scope: this.bucket + ":" + key,
    };
    var putPolicy = new qiniu.rs.PutPolicy(options);
    var uploadToken = putPolicy.uploadToken(this.mac);
    var formUploader = new qiniu.form_up.FormUploader(this.config);
    var putExtra = new qiniu.form_up.PutExtra();
    // 文件上传
    return new Promise((resolve, reject) => {
      formUploader.putFile(uploadToken, key, localFilePath, putExtra,
        this._handleCallback(resolve, reject));
    })
  }

  //删除云空间里面的文件
  deleteFile(key) {
    return new Promise((resolve, reject) => {
      this.bucketManager.delete(this.bucket, key,
        this._handleCallback(resolve, reject));
    })
  }

  //获得bucket的网址
  getBucketDomain() {
    //其中的tbl是我们的bucket名字
    const reqUrl = `http://api.qiniu.com/v6/domain/list?tbl=${this.bucket}`;
    //生成token
    const digest = qiniu.util.generateAccessToken(this.mac, reqUrl);
    //发送请求
    return new Promise((resolve, reject) => {
      //这是七牛封装的请求的方法
      qiniu.rpc.postWithoutForm(reqUrl, digest, this._handleCallback(resolve, reject))
    })
  }

  //获取七牛云上的文件信息
  getStat(key) {
    return new Promise((resolve, reject) => {
      this.bucketManager.stat(this.bucket, key, this._handleCallback(resolve, reject));
    })
  }
  //拿到下载链接
  generateDownloadLink(key) {
    // 这么写每次都会发送请求，所以我们要想办法把它请求的结果缓存起来
    // this.getBucketDomain().then((data) => {})
    const domainPromise = this.publicBucketDomain ?
      Promise.resolve([this.publicBucketDomain]) :
      this.getBucketDomain();
    return domainPromise.then(data => {
      if (Array.isArray(data) && data.length > 0) {
        const pattern = /^https?/;
        this.publicBucketDomain = pattern.test(data[0]) ? data[0] : `http://${data[0]}`;
        return this.bucketManager.publicDownloadUrl(this.publicBucketDomain, key);
      } else {
        throw Error('域名未找到，请查看储存空间有没有过期');
      }
    })
  }

  //下载文件
  downloadFile(key, downloadPath) {
    // 1、获得下载链接
    // 2、发送请求，返回一个可读流
    // 3、创建一个可写流，写入文件
    // 4、返回一个Promise
    return this.generateDownloadLink(key).then(link => {
      // 更新文件的时候用时间戳
      const timeStamp = new Date().getTime();
      const url = `${link}?timestamp=${timeStamp}`;
      return axios({
        url,
        method: 'GET',
        responseType: 'stream',
        headers: { 'Cache-Control': 'no-cache' }
      })
    }).then(res => {
      //创建一个可写流
      const writer = fs.createWriteStream(downloadPath);
      res.data.pipe(writer);
      return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      })
    }).catch(err => {
      return Promise.reject({ err: err.response })
    })
  }

  //处理回调的函数
  _handleCallback(resolve, reject) {
    return (respErr, respBody, respInfo) => {
      if (respErr) {
        throw respErr;
      }
      if (respInfo.statusCode === 200) {
        resolve(respBody);
      } else {
        reject({
          statusCode: respInfo.statusCode,
          body: respBody
        })
      }
    }
  }
}

module.exports = QiniuManager;