import { NextResponse } from 'next/server';
import { getHealthStatus } from '@backend/handlers/health';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const health = await getHealthStatus();
  const status = health.status === 'ok' ? 200 : 503;
  return NextResponse.json(health, { status });
}
