const { contextBridge, ipcRenderer, screen } = require('electron')

contextBridge.exposeInMainWorld('screenScale', screen.getPrimaryDisplay().scaleFactor)

contextBridge.exposeInMainWorld('electronAPI', {
  loadData:          ()       => ipcRenderer.invoke('tasks:load'),
  saveData:          (data)   => ipcRenderer.invoke('tasks:save', data),
  collapseWindow:    ()       => ipcRenderer.invoke('window:collapse'),
  expandWindow:      ()       => ipcRenderer.invoke('window:expand'),
  dragWindow:        (delta)  => ipcRenderer.invoke('window:drag', delta),
  startResize:       (dir)    => ipcRenderer.invoke('window:startResize', dir),
  stopResize:        ()       => ipcRenderer.invoke('window:stopResize'),
  onWindowBlur:      (cb)     => ipcRenderer.on('window-blur', cb),
})
