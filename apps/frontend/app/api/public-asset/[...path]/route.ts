import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { NextResponse } from 'next/server'

/** Small marketing images only — must match PUBLIC_MARKETING_ASSETS in next.config.js */
const ALLOWED_FILES = new Set([
  'ar-group-logo.png',
  'india-homepage.jpg',
  'abroad-homepage.jpg',
  'about-counsellor.png',
  'lead-mbbs-doctor.png',
])

const MIME: Record<string, string> = {
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
}

/** Explicit paths so @vercel/nft traces only these files, not all of public/. */
function assetPath(fileName: string): string | null {
  const root = process.cwd()
  switch (fileName) {
    case 'ar-group-logo.png':
      return path.join(root, 'public', 'ar-group-logo.png')
    case 'india-homepage.jpg':
      return path.join(root, 'public', 'india-homepage.jpg')
    case 'abroad-homepage.jpg':
      return path.join(root, 'public', 'abroad-homepage.jpg')
    case 'about-counsellor.png':
      return path.join(root, 'public', 'about-counsellor.png')
    case 'lead-mbbs-doctor.png':
      return path.join(root, 'public', 'lead-mbbs-doctor.png')
    default:
      return null
  }
}

/** Serve /public files when Vercel static layer omits public/ (wrong Output Directory). */
export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await context.params
  if (!segments?.length) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const fileName = segments.map((s) => path.basename(s)).join('/')
  if (!ALLOWED_FILES.has(fileName)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const filePath = assetPath(fileName)
  if (!filePath) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const data = await readFile(filePath)
    const ext = path.extname(fileName).toLowerCase()
    const contentType = MIME[ext] ?? 'application/octet-stream'
    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}
