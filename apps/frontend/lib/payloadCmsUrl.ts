/** Base URL for Payload (server routes prefer PAYLOAD_CMS_URL; browser uses NEXT_PUBLIC_CMS_URL). */
export function getPayloadCmsBaseUrl(): string {
  const fromEnv =
    process.env.PAYLOAD_CMS_URL?.replace(/\/$/, '') ||
    process.env.NEXT_PUBLIC_CMS_URL?.replace(/\/$/, '') ||
    '';
  return fromEnv || 'http://localhost:8000';
}

/**
 * URL used by Node/Next **server** when calling Payload (API routes, RSC fetch).
 * Replaces `localhost` with `127.0.0.1` so fetch does not prefer IPv6 (::1) on Windows
 * while Payload listens on IPv4 only — fixes ECONNREFUSED / 503 "Cannot reach CMS".
 */
export function getPayloadCmsServerFetchUrl(): string {
  const base = getPayloadCmsBaseUrl().replace(/\/$/, '');
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
