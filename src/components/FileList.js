import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faTimes } from '@fortawesome/free-solid-svg-icons';
import { faMarkdown } from '@fortawesome/free-brands-svg-icons';
import PropTypes from 'prop-types';
import useKeyPress from '../hooks/useKeyPress';
import useContextMenu from '../hooks/useContextMenu';
import { getParentNode } from '../utils/helper';

// load nodejs modules
const { remote } = window.require('electron');
const { Menu, MenuItem } = remote;

const FileList = ({ files, onFileClick, onSaveEdit, onFileDelete }) => {
  const [editStatus, setEditStatus] = useState(false);
  const [value, setValue] = useState('')
  const node = useRef(null);
  const enterPress = useKeyPress(13);
  const escPress = useKeyPress(27);
  const closeSearch = (editItem) => {
    setEditStatus(false);
    setValue('');
    // if we are editing a newly created file, we should delete this file when pressing esc
    if (editItem.isNew) {
      onFileDelete(editItem.id);
    }
  }
  //添加上下文菜单
  const clickedItem = useContextMenu([
    {
      label: '打开',
      click: () => {
        const parentElement = getParentNode(clickedItem.current, 'file-item');
        if (parentElement) { //当父元素非空的时候就可以进行操作
          onFileClick(parentElement.dataset.id);
          console.log(parentElement.dataset.id);
        }
      }
    },
    {
      label: '重命名',
      click: () => {
        console.log('click');
      }
    },
    {
      label: '删除',
      click: () => {
        console.log('click');
      }
    }
  ], '.file-list', [files]);
  //这里处理键盘事件
  useEffect(() => {
    const editItem = files.find(file => file.id === editStatus);
    if (enterPress && editStatus && value.trim() !== '') {
      onSaveEdit(editItem.id, value, editItem.isNew);
      setEditStatus(false);
      setValue('');
    }
    if (escPress && editStatus) {
      closeSearch(editItem);
    }
  })
  useEffect(() => {
    const newFile = files.find(file => file.isNew);
    if (newFile) {
      setEditStatus(newFile.id);
      setValue(newFile.title);
    }
  }, [files])
  //设置input框的焦点，也是个副作用
  useEffect(() => {
    if (editStatus) {
      node.current.focus()
    }
  }, [editStatus])
  return (
    <ul className="list-group list-group-flush file-list  ">
      {
        files.map(file => (
          <li
            className="list-group-item bg-light d-flex row mx-0 no-gutters align-items-center file-item"
            key={file.id}
            data-id={file.id}
            data-title={file.title}
          >
            {((file.id !== editStatus) && !file.isNew) &&
              <>
                <span className="col-2">
                  <FontAwesomeIcon
                    size="lg"
                    icon={faMarkdown}
                  />
                </span>
                <span className="col-6 c-link"
                  onClick={() => { onFileClick(file.id) }}
                >
                  {file.title}
                </span>
                {/* 编辑按钮 */}
                <button
                  className="icon-button col-2"
                  type="button"
                  onClick={() => {
                    setEditStatus(file.id);
                    setValue(file.title);
                  }}
                >
                  <FontAwesomeIcon
                    title="编辑"
                    size="lg"
                    icon={faEdit}
                  />
                </button>
                <button
                  className="icon-button col-2"
                  type="button"
                  onClick={() => { onFileDelete(file.id, file.title) }}
                >
                  <FontAwesomeIcon
                    title="删除"
                    size="lg"
                    icon={faTrash}
                  />
                </button>
              </>
            }
            {
              ((file.id === editStatus) || file.isNew) &&
              <>
                <input
                  className="form-control input-height col-10"
                  value={value}
                  onChange={(e) => { setValue(e.target.value) }}
                  placeholder="请输入文件名称"
                  ref={node}
                />
                <button
                  type="button"
                  className="icon-button col-2"
                  onClick={() => { closeSearch(file) }}
                >
                  <FontAwesomeIcon
                    title="关闭"
                    icon={faTimes}
                    size="lg"
                  />
                </button>
              </>
            }
          </li>
        ))
      }
    </ul>
  )
}
FileList.propTypes = {
  files: PropTypes.array,
  onFileClick: PropTypes.func,
  onFileDelete: PropTypes.func,
  onSaveEdit: PropTypes.func
}
export default FileList;