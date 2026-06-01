const { spawn } = require('child_process')
const path = require('path')

const electronPath = path.join(__dirname, '..', 'node_modules', 'electron', 'dist', 'electron.exe')

function startElectron(attempt = 1) {
  console.log(`[dev] Starting Electron (attempt ${attempt})`)

  const child = spawn(electronPath, ['.'], {
    stdio: 'inherit',
    env: process.env,
  })

  child.on('error', (err) => {
    console.error('[dev] Failed to start Electron:', err.message)
  })

  child.on('close', (code) => {
    // 任何非零退出码都重试（包括 3221225786 DLL 缺失 和 1 未捕获异常）
    if (code !== 0 && code !== null && attempt < 3) {
      console.log(`[dev] Electron exited with code ${code}, retrying in 1s...`)
      setTimeout(() => startElectron(attempt + 1), 1000)
    } else {
      process.exit(code ?? 0)
    }
  })
}

startElectron()
