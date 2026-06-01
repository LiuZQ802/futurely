const { spawn } = require('child_process')
const path = require('path')

const electronPath = path.join(__dirname, '..', 'node_modules', 'electron', 'dist', 'electron.exe')

function startElectron(attempt = 1) {
  console.log(`[dev] Starting Electron (attempt ${attempt}):`, electronPath)

  const child = spawn(electronPath, ['.'], {
    stdio: 'inherit',
    env: process.env,
  })

  child.on('error', (err) => {
    console.error('[dev] Failed to start Electron:', err.message)
  })

  child.on('close', (code) => {
    console.log('[dev] Electron exited with code', code)
    // 3221225786 = STATUS_DLL_NOT_FOUND，Windows 首次加载 DLL 偶发失败，重试即可
    if (code === 3221225786 && attempt < 3) {
      console.log('[dev] Retrying in 1 second...')
      setTimeout(() => startElectron(attempt + 1), 1000)
    } else {
      process.exit(code ?? 0)
    }
  })
}

startElectron()
