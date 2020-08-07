const fs = window.require('fs').promises;

const fileHelper = {
  readFile: (path) => {
    return fs.readFile(path, { encoding: 'utf8'})
  },
  writeFile: (path, content) => {
   return  fs.writeFile(path, content, { encoding: 'utf8'})
  },
  renameFile: (path, newPath) => {
    return fs.rename(path, newPath)
  },
  deleteFile: (path) => {
    return fs.unlink(path);
  }
}

// fileHelper.writeFile(`C:/Users/10443/Documents/h1232.md`, 'hello').then(() => {
//   console.log(123);
// })
export default fileHelper;