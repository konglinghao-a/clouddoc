import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import './TabList.scss';

const TabList = ({ files, activeId, unsaveIds, onTabClick, onCloseTab }) => {
  return (
    <ul className="nav nav-pills tablist-component">
      {
        files.map(file => {
          //没有保存时的小标志
          const withUnsavedMark = unsaveIds.includes(file.id);
          //利用classnames来拼接类名
          const fClassName = classNames({
            'nav-link': true,
            'active': file.id === activeId,
            'withUnsaved': withUnsavedMark
          })
          return (
            <li className="nav-item" key={file.id}>
              <a href="#"
                className={fClassName}
                onClick={(e) => {
                  e.preventDefault();
                  onTabClick(file.id);
                }}
              >
                {file.title}
                <span 
                  className="ml-2 close-icon"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onCloseTab(file.id);
                  }}
                >
                  <FontAwesomeIcon 
                    icon={faTimes}
                  />
                </span>
                { withUnsavedMark && 
                  <span className="rounded-circle unsaved-icon ml-2">
                  </span>
                }
              </a>
            </li>
          )
        })
      }
    </ul>
  )
}
TabList.propTypes = {
  files: PropTypes.array,
  activeIf: PropTypes.string,
  unsaveIds: PropTypes.array,
  onTabClick: PropTypes.func,
  onCloseTab: PropTypes.func
}
TabList.defaultProps = {
  unsaveIds: []
}
export default TabList;