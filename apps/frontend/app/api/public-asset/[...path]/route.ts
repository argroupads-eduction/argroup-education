import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { NextResponse } from 'next/server'

/** Small marketing images only — must match PUBLIC_MARKETING_ASSETS in next.config.js */
const ALLOWED_FILES = new Set([
  'ar-group-logo.png',
  'ar-group-logo.webp',
  'india-homepage.jpg',
  'india-homepage.webp',
  'abroad-homepage.jpg',
  'abroad-homepage.webp',
  'about-counsellor.png',
  'lead-mbbs-doctor.png',
  'medical-admission-counselling-hero.png',
  'hero-banner-aug4.webp',
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

/** Try cwd + common Amplify/Next traced locations for bundled public files. */
function candidatePaths(fileName: string): string[] {
  const roots = [
    process.cwd(),
    path.join(process.cwd(), 'apps', 'frontend'),
    path.join(process.cwd(), '..'),
    path.join(process.cwd(), '../..'),
  ]
  const out: string[] = []
  for (const root of roots) {
    out.push(path.join(root, 'public', fileName))
    out.push(path.join(root, '.next', 'server', 'app', 'api', 'public-asset', fileName))
  }
  return out
}

/** Serve /public files when static layer omits public/ (wrong Output Directory / cold miss). */
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

  const ext = path.extname(fileName).toLowerCase()
  const contentType = MIME[ext] ?? 'application/octet-stream'

  for (const filePath of candidatePaths(fileName)) {
    try {
      const data = await readFile(filePath)
      return new NextResponse(data, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      })
    } catch {
      /* try next path */
    }
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}
