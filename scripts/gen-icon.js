const fs = require('fs')
const path = require('path')

const publicDir = path.join(__dirname, '..', 'public')
const sourcePath = path.join(publicDir, 'icon-source.png')
const pngPath = path.join(publicDir, 'icon.png')
const icoPath = path.join(publicDir, 'icon.ico')

function assertPng(buffer, filePath) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  if (buffer.length < 24 || !buffer.subarray(0, 8).equals(signature)) {
    throw new Error(`${filePath} is not a PNG file`)
  }
}

function readPngSize(buffer) {
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  }
}

function makeIco(pngBuffer) {
  const ico = Buffer.allocUnsafe(6 + 16 + pngBuffer.length)

  ico.writeUInt16LE(0, 0)
  ico.writeUInt16LE(1, 2)
  ico.writeUInt16LE(1, 4)

  ico[6] = 0
  ico[7] = 0
  ico[8] = 0
  ico[9] = 0
  ico.writeUInt16LE(1, 10)
  ico.writeUInt16LE(32, 12)
  ico.writeUInt32LE(pngBuffer.length, 14)
  ico.writeUInt32LE(22, 18)

  pngBuffer.copy(ico, 22)
  return ico
}

fs.mkdirSync(publicDir, { recursive: true })

if (!fs.existsSync(sourcePath)) {
  throw new Error(`Missing ${sourcePath}. Put the app icon source PNG there first.`)
}

const png = fs.readFileSync(sourcePath)
assertPng(png, sourcePath)

const size = readPngSize(png)
if (size.width !== 256 || size.height !== 256) {
  throw new Error(`icon-source.png must be 256x256. Current size is ${size.width}x${size.height}.`)
}

fs.copyFileSync(sourcePath, pngPath)
fs.writeFileSync(icoPath, makeIco(png))

console.log('public/icon.png and public/icon.ico generated from public/icon-source.png')
