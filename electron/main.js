const { app, BrowserWindow, ipcMain, Tray, Menu, Notification, screen, nativeImage } = require('electron')
const path = require('path')
const fs = require('fs')

const isDev = process.env.NODE_ENV !== 'production' && !app.isPackaged

let mainWindow = null
let tray = null
let collapsedPos = null
let resizeTimer = null
let resizeState = null

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

async function createWindow() {
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
    hasShadow: false,
    alwaysOnTop: true,
    resizable: false,
    maximizable: false,
    skipTaskbar: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (isDev) {
    // 轮询等待 Vite 开发服务器就绪（最多等 15 秒）
    let loaded = false
    for (let i = 0; i < 30; i++) {
      try {
        await mainWindow.loadURL('http://localhost:5173')
        loaded = true
        break
      } catch (e) {
        await new Promise(r => setTimeout(r, 500))
      }
    }
    if (!loaded) {
      console.error('[main] 无法连接 Vite 开发服务器')
      app.quit()
      return
    }
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    checkDeadlines(data)
  })

  // 禁止页面缩放
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.setZoomFactor(1.0)
    mainWindow.webContents.setVisualZoomLevelLimits(1, 1)
  })

  mainWindow.on('moved', () => {
    const [wx, wy] = mainWindow.getPosition()
    const d = loadData()
    d.settings.position = { x: wx, y: wy }
    saveData(d)
  })

  // 失焦自动折叠（resize 过程中不触发）
  mainWindow.on('blur', () => {
    if (!mainWindow || mainWindow.isDestroyed() || resizeState) return
    mainWindow.webContents.send('window-blur')
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

// ── IPC 处理器 ──────────────────────────────────────

ipcMain.handle('tasks:load', () => loadData())

ipcMain.handle('tasks:save', (_, data) => {
  saveData(data)
  return true
})

ipcMain.handle('window:collapse', () => {
  if (resizeTimer) { clearInterval(resizeTimer); resizeTimer = null }
  resizeState = null
  collapsedPos = mainWindow.getPosition()

  // 必须先放开 resizable + 清掉 minimumSize，否则 setBounds 被系统拒绝
  mainWindow.setResizable(true)
  mainWindow.setMinimumSize(1, 1)
  const b = mainWindow.getBounds()
  mainWindow.setBounds({ x: b.x, y: b.y, width: MINI_SIZE, height: MINI_SIZE })
  mainWindow.setResizable(false)
})

ipcMain.handle('window:expand', () => {
  const data = loadData()
  const { width, height } = data.settings.windowSize

  mainWindow.setResizable(true)
  mainWindow.setMinimumSize(1, 1)
  const b = mainWindow.getBounds()
  mainWindow.setBounds({ x: b.x, y: b.y, width, height })
  mainWindow.setResizable(false)
})

// 拖拽移动：用 setBounds 保持大小不变（setPosition 在 Windows 上偶有副作用）
ipcMain.handle('window:drag', (_, { mouseX, mouseY }) => {
  const b = mainWindow.getBounds()
  mainWindow.setBounds({
    x: b.x + mouseX,
    y: b.y + mouseY,
    width: b.width,
    height: b.height,
  })
})

ipcMain.handle('window:startResize', (_, dir) => {
  const initBounds = mainWindow.getBounds()
  const initMouse = screen.getCursorScreenPoint()
  const scale = screen.getPrimaryDisplay().scaleFactor
  resizeState = { dir, initBounds, initMouse }

  resizeTimer = setInterval(() => {
    const mouse = screen.getCursorScreenPoint()
    const dx = (mouse.x - initMouse.x) / scale   // 物理→逻辑像素
    const dy = (mouse.y - initMouse.y) / scale

    let { x, y, width, height } = initBounds
    const MIN_W = 280, MIN_H = 360

    if (dir.includes('e')) width  = Math.max(MIN_W, Math.round(width  + dx))
    if (dir.includes('s')) height = Math.max(MIN_H, Math.round(height + dy))
    if (dir.includes('w')) {
      const newW = Math.max(MIN_W, Math.round(width - dx))
      x += width - newW
      width = newW
    }
    if (dir.includes('n')) {
      const newH = Math.max(MIN_H, Math.round(height - dy))
      y += height - newH
      height = newH
    }

    mainWindow.setBounds({ x, y, width, height })
  }, 16)
})

ipcMain.handle('window:stopResize', () => {
  if (resizeTimer) {
    clearInterval(resizeTimer)
    resizeTimer = null
  }
  resizeState = null
  const b = mainWindow.getBounds()
  const d = loadData()
  d.settings.windowSize = { width: b.width, height: b.height }
  saveData(d)
  return { width: b.width, height: b.height }
})

app.whenReady().then(async () => {
  await createWindow()
  createTray()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
