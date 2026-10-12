const MAX_CONCURRENT_BC_REQUESTS = 3;
const MAX_RETRIES = 2;
const BASE_RETRY_DELAY_MS = 500;

let activeRequests = 0;
const waiting: Array<() => void> = [];
const inflight = new Map<string, Promise<Response>>();

async function acquireSlot(): Promise<void> {
  if (activeRequests < MAX_CONCURRENT_BC_REQUESTS) {
    activeRequests += 1;
    return;
  }
  await new Promise<void>((resolve) => waiting.push(resolve));
  activeRequests += 1;
}

function releaseSlot(): void {
  activeRequests = Math.max(0, activeRequests - 1);
  waiting.shift()?.();
}

function sleep(ms: number) { return new Promise((resolve) => setTimeout(resolve, ms)); }

function retryDelay(attempt: number, response: Response) {
  const retryAfter = Number(response.headers.get('Retry-After'));
  if (Number.isFinite(retryAfter) && retryAfter > 0) return retryAfter * 1000;
  return Math.min(BASE_RETRY_DELAY_MS * 2 ** attempt, 6000) + Math.floor(Math.random() * 250);
}

function toProxyRequest(url: string): { url: string; cacheKey: string } {
  const source = new URL(url);
  const pathname = source.pathname;
  let target: 'api' | 'odata' | 'odata-root' = 'api';
  let path = pathname;

  const odataCompany = pathname.indexOf('/ODataV4/Company(');
  const odataRoot = pathname.indexOf('/ODataV4/');
  const apiCompany = pathname.indexOf('/api/v2.0/companies(');

  if (odataCompany >= 0) {
    target = 'odata';
    path = pathname.slice(odataCompany).replace(/^\/ODataV4\/Company\([^)]*\)/, '') || '/';
  } else if (odataRoot >= 0) {
    target = 'odata-root';
    path = pathname.slice(odataRoot).replace(/^\/ODataV4/, '') || '/';
  } else if (apiCompany >= 0) {
    target = 'api';
    path = pathname.slice(apiCompany).replace(/^\/api\/v2\.0\/companies\([^)]*\)/, '') || '/';
  }

  const proxy = new URL('/api/bc', window.location.origin);
  proxy.searchParams.set('path', path);
  proxy.searchParams.set('target', target);
  source.searchParams.forEach((value, key) => proxy.searchParams.append(key, value));

  return { url: proxy.toString(), cacheKey: `${target}:${path}?${source.searchParams.toString()}` };
}

/**
 * Compatibility transport. Existing services continue passing full BC URLs,
 * but requests are transparently routed through the server-side BC proxy.
 */
export async function bcFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const method = (options.method ?? 'GET').toUpperCase();
  const isGet = method === 'GET';
  const proxy = toProxyRequest(url);

  if (isGet) {
    const existing = inflight.get(proxy.cacheKey);
    if (existing) return existing.then((r) => r.clone());
  }

  const execute = async () => {
    await acquireSlot();
    try {
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
        const headers = new Headers(options.headers);
        headers.delete('Authorization');
        headers.set('Accept', 'application/json');
        if (isGet) headers.set('Data-Access-Intent', 'ReadOnly');

        const response = await fetch(proxy.url, { ...options, headers, cache: 'no-store' });
        if (![408, 429, 502, 503, 504].includes(response.status) || attempt === MAX_RETRIES) return response;
        await sleep(retryDelay(attempt, response));
      }
      throw new Error('Business Central request failed after retries');
    } finally {
      releaseSlot();
    }
  };

  if (!isGet) return execute();
  const promise = execute();
  inflight.set(proxy.cacheKey, promise);
  try { return (await promise).clone(); } finally { inflight.delete(proxy.cacheKey); }
}
