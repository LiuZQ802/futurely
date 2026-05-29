const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  loadData:          ()       => ipcRenderer.invoke('tasks:load'),
  saveData:          (data)   => ipcRenderer.invoke('tasks:save', data),
  collapseWindow:    ()       => ipcRenderer.invoke('window:collapse'),
  expandWindow:      ()       => ipcRenderer.invoke('window:expand'),
  dragWindow:        (delta)  => ipcRenderer.invoke('window:drag', delta),
  ignoreMouseEvents: (ignore) => ipcRenderer.invoke('window:ignoreMouseEvents', ignore),
  onWindowBlur: (cb) => ipcRenderer.on('window-blur', cb),
  getBounds:         ()       => ipcRenderer.invoke('window:getBounds'),
  resizeWindow:      (bounds) => ipcRenderer.invoke('window:resize', bounds),
  saveWindowSize:    (size)   => ipcRenderer.invoke('window:saveSize', size),
})
