import { NextRequest, NextResponse } from 'next/server';
import { getJob, claimNextJob, updateJob, SalesOrderJob } from '@/lib/jobStore';
import { BC_API_BASE_URL, BC_TENANT_ID, BC_ENV_NAME, COMPANY_NAME } from '@/constants';

export const runtime = 'nodejs';

let tokenCache: { token: string; expiresAt: number } | null = null;
async function getToken() {
  if (tokenCache && Date.now() < tokenCache.expiresAt - 60_000) return tokenCache.token;
  const res = await fetch(`https://login.microsoftonline.com/${BC_TENANT_ID}/oauth2/v2.0/token`, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'client_credentials', client_id: process.env.BC_CLIENT_ID || '', client_secret: process.env.BC_CLIENT_SECRET || '', scope: process.env.BC_SCOPE || 'https://api.businesscentral.dynamics.com/.default' }).toString(), cache: 'no-store',
  });
  if (!res.ok) throw new Error(`OAuth failed (${res.status})`);
  const data = await res.json();
  tokenCache = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return tokenCache.token;
}

async function postBC(path: string, body: unknown) {
  const url = `${BC_API_BASE_URL}/${BC_TENANT_ID}/${BC_ENV_NAME}/ODataV4/Company('${encodeURIComponent(COMPANY_NAME)}')/${path}`;
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${await getToken()}`, Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify(body), cache: 'no-store' });
    if (![408, 429, 502, 503, 504].includes(res.status) || attempt === 3) {
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    }
    const retryAfter = Number(res.headers.get('retry-after'));
    const delay = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : Math.min(750 * 2 ** attempt, 8000);
    await new Promise((r) => setTimeout(r, delay));
  }
  throw new Error('BC POST failed after retries');
}

async function processJob(job: SalesOrderJob) {
  const payload = job.payload;
  job.completedLineNos ??= [];
  job.attempts += 1;
  if (!job.bcHeaderId) {
    const header = await postBC('StagingHeader', { customerNo: payload.customerNo, orderDate: payload.orderDate, requestedDeliveryDate: payload.requestedDeliveryDate || null, externalDocumentNo: payload.externalDocumentNo || '', yourReference: payload.yourReference || '', locationCode: payload.locationCode || '', paymentTermsCode: payload.paymentTermsCode || '', salespersonCode: payload.salespersonCode || '', shipToName: payload.shipToName || '', shipToAddress: payload.shipToAddress || '', shipToCity: payload.shipToCity || '', shipToCountry: payload.shipToCountry || '' });
    job.bcHeaderId = header.id;
    job.bcDocumentNo = header.bcOrderNo || '';
    await updateJob(job);
  }
  for (const line of payload.lines || []) {
    if (job.completedLineNos.includes(line.lineNo)) continue;
    await postBC('StagingLine', { headerSystemId: job.bcHeaderId, lineNo: line.lineNo, itemNo: line.itemNo, description: line.description || '', quantity: line.quantity, unitPrice: line.unitPrice, discountPercent: line.discountPercent || 0, unitOfMeasureCode: line.unitOfMeasureCode || 'PCS' });
    job.completedLineNos.push(line.lineNo);
    await updateJob(job);
  }
  job.status = 'COMPLETED';
  await updateJob(job);
  return job;
}

export async function POST(req: NextRequest) {
  if (!process.env.REDIS_URL) return NextResponse.json({ error: 'REDIS_URL is required' }, { status: 503 });
  const body = await req.json().catch(() => ({}));
  const job = body.jobId ? await getJob(body.jobId) : await claimNextJob();
  if (!job) return NextResponse.json({ success: true, status: 'IDLE' });
  try {
    const completed = await processJob(job);
    return NextResponse.json({ success: true, status: completed.status, jobId: completed.jobId, orderNo: completed.bcDocumentNo });
  } catch (error: any) {
    job.error = error?.message || 'Worker failed';
    job.status = job.attempts >= 5 ? 'FAILED' : 'PENDING';
    await updateJob(job, job.status === 'PENDING');
    return NextResponse.json({ success: false, status: job.status, jobId: job.jobId, error: job.error }, { status: 500 });
  }
}
