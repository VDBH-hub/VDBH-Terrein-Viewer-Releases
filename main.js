const { app, BrowserWindow, shell, Menu, dialog } = require('electron');
const path = require('node:path');
const {ipcMain}=require('electron');
const {ProjectRepository,atomic}=require('./project-repository.cjs');
const {encodeTransfer,readTransfer,suggestedName}=require('./project-transfer.cjs');
const {ProjectOpenQueue}=require('./project-open.cjs');
const projectOpenQueue=new ProjectOpenQueue();
let rendererFilesReady=false;
const launchDirectory=()=>typeof process.cwd==='function'?process.cwd():__dirname;
let projectRepository;
let projectDirty=false;
const { autoUpdater } = require('electron-updater');

app.setName('VDBH Terrein Viewer');

let mainWindow;
let updateCheckStarted = false;
let isQuitting = false;
let closeConfirmationOpen = false;

function notifyProjectFiles(){
 if(rendererFilesReady&&projectOpenQueue.length&&mainWindow&&!mainWindow.isDestroyed())mainWindow.webContents.send('projects:open-file-available');
}
function queueProjectFiles(args,cwd){if(projectOpenQueue.enqueue(args,cwd||launchDirectory()))notifyProjectFiles();}
function createWindow() {
  rendererFilesReady=false;
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    minWidth: 900,
    minHeight: 600,
    show: false,
    title: 'VDBH Terrein Viewer',
    backgroundColor: '#0d1117',
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.setTitle('VDBH Terrein Viewer');
    mainWindow.maximize();
    mainWindow.show();
  });

  // Vraag bevestiging voordat de gebruiker de hoofdapp via het kruisje sluit.
  // Geplande afsluiting (bijvoorbeeld voor een update) mag zonder extra dialoog doorgaan.
  mainWindow.on('close', (event) => {
    if (isQuitting) return;
    event.preventDefault();
    if (closeConfirmationOpen) return;
    closeConfirmationOpen = true;

    const dirty=projectDirty;
    dialog.showMessageBox(mainWindow, {
      type: 'question',title: 'VDBH Terrein Viewer afsluiten',
      message: dirty?'Je project heeft niet-opgeslagen wijzigingen.':'VDBH Terrein Viewer afsluiten?',
      detail: dirty?'Sla je project op om modellen, opmerkingen en metingen te bewaren.':'Je opgeslagen projecten en rapporten blijven bewaard.',
      buttons: dirty?['Opslaan en afsluiten','Afsluiten zonder opslaan','Annuleren']:['Afsluiten','Annuleren'],
      defaultId:dirty?0:1,cancelId:dirty?2:1,noLink:true
    }).then(({response})=>{
      closeConfirmationOpen=false;
      if(dirty&&response===0){mainWindow.webContents.send('projects:save-before-close');return;}
      if((dirty&&response===1)||(!dirty&&response===0)){isQuitting=true;mainWindow.close();}
    }).catch(()=>{closeConfirmationOpen=false;});
  });
  const logPath = path.join(app.getPath('userData'), 'viewer-error.log');
  const fs = require('node:fs');
  const writeRendererLog = (label, detail) => {
    try { fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${label}: ${detail}\n`); } catch (_) {}
  };
  mainWindow.webContents.on('did-start-loading',()=>{rendererFilesReady=false;});
  mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    if (level >= 2) writeRendererLog('Renderer console error', `${message} (line ${line}, ${sourceId})`);
  });
  mainWindow.webContents.on('did-fail-load', (_event, code, description, validatedURL) => {
    writeRendererLog('Page load failed', `${code} ${description} ${validatedURL}`);
  });
  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    writeRendererLog('Renderer process gone', JSON.stringify(details));
  });
  mainWindow.webContents.on('will-navigate',(event,url)=>{if(url!==mainWindow.webContents.getURL()){event.preventDefault();if(/^https?:/.test(url))shell.openExternal(url);}});
  mainWindow.loadFile(path.join(__dirname, 'VDBH_Terrein_Viewer.html'));
  // Toon altijd de versie uit package.json; het versielabel hoeft nooit meer handmatig aangepast te worden.
  mainWindow.webContents.once('did-finish-load', () => {
    const versionLabel = `VERSIE ${app.getVersion()}`;
    mainWindow.webContents.executeJavaScript(`(() => { const el = document.getElementById('appVersion'); if (el) el.textContent = ${JSON.stringify(versionLabel)}; })()`)
      .catch((error) => console.error('[VDBH] Versienummer kon niet in de interface worden gezet:', error));
  });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // The viewer opens its own about:blank child window for the separate 3D viewer.
    // External web links remain in the system browser and are not opened inside the app.
    if (url === 'about:blank') {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          width: 1400,
          height: 950,
          minWidth: 800,
          minHeight: 600,
          autoHideMenuBar: true,
          backgroundColor: '#0b191b',
          webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true
          }
        }
      };
    }
    if (url.startsWith('https://') || url.startsWith('http://')) shell.openExternal(url);
    return { action: 'deny' };
  });
}

function configureAutoUpdates() {
  // Updates are distributed as GitHub Releases from the public VDBH release repository.
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => {
    console.log('[VDBH updater] Checking for updates...');
  });

  autoUpdater.on('update-available', (info) => {
    console.log('[VDBH updater] Update available:', info.version);
    if (mainWindow && !mainWindow.isDestroyed()) {
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'VDBH Terrein Viewer',
        message: `Nieuwe versie ${info.version} beschikbaar`,
        detail: 'De update wordt automatisch op de achtergrond gedownload. Je kunt ondertussen doorwerken.'
      });
    }
  });

  autoUpdater.on('update-not-available', (info) => {
    console.log('[VDBH updater] No update available. Current version:', info.version);
  });

  autoUpdater.on('download-progress', (progress) => {
    console.log(`[VDBH updater] Download ${Math.round(progress.percent)}%`);
  });

  autoUpdater.on('update-downloaded', async (info) => {
    const result = await dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'VDBH Terrein Viewer bijgewerkt',
      message: `Versie ${info.version} is gedownload.`,
      detail: 'Wil je de viewer nu opnieuw starten om de update te installeren?',
      buttons: ['Nu opnieuw starten', 'Later'],
      defaultId: 0,
      cancelId: 1
    });
    if (result.response === 0) {if(projectDirty)mainWindow.close();else autoUpdater.quitAndInstall();}
  });

  autoUpdater.on('error', (error) => {
    console.error('[VDBH updater] Update error:', error);
    // Update failures should never prevent the viewer from opening or being used.
  });

  if (!app.isPackaged || updateCheckStarted) return;
  updateCheckStarted = true;
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((error) => {
      console.error('[VDBH updater] Could not check for updates:', error);
    });
  }, 8000);
}

function registerProjectStorage(){
 projectRepository=new ProjectRepository(path.join(app.getPath('userData'),'Projects'));
 const trusted=event=>{if(!mainWindow||event.sender!==mainWindow.webContents||event.senderFrame!==mainWindow.webContents.mainFrame)throw Error('Projectactie niet toegestaan.');};
 for(const [channel,fn] of Object.entries({
  changelog:async()=>{
   const news=require('./changelog.json');let seen=null;
   try{seen=JSON.parse(await require('node:fs/promises').readFile(path.join(app.getPath('userData'),'changelog-seen.json'),'utf8')).version;}catch(e){if(e.code!=='ENOENT')console.error('Changelogstatus kon niet worden gelezen:',e.message);}
   return {version:app.getVersion(),entries:news.entries,showAutomatically:seen!==app.getVersion()};
  },
  markChangelogSeen:async version=>{if(version!==app.getVersion())throw Error('Onbekende versie.');await atomic(path.join(app.getPath('userData'),'changelog-seen.json'),JSON.stringify({version}));return true;},
  rename:p=>projectRepository.rename(p),remove:p=>projectRepository.remove(p),
  trash:()=>projectRepository.trash(),restore:p=>projectRepository.restore(p),
  quit:()=>{mainWindow.close();return true;},
  readyForProjectFiles:()=>{rendererFilesReady=true;return {pending:projectOpenQueue.length};},
  takeOpenProjectFile:()=>projectOpenQueue.take(),
  exportProject:async payload=>{
   const bytes=await encodeTransfer(payload,app.getVersion());
   const result=await dialog.showSaveDialog(mainWindow,{title:'3D-project met opmerkingen exporteren',defaultPath:suggestedName(payload.name,payload.number),filters:[{name:'VDBH 3D-project',extensions:['vdbhproject']}],properties:['showOverwriteConfirmation','createDirectory']});
   if(result.canceled||!result.filePath)return null;
   const file=/\.vdbhproject$/i.test(result.filePath)?result.filePath:result.filePath+'.vdbhproject';
   await atomic(file,bytes);return {fileName:path.basename(file),sizeBytes:bytes.length};
  },
  importProject:async()=>{
   const result=await dialog.showOpenDialog(mainWindow,{title:'3D-project met opmerkingen importeren',filters:[{name:'VDBH 3D-project',extensions:['vdbhproject']}],properties:['openFile']});
   if(result.canceled||!result.filePaths?.length)return null;
   const value=await readTransfer(result.filePaths[0]);return {...value,fileName:path.basename(result.filePaths[0])};
  },
  list:()=>projectRepository.list(),load:id=>projectRepository.read(id),save:p=>projectRepository.save(p),
  reports:id=>projectRepository.reports(id),saveReport:p=>projectRepository.saveReport(p),
  openReport:async p=>{const file=await projectRepository.reportPath(p.projectId,p.reportId);const error=await shell.openPath(file);if(error)throw Error(error);return true;}
 }))ipcMain.handle('projects:'+channel,async(event,payload)=>{trusted(event);return fn(payload);});
 ipcMain.on('projects:dirty',(event,value)=>{trusted(event);projectDirty=value===true;});
 ipcMain.on('projects:close-after-save',event=>{trusted(event);if(!projectDirty){isQuitting=true;mainWindow.close();}});
}
if(!app.requestSingleInstanceLock()){app.quit();}else{
queueProjectFiles(process.argv||[],launchDirectory());
app.on('open-file',(event,file)=>{event.preventDefault();queueProjectFiles([file],launchDirectory());});
app.on('second-instance',(_event,argv,cwd)=>{queueProjectFiles(argv||[],cwd);if(mainWindow){if(mainWindow.isMinimized())mainWindow.restore();mainWindow.show();mainWindow.focus();}});
app.whenReady().then(() => {
  registerProjectStorage();
  Menu.setApplicationMenu(null);
  createWindow();
  configureAutoUpdates();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

}

app.on('before-quit', event => {
  if(projectDirty&&!isQuitting&&mainWindow&&!mainWindow.isDestroyed()){event.preventDefault();mainWindow.close();return;}
  isQuitting = true;
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
