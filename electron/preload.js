const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  loadData:       ()      => ipcRenderer.invoke('tasks:load'),
  saveData:       (data)  => ipcRenderer.invoke('tasks:save', data),
  collapseWindow: ()      => ipcRenderer.invoke('window:collapse'),
  expandWindow:   ()      => ipcRenderer.invoke('window:expand'),
  recordPos:      ()      => ipcRenderer.invoke('window:recordPos'),
  didMove:        ()      => ipcRenderer.invoke('window:didMove'),
  startResize:    (dir)   => ipcRenderer.invoke('window:startResize', dir),
  stopResize:     ()      => ipcRenderer.invoke('window:stopResize'),
  onWindowBlur:   (cb)    => ipcRenderer.on('window-blur', cb),
})
