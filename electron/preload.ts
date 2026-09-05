import { contextBridge, ipcRenderer } from 'electron'
contextBridge.exposeInMainWorld('readlocal',{
  getData:()=>ipcRenderer.invoke('data:get'), chooseFolder:()=>ipcRenderer.invoke('folder:choose'), scanFolders:(x:string[])=>ipcRenderer.invoke('folders:scan',x),
  updateBook:(id:string,p:any)=>ipcRenderer.invoke('book:update',id,p), saveSettings:(p:any)=>ipcRenderer.invoke('settings:save',p),
  addBookmark:(x:any)=>ipcRenderer.invoke('bookmark:add',x), removeBookmark:(id:string)=>ipcRenderer.invoke('bookmark:remove',id),
  addNote:(x:any)=>ipcRenderer.invoke('note:add',x), removeNote:(id:string)=>ipcRenderer.invoke('note:remove',id), addCollection:(n:string)=>ipcRenderer.invoke('collection:add',n),
  addHighlight:(x:any)=>ipcRenderer.invoke('highlight:add',x), removeHighlight:(id:string)=>ipcRenderer.invoke('highlight:remove',id), removeCollection:(id:string)=>ipcRenderer.invoke('collection:remove',id),
  logSession:(x:any)=>ipcRenderer.invoke('session:add',x), fileUrl:(p:string)=>ipcRenderer.invoke('file:url',p)
  ,onLibraryChanged:(callback:()=>void)=>{const listener=()=>callback();ipcRenderer.on('library:changed',listener);return()=>ipcRenderer.removeListener('library:changed',listener)}
})
