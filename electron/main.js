const { app, BrowserWindow, dialog } = require("electron");
const { fork } = require("child_process");
const path = require("path");
const http = require("http");
let serverProcess;
const PORT = 3187;
function waitForServer(resolve, attempts=50) {
  const req=http.get(`http://127.0.0.1:${PORT}`,res=>{res.resume();resolve();});
  req.on("error",()=>{if(attempts<=0)return dialog.showErrorBox("ABYSS","Не удалось запустить игровой сервер.");setTimeout(()=>waitForServer(resolve,attempts-1),200);});
}
async function createWindow(){
  serverProcess=fork(path.join(__dirname,"..","server.js"),[],{cwd:path.join(__dirname,".."),env:{...process.env,PORT:String(PORT),ELECTRON_RUN_AS_NODE:"1"},stdio:"ignore"});
  await new Promise(resolve=>waitForServer(resolve));
  const win=new BrowserWindow({width:1280,height:850,minWidth:900,minHeight:650,backgroundColor:"#07131e",title:"ABYSS — Axolotl Club",autoHideMenuBar:true,webPreferences:{contextIsolation:true,nodeIntegration:false}});
  win.loadURL(`http://127.0.0.1:${PORT}`);
  win.on("closed",()=>{});
}
app.whenReady().then(createWindow);
app.on("window-all-closed",()=>{if(serverProcess)serverProcess.kill();if(process.platform!=="darwin")app.quit();});
app.on("before-quit",()=>{if(serverProcess)serverProcess.kill();});
