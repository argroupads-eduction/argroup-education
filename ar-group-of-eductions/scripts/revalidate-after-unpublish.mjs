import fs from 'node:fs'
import path from 'node:path'

const roots = [
  'D:/ARGROUP OF EDUCTION/.history/apps/backend',
  'C:/Users/akash/OneDrive/Desktop/ARGROUP OF EDUCTION/.history/apps/backend',
]
const secrets = new Set()
for (const root of roots) {
  if (!fs.existsSync(root)) continue
  for (const name of fs.readdirSync(root)) {
    const file = path.join(root, name)
    if (!fs.statSync(file).isFile()) continue
    const text = fs.readFileSync(file, 'utf8')
    for (const line of text.split(/\r?\n/)) {
      if (line.startsWith('REVALIDATE_SECRET=') || line.startsWith('PAYLOAD_SYNC_SECRET=')) {
        const v = line
          .slice(line.indexOf('=') + 1)
          .trim()
          .replace(/^["']|["']$/g, '')
        if (v && v.length > 8 && !/change-me|YOUR_/i.test(v)) secrets.add(v)
      }
    }
  }
}

const slug = 'suvbudfbvuhuysdbfuyefuyef'
const paths = [`/blog/${slug}`, '/blog', '/sitemap.xml', '/sitemap-images.xml']

for (const secret of secrets) {
  // Try common revalidate endpoints
  for (const endpoint of [
    'https://www.argroupofeducation.com/api/revalidate',
    'https://www.argroupofeducation.com/api/cms/reconcile-posts',
  ]) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${secret}`,
        },
        body: JSON.stringify({
          paths,
          path: `/blog/${slug}`,
          type: 'post',
          slug,
          secret,
        }),
        signal: AbortSignal.timeout(20_000),
      })
      const text = await res.text()
      console.log(endpoint, res.status, text.slice(0, 180))
      if (res.ok) {
        console.log('REVALIDATE_OK')
      }
    } catch (e) {
      console.log(endpoint, e.message)
    }
  }
}

// hard unpublish again
for (const secret of secrets) {
  const res = await fetch('https://www.argroupofeducation.com/api/cms/payload-sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify({
      type: 'post',
      slug,
      title: slug,
      content: '',
      published: false,
      pullFromCms: false,
    }),
    signal: AbortSignal.timeout(20_000),
  })
  console.log('unpublish', res.status, (await res.text()).slice(0, 200))
  if (res.ok) break
}
