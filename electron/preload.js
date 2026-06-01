const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  loadData:       ()      => ipcRenderer.invoke('tasks:load'),
  saveData:       (data)  => ipcRenderer.invoke('tasks:save', data),
  collapseWindow: ()      => ipcRenderer.invoke('window:collapse'),
  expandWindow:   ()      => ipcRenderer.invoke('window:expand'),
  startDrag:      ()      => ipcRenderer.invoke('window:startDrag'),
  stopDrag:       ()      => ipcRenderer.invoke('window:stopDrag'),
  startResize:    (dir)   => ipcRenderer.invoke('window:startResize', dir),
  stopResize:     ()      => ipcRenderer.invoke('window:stopResize'),
  onWindowBlur:     (cb)  => ipcRenderer.on('window-blur', cb),
  onSnapChanged:    (cb)  => ipcRenderer.on('snap-changed', (_, v) => cb(v)),
  getSnapState:     ()    => ipcRenderer.invoke('window:getSnapState'),
  snapToNearest:    ()    => ipcRenderer.invoke('window:snapToNearest'),
  unsnap:           ()    => ipcRenderer.invoke('window:unsnap'),
  toggleAutoHide:   ()    => ipcRenderer.invoke('window:toggleAutoHide'),
})
