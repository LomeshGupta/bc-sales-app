import "server-only";

import PQueue from "p-queue";
import { LRUCache } from "lru-cache";
import Redis from "ioredis";

const maxConcurrency = Math.max(1, Number(process.env.BC_MAX_CONCURRENCY || 3));

export const bcQueue = new PQueue({
  concurrency: maxConcurrency,
});

const ramCache = new LRUCache<string, any>({
  max: Number(process.env.BC_RAM_CACHE_MAX || 500),
});

let redis: Redis | null = null;
let redisInitAttempted = false;

function getRedis(): Redis | null {
  if (redisInitAttempted) {
    return redis;
  }

  redisInitAttempted = true;

  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    return null;
  }

  try {
    redis = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    });
  } catch {
    redis = null;
  }

  return redis;
}

export function cacheKey(method: string, url: string): string {
  return `bc:${method}:${url}`;
}

export async function getCached<T>(key: string): Promise<T | undefined> {
  const ram = ramCache.get(key);

  if (ram !== undefined) {
    return ram as T;
  }

  const r = getRedis();

  if (!r) {
    return undefined;
  }

  try {
    const raw = await r.get(key);

    if (!raw) {
      return undefined;
    }

    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

export async function setCached<T>(
  key: string,
  value: T,
  ttlMs: number,
): Promise<void> {
  ramCache.set(key, value, {
    ttl: ttlMs,
  });

  const r = getRedis();

  if (!r) {
    return;
  }

  try {
    await r.set(key, JSON.stringify(value), "PX", ttlMs);
  } catch {
    // Redis is optional.
    // RAM cache continues working if Redis is unavailable.
  }
}

export function invalidateBCCache(): void {
  ramCache.clear();

  const r = getRedis();

  if (!r) {
    return;
  }

  void r
    .scanStream({
      match: "bc:*",
    })
    .on("data", (keys: string[]) => {
      if (keys.length > 0) {
        void r.del(...keys);
      }
    });
}

const inflight = new Map<string, Promise<any>>();

export function dedupe<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key) as Promise<T> | undefined;

  if (existing) {
    return existing;
  }

  const promise = fn().finally(() => {
    inflight.delete(key);
  });

  inflight.set(key, promise);

  return promise;
}

export function runBC<T>(key: string, fn: () => Promise<T>): Promise<T> {
  return bcQueue.add(() => dedupe(key, fn));
}

export function ttlForPath(path: string): number {
  const p = path.toLowerCase();

  if (p.includes("velvotixitems") || p.includes("inventory")) {
    return 30_000;
  }

  if (p.includes("customer")) {
    return 10 * 60_000;
  }

  if (p.includes("location")) {
    return 30 * 60_000;
  }

  if (p.includes("paymentterm")) {
    return 30 * 60_000;
  }

  if (p.includes("/items")) {
    return 10 * 60_000;
  }

  if (p.includes("pricing") || p.includes("discount")) {
    return 90_000;
  }

  if (p.includes("salesummary") || p.includes("recentactivity")) {
    return 2 * 60_000;
  }

  return 60_000;
}
