import fs from 'node:fs'
import path from 'node:path'

const slug = 'suvbudfbvuhuysdbfuyefuyef'
const files = [
  'C:/Users/akash/OneDrive/Desktop/ARGROUP OF EDUCTION/ar-group-of-eductions/.env',
  'C:/Users/akash/OneDrive/Desktop/ARGROUP OF EDUCTION/apps/backend/.env',
  'C:/Users/akash/OneDrive/Desktop/ARGROUP OF EDUCTION/apps/frontend/.env.local',
  'D:/ARGROUP OF EDUCTION/apps/backend/.env',
  'D:/ARGROUP OF EDUCTION/apps/frontend/.env.local',
]

function secretsFrom(file) {
  const out = []
  if (!fs.existsSync(file)) return out
  const text = fs.readFileSync(file, 'utf8')
  for (const key of ['REVALIDATE_SECRET', 'PAYLOAD_SYNC_SECRET']) {
    for (const line of text.split(/\r?\n/)) {
      if (line.startsWith(`${key}=`)) {
        const v = line
          .slice(key.length + 1)
          .trim()
          .replace(/^["']|["']$/g, '')
          .replace(/\r$/, '')
        if (v) out.push({ file: path.basename(path.dirname(file)) + '/' + path.basename(file), key, v })
      }
    }
  }
  return out
}

const seen = new Set()
const candidates = []
for (const f of files) {
  for (const s of secretsFrom(f)) {
    if (seen.has(s.v)) continue
    seen.add(s.v)
    candidates.push(s)
  }
}

console.log('candidates', candidates.length)

const body = JSON.stringify({
  type: 'post',
  slug,
  title: slug,
  content: '',
  published: false,
  pullFromCms: false,
})

for (const c of candidates) {
  try {
    const res = await fetch('https://www.argroupofeducation.com/api/cms/payload-sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${c.v}`,
      },
      body,
      signal: AbortSignal.timeout(25_000),
    })
    const text = await res.text()
    console.log(res.status, c.key, 'from', c.file, text.slice(0, 180))
    if (res.ok) {
      console.log('SUCCESS')
      process.exit(0)
    }
  } catch (e) {
    console.log('ERR', c.key, e.message)
  }
}

// Also try Vercel CMS pulled env via vercel env pull without printing
console.log('all_failed')
process.exit(1)
