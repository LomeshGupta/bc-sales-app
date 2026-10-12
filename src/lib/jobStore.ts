import 'server-only';
import Redis from 'ioredis';

export type JobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export interface SalesOrderJob {
  jobId: string;
  idempotencyKey: string;
  operation: 'CREATE_SALES_ORDER';
  payload: any;
  status: JobStatus;
  attempts: number;
  error?: string;
  bcHeaderId?: string;
  bcDocumentNo?: string;
  completedLineNos?: number[];
  createdAt: string;
  updatedAt: string;
}

let redis: Redis | null = null;
function getRedis() {
  if (!process.env.REDIS_URL) return null;
  if (!redis) redis = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: 1 });
  return redis;
}

export async function saveJob(job: SalesOrderJob) {
  const r = getRedis();
  if (!r) throw new Error('REDIS_URL is required for durable background jobs');
  await r.set(`bc:job:${job.jobId}`, JSON.stringify(job), 'EX', 86400);
  await r.set(`bc:idempotency:${job.idempotencyKey}`, job.jobId, 'EX', 86400);
  if (job.status === 'PENDING') await r.lpush('bc:jobs:pending', job.jobId);
}

export async function getJob(jobId: string): Promise<SalesOrderJob | null> {
  const r = getRedis();
  if (!r) return null;
  const raw = await r.get(`bc:job:${jobId}`);
  return raw ? JSON.parse(raw) as SalesOrderJob : null;
}

export async function getJobByIdempotencyKey(key: string): Promise<SalesOrderJob | null> {
  const r = getRedis();
  if (!r) return null;
  const jobId = await r.get(`bc:idempotency:${key}`);
  return jobId ? getJob(jobId) : null;
}

export async function updateJob(job: SalesOrderJob, enqueue = false) {
  const r = getRedis();
  if (!r) throw new Error('REDIS_URL is required for durable background jobs');
  job.updatedAt = new Date().toISOString();
  await r.set(`bc:job:${job.jobId}`, JSON.stringify(job), 'EX', 86400);
  if (enqueue) await r.lpush('bc:jobs:pending', job.jobId);
}

export async function claimNextJob(): Promise<SalesOrderJob | null> {
  const r = getRedis();
  if (!r) return null;
  const jobId = await r.rpop('bc:jobs:pending');
  if (!jobId) return null;
  const job = await getJob(jobId);
  if (!job || job.status === 'COMPLETED') return null;
  job.status = 'PROCESSING';
  job.updatedAt = new Date().toISOString();
  await r.set(`bc:job:${job.jobId}`, JSON.stringify(job), 'EX', 86400);
  return job;
}
