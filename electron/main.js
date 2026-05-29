const { app, BrowserWindow, ipcMain, Tray, Menu, Notification, screen, nativeImage } = require('electron')
const path = require('path')
const fs = require('fs')

const isDev = process.env.NODE_ENV !== 'production' && !app.isPackaged

let mainWindow = null
let tray = null
let isCollapsed = false

const dataPath = path.join(app.getPath('userData'), 'tasks.json')

const defaultData = {
  tasks: [],
  assignees: ['自己'],
  tags: ['工作', '个人'],
  settings: {
    notifyDaysBefore: 1,
    position: null,
    collapsed: false,
    windowSize: { width: 340, height: 520 },
  },
}

function loadData() {
  try {
    if (fs.existsSync(dataPath)) {
      return JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
    }
  } catch (e) {}
  return JSON.parse(JSON.stringify(defaultData))
}

function saveData(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf-8')
}

function checkDeadlines(data) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const n = data.settings.notifyDaysBefore ?? 1

  data.tasks.forEach((task) => {
    if (task.status === 'done' || !task.deadline) return
    const deadline = new Date(task.deadline)
    deadline.setHours(0, 0, 0, 0)
    const diffDays = Math.round((deadline - today) / 86400000)
    if (diffDays >= 0 && diffDays <= n) {
      const label = diffDays === 0 ? '今天截止' : `还有 ${diffDays} 天截止`
      new Notification({
        title: `⏰ 任务提醒：${task.title}`,
        body: label,
      }).show()
    }
  })
}

function createWindow() {
  const data = loadData()
  const { width, height } = data.settings.windowSize
  const display = screen.getPrimaryDisplay().workAreaSize

  let x = data.settings.position?.x
  let y = data.settings.position?.y
  if (x == null || y == null) {
    x = display.width - width - 20
    y = display.height - height - 20
  }

  mainWindow = new BrowserWindow({
    width,
    height,
    x,
    y,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    checkDeadlines(data)
  })

  mainWindow.on('moved', () => {
    const [wx, wy] = mainWindow.getPosition()
    const d = loadData()
    d.settings.position = { x: wx, y: wy }
    saveData(d)
  })
}

function createTray() {
  const icon = nativeImage.createEmpty()
  tray = new Tray(icon)
  tray.setToolTip('桌面清单')

  const menu = Menu.buildFromTemplate([
    {
      label: '显示/隐藏',
      click: () => {
        if (mainWindow.isVisible()) {
          mainWindow.hide()
        } else {
          mainWindow.show()
        }
      },
    },
    { type: 'separator' },
    { label: '退出', click: () => app.quit() },
  ])
  tray.setContextMenu(menu)
  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide()
    } else {
      mainWindow.show()
    }
  })
}

// IPC 处理器
ipcMain.handle('tasks:load', () => loadData())

ipcMain.handle('tasks:save', (_, data) => {
  saveData(data)
  return true
})

ipcMain.handle('window:collapse', () => {
  isCollapsed = true
  mainWindow.setSize(64, 64)
  mainWindow.setAlwaysOnTop(true)
})

ipcMain.handle('window:expand', () => {
  isCollapsed = false
  const data = loadData()
  const { width, height } = data.settings.windowSize
  mainWindow.setSize(width, height)
  mainWindow.setAlwaysOnTop(true)
})

ipcMain.handle('window:drag', (_, { mouseX, mouseY }) => {
  const [wx, wy] = mainWindow.getPosition()
  mainWindow.setPosition(wx + mouseX, wy + mouseY)
})

app.whenReady().then(() => {
  createWindow()
  createTray()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
