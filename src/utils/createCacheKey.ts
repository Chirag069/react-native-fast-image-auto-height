import type { FastImageSource } from '../types/source';

/**
 * Builds a stable cache key for any image source.
 *
 * - Local assets key on their packager asset id.
 * - Remote sources key on the URI, plus a hash of the headers when present
 *   (the same URI behind different `Authorization` headers may serve
 *   different images and must not collide).
 *
 * Returns `null` for sources that cannot be identified (no `uri`), which
 * callers treat as "nothing to resolve".
 */
export function createCacheKey(source: FastImageSource): string | null {
  if (typeof source === 'number') {
    return `asset:${source}`;
  }
  if (!source.uri) {
    return null;
  }
  const { uri, headers } = source;
  if (!headers || Object.keys(headers).length === 0) {
    return uri;
  }
  return `${uri}#${hashHeaders(headers)}`;
}

/** Order-independent djb2 hash over `key:value` header pairs. */
function hashHeaders(headers: Record<string, string>): string {
  const canonical = Object.keys(headers)
    .sort()
    .map((key) => `${key}:${headers[key]}`)
    .join('\n');
  let hash = 5381;
  for (let i = 0; i < canonical.length; i++) {
    hash = ((hash << 5) + hash + canonical.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(36);
}
