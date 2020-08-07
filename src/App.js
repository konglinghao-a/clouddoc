import React, { useState, useEffect } from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { faPlus, faFileImport } from '@fortawesome/free-solid-svg-icons';
import FileSearch from './components/FileSearch';
import FileList from './components/FileList';
import defaultFiles from './utils/defaultFiles';
import BottomBtn from './components/BottomBtn';
import TabList from './components/TabList';
import SimpleMDE from 'react-simplemde-editor';
import { flattenArr, objToArr, timestampToString } from './utils/helper';
import { v4 as uuidv4 } from 'uuid';
import fileHelper from './utils/fileHelper';
import 'easymde/dist/easymde.min.css';
import useIpcRenderer from './hooks/useIpcRenderer';
import Loader from './components/Loader';

// require node.js modules
const { join, basename, extname, dirname } = window.require('path');
const { remote, ipcRenderer } = window.require('electron');
const Store = window.require('electron-store');
const fileStore = new Store({ name: 'files data' });
const settingsStore = new Store({ name: 'Settings' });

//判断要不要自动同步到七牛云
const getAutoAsync = () => {
  const qiniuIsConfiged = ['access-key', 'secret-key', 'bucket'].every(id => {
    let savedQiniuConfig = settingsStore.get('savedQiniuConfig');
    return !!savedQiniuConfig[id];
  })
  // console.log('qiniuisconfig', qiniuIsConfiged);
  // console.log('enableAutoSync', settingsStore.get('enableAutoSync'));
  return qiniuIsConfiged && settingsStore.get('enableAutoSync');
}
// console.log(fileStore.delete('files'))
// console.log(fileStore.get('files'))

const saveFilesToStore = (files) => {
  // we don't have to store any info in file system, ag:isNew, body
  const filesStoreObj = objToArr(files).reduce((result, file) => {
    const { id, path, title, createdAt, isSynced, updatedAt } = file;
    result[id] = {
      id,
      path,
      title,
      createdAt,
      isSynced,
      updatedAt
    }
    return result
  }, {});
  fileStore.set('files', filesStoreObj);
  console.log(fileStore.get('files'));
}

