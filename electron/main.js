const { app, BrowserWindow, ipcMain, Tray, Menu, Notification, screen, nativeImage, net, shell, dialog, globalShortcut } = require('electron')
const path = require('path')
const fs = require('fs')
const zlib = require('zlib')

const isDev = process.env.NODE_ENV !== 'production' && !app.isPackaged

// Windows 通知/弹框的应用名称来自 AppUserModelId，必须在 ready 之前设置
app.setAppUserModelId('Futurely')
app.name = 'Futurely'

let mainWindow = null
let tray = null
let appIcon = null   // 启动时生成一次，全局复用
let collapsedPos = null
let resizeTimer = null
let resizeState = null
let isCollapsed = false
let dragTimer = null

// ── 吸附 / 贴边隐藏 ──
let snapEdge       = null   // 'left'|'right'|'top'|'bottom'|null
let snapBounds     = null   // 吸附时的可见位置，固定存储避免从隐藏坐标反推
let autoHide       = false  // 贴边自动隐藏开关
let slideHidden    = false  // 当前是否已缩到边缘
let slideAnim      = null   // 滑动动画 timer
let isOurMove      = false  // animateTo 期间设为 true，区分用户拖拽与我们自己的动画
let hideDelayTimer = null   // 隐藏延迟 timer
let edgeMonitor    = null   // 鼠标边缘监测 timer
const SNAP_DIST    = 30     // 距边缘多少 px 触发吸附
const SLIVER       = 4      // 隐藏后露出的宽度(px)
const HIDE_DELAY   = 600    // 离开后多少 ms 开始隐藏

const MINI_SIZE = 64
const APP_NAME  = 'Futurely'
let dataPath = ''
let dbPath   = ''

function resolveDataPaths() {
  const userDataDir = app.getPath('userData')
  // 打包后：exe 同级目录；开发模式：项目根目录
  const portableDir = app.isPackaged
    ? path.dirname(app.getPath('exe'))
    : path.join(__dirname, '..')

  function pick(filename) {
    const portable = path.join(portableDir, filename)
    const userData = path.join(userDataDir, filename)
    if (fs.existsSync(portable)) return portable
    if (fs.existsSync(userData)) return userData
    // 开发模式直接回退 userData，避免在项目目录创建 db
    if (!app.isPackaged) return userData
    try {
      const test = portable + '.writetest'
      fs.writeFileSync(test, '')
      fs.unlinkSync(test)
      return portable
    } catch {
      return userData
    }
  }

  dataPath = pick('tasks.json')
  dbPath   = pick('futurely.db')
  console.log('[Futurely] dataPath:', dataPath)
  console.log('[Futurely] dbPath:  ', dbPath)
}

const defaultData = {
  tasks: [],
  assignees: ['自己'],
  tags: ['工作', '个人'],
  settings: {
    notifyHoursBefore:   1,
    notifyMinutesBefore: 0,
    lang:       'zh',
    theme:      'dark',
    autoLaunch: false,
    dailySummary: true,
    workDirs:   [],
    position:   null,
    collapsed:  false,
    windowSize: { width: 460, height: 600 },
  },
}

// ── 生成应用图标（深海军蓝圆角方块 + 金色右向三角，代表「面向未来」）──
function makeAppIcon() {
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

  // 圆角方块，radius = 6，边缘抗锯齿
  function inBg(x, y) {
    const m = 1, r = 6
    const x0 = m, y0 = m, x1 = S-1-m, y1 = S-1-m
    if (x < x0 || x > x1 || y < y0 || y > y1) return 0
    for (const [cx, cy] of [[x0+r,y0+r],[x1-r,y0+r],[x0+r,y1-r],[x1-r,y1-r]]) {
      if (Math.abs(x-cx) <= r && Math.abs(y-cy) <= r) {
        const d = Math.sqrt((x-cx)**2+(y-cy)**2)
        if (d > r+0.6) return 0
        if (d > r-0.6) return Math.round((r+0.6-d)/1.2*255)
      }
    }
    return 255
  }

  // 点在三角形内（有符号面积法）
  function inTriangle(px, py, ax, ay, bx, by, cx, cy) {
    const s1=(bx-ax)*(py-ay)-(by-ay)*(px-ax)
    const s2=(cx-bx)*(py-by)-(cy-by)*(px-bx)
    const s3=(ax-cx)*(py-cy)-(ay-cy)*(px-cx)
    return (s1>=0&&s2>=0&&s3>=0)||(s1<=0&&s2<=0&&s3<=0)
  }

  // 右向三角箭头：尖端右，左侧上下两角
  const TX = 24.5, TY = 16    // 尖端
  const LX = 9,    LYT = 8    // 左上
  const              LYB = 24  // 左下

  const ihdr = Buffer.allocUnsafe(13)
  ihdr.writeUInt32BE(S, 0); ihdr.writeUInt32BE(S, 4)
  ihdr[8]=8; ihdr[9]=6; ihdr[10]=0; ihdr[11]=0; ihdr[12]=0

  const raw = Buffer.allocUnsafe(S * (1 + S * 4))
  for (let y = 0; y < S; y++) {
    raw[y*(1+S*4)] = 0
    for (let x = 0; x < S; x++) {
      const off = y*(1+S*4)+1+x*4
      const a = inBg(x, y)
      if (!a) { raw[off]=raw[off+1]=raw[off+2]=raw[off+3]=0; continue }
      if (inTriangle(x+0.5, y+0.5, TX, TY, LX, LYT, LX, LYB)) {
        raw[off]=0xfb; raw[off+1]=0xbf; raw[off+2]=0x24; raw[off+3]=a  // #fbbf24 amber
      } else {
        raw[off]=0x0f; raw[off+1]=0x17; raw[off+2]=0x2a; raw[off+3]=a  // #0f172a navy
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
  if (!target || [target.x, target.y, target.width, target.height].some(v => !Number.isFinite(v))) {
    onDone?.()
    return
  }
  if (slideAnim) { clearInterval(slideAnim); slideAnim = null }
  isOurMove = true
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
      isOurMove = false
      onDone?.()
    }
  }, 16)
}

/** 检查拖拽结束后是否贴近边缘，是则直接缩入（折叠态和展开态都支持） */
function checkSnap() {
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
    if (d < minD) { minD = d; nearest = edge }
  }
  if (nearest) {
    snapEdge = nearest
    autoHide = true
    snapBounds = snappedBounds(nearest, b)          // 固定保存可见位置
    const hb = hiddenBounds(nearest, snapBounds)
    slideHidden = true
    // 400ms 延迟再启动监测，让 drag 结束后 cursor 有时间离开边缘
    animateTo(hb, () => setTimeout(() => startEdgeMonitor(), 400))
    notifySnapChange()
  }
}

function notifySnapChange() {
  if (mainWindow && !mainWindow.isDestroyed())
    mainWindow.webContents.send('snap-changed', { edge: snapEdge, autoHide, slideHidden })
}

/** 滑入（从隐藏态恢复到贴边可见） */
function slideIn() {
  if (!snapEdge || !slideHidden || !snapBounds) return
  if (hideDelayTimer) { clearTimeout(hideDelayTimer); hideDelayTimer = null }
  slideHidden = false
  animateTo(snapBounds)
}

/** 滑出（缩到边缘外只露 SLIVER px） */
function slideOut() {
  if (!snapEdge || slideHidden || !snapBounds) return
  const hb = hiddenBounds(snapEdge, snapBounds)
  slideHidden = true
  animateTo(hb)
}

/** 开启鼠标监测，用于贴边自动隐藏 */
function startEdgeMonitor() {
  stopEdgeMonitor()
  edgeMonitor = setInterval(() => {
    if (!autoHide || !snapEdge || !snapBounds) return
    const cursor = screen.getCursorScreenPoint()
    const sb = snapBounds   // 始终用固定的可见位置判断区域
    const M  = 16

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

let db = null

function initDb() {
  if (db) return db
  const Database = require('better-sqlite3')
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')

  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL DEFAULT '',
      deadline TEXT,
      priority TEXT DEFAULT 'medium',
      status TEXT DEFAULT 'todo',
      assignee TEXT DEFAULT '自己',
      notes TEXT DEFAULT '',
      tags TEXT DEFAULT '[]',
      workDir TEXT,
      archived INTEGER DEFAULT 0,
      createdAt TEXT,
      updatedAt TEXT,
      syncVersion INTEGER DEFAULT 1
    );
    CREATE INDEX IF NOT EXISTS idx_tasks_status   ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_archived ON tasks(archived);
    CREATE INDEX IF NOT EXISTS idx_tasks_updated  ON tasks(updatedAt);

    CREATE TABLE IF NOT EXISTS assignees (name TEXT PRIMARY KEY);
    CREATE TABLE IF NOT EXISTS tags      (name TEXT PRIMARY KEY);

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL DEFAULT '',
      updatedAt TEXT
    );
  `)
  return db
}

function loadFromDb() {
  const nowISO = new Date().toISOString()

  const tasks = db.prepare(`SELECT * FROM tasks ORDER BY createdAt DESC`).all().map(r => ({
    id:        r.id,
    title:     r.title,
    deadline:  r.deadline,
    priority:  r.priority,
    status:    r.status,
    assignee:  r.assignee,
    notes:     r.notes,
    tags:      JSON.parse(r.tags || '[]'),
    workDir:   r.workDir,
    archived:  r.archived === 1,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    syncVersion: r.syncVersion,
  }))

  const assignees = db.prepare(`SELECT name FROM assignees`).all().map(r => r.name)
  const tags      = db.prepare(`SELECT name FROM tags`).all().map(r => r.name)

  const row = db.prepare(`SELECT value FROM settings WHERE key = 'app'`).get()
  let settings = row ? JSON.parse(row.value) : {}

  // 合并默认值，防止新增字段缺失
  settings = { ...defaultData.settings, ...settings }

  // 配置迁移：旧版窄窗口自动升级
  const MIN_W = 460, MIN_H = 600
  let changed = false
  if (settings.windowSize?.width < MIN_W)  { settings.windowSize.width  = MIN_W;  changed = true }
  if (settings.windowSize?.height < MIN_H) { settings.windowSize.height = MIN_H; changed = true }
  if (changed) {
    db.prepare(`INSERT OR REPLACE INTO settings (key, value, updatedAt) VALUES (?, ?, ?)`)
      .run('app', JSON.stringify(settings), nowISO)
  }

  return { tasks, assignees, tags, settings }
}

function migrateToDb(legacy) {
  const nowISO = new Date().toISOString()

  db.transaction(() => {
    const insTask = db.prepare(`
      INSERT OR REPLACE INTO tasks
      (id, title, deadline, priority, status, assignee, notes, tags, workDir, archived, createdAt, updatedAt, syncVersion)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    for (const t of legacy.tasks ?? []) {
      insTask.run(
        t.id, t.title ?? '', t.deadline ?? '', t.priority ?? 'medium',
        t.status ?? 'todo', t.assignee ?? '自己', t.notes ?? '',
        JSON.stringify(t.tags ?? []), t.workDir ?? '',
        t.archived ? 1 : 0,
        t.createdAt ?? nowISO, nowISO, 1
      )
    }

    db.prepare(`DELETE FROM assignees`).run()
    const insA = db.prepare(`INSERT INTO assignees (name) VALUES (?)`)
    for (const n of legacy.assignees ?? ['自己']) insA.run(n)

    db.prepare(`DELETE FROM tags`).run()
    const insT = db.prepare(`INSERT INTO tags (name) VALUES (?)`)
    for (const n of legacy.tags ?? ['工作', '个人']) insT.run(n)

    db.prepare(`INSERT OR REPLACE INTO settings (key, value, updatedAt) VALUES (?, ?, ?)`)
      .run('app', JSON.stringify({ ...defaultData.settings, ...(legacy.settings ?? {}) }), nowISO)
  })()
}

function loadData() {
  // 只要旧 JSON 存在且有任务数据，就尝试迁移（防止 db 被提前创建为空文件）
  if (fs.existsSync(dataPath)) {
    try {
      const legacy = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
      const hasLegacyTasks = (legacy.tasks?.length ?? 0) > 0
      if (hasLegacyTasks) {
        let shouldMigrate = !fs.existsSync(dbPath)
        if (!shouldMigrate) {
          initDb()
          const count = db.prepare(`SELECT COUNT(*) as c FROM tasks`).get().c
          shouldMigrate = count === 0
        }
        if (shouldMigrate) {
          initDb()
          migrateToDb(legacy)
          fs.renameSync(dataPath, dataPath + '.backup')
          return legacy
        }
      }
    } catch (e) { console.error('Migration failed', e) }
  }

  if (!fs.existsSync(dbPath)) {
    return JSON.parse(JSON.stringify(defaultData))
  }

  initDb()
  return loadFromDb()
}

function saveData(data) {
  if (!db) initDb()
  const nowISO = new Date().toISOString()

  db.transaction(() => {
    const insTask = db.prepare(`
      INSERT OR REPLACE INTO tasks
      (id, title, deadline, priority, status, assignee, notes, tags, workDir, archived, createdAt, updatedAt, syncVersion)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    for (const t of data.tasks ?? []) {
      insTask.run(
        t.id, t.title ?? '', t.deadline ?? '', t.priority ?? 'medium',
        t.status ?? 'todo', t.assignee ?? '自己', t.notes ?? '',
        JSON.stringify(t.tags ?? []), t.workDir ?? '',
        t.archived ? 1 : 0,
        t.createdAt ?? nowISO, nowISO,
        (t.syncVersion ?? 0) + 1
      )
    }

    // 删除已从列表移除的任务
    const ids = (data.tasks ?? []).map(t => t.id)
    if (ids.length) {
      const ph = ids.map(() => '?').join(',')
      db.prepare(`DELETE FROM tasks WHERE id NOT IN (${ph})`).run(...ids)
    } else {
      db.prepare(`DELETE FROM tasks`).run()
    }

    db.prepare(`DELETE FROM assignees`).run()
    const insA = db.prepare(`INSERT INTO assignees (name) VALUES (?)`)
    for (const n of data.assignees ?? ['自己']) insA.run(n)

    db.prepare(`DELETE FROM tags`).run()
    const insT = db.prepare(`INSERT INTO tags (name) VALUES (?)`)
    for (const n of data.tags ?? ['工作', '个人']) insT.run(n)

    db.prepare(`INSERT OR REPLACE INTO settings (key, value, updatedAt) VALUES (?, ?, ?)`)
      .run('app', JSON.stringify(data.settings ?? {}), nowISO)
  })()
}

function checkDeadlines(data) {
  const now = new Date()
  const h   = data.settings.notifyHoursBefore   ?? 1
  const m   = data.settings.notifyMinutesBefore ?? 0
  const notifyMs = (h * 60 + m) * 60000

  data.tasks.forEach((task) => {
    if (task.status === 'done' || !task.deadline) return
    const deadline = new Date(task.deadline)
    const diffMs   = deadline - now
    if (diffMs < 0 || diffMs > notifyMs) return

    const diffMin = Math.round(diffMs / 60000)
    const dh = Math.floor(diffMin / 60)
    const dm = diffMin % 60
    let label
    if (dh > 0 && dm > 0)      label = `还有 ${dh} 小时 ${dm} 分钟截止`
    else if (dh > 0)           label = `还有 ${dh} 小时截止`
    else if (dm > 0)           label = `还有 ${dm} 分钟截止`
    else                       label = `即将截止`

    new Notification({
      title:  `${APP_NAME} · 任务提醒`,
      body:   `「${task.title}」${label}`,
      icon:   appIcon,
      silent: false,
    }).show()
  })
}

async function createWindow() {
  const data = loadData()
  const { width, height } = data.settings.windowSize
  const wa = screen.getPrimaryDisplay().workArea

  // 默认居中，避免初始位置落在 SNAP_DIST 范围内触发贴边
  let x = data.settings.position?.x ?? Math.round(wa.x + (wa.width  - width)  / 2)
  let y = data.settings.position?.y ?? Math.round(wa.y + (wa.height - height) / 2)

  // 确保位置在屏幕可见区域内（其他用户分辨率不同时可能越界）
  x = Math.max(wa.x, Math.min(x, wa.x + wa.width  - 100))
  y = Math.max(wa.y, Math.min(y, wa.y + wa.height - 100))

  mainWindow = new BrowserWindow({
    width, height, x, y,
    icon: appIcon,
    frame: false,
    transparent: true,
    hasShadow: false,
    alwaysOnTop: true,
    resizable: true,
    maximizable: false,
    skipTaskbar: true,
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

  let snapDebounce = null
  mainWindow.on('moved', () => {
    // animateTo 期间我们自己在动，忽略
    if (isOurMove) return

    const [wx, wy] = mainWindow.getPosition()
    const d = loadData(); d.settings.position = { x: wx, y: wy }; saveData(d)

    // 贴边状态中：检测用户是否把窗口拖离了贴边位置
    if (snapEdge && snapBounds) {
      const b = mainWindow.getBounds()
      const drifted = Math.abs(b.x - snapBounds.x) > 15 || Math.abs(b.y - snapBounds.y) > 15
      if (!drifted) return  // 还在贴边位置附近（如 slideIn 后的微小事件），忽略
      // 用户把窗口拖走了，清除贴边状态
      stopEdgeMonitor()
      snapEdge = null; snapBounds = null; autoHide = false; slideHidden = false
      notifySnapChange()
      // 继续往下，拖到新位置后重新检测是否贴边
    }

    // 防抖：停止移动 200ms 后检测是否贴边
    if (snapDebounce) clearTimeout(snapDebounce)
    snapDebounce = setTimeout(() => {
      snapDebounce = null
      checkSnap()
    }, 200)
  })

  mainWindow.on('blur', () => {
    if (!mainWindow || mainWindow.isDestroyed() || resizeState || dragTimer) return
    if (snapEdge) return  // 贴边状态下不自动折叠
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
  tray = new Tray(appIcon)
  tray.setToolTip(APP_NAME)

  const menu = Menu.buildFromTemplate([
    { label: '显示 / 隐藏',  click: () => { mainWindow.show(); mainWindow.focus() } },
    { label: '新建任务',     click: () => {
      mainWindow.show(); mainWindow.focus()
      mainWindow.webContents.send('open-add-form')
    }},
    { type: 'separator' },
    { label: '退出', click: () => app.quit() },
  ])
  tray.setContextMenu(menu)
  tray.on('click', () => {
    if (mainWindow.isVisible() && mainWindow.isFocused()) mainWindow.hide()
    else { mainWindow.show(); mainWindow.focus() }
  })
}

// ── IPC ───────────────────────────────────────────────

ipcMain.handle('tasks:load', () => loadData())
ipcMain.handle('tasks:save', (_, data) => { saveData(data); return true })

ipcMain.handle('window:collapse', () => {
  // 贴边缩入时先把窗口拉回可见位置，再折叠
  if (snapEdge) {
    stopEdgeMonitor()
    if (slideHidden && snapBounds) mainWindow.setPosition(snapBounds.x, snapBounds.y)
    snapEdge = null; snapBounds = null; autoHide = false; slideHidden = false
    notifySnapChange()
  }
  if (resizeTimer) { clearInterval(resizeTimer); resizeTimer = null }
  resizeState = null; isCollapsed = true
  collapsedPos = mainWindow.getPosition()
  mainWindow.setMaximumSize(MINI_SIZE, MINI_SIZE)
  mainWindow.setMinimumSize(1, 1)
  mainWindow.setSize(MINI_SIZE, MINI_SIZE)
})

ipcMain.handle('window:expand', () => {
  isCollapsed = false
  // 展开时清除贴边状态（mini 模式贴边的 snapBounds 是 64×64，展开后尺寸变了需要重新贴）
  if (snapEdge) {
    stopEdgeMonitor()
    snapEdge = null; snapBounds = null; autoHide = false; slideHidden = false
    notifySnapChange()
  }
  const { width, height } = loadData().settings.windowSize
  mainWindow.setMaximumSize(0, 0)
  mainWindow.setMinimumSize(1, 1)
  // 自适应展开方向：将当前位置向屏幕内侧收拢，避免窗口展开后超出工作区
  const wa = workArea()
  const [cx, cy] = mainWindow.getPosition()
  const nx = Math.max(wa.x, Math.min(cx, wa.x + wa.width  - width))
  const ny = Math.max(wa.y, Math.min(cy, wa.y + wa.height - height))
  mainWindow.setBounds({ x: nx, y: ny, width, height })
})

ipcMain.handle('window:startDrag', () => {
  // 如果当前贴边缩入，先取消吸附让窗口完全可见
  if (snapEdge) {
    stopEdgeMonitor()
    if (slideHidden && snapBounds) {
      mainWindow.setBounds(snapBounds)
      slideHidden = false
    }
    snapEdge = null; snapBounds = null; autoHide = false
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
  // 拖拽结束后检测吸附（折叠态和展开态都支持）
  if (moved) {
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
    snapBounds = null
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
  resolveDataPaths()        // 初始化 dataPath / dbPath
  appIcon = makeAppIcon()   // 生成一次，全局复用
  await createWindow()
  createTray()

  // 应用保存的开机自启设置
  const data = loadData()
  if (data.settings.autoLaunch !== undefined) {
    app.setLoginItemSettings({ openAtLogin: !!data.settings.autoLaunch })
  }

  // 全局热键：Ctrl+Shift+F 召唤 / 隐藏窗口
  globalShortcut.register('Ctrl+Shift+F', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return
    if (mainWindow.isVisible() && mainWindow.isFocused()) {
      mainWindow.hide()
      return
    }
    // 召唤时若处于折叠态，先通知前端展开再显示
    if (isCollapsed) {
      mainWindow.webContents.send('hotkey-show')
    }
    mainWindow.show()
    mainWindow.focus()
  })

  // 每日摘要：每分钟检查是否到 9:00
  let lastSummaryDate = null
  setInterval(() => {
    const now = new Date()
    if (now.getHours() !== 9 || now.getMinutes() !== 0) return
    const today = now.toDateString()
    if (lastSummaryDate === today) return
    lastSummaryDate = today

    const d = loadData()
    if (d.settings.dailySummary === false) return

    const todayPrefix = now.toISOString().slice(0, 10)
    const active      = d.tasks.filter(t => t.status !== 'done')
    const dueToday    = active.filter(t => t.deadline?.startsWith(todayPrefix))

    if (active.length === 0) return
    const body = dueToday.length > 0
      ? `今日到期 ${dueToday.length} 个任务，共 ${active.length} 个待处理`
      : `共有 ${active.length} 个任务待处理`

    new Notification({ title: `${APP_NAME} · 每日摘要`, body, icon: appIcon, silent: false }).show()
  }, 60000)

  // 启动 5 秒后静默检测更新
  setTimeout(async () => {
    try {
      const res  = await net.fetch('https://api.github.com/repos/LiuZQ802/futurely/releases/latest',
        { headers: { 'User-Agent': 'Futurely-App' } })
      const json = await res.json()
      const latest  = (json.tag_name ?? '').replace(/^v/, '')
      const current = app.getVersion()
      if (latest.length > 0 && semverGt(latest, current) && mainWindow && !mainWindow.isDestroyed()) {
        const exeAsset   = json.assets?.find(a => a.name.endsWith('.exe'))
        const downloadUrl = exeAsset?.browser_download_url ?? json.html_url
        const { response } = await dialog.showMessageBox(mainWindow, {
          type:      'info',
          icon:      appIcon,
          buttons:   ['下载更新', '稍后'],
          defaultId: 0,
          title:     APP_NAME,
          message:   `发现新版本 v${latest}`,
          detail:    `当前版本：v${current}\n点击「下载更新」将直接下载安装包。`,
        })
        if (response === 0) shell.openExternal(downloadUrl)
      }
    } catch {}
  }, 5000)
})

app.on('will-quit', () => globalShortcut.unregisterAll())

ipcMain.handle('app:version', () => app.getVersion())

ipcMain.handle('app:setAutoLaunch', (_, enable) => {
  app.setLoginItemSettings({ openAtLogin: !!enable })
})

ipcMain.handle('dialog:selectFolder', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  })
  return canceled ? null : filePaths[0]
})

ipcMain.handle('shell:openPath', (_, p) => {
  if (!p) return
  if (process.platform === 'win32') {
    // 直接用 explorer.exe 最可靠，路径含空格时用引号包裹
    require('child_process').exec(`explorer.exe "${p}"`)
  } else {
    shell.openPath(p)
  }
})

// 语义化版本比较：a > b 返回 true
function semverGt(a, b) {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    const x = pa[i] ?? 0, y = pb[i] ?? 0
    if (x > y) return true
    if (x < y) return false
  }
  return false
}

ipcMain.handle('app:checkUpdate', async () => {
  try {
    const res  = await net.fetch('https://api.github.com/repos/LiuZQ802/futurely/releases/latest',
      { headers: { 'User-Agent': 'Futurely-App' } })
    const data = await res.json()
    const latest  = (data.tag_name ?? '').replace(/^v/, '')
    const current = app.getVersion()
    const hasUpdate  = latest.length > 0 && semverGt(latest, current)
    const exeAsset   = data.assets?.find(a => a.name.endsWith('.exe'))
    const downloadUrl = exeAsset?.browser_download_url ?? data.html_url
    return { latest, current, url: downloadUrl, hasUpdate, body: data.body ?? '' }
  } catch {
    return { error: true }
  }
})

ipcMain.handle('app:openUrl', (_, url) => shell.openExternal(url))

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
