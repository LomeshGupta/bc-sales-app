import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomUUID } from 'crypto';
import { getJobByIdempotencyKey, saveJob, SalesOrderJob } from '@/lib/jobStore';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  if (!process.env.REDIS_URL) {
    return NextResponse.json({ error: 'Durable job processing requires REDIS_URL' }, { status: 503 });
  }

  const payload = await req.json();
  const supplied = req.headers.get('Idempotency-Key');
  const idempotencyKey = supplied || createHash('sha256').update(JSON.stringify(payload)).digest('hex');

  const existing = await getJobByIdempotencyKey(idempotencyKey);
  if (existing) {
    return NextResponse.json({ success: true, status: existing.status, jobId: existing.jobId });
  }

  const now = new Date().toISOString();
  const job: SalesOrderJob = {
    jobId: randomUUID(),
    idempotencyKey,
    operation: 'CREATE_SALES_ORDER',
    payload,
    status: 'PENDING',
    attempts: 0,
    createdAt: now,
    updatedAt: now,
  };
  await saveJob(job);

  return NextResponse.json({ success: true, status: 'PENDING', jobId: job.jobId }, { status: 202 });
}
