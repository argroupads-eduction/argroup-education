import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { NextResponse } from 'next/server'

const MIME: Record<string, string> = {
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
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
  const publicRoot = path.join(process.cwd(), 'public')
  const filePath = path.join(publicRoot, fileName)

  if (!filePath.startsWith(publicRoot + path.sep) && filePath !== publicRoot) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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
