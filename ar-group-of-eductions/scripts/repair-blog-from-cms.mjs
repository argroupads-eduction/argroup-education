/**
 * One-shot: pull published posts from Payload CMS REST and upsert BlogPost in Supabase.
 * Usage: node scripts/repair-blog-from-cms.mjs [slug ...]
 * Env: apps/backend/.env DATABASE_URL_UNPOOLED
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import pg from 'pg'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../apps/backend/.env') })

const CMS =
  process.env.PAYLOAD_PUBLIC_SERVER_URL?.replace(/\/$/, '') ||
  'https://argroup-education-cms-livid.vercel.app'

const slugs = process.argv.slice(2)
if (!slugs.length) {
  console.error('Usage: node repair-blog-from-cms.mjs <slug> [slug...]')
  process.exit(1)
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, '&#96;')
}
const F_BOLD = 1
const F_ITALIC = 2
const F_STRIKETHROUGH = 4
const F_UNDERLINE = 8
const F_CODE = 16

function applyTextFormat(html, format, style) {
  let out = html
  if (format & F_CODE) out = `<code>${out}</code>`
  if (format & F_BOLD) out = `<strong>${out}</strong>`
  if (format & F_ITALIC) out = `<em>${out}</em>`
  if (format & F_STRIKETHROUGH) out = `<s>${out}</s>`
  if (format & F_UNDERLINE) out = `<u>${out}</u>`
  if (style?.trim()) out = `<span style="${escapeAttr(style.trim())}">${out}</span>`
  return out
}

function mediaValueToUrl(value, baseUrl) {
  if (!value || typeof value !== 'object' || !value.url) return null
  if (/^https?:\/\//i.test(value.url)) return value.url
  const base = baseUrl.replace(/\/$/, '')
  return `${base}${value.url.startsWith('/') ? value.url : `/${value.url}`}`
}

function resolveLinkHref(fields) {
  if (!fields) return '#'
  if (fields.linkType === 'internal' && fields.doc) {
    const value = fields.doc.value
    if (value && typeof value === 'object' && value.slug) {
      const parts = value.slug.split('/').filter(Boolean).map(encodeURIComponent)
      if (fields.doc.relationTo === 'posts') return `/blog/${parts.join('/')}`
      return `/${parts.join('/')}`
    }
  }
  return (typeof fields.url === 'string' && fields.url.trim()) || '#'
}

function inlineNodesToHtml(nodes, baseUrl) {
  return nodes
    .map((n) => {
      if (!n || typeof n !== 'object') return ''
      if (n.type === 'text') {
        const raw = typeof n.text === 'string' ? n.text : ''
        if (!raw) return ''
        return applyTextFormat(escapeHtml(raw), n.format || 0, n.style || '')
      }
      if (n.type === 'link') {
        const href = resolveLinkHref(n.fields)
        const inner = Array.isArray(n.children) ? inlineNodesToHtml(n.children, baseUrl) : ''
        if (!inner) return ''
        const target = n.fields?.newTab ? ' target="_blank" rel="noopener noreferrer"' : ''
        return `<a href="${escapeAttr(href)}"${target}>${inner}</a>`
      }
      if (n.type === 'linebreak') return '<br />'
      if (n.type === 'upload' && n.value) {
        const imgUrl = mediaValueToUrl(n.value, baseUrl)
        if (!imgUrl) return ''
        const alt =
          typeof n.value === 'object' && n.value?.alt != null ? escapeAttr(String(n.value.alt)) : ''
        return `<img src="${escapeAttr(imgUrl)}" alt="${alt}" />`
      }
      if (Array.isArray(n.children)) return inlineNodesToHtml(n.children, baseUrl)
      return ''
    })
    .join('')
}

function blockToHtml(node, baseUrl) {
  const type = node.type || ''
  const children = Array.isArray(node.children) ? node.children : []
  if (type === 'paragraph') {
    const inner = inlineNodesToHtml(children, baseUrl)
    return inner.trim() ? `<p>${inner}</p>` : ''
  }
  if (type === 'heading') {
    const tag = typeof node.tag === 'string' ? node.tag : 'h2'
    const inner = inlineNodesToHtml(children, baseUrl)
    return inner.trim() ? `<${tag}>${inner}</${tag}>` : ''
  }
  if (type === 'list') {
    const items = children
      .map((li) => {
        if (!li || typeof li !== 'object') return ''
        const inner = Array.isArray(li.children) ? inlineNodesToHtml(li.children, baseUrl) : ''
        return inner.trim() ? `<li>${inner}</li>` : ''
      })
      .join('')
    if (!items) return ''
    const tag = node.listType === 'number' ? 'ol' : 'ul'
    return `<${tag}>${items}</${tag}>`
  }
  if (type === 'quote') {
    const inner = inlineNodesToHtml(children, baseUrl)
    return inner.trim() ? `<blockquote>${inner}</blockquote>` : ''
  }
  if (type === 'upload' && node.value) {
    const imgUrl = mediaValueToUrl(node.value, baseUrl)
    if (!imgUrl) return ''
    const alt =
      typeof node.value === 'object' && node.value?.alt != null ? escapeAttr(String(node.value.alt)) : ''
    return `<p><img src="${escapeAttr(imgUrl)}" alt="${alt}" /></p>`
  }
  if (type === 'horizontalrule') return '<hr />'
  if (type === 'block' && node.fields && typeof node.fields === 'object') {
    if (node.fields.blockType === 'mediaBlock' && node.fields.media) {
      const imgUrl = mediaValueToUrl(node.fields.media, baseUrl)
      if (imgUrl) return `<p><img src="${escapeAttr(imgUrl)}" alt="" /></p>`
    }
    if (node.fields.content) return lexicalToHtml({ root: node.fields.content }, baseUrl)
  }
  const fallback = inlineNodesToHtml(children, baseUrl)
  return fallback.trim() ? `<p>${fallback}</p>` : ''
}

function lexicalToHtml(value, baseUrl = CMS) {
  if (!value || typeof value !== 'object') return ''
  const root = value.root ?? value.content?.root
  const children = Array.isArray(root?.children) ? root.children : []
  if (!children.length) return ''
  return children
    .map((child) => (child && typeof child === 'object' ? blockToHtml(child, baseUrl) : ''))
    .filter(Boolean)
    .join('\n')
}

async function fetchPost(slug) {
  const url = `${CMS}/api/posts?where[slug][equals]=${encodeURIComponent(slug)}&depth=2&limit=1`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`CMS ${res.status} for ${slug}`)
  const json = await res.json()
  const doc = json.docs?.[0]
  if (!doc) throw new Error(`CMS missing post ${slug}`)
  return doc
}

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
const client = new pg.Client({
  connectionString: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})
await client.connect()

for (const slug of slugs) {
  const doc = await fetchPost(slug)
  const html = lexicalToHtml(doc.content)
  const image =
    (typeof doc.heroImage === 'object' && doc.heroImage?.url) ||
    (typeof doc.featuredImageUrl === 'string' && doc.featuredImageUrl) ||
    null
  const plain = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  const excerpt =
    (typeof doc.meta?.description === 'string' && doc.meta.description.trim()) ||
    plain.slice(0, 500)
  const title = doc.title || slug

  if (html.length < 200) {
    console.error('SKIP thin html', slug, html.length)
    continue
  }

  const existing = await client.query(`SELECT id FROM public."BlogPost" WHERE slug = $1`, [slug])
  if (existing.rowCount) {
    const r = await client.query(
      `UPDATE public."BlogPost"
       SET title=$1, content=$2, excerpt=$3, "featuredImage"=$4, "ogImage"=$4,
           published=true, "updatedAt"=NOW()
       WHERE slug=$5
       RETURNING slug, length(content) AS content_len, ("featuredImage" IS NOT NULL) AS has_img`,
      [title, html, excerpt, image, slug],
    )
    console.log('UPDATED', r.rows[0])
  } else {
    const id = `cm${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`
    const publishedAt = doc.publishedAt ? new Date(doc.publishedAt) : new Date()
    const r = await client.query(
      `INSERT INTO public."BlogPost"
         (id, title, slug, content, excerpt, "featuredImage", "ogImage", category,
          published, "publishedAt", "createdAt", "updatedAt", tags, keywords, author, views)
       VALUES
         ($1, $2, $3, $4, $5, $6, $6, 'Blog', true, $7, NOW(), NOW(), '{}', '{}', 'AR Group', 0)
       RETURNING slug, length(content) AS content_len, ("featuredImage" IS NOT NULL) AS has_img`,
      [id, title, slug, html, excerpt, image, publishedAt],
    )
    console.log('INSERTED', r.rows[0])
  }
}

await client.end()
