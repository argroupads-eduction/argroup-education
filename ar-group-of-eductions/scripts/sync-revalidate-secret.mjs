import fs from 'node:fs'

const cmsEnv = 'C:/Users/akash/OneDrive/Desktop/ARGROUP OF EDUCTION/ar-group-of-eductions/.env'
const targets = [
  'D:/ARGROUP OF EDUCTION/apps/backend/.env',
  'D:/ARGROUP OF EDUCTION/apps/frontend/.env.local',
  'C:/Users/akash/OneDrive/Desktop/ARGROUP OF EDUCTION/apps/backend/.env',
  'C:/Users/akash/OneDrive/Desktop/ARGROUP OF EDUCTION/apps/frontend/.env.local',
]

function readSecret(file) {
  const text = fs.readFileSync(file, 'utf8')
  for (const key of ['REVALIDATE_SECRET', 'PAYLOAD_SYNC_SECRET']) {
    for (const line of text.split(/\r?\n/)) {
      if (line.startsWith(`${key}=`)) {
        return line
          .slice(key.length + 1)
          .trim()
          .replace(/^["']|["']$/g, '')
          .replace(/\r$/, '')
      }
    }
  }
  return ''
}

function upsert(file, key, value) {
  let text = ''
  try {
    text = fs.readFileSync(file, 'utf8')
  } catch {
    text = ''
  }
  const lines = text.split(/\r?\n/)
  let found = false
  const out = lines.map((line) => {
    if (line.startsWith(`${key}=`)) {
      found = true
      return `${key}=${value}`
    }
    return line
  })
  if (!found) out.push(`${key}=${value}`)
  fs.mkdirSync(pathDir(file), { recursive: true })
  fs.writeFileSync(file, `${out.filter(Boolean).join('\n').replace(/\n+$/, '')}\n`)
}

function pathDir(file) {
  return file.replace(/[/\\][^/\\]+$/, '')
}

const secret = readSecret(cmsEnv)
if (!secret) {
  console.error('cms_secret_missing')
  process.exit(1)
}

for (const t of targets) {
  try {
    upsert(t, 'REVALIDATE_SECRET', secret)
    upsert(t, 'PAYLOAD_SYNC_SECRET', secret)
    console.log('updated', t)
  } catch (e) {
    console.log('skip', t, e.message)
  }
}
console.log('secret_len', secret.length)
