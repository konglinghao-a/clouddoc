import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faTimes } from '@fortawesome/free-solid-svg-icons';
import PropTypes from 'prop-types';
import useKeyPress from '../hooks/useKeyPress';

const FileSearch = ({ title, onFileSearch }) => {
  const [inputActive, setInputActive] = useState(false);
  const [value, setValue] = useState('');

  //是否按了enter键
  const enterPressed = useKeyPress(13);
  const escPressed = useKeyPress(27);
  //是否按了esc键

  let node = useRef(null);

  const closeSearch = () => {
    setInputActive(false);
    setValue('');
    onFileSearch('');
  }
  useEffect(() => {
    //用自定义hook来解决按钮按下的状态
    if (enterPressed && inputActive) {
      onFileSearch(value);
    }
    if (escPressed && inputActive) {
      closeSearch();
    }
    // //处理键盘事件的函数
    // const handleInputEvent = (event) => {
    //   const { keyCode } = event;
    //   //回车键的keyCode为13, ESC的keyCode为27
    //   if (keyCode === 13 && inputActive) {
    //     onFileSearch(value);
    //   } else if (keyCode === 27 && inputActive) {
    //     closeSearch(event);
    //   }
    // }
    // document.addEventListener('keyup', handleInputEvent);
    // //有事件的注册，就得记得remove掉事件
    // return () => { document.removeEventListener('keyup', handleInputEvent) };
  })
  //设置input框的焦点，也是个副作用
  useEffect(() => {
    if (inputActive) {
      node.current.focus()
    }
  }, [inputActive])
  return (
    <div className="alert alert-primary d-flex mb-0 justify-content-between align-items-center">
      {
        !inputActive &&
        <>
          <span>{title}</span>
          <button
            type="button"
            className="icon-button"
            onClick={() => { setInputActive(!inputActive) }}
          >
            <FontAwesomeIcon
              title="搜索"
              icon={faSearch}
              size="lg"
            />
          </button>
        </>
      }
      {
        inputActive &&
        <>
          <input
            className="form-control input-height"
            value={value}
            onChange={(e) => { setValue(e.target.value) }}
            ref={node}
          />
          <button
            type="button"
            className="icon-button"
            onClick={closeSearch}
          >
            <FontAwesomeIcon
              title="关闭"
              icon={faTimes}
              size="lg"
            />
          </button>
        </>
      }
    </div>
  )
}

FileSearch.propTypes = {
  title: PropTypes.string,
  onFileSearch: PropTypes.func.isRequired
}
FileSearch.defaultProps = {
  title: '我的云文档'
}
export default FileSearch;