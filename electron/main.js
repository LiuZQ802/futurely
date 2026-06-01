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

// ── 吸附 / 贴边隐藏 ──
let snapEdge       = null   // 'left'|'right'|'top'|'bottom'|null
let autoHide       = false  // 贴边自动隐藏开关
let slideHidden    = false  // 当前是否已缩到边缘
let slideAnim      = null   // 滑动动画 timer
let hideDelayTimer = null   // 隐藏延迟 timer
let edgeMonitor    = null   // 鼠标边缘监测 timer
const SNAP_DIST    = 30     // 距边缘多少 px 触发吸附
const SLIVER       = 4      // 隐藏后露出的宽度(px)
const HIDE_DELAY   = 800    // 离开后多少 ms 开始隐藏

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

// ── 吸附 / 贴边隐藏 工具函数 ──────────────────────────

function workArea() { return screen.getPrimaryDisplay().workArea }

/** 计算吸附到指定边缘时窗口应处于的坐标 */
function snappedBounds(edge, b) {
  const wa = workArea()
  return {
    x:      edge === 'left'   ? wa.x
           : edge === 'right'  ? wa.x + wa.width  - b.width  : b.x,
    y:      edge === 'top'    ? wa.y
           : edge === 'bottom' ? wa.y + wa.height - b.height : b.y,
    width:  b.width,
    height: b.height,
  }
}

/** 计算隐藏到边缘外（只露出 SLIVER px）时的坐标 */
function hiddenBounds(edge, sb) {
  const wa = workArea()
  const h = { ...sb }
  if (edge === 'left')   h.x = wa.x - sb.width  + SLIVER
  if (edge === 'right')  h.x = wa.x + wa.width  - SLIVER
  if (edge === 'top')    h.y = wa.y - sb.height + SLIVER
  if (edge === 'bottom') h.y = wa.y + wa.height - SLIVER
  return h
}

/** 平滑滑动到目标位置（ease-out cubic，约 180ms）*/
function animateTo(target, onDone) {
  if (slideAnim) { clearInterval(slideAnim); slideAnim = null }
  const start = mainWindow.getBounds()
  const STEPS = 11
  let s = 0
  slideAnim = setInterval(() => {
    s++
    const t = 1 - Math.pow(1 - s / STEPS, 3)
    mainWindow.setBounds({
      x:      Math.round(start.x      + (target.x      - start.x)      * t),
      y:      Math.round(start.y      + (target.y      - start.y)      * t),
      width:  Math.round(start.width  + (target.width  - start.width)  * t),
      height: Math.round(start.height + (target.height - start.height) * t),
    })
    if (s >= STEPS) {
      clearInterval(slideAnim); slideAnim = null
      onDone?.()
    }
  }, 16)
}

/** 检查拖拽结束后是否贴近边缘，是则吸附并自动滑入 */
function checkSnap() {
  if (isCollapsed) return
  const wa = workArea()
  const b  = mainWindow.getBounds()
  const gaps = {
    left:   b.x - wa.x,
    right:  wa.x + wa.width  - (b.x + b.width),
    top:    b.y - wa.y,
    bottom: wa.y + wa.height - (b.y + b.height),
  }
  let nearest = null, minD = SNAP_DIST
  for (const [edge, d] of Object.entries(gaps)) {
    if (Math.abs(d) < minD) { minD = Math.abs(d); nearest = edge }
  }
  if (nearest) {
    snapEdge = nearest
    autoHide = true
    // 先滑到贴边位置，300ms 后自动缩入
    animateTo(snappedBounds(nearest, b), () => {
      startEdgeMonitor()
      setTimeout(() => slideOut(), 300)
    })
    notifySnapChange()
  }
}

function notifySnapChange() {
  if (mainWindow && !mainWindow.isDestroyed())
    mainWindow.webContents.send('snap-changed', { edge: snapEdge, autoHide, slideHidden })
}

/** 滑入（从隐藏态恢复到贴边可见） */
function slideIn() {
  if (!snapEdge || !slideHidden) return
  if (hideDelayTimer) { clearTimeout(hideDelayTimer); hideDelayTimer = null }
  const sb = snappedBounds(snapEdge, mainWindow.getBounds())
  slideHidden = false
  animateTo(sb)
}

/** 滑出（缩到边缘外只露 SLIVER px） */
function slideOut() {
  if (!snapEdge || slideHidden) return
  const b  = mainWindow.getBounds()
  const sb = snappedBounds(snapEdge, b)
  const hb = hiddenBounds(snapEdge, sb)
  slideHidden = true
  animateTo(hb)
}

/** 开启鼠标监测，用于贴边自动隐藏 */
function startEdgeMonitor() {
  stopEdgeMonitor()
  edgeMonitor = setInterval(() => {
    if (!autoHide || !snapEdge || isCollapsed) return
    const cursor = screen.getCursorScreenPoint()
    const b  = mainWindow.getBounds()
    const sb = snappedBounds(snapEdge, b)
    const M  = 12  // 触发区域边距

    const inZone = cursor.x >= sb.x - M && cursor.x <= sb.x + sb.width  + M
                && cursor.y >= sb.y - M && cursor.y <= sb.y + sb.height + M

    if (inZone && slideHidden) {
      slideIn()
    } else if (!inZone && !slideHidden && !slideAnim) {
      if (!hideDelayTimer) {
        hideDelayTimer = setTimeout(() => {
          hideDelayTimer = null
          slideOut()
        }, HIDE_DELAY)
      }
    } else if (inZone && hideDelayTimer) {
      clearTimeout(hideDelayTimer); hideDelayTimer = null
    }
  }, 80)
}

function stopEdgeMonitor() {
  if (edgeMonitor) { clearInterval(edgeMonitor); edgeMonitor = null }
  if (hideDelayTimer) { clearTimeout(hideDelayTimer); hideDelayTimer = null }
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
  const now   = new Date()
  const today = new Date(); today.setHours(0,0,0,0)
  const n = data.settings.notifyDaysBefore ?? 1

  data.tasks.forEach((task) => {
    if (task.status === 'done' || !task.deadline) return
    const deadline = new Date(task.deadline)
    const dayD = new Date(task.deadline); dayD.setHours(0,0,0,0)
    const diff = Math.round((dayD - today) / 86400000)

    if (diff >= 0 && diff <= n) {
      const hasTime = task.deadline.includes('T')
      const timePart = hasTime
        ? ` ${String(deadline.getHours()).padStart(2,'0')}:${String(deadline.getMinutes()).padStart(2,'0')}`
        : ''
      const label = diff === 0 ? `今天${timePart}截止` : `还有 ${diff} 天${timePart}截止`
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
  // 如果当前贴边缩入，先取消吸附让窗口完全可见
  if (snapEdge) {
    stopEdgeMonitor()
    if (slideHidden) {
      const sb = snappedBounds(snapEdge, mainWindow.getBounds())
      mainWindow.setBounds(sb)
      slideHidden = false
    }
    snapEdge = null
    autoHide = false
    notifySnapChange()
  }

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
  // 拖拽结束后检测吸附
  if (moved && !isCollapsed) {
    // 先清除旧吸附状态
    snapEdge = null
    checkSnap()
  }
  return moved
})

// ── 吸附 / 贴边隐藏 IPC ────────────────────────────

ipcMain.handle('window:getSnapState', () => ({
  edge: snapEdge, autoHide, slideHidden,
}))

/** 手动触发吸附到最近边缘 */
ipcMain.handle('window:snapToNearest', () => {
  snapEdge = null
  checkSnap()
})

/** 取消吸附，恢复自由浮动 */
ipcMain.handle('window:unsnap', () => {
  stopEdgeMonitor()
  if (slideHidden) slideIn()
  setTimeout(() => {
    snapEdge = null
    autoHide = false
    slideHidden = false
    notifySnapChange()
  }, slideHidden ? 220 : 0)
})

/** 切换贴边自动隐藏 */
ipcMain.handle('window:toggleAutoHide', () => {
  if (!snapEdge) return
  autoHide = !autoHide
  if (autoHide) {
    startEdgeMonitor()
    // 立刻触发一次隐藏（如果鼠标不在窗口上）
    const cursor = screen.getCursorScreenPoint()
    const b  = mainWindow.getBounds()
    const sb = snappedBounds(snapEdge, b)
    const inWin = cursor.x >= sb.x && cursor.x <= sb.x + sb.width
               && cursor.y >= sb.y && cursor.y <= sb.y + sb.height
    if (!inWin) setTimeout(() => slideOut(), HIDE_DELAY)
  } else {
    stopEdgeMonitor()
    if (slideHidden) slideIn()
    slideHidden = false
  }
  notifySnapChange()
  return autoHide
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
