import { NextResponse } from 'next/server';
import { checkGoogleSheetsWebhookHealth } from '@backend/lib/googleSheetsLead';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Verify GOOGLE_SHEETS_* env + live Apps Script deployment (doGet). */
export async function GET() {
  const health = await checkGoogleSheetsWebhookHealth();
  return NextResponse.json(health, { status: health.ok ? 200 : 503 });
}
