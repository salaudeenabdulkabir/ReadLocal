import { app, BrowserWindow, dialog, ipcMain, protocol, net } from 'electron'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { Store } from './store'
import { scan } from './scanner'
import chokidar from 'chokidar'

protocol.registerSchemesAsPrivileged([{scheme:'readlocal',privileges:{standard:true,secure:true,supportFetchAPI:true,stream:true}}])
let store:Store
let watcher: ReturnType<typeof chokidar.watch>|undefined, scanTimer:NodeJS.Timeout|undefined
async function scanAndNotify(folders:string[]) { const d=await store.read();const books=await scan(folders,d.books);await store.replaceLibrary(folders,books);BrowserWindow.getAllWindows().forEach(w=>w.webContents.send('library:changed'));return books }
function watchFolders(folders:string[]){watcher?.close();if(!folders.length)return;watcher=chokidar.watch(folders,{ignoreInitial:true,depth:20});watcher.on('all',()=>{clearTimeout(scanTimer);scanTimer=setTimeout(()=>scanAndNotify(folders),800)})}
async function createWindow(){
  const win=new BrowserWindow({width:1440,height:900,minWidth:980,minHeight:650,backgroundColor:'#f4efe5',titleBarStyle:'hiddenInset',webPreferences:{preload:path.join(__dirname,'preload.js'),contextIsolation:true,nodeIntegration:false,sandbox:true}})
  if(process.env.VITE_DEV_SERVER_URL) await win.loadURL(process.env.VITE_DEV_SERVER_URL); else await win.loadFile(path.join(__dirname,'../../dist/index.html'))
}
app.whenReady().then(()=>{
  store=new Store(path.join(app.getPath('userData'),'readlocal-data.json'))
  protocol.handle('readlocal',req=>net.fetch(pathToFileURL(decodeURIComponent(new URL(req.url).pathname.slice(1))).toString()))
  ipcMain.handle('data:get',()=>store.read())
  ipcMain.handle('folder:choose',async()=>{const r=await dialog.showOpenDialog({properties:['openDirectory']});return r.canceled?null:r.filePaths[0]})
  store.read().then(d=>watchFolders(d.settings.folders))
  ipcMain.handle('folders:scan',async(_e,folders:string[])=>{const books=await scanAndNotify(folders);watchFolders(folders);return books})
  ipcMain.handle('book:update',(_e,id,patch)=>store.updateBook(id,patch)); ipcMain.handle('settings:save',(_e,p)=>store.settings(p))
  ipcMain.handle('bookmark:add',(_e,x)=>store.bookmark(x)); ipcMain.handle('bookmark:remove',(_e,id)=>store.remove('bookmarks',id))
  ipcMain.handle('note:add',(_e,x)=>store.note(x)); ipcMain.handle('note:remove',(_e,id)=>store.remove('notes',id))
  ipcMain.handle('highlight:add',(_e,x)=>store.highlight(x)); ipcMain.handle('highlight:remove',(_e,id)=>store.remove('highlights',id))
  ipcMain.handle('collection:add',(_e,n)=>store.collection(n)); ipcMain.handle('collection:remove',(_e,id)=>store.removeCollection(id)); ipcMain.handle('session:add',(_e,x)=>store.session(x))
  ipcMain.handle('file:url',(_e,p)=>`readlocal://file/${encodeURIComponent(p)}`)
  createWindow(); app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0)createWindow()})
}); app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit()})
