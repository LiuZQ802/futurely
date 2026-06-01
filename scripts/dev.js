const { spawn } = require('child_process')
const path = require('path')

const electronPath = path.join(__dirname, '..', 'node_modules', 'electron', 'dist', 'electron.exe')
console.log('[dev] Starting Electron:', electronPath)

const child = spawn(electronPath, ['.'], { stdio: ['inherit', 'pipe', 'pipe'], shell: false })

child.stdout.on('data', (data) => process.stdout.write(data))
child.stderr.on('data', (data) => process.stderr.write(data))

child.on('error', (err) => {
  console.error('[dev] Failed to start Electron:', err.message)
})

child.on('close', (code) => {
  console.log('[dev] Electron exited with code', code)
  process.exit(code ?? 0)
})