function App() {
  const [files, setFiles] = useState(fileStore.get('files') || {});
  const [activeFileId, setActiveFileId] = useState('');
  const [openFileIds, setOpenFileIds] = useState([]);
  const [unsavedFileIds, setUnsavedFileIds] = useState([]);
  const [searchedFiles, setSearchedFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const openedFiles = openFileIds.map((openId) => files[openId]);
  const activeFile = files[activeFileId];
  const filesArr = objToArr(files);
  const fileListArr = (searchedFiles.length > 0) ? searchedFiles : filesArr;
  // const savedLocation = remote.app.getPath('documents')
  // const savedLocation = 'C:/Users/10443/Desktop/mds-and-cloud-doc/mds';
  const savedLocation = settingsStore.get('savedFilesLocation') || remote.app.getPath('documents');

  const fileClick = (fileId) => {
    // set current active file
    setActiveFileId(fileId);
    const currentFile = files[fileId];
    const { id, title, path, isLoaded } = currentFile;

    console.log('files:',fileStore.get('files'));
    if (!isLoaded) {
      if (getAutoAsync()) {
        ipcRenderer.send('download-file', {
          key: `${title}.md`,
          path,
          id
        })
      } else {
        fileHelper.readFile(path).then(value => {
          const newFile = { ...files[fileId], body: value, isLoaded: true }
          setFiles({ ...files, [fileId]: newFile });
        })
      }
    }
    // if openedFiles don't have thie current id
    // then add new fileId to opened files
    if (!openFileIds.includes(fileId)) {
      setOpenFileIds([...openFileIds, fileId]);
    }
  }

  const tabClick = (fileId) => {
    // set current active file
    setActiveFileId(fileId);
    // console.log(settingsStore.get('savedQiniuConfig'));
  }

  const tabClose = (fileId) => {
    // remove current id from openFileId
    const tabsWithout = openFileIds.filter(openId => openId !== fileId);
    setOpenFileIds(tabsWithout);
    // set the active to the first opened tab if still tabs left
    if (tabsWithout.length > 0) {
      setActiveFileId(tabsWithout[0]);
    } else {
      setActiveFileId('');
    }
  }

  const fileChange = (fileId, value) => {
    if (value !== files[fileId].body) {
      const newFile = { ...files[fileId], body: value };
      setFiles({ ...files, [fileId]: newFile });
      // update unsavedIds
      if (!unsavedFileIds.includes(fileId)) {
        setUnsavedFileIds([...unsavedFileIds, fileId])
      }
    }
  }

  const deleteFile = async (fileId, title) => {

    if (files[fileId].isNew) {
      const { [fileId]: value, ...afterDelete } = files;
      setFiles(afterDelete);
      // delete files[fileId];
      // setFiles({ ...files});
    } else {
      await fileHelper.deleteFile(join(savedLocation, `${title}.md`));
      //filter out the current fileId
      const { [fileId]: value, ...afterDelete } = files;
      setFiles(afterDelete);
      // delete files[fileId];
      // setFiles({ ...files});
      saveFilesToStore(afterDelete);
      //close the tab if opened
      tabClose(fileId);
    }
  }

  //需要新增一个参数来判断是新建还是重命名
  const updateFileName = (fileId, title, isNew) => {
    // newPath should be different based on isNew
    // if isNew is false, path should be old dirname + new title
    const newPath = isNew ? join(savedLocation, `/${title}.md`) :
      join(dirname(files[fileId].path), `${title}.md`)
      ;

    const newFile = { ...files[fileId], title, isNew: false, path: newPath };
    const newFiles = { ...files, [fileId]: newFile }
    if (isNew) {
      fileHelper.writeFile(newPath, files[fileId].body).then(() => {
        setFiles(newFiles);
        saveFilesToStore(newFiles);
      });
      // //这里好奇怪啊，不加句话上面那个promise就会一直处于pending的状态
      console.log('');
    } else {
      const oldPath = files[fileId].path;
      fileHelper.renameFile(oldPath, newPath).then(() => {
        setFiles(newFiles);
        saveFilesToStore(newFiles);
      });
    }
  }

  const fileSearch = (keyword) => {
    // filter out the new files based on the keyword
    const newFiles = filesArr.filter(file => file.title.includes(keyword));
    setSearchedFiles(newFiles);
  }

  const createNewFile = () => {
    const newId = uuidv4();
    const newFile = {
      id: newId,
      title: '',
      body: '',
      createdAt: Date.now(),
      isNew: true
    }
    setFiles({ ...files, [newId]: newFile });
  }

  const saveCurrentFile = () => {
    const { path, body, title } = activeFile;
    console.log('active',activeFile);
    fileHelper.writeFile(path, body).then(() => {
      setUnsavedFileIds(unsavedFileIds.filter(id => id !== activeFile.id));
    });
    if (getAutoAsync()) {
      ipcRenderer.send('upload-file', { key: `${title}.md`, path })
    }
  }

  const importFiles = () => {
    remote.dialog.showOpenDialog({
      title: '选择导入的Markdown文件',
      // properties可以选择是否能传文件以及文件夹等等。
      properties: ['openFile', 'multiSelections'],
      //规定可选类型
      filters: [
        { name: 'Markdown files', extensions: ['md'] }
      ]
    }).then((result) => {
      // console.log(result.filePaths);
      if (result.filePaths.length > 0) {
        //filter out the path we already have in electron store
        const filteredPaths = result.filePaths.filter(path => {
          const alreadyAdded = Object.values(files).find(file => {
            return file.path === path
          })
          return !alreadyAdded;
        })
        //extend the path array to an array contains files info
        const importFileArr = filteredPaths.map(path => {
          return {
            id: uuidv4(),
            title: basename(path, extname(path)),
            path
          }
        })
        // get the new files object in flattenArr
        const newFiles = { ...files, ...flattenArr(importFileArr) };
        //setState and update electron store
        setFiles(newFiles);
        saveFilesToStore(newFiles);
        if (importFileArr.length > 0) {
          remote.dialog.showMessageBox({
            type: 'info',
            title: `成功导入${importFileArr.length}文件！`,
            message: `成功导入${importFileArr.length}文件！`
          })
        }
      }
    })
  }

  const activeFileUploaded = () => {
    const { id } = activeFile;
    const modifiedFile = { ...files[id], isSynced: true, updatedAt: new Date().getTime()}
    const newFiles = { ...files, [id]: modifiedFile};
    setFiles(newFiles);
    saveFilesToStore(newFiles);
  }

  const activeFileDownloaded = (event, message) => {
    const currentFile = files[message.id];
    const { id, path } = currentFile;
    fileHelper.readFile(path).then(value => {
      let newFile;
      if (message.status === 'download-success') {
        newFile = { ...files[id], body: value, isLoaded: true, isSynced: true, updatedAt: new Date().getTime()};
      } else {
        newFile = { ...files[id], body: value, isLoaded: true};
      }
      const newFiles = { ...files, [id]: newFile };
      setFiles(newFiles);
      saveFilesToStore(newFiles);
    })
  }
  //上传全部文件以后主要是要更新updateAt的值
  const filesUpLoaded = () => {
    const newFiles = objToArr(files).reduce((result, file) => {
      const currentTime = new Date().getTime();
      result[file.id] = {
        ...files[file.id],
        isSynced: true,
        updatedAt: currentTime
      }
      return result;
    }, {});
    setFiles(newFiles);
    saveFilesToStore(newFiles);
  }
  useIpcRenderer({
    'create-new-file': createNewFile,
    'import-file': importFiles,
    'save-edit-file': saveCurrentFile,
    'active-file-uploaded': activeFileUploaded,
    'file-downloaded': activeFileDownloaded,
    'files-uploaded': filesUpLoaded,
    'loading-status': (massage, status) => { setIsLoading(status) }
  })

  return (
    <div className="App container-fluid px-0">
      { isLoading && 
        <Loader />
      }
      <div className="row no-gutters">
        <div className="col-3 left-panel left-panel">
          <FileSearch
            title='我的云文档'
            onFileSearch={fileSearch}
          />
          <FileList
            files={fileListArr}
            onFileClick={fileClick}
            onFileDelete={deleteFile}
            onSaveEdit={updateFileName}
          />
          <div className="row no-gutters button-group">
            <div className="col">
              <BottomBtn
                text="新建"
                colorClass="btn-primary"
                icon={faPlus}
                onBtnClick={createNewFile}
              />
            </div>
            <div className="col">
              <BottomBtn
                text="导入"
                colorClass="btn-success"
                icon={faFileImport}
                onBtnClick={importFiles}
              />
            </div>
          </div>
        </div>
        <div className="col-9 right-panel">
          {!activeFile &&
            <div className="start-page">
              选择或者创建新的 markdown 文档
            </div>
          }
          {
            activeFile &&
            <>
              <TabList
                files={openedFiles}
                onTabClick={tabClick}
                activeId={activeFileId}
                onCloseTab={tabClose}
                unsaveIds={unsavedFileIds}
              />
              <SimpleMDE
                key={activeFile && activeFile.id} //在读取不同的file的时候要有不同的key
                value={activeFile && activeFile.body} //markdown里显示的内容
                onChange={(value) => { fileChange(activeFile.id, value) }} //改变内容时的回调
                options={{
                  minHeight: '515px'
                }}
              />
              { activeFile.isSynced && 
                <span className="sync-status">
                  已同步，上次同步时间: {timestampToString(activeFile.updatedAt)}
                </span>
              }
            </>
          }
        </div>
      </div>
    </div>
  );
}

export default App;
