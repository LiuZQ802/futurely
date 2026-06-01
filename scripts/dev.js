const { spawn } = require('child_process')
const path = require('path')

const electronPath = path.join(__dirname, '..', 'node_modules', 'electron', 'dist', 'electron.exe')
const child = spawn(electronPath, ['.'], { stdio: ['inherit', 'pipe', 'pipe'], shell: false })

child.stdout.on('data', (data) => process.stdout.write(data))
child.stderr.on('data', (data) => process.stderr.write(data))

child.on('close', (code) => {
  process.exit(code ?? 0)
})
