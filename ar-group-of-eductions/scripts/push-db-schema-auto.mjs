/**
 * Run schema push and auto-send Enter for Drizzle interactive prompts.
 */
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMS = path.resolve(__dirname, '..')

const child = spawn('npx', ['tsx', 'scripts/push-db-schema.mts'], {
  cwd: CMS,
  stdio: ['pipe', 'inherit', 'inherit'],
  env: { ...process.env, PAYLOAD_DATABASE_PUSH: 'true' },
  shell: true,
})

let sent = 0
const max = 40
const timer = setInterval(() => {
  if (sent >= max) return
  child.stdin.write('\n')
  sent += 1
}, 2500)

child.on('close', (code) => {
  clearInterval(timer)
  process.exit(code ?? 1)
})
