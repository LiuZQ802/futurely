const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')

const electronPath = path.join(__dirname, '..', 'node_modules', 'electron', 'dist', 'electron.exe')
const logFile = path.join(__dirname, '..', 'electron-debug.log')

// 清空上次日志
try { fs.writeFileSync(logFile, '') } catch (e) {}

function startElectron(attempt = 1) {
  console.log(`[dev] Attempt ${attempt}: spawning ${electronPath}`)

  const child = spawn(electronPath, ['.'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, ELECTRON_ENABLE_LOGGING: '1' },
    windowsHide: false,
  })

  child.stdout.on('data', d => {
    const s = d.toString()
    process.stdout.write(`[electron] ${s}`)
    fs.appendFileSync(logFile, s)
  })
  child.stderr.on('data', d => {
    const s = d.toString()
    process.stderr.write(`[electron] ${s}`)
    fs.appendFileSync(logFile, s)
  })

  child.on('error', err => {
    console.error(`[dev] spawn error: ${err.message}`)
  })

  child.on('close', (code, signal) => {
    console.log(`[dev] Electron exited code=${code} signal=${signal}`)
    if (code !== 0 && code !== null && attempt < 4) {
      console.log(`[dev] Retrying in 800ms...`)
      setTimeout(() => startElectron(attempt + 1), 800)
    } else {
      process.exit(code ?? 0)
    }
  })
}

startElectron()
