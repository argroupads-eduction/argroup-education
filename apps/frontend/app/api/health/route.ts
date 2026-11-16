import { NextResponse } from 'next/server';
import { getHealthStatus } from '@backend/handlers/health';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const health = await getHealthStatus();
  // Amplify/ALB liveness — always 200; degraded state stays in JSON body.
  return NextResponse.json(health, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}
