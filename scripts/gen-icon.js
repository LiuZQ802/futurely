/**
 * 生成 public/icon.png 和 public/icon.ico
 * 图案：深靛蓝圆形背景 + 白色大写 F
 * 运行：node scripts/gen-icon.js
 */
const zlib = require('zlib')
const fs   = require('fs')
const path = require('path')

// ── CRC32 / PNG chunk ────────────────────────────────────────
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

// ── 字母 F 像素检测 ──────────────────────────────────────────
function isF(x, y, S) {
  const lx  = Math.round(S * 0.26)   // 左边缘
  const rx  = Math.round(S * 0.74)   // 顶部横条右边缘
  const ty  = Math.round(S * 0.20)   // 顶部
  const by  = Math.round(S * 0.80)   // 底部
  const sw  = Math.round(S * 0.13)   // 笔画宽度
  const mby = Math.round(S * 0.45)   // 中横条 y 起始
  const mbx = lx + Math.round((rx - lx) * 0.68)  // 中横条右边缘（略短）

  if (x >= lx && x < rx  && y >= ty && y < ty + sw) return true  // 顶横条
  if (x >= lx && x < lx + sw && y >= ty && y <= by) return true  // 竖笔
  if (x >= lx && x < mbx && y >= mby && y < mby + sw) return true  // 中横条
  return false
}

// ── 生成 RGBA PNG ────────────────────────────────────────────
function makePng(S) {
  const raw = Buffer.allocUnsafe(S * (1 + S * 4))
  const R = S / 2

  for (let y = 0; y < S; y++) {
    raw[y * (1 + S * 4)] = 0  // filter byte
    for (let x = 0; x < S; x++) {
      const off = y * (1 + S * 4) + 1 + x * 4
      const dx  = x - R + 0.5
      const dy  = y - R + 0.5
      const r   = Math.sqrt(dx * dx + dy * dy)

      if (r > R + 0.5) {
        raw[off] = raw[off+1] = raw[off+2] = raw[off+3] = 0
        continue
      }
      const alpha = r > R - 0.5 ? Math.round((R + 0.5 - r) * 255) : 255

      if (isF(x, y, S)) {
        raw[off] = 0xff; raw[off+1] = 0xff; raw[off+2] = 0xff; raw[off+3] = alpha
      } else {
        // 深靛蓝 #312e81
        raw[off] = 0x31; raw[off+1] = 0x2e; raw[off+2] = 0x81; raw[off+3] = alpha
      }
    }
  }

  const ihdr = Buffer.allocUnsafe(13)
  ihdr.writeUInt32BE(S, 0); ihdr.writeUInt32BE(S, 4)
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// ── 将 PNG 包装成 ICO（Windows Vista+ 支持 PNG-inside-ICO）──
function makeIco(pngBuf) {
  const ico = Buffer.allocUnsafe(6 + 16 + pngBuf.length)
  ico.writeUInt16LE(0, 0)               // reserved
  ico.writeUInt16LE(1, 2)               // type: 1 = icon
  ico.writeUInt16LE(1, 4)               // count: 1
  ico[6]  = 0                           // width  (0 = 256)
  ico[7]  = 0                           // height (0 = 256)
  ico[8]  = 0                           // colorCount
  ico[9]  = 0                           // reserved
  ico.writeUInt16LE(1,  10)             // planes
  ico.writeUInt16LE(32, 12)             // bitCount
  ico.writeUInt32LE(pngBuf.length, 14) // bytesInRes
  ico.writeUInt32LE(22, 18)            // imageOffset
  pngBuf.copy(ico, 22)
  return ico
}

// ── 输出 ─────────────────────────────────────────────────────
const outDir = path.join(__dirname, '..', 'public')
fs.mkdirSync(outDir, { recursive: true })

const png = makePng(256)
fs.writeFileSync(path.join(outDir, 'icon.png'), png)
fs.writeFileSync(path.join(outDir, 'icon.ico'), makeIco(png))
console.log('✓ public/icon.png  public/icon.ico  generated')
