const { app, BrowserWindow, ipcMain, Tray, Menu, Notification, screen, nativeImage } = require('electron')
const path = require('path')
const fs = require('fs')

const isDev = process.env.NODE_ENV !== 'production' && !app.isPackaged

let mainWindow = null
let tray = null
let collapsedPos = null  // 折叠前保存位置，展开时恢复

const MINI_SIZE = 64
const dataPath = path.join(app.getPath('userData'), 'tasks.json')

const defaultData = {
  tasks: [],
  assignees: ['自己'],
  tags: ['工作', '个人'],
  settings: {
    notifyDaysBefore: 1,
    position: null,
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

  let x = data.settings.position?.x ?? display.width - width - 20
  let y = data.settings.position?.y ?? display.height - height - 20

  mainWindow = new BrowserWindow({
    width,
    height,
    x,
    y,
    frame: false,
    transparent: true,
    backgroundMaterial: 'acrylic',  // Windows 11 原生毛玻璃
    hasShadow: false,               // 禁用 OS 阴影，避免黑色残影
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
        if (mainWindow.isVisible()) mainWindow.hide()
        else mainWindow.show()
      },
    },
    { type: 'separator' },
    { label: '退出', click: () => app.quit() },
  ])
  tray.setContextMenu(menu)
  tray.on('click', () => {
    if (mainWindow.isVisible()) mainWindow.hide()
    else mainWindow.show()
  })
}

// IPC 处理器
ipcMain.handle('tasks:load', () => loadData())

ipcMain.handle('tasks:save', (_, data) => {
  saveData(data)
  return true
})

ipcMain.handle('window:collapse', () => {
  // 保存展开时的位置，折叠后贴右下角
  collapsedPos = mainWindow.getPosition()
  const display = screen.getPrimaryDisplay().workAreaSize
  mainWindow.setMinimumSize(1, 1)
  mainWindow.setBounds({
    x: display.width - MINI_SIZE - 16,
    y: display.height - MINI_SIZE - 16,
    width: MINI_SIZE,
    height: MINI_SIZE,
  })
  // 透明区域不拦截鼠标（但圆钮本体仍可点击）
  mainWindow.setIgnoreMouseEvents(false)
})

ipcMain.handle('window:expand', () => {
  const data = loadData()
  const { width, height } = data.settings.windowSize
  const display = screen.getPrimaryDisplay().workAreaSize

  // 恢复到折叠前位置，或默认位置
  let x = collapsedPos?.[0] ?? data.settings.position?.x ?? display.width - width - 20
  let y = collapsedPos?.[1] ?? data.settings.position?.y ?? display.height - height - 20
  collapsedPos = null

  mainWindow.setBounds({ x, y, width, height })
})

ipcMain.handle('window:drag', (_, { mouseX, mouseY }) => {
  const [wx, wy] = mainWindow.getPosition()
  mainWindow.setPosition(wx + mouseX, wy + mouseY)
})

// 让渲染进程通知主进程哪些区域应忽略鼠标事件
ipcMain.handle('window:ignoreMouseEvents', (_, ignore) => {
  mainWindow.setIgnoreMouseEvents(ignore, { forward: true })
})

app.whenReady().then(() => {
  createWindow()
  createTray()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
