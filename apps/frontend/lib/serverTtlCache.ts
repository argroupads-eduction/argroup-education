type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const store = new Map<string, CacheEntry<unknown>>();

/** Per-instance TTL cache — cuts repeat SSR/API work on Amplify. */
export function getTtlCache<T>(key: string): T | null {
  const hit = store.get(key);
  if (!hit) return null;
  if (Date.now() >= hit.expiresAt) {
    store.delete(key);
    return null;
  }
  return hit.value as T;
}

export function setTtlCache<T>(key: string, value: T, ttlMs: number): T {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
}

export async function withTtlCache<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>,
): Promise<T> {
  const cached = getTtlCache<T>(key);
  if (cached !== null) return cached;
  const value = await loader();
  return setTtlCache(key, value, ttlMs);
}
