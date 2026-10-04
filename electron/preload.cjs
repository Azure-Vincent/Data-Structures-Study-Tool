// Exposes a tiny, fixed update API to the page (no Node access).
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('dslabDesktop', {
  getUpdateInfo: () => ipcRenderer.invoke('updates:info'),
  checkForUpdates: () => ipcRenderer.invoke('updates:check'),
  setAutoUpdate: (on) => ipcRenderer.invoke('updates:setAuto', !!on),
  installUpdate: () => ipcRenderer.invoke('updates:install'),
  openRelease: () => ipcRenderer.invoke('updates:open'),
  onUpdateStatus: (cb) => {
    const f = (_e, s) => cb(s);
    ipcRenderer.on('updates:status', f);
    return () => ipcRenderer.removeListener('updates:status', f);
  },
});
