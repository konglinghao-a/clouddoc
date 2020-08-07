import { useState, useEffect } from 'react';

//传入一个keycode
const useKeyPress = (targetKeyCode) => {
  //判断键盘有没有被按到
  const [keyPressed, setKeyPressed] = useState(false);

  const keyDownHandler = ({ keyCode }) => {
    if (keyCode === targetKeyCode) {
      setKeyPressed(true);
    }
  }

  const keyUpHandler = ({ keyCode }) => {
    if (keyCode === targetKeyCode) {
      setKeyPressed(false);
    }
  }

  useEffect(() => {
    document.addEventListener('keydown', keyDownHandler);
    document.addEventListener('keyup', keyUpHandler);
    return () => {
      document.removeEventListener('keydown', keyDownHandler);
      document.removeEventListener('keyup', keyUpHandler);
    }
  }, [])

  //返回这个键有没有被按到
  return keyPressed;
}
export default useKeyPress;