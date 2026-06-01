/**
 * 生成 public/icon.png 和 public/icon.ico
 * 图案：翠绿圆角方块 + 白色勾选 ✓
 */
const zlib = require('zlib')
const fs   = require('fs')
const path = require('path')

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

function makePng(S) {
  const m = Math.max(1, Math.round(S * 0.03))
  const r = Math.round(S * 0.19)

  function inBg(x, y) {
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

  function inTriangle(px, py, ax, ay, bx, by, cx, cy) {
    const s1=(bx-ax)*(py-ay)-(by-ay)*(px-ax)
    const s2=(cx-bx)*(py-by)-(cy-by)*(px-bx)
    const s3=(ax-cx)*(py-cy)-(ay-cy)*(px-cx)
    return (s1>=0&&s2>=0&&s3>=0)||(s1<=0&&s2<=0&&s3<=0)
  }

  const TX = S*0.77, TY = S*0.50
  const LX = S*0.28, LYT = S*0.25, LYB = S*0.75

  const raw = Buffer.allocUnsafe(S * (1 + S * 4))
  for (let y = 0; y < S; y++) {
    raw[y * (1 + S * 4)] = 0
    for (let x = 0; x < S; x++) {
      const off = y * (1 + S * 4) + 1 + x * 4
      const a = inBg(x, y)
      if (!a) { raw[off]=raw[off+1]=raw[off+2]=raw[off+3]=0; continue }
      if (inTriangle(x+0.5, y+0.5, TX, TY, LX, LYT, LX, LYB)) {
        raw[off]=0xfb; raw[off+1]=0xbf; raw[off+2]=0x24; raw[off+3]=a  // #fbbf24 amber
      } else {
        raw[off]=0x0f; raw[off+1]=0x17; raw[off+2]=0x2a; raw[off+3]=a  // #0f172a navy
      }
    }
  }

  const ihdr = Buffer.allocUnsafe(13)
  ihdr.writeUInt32BE(S, 0); ihdr.writeUInt32BE(S, 4)
  ihdr[8]=8; ihdr[9]=6; ihdr[10]=0; ihdr[11]=0; ihdr[12]=0

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function makeIco(pngBuf) {
  const ico = Buffer.allocUnsafe(6 + 16 + pngBuf.length)
  ico.writeUInt16LE(0, 0); ico.writeUInt16LE(1, 2); ico.writeUInt16LE(1, 4)
  ico[6]=0; ico[7]=0; ico[8]=0; ico[9]=0
  ico.writeUInt16LE(1, 10); ico.writeUInt16LE(32, 12)
  ico.writeUInt32LE(pngBuf.length, 14); ico.writeUInt32LE(22, 18)
  pngBuf.copy(ico, 22)
  return ico
}

const outDir = path.join(__dirname, '..', 'public')
fs.mkdirSync(outDir, { recursive: true })
const png = makePng(256)
fs.writeFileSync(path.join(outDir, 'icon.png'), png)
fs.writeFileSync(path.join(outDir, 'icon.ico'), makeIco(png))
console.log('✓ public/icon.png  public/icon.ico  generated')
