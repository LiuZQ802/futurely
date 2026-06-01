const { app, BrowserWindow, ipcMain, Tray, Menu, Notification, screen, nativeImage } = require('electron')
const path = require('path')
const fs = require('fs')
const zlib = require('zlib')

const isDev = process.env.NODE_ENV !== 'production' && !app.isPackaged

let mainWindow = null
let tray = null
let collapsedPos = null
let resizeTimer = null
let resizeState = null
let isCollapsed = false
let dragTimer = null

const MINI_SIZE = 64
const APP_NAME  = '桌面清单'
const dataPath  = path.join(app.getPath('userData'), 'tasks.json')

const defaultData = {
  tasks: [],
  assignees: ['自己'],
  tags: ['工作', '个人'],
  settings: {
    notifyDaysBefore: 1,
    position: null,
    windowSize: { width: 400, height: 560 },  // 默认宽度加大
  },
}

// ── 用 Node.js 内置模块生成托盘图标（无外部依赖）──────────────
function makeTrayIcon() {
  // CRC32
  const T = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1)
    T[n] = c
  }
  function crc32(buf) {
    let c = 0xffffffff
    for (let i = 0; i < buf.length; i++) c = T[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
    return ((c ^ 0xffffffff) >>> 0)
  }
  function chunk(type, data) {
    const tb = Buffer.from(type, 'ascii')
    const lb = Buffer.allocUnsafe(4); lb.writeUInt32BE(data.length)
    const cb = Buffer.allocUnsafe(4); cb.writeUInt32BE(crc32(Buffer.concat([tb, data])))
    return Buffer.concat([lb, tb, data, cb])
  }

  const S = 32
  const ihdr = Buffer.allocUnsafe(13)
  ihdr.writeUInt32BE(S, 0); ihdr.writeUInt32BE(S, 4)
  ihdr[8]=8; ihdr[9]=6; ihdr[10]=0; ihdr[11]=0; ihdr[12]=0  // RGBA

  const raw = Buffer.allocUnsafe(S * (1 + S * 4))
  for (let y = 0; y < S; y++) {
    raw[y * (1 + S*4)] = 0
    for (let x = 0; x < S; x++) {
      const off = y*(1+S*4) + 1 + x*4
      const dx = x - S/2 + 0.5, dy = y - S/2 + 0.5
      const r  = Math.sqrt(dx*dx + dy*dy)
      if (r < S/2 - 1) {
        // 圆形背景：青色 #20b8a6
        raw[off]=0x20; raw[off+1]=0xb8; raw[off+2]=0xa6; raw[off+3]=255
        // 中间画简单勾形（✓）
        const cx=x-S/2+0.5, cy=y-S/2+0.5
        const inCheck = (
          (cx>-9 && cx<-2 && cy>(cx+9)*0.7-2 && cy<(cx+9)*0.7+2) ||
          (cx>-2 && cx<8  && cy>-(cx-8)*1.1-2 && cy<-(cx-8)*1.1+2)
        )
        if (inCheck) { raw[off]=255; raw[off+1]=255; raw[off+2]=255; raw[off+3]=255 }
      } else if (r < S/2) {
        // 边缘抗锯齿
        const a = Math.round((S/2 - r) * 255)
        raw[off]=0x20; raw[off+1]=0xb8; raw[off+2]=0xa6; raw[off+3]=a
      } else {
        raw[off]=0; raw[off+1]=0; raw[off+2]=0; raw[off+3]=0
      }
    }
  }

  const png = Buffer.concat([
    Buffer.from([137,80,78,71,13,10,26,10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
  return nativeImage.createFromBuffer(png, { scaleFactor: 1 })
}

function loadData() {
  try {
    if (fs.existsSync(dataPath)) return JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
  } catch (e) {}
  return JSON.parse(JSON.stringify(defaultData))
}

function saveData(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf-8')
}

function checkDeadlines(data) {
  const today = new Date(); today.setHours(0,0,0,0)
  const n = data.settings.notifyDaysBefore ?? 1

  data.tasks.forEach((task) => {
    if (task.status === 'done' || !task.deadline) return
    const deadline = new Date(task.deadline); deadline.setHours(0,0,0,0)
    const diff = Math.round((deadline - today) / 86400000)
    if (diff >= 0 && diff <= n) {
      const label = diff === 0 ? '今天截止' : `还有 ${diff} 天截止`
      new Notification({
        title: `${APP_NAME} · 任务提醒`,
        body: `「${task.title}」${label}`,
        silent: false,
      }).show()
    }
  })
}

async function createWindow() {
  const data = loadData()
  const { width, height } = data.settings.windowSize
  const display = screen.getPrimaryDisplay().workAreaSize

  let x = data.settings.position?.x ?? display.width  - width  - 20
  let y = data.settings.position?.y ?? display.height - height - 20

  mainWindow = new BrowserWindow({
    width, height, x, y,
    frame: false,
    transparent: true,
    hasShadow: false,
    alwaysOnTop: true,
    resizable: true,
    maximizable: false,
    skipTaskbar: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    checkDeadlines(data)
  })

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.setZoomFactor(1.0)
    mainWindow.webContents.setVisualZoomLevelLimits(1, 1)
  })

  mainWindow.on('moved', () => {
    const [wx, wy] = mainWindow.getPosition()
    const d = loadData(); d.settings.position = { x: wx, y: wy }; saveData(d)
  })

  mainWindow.on('blur', () => {
    if (!mainWindow || mainWindow.isDestroyed() || resizeState || dragTimer) return
    mainWindow.webContents.send('window-blur')
  })

  mainWindow.on('maximize', () => {
    if (isCollapsed) { mainWindow.unmaximize(); mainWindow.setSize(MINI_SIZE, MINI_SIZE) }
  })
  mainWindow.on('will-resize', (e, nb) => {
    if (isCollapsed && (nb.width > MINI_SIZE || nb.height > MINI_SIZE)) e.preventDefault()
  })

  if (isDev) {
    let loaded = false
    for (let i = 0; i < 30; i++) {
      try { await mainWindow.loadURL('http://localhost:5173'); loaded = true; break }
      catch (e) { await new Promise(r => setTimeout(r, 500)) }
    }
    if (!loaded) { app.quit(); return }
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

function createTray() {
  const icon = makeTrayIcon()
  tray = new Tray(icon)
  tray.setToolTip(APP_NAME)

  const menu = Menu.buildFromTemplate([
    { label: '显示 / 隐藏', click: () => mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show() },
    { type: 'separator' },
    { label: '退出', click: () => app.quit() },
  ])
  tray.setContextMenu(menu)
  tray.on('click', () => mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show())
}

// ── IPC ───────────────────────────────────────────────

ipcMain.handle('tasks:load', () => loadData())
ipcMain.handle('tasks:save', (_, data) => { saveData(data); return true })

ipcMain.handle('window:collapse', () => {
  if (resizeTimer) { clearInterval(resizeTimer); resizeTimer = null }
  resizeState = null; isCollapsed = true
  collapsedPos = mainWindow.getPosition()
  mainWindow.setMaximumSize(MINI_SIZE, MINI_SIZE)
  mainWindow.setMinimumSize(1, 1)
  mainWindow.setSize(MINI_SIZE, MINI_SIZE)
})

ipcMain.handle('window:expand', () => {
  isCollapsed = false
  const { width, height } = loadData().settings.windowSize
  mainWindow.setMaximumSize(0, 0)
  mainWindow.setMinimumSize(1, 1)
  mainWindow.setSize(width, height)
})

ipcMain.handle('window:startDrag', () => {
  if (dragTimer) { clearInterval(dragTimer); dragTimer = null }
  const initBounds = mainWindow.getBounds()
  const initMouse  = screen.getCursorScreenPoint()
  let hasMoved = false

  dragTimer = setInterval(() => {
    const cur = screen.getCursorScreenPoint()
    const dx = cur.x - initMouse.x
    const dy = cur.y - initMouse.y
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return
    hasMoved = true
    const w = isCollapsed ? MINI_SIZE : initBounds.width
    const h = isCollapsed ? MINI_SIZE : initBounds.height
    mainWindow.setBounds({ x: Math.round(initBounds.x+dx), y: Math.round(initBounds.y+dy), width: w, height: h })
  }, 8)
  mainWindow._drag = { get moved() { return hasMoved } }
})

ipcMain.handle('window:stopDrag', () => {
  if (dragTimer) { clearInterval(dragTimer); dragTimer = null }
  const moved = mainWindow._drag?.moved ?? false
  mainWindow._drag = null
  return moved
})

ipcMain.handle('window:startResize', (_, dir) => {
  const initBounds = mainWindow.getBounds()
  const initMouse  = screen.getCursorScreenPoint()
  resizeState = { dir, initBounds, initMouse }

  resizeTimer = setInterval(() => {
    const mouse = screen.getCursorScreenPoint()
    const dx = mouse.x - initMouse.x
    const dy = mouse.y - initMouse.y
    let { x, y, width, height } = initBounds
    const MIN_W = 300, MIN_H = 400

    if (dir.includes('e')) width  = Math.max(MIN_W, Math.round(width  + dx))
    if (dir.includes('s')) height = Math.max(MIN_H, Math.round(height + dy))
    if (dir.includes('w')) { const nw = Math.max(MIN_W, Math.round(width-dx));  x += width-nw;  width  = nw }
    if (dir.includes('n')) { const nh = Math.max(MIN_H, Math.round(height-dy)); y += height-nh; height = nh }
    mainWindow.setBounds({ x, y, width, height })
  }, 16)
})

ipcMain.handle('window:stopResize', () => {
  if (resizeTimer) { clearInterval(resizeTimer); resizeTimer = null }
  resizeState = null
  const b = mainWindow.getBounds()
  const d = loadData(); d.settings.windowSize = { width: b.width, height: b.height }; saveData(d)
  return { width: b.width, height: b.height }
})

app.whenReady().then(async () => {
  app.setName(APP_NAME)
  await createWindow()
  createTray()
})

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
