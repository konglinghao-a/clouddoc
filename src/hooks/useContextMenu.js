import { useEffect, useRef } from 'react';
const { remote } = window.require('electron');
const { Menu, MenuItem } = remote;

const useContextMenu = (itemArr, targetSelector, dps) => {
  let clickedElement = useRef(null);
  useEffect(() => {
    const menu = new Menu();
    itemArr.forEach((item) => {
      menu.append(new MenuItem(item));
    })
    const handleContextMenu = (e) => {
      // only show the context menu on current dom element or targetSelector contains target
      if (document.querySelector(targetSelector).contains(e.target)) {
        clickedElement.current = e.target;
        //在当前的window弹出菜单
        menu.popup({window: remote.getCurrentWindow()});
      }
    };
    //注册鼠标右击的事件
    window.addEventListener('contextmenu', handleContextMenu);
    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
    }
  }, [dps]);

  return clickedElement;
}

export default useContextMenu;