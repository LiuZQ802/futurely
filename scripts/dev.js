const { spawn } = require('child_process')
const path = require('path')

const electronPath = path.join(__dirname, '..', 'node_modules', 'electron', 'dist', 'electron.exe')
const child = spawn(electronPath, ['.'], { stdio: 'inherit', shell: false })

child.on('close', (code) => {
  process.exit(code ?? 0)
})
