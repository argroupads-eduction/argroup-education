/** True when Payload CMS URL is explicitly configured (not implied localhost default). */
export function isPayloadCmsConfigured(): boolean {
  const enabled = process.env.PAYLOAD_CMS_ENABLED;
  if (enabled === 'false' || enabled === '0' || enabled === 'no') return false;
  return !!(process.env.PAYLOAD_CMS_URL?.trim() || process.env.NEXT_PUBLIC_CMS_URL?.trim());
}

/**
 * Production Vercel should read blogs from Railway/Neon (Payload sync on publish), not live Payload API.
 * Set PAYLOAD_CMS_ENABLED=false on Vercel, or CONTENT_SOURCE=api (default on VERCEL).
 */
export function isBackendPrimaryContent(): boolean {
  const source = process.env.CONTENT_SOURCE?.trim().toLowerCase();
  if (source === 'api' || source === 'backend') return true;
  if (source === 'payload' || source === 'cms') return false;

  const enabled = process.env.PAYLOAD_CMS_ENABLED;
  if (enabled === 'false' || enabled === '0' || enabled === 'no') return true;

  if (process.env.VERCEL === '1') return enabled !== 'true';

  return false;
}

/** Base URL for Payload (server routes prefer PAYLOAD_CMS_URL; browser uses NEXT_PUBLIC_CMS_URL). */
export function getPayloadCmsBaseUrl(): string {
  const fromEnv =
    process.env.PAYLOAD_CMS_URL?.replace(/\/$/, '') ||
    process.env.NEXT_PUBLIC_CMS_URL?.replace(/\/$/, '') ||
    '';
  return fromEnv;
}

/**
 * URL used by Node/Next **server** when calling Payload (API routes, RSC fetch).
 * Replaces `localhost` with `127.0.0.1` so fetch does not prefer IPv6 (::1) on Windows
 * while Payload listens on IPv4 only — fixes ECONNREFUSED / 503 "Cannot reach CMS".
 */
export function getPayloadCmsServerFetchUrl(): string {
  const base = getPayloadCmsBaseUrl().replace(/\/$/, '');
  if (!base) return '';
  try {
    const u = new URL(base);
    if (u.hostname === 'localhost') {
      u.hostname = '127.0.0.1';
    }
    return u.toString().replace(/\/$/, '');
  } catch {
    return base.replace('://localhost', '://127.0.0.1');
  }
}
