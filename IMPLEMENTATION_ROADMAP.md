# AI Data Analyst Platform - Implementation Roadmap

## 🎯 Current Status (MVP Complete!)

### ✅ Phase 1: Foundation & Core Agents (DONE)
- [x] Database schema with all models
- [x] Object storage (R2/local fallback)
- [x] Raw data upload with versioning
- [x] AI Profiling Agent
- [x] AI Cleaning Strategy Agent
- [x] Data Versioning System
- [x] Semantic Mapping Agent
- [x] Analysis Agent
- [x] Visualization Agent
- [x] Report Generation Agent

### ✅ Phase 2: Frontend & UX (DONE)
- [x] Upload interface
- [x] Dataset overview page
- [x] Cleaning approval interface
- [x] Analysis dashboard
- [x] Natural language query interface
- [x] Chart rendering (Recharts)
- [x] Report viewer

### ✅ Bug Fixes (DONE)
- [x] BigInt serialization fixed
- [x] Cloudflare R2 SSL issues resolved (local storage fallback)
- [x] Chart visualization rendering
- [x] Cleaning page errors fixed

---

## 📋 Next: Phase 3 - Production Ready

### Week 1: Real Data & Performance (Critical Path)

#### Day 1-2: DuckDB Integration
**Goal:** Query actual CSV data instead of mock data

```bash
# Install
pnpm add duckdb @types/duckdb
```

**Files to Create:**
1. `lib/data/duckdb-engine.ts` - Query engine
2. `lib/data/csv-parser.ts` - CSV parsing utilities
3. Update `lib/query/nl-query-engine.ts` - Use real data

**Implementation:**
```typescript
// lib/data/duckdb-engine.ts
import duckdb from 'duckdb'
import { ObjectStorage } from '@/lib/storage/object-storage'

export class DuckDBEngine {
  async queryCSV(filePath: string, query: string) {
    const db = new duckdb.Database(':memory:')
    
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT * FROM read_csv_auto('${filePath}')
        ${query}
      `, (err, result) => {
        if (err) reject(err)
        else resolve(result)
      })
    })
  }

  async getTopN(filePath: string, column: string, n: number) {
    return this.queryCSV(filePath, `
      ORDER BY "${column}" DESC
      LIMIT ${n}
    `)
  }

  async getAggregate(filePath: string, metric: string, dimension: string) {
    return this.queryCSV(filePath, `
      SELECT "${dimension}", SUM("${metric}") as total
      GROUP BY "${dimension}"
      ORDER BY total DESC
    `)
  }
}
```

**Update `nl-query-engine.ts`:**
```typescript
import { DuckDBEngine } from '@/lib/data/duckdb-engine'

async executeQuery(datasetId: string, userId: string, query: string) {
  // ... existing code ...

  // Get file path from dataset
  const filePath = await this.getLocalFilePath(dataset.rawFileLocation)

  // Execute real query with DuckDB
  const duckdb = new DuckDBEngine()
  const realData = await duckdb.executeInterpretation(filePath, interpretation)

  return {
    query,
    interpretation,
    visualization: vizConfig,
    data: realData, // REAL DATA NOW!
    explanation: this.generateExplanation(interpretation, query)
  }
}
```

**Testing:**
- Upload sample CSV
- Ask: "What are top 5 items by revenue?"
- Verify real data appears in chart

**Time Estimate:** 8 hours

---

#### Day 3-4: Background Jobs (BullMQ)
**Goal:** Long operations don't block API requests

```bash
# Install
pnpm add bullmq ioredis
```

**Setup Redis:**
```bash
# Option 1: Local (Docker)
docker run -d -p 6379:6379 redis:alpine

# Option 2: Upstash (Free cloud)
# Sign up at upstash.com, create Redis database
```

**Files to Create:**
1. `lib/queues/index.ts` - Queue definitions
2. `lib/workers/profiling-worker.ts` - Profiling job processor
3. `lib/workers/cleaning-worker.ts` - Cleaning job processor
4. `lib/workers/analysis-worker.ts` - Analysis job processor
5. Update API routes to use queues

**Implementation:**

```typescript
// lib/queues/index.ts
import { Queue } from 'bullmq'
import { Redis } from 'ioredis'

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

export const profilingQueue = new Queue('profiling', { connection })
export const cleaningQueue = new Queue('cleaning', { connection })
export const analysisQueue = new Queue('analysis', { connection })
```

```typescript
// lib/workers/profiling-worker.ts
import { Worker } from 'bullmq'
import { profilingQueue } from '@/lib/queues'
import { ProfilingAgent } from '@/lib/agents/profiling-agent'

const worker = new Worker('profiling', async (job) => {
  const { datasetId } = job.data
  const agent = new ProfilingAgent()
  
  // Update progress
  await job.updateProgress(10)
  
  const profile = await agent.profileDataset(datasetId)
  
  await job.updateProgress(100)
  return profile
})

worker.on('completed', (job) => {
  console.log(`[Worker] Profiling job ${job.id} completed`)
})

worker.on('failed', (job, err) => {
  console.error(`[Worker] Profiling job ${job?.id} failed:`, err)
})
```

```typescript
// app/api/analyst/datasets/[id]/profile/route.ts (Updated)
import { profilingQueue } from '@/lib/queues'

export async function POST(req: Request, { params }: any) {
  const { id } = await params
  
  // Add to queue (instant response)
  const job = await profilingQueue.add('profile-dataset', {
    datasetId: id,
    userId: await getUserId()
  })

  return NextResponse.json({
    jobId: job.id,
    status: 'processing',
    message: 'Profiling started in background'
  }, { status: 202 }) // 202 Accepted
}

// New endpoint to check job status
export async function GET(req: Request, { params }: any) {
  const { id } = await params
  const { searchParams } = new URL(req.url)
  const jobId = searchParams.get('jobId')

  if (jobId) {
    const job = await profilingQueue.getJob(jobId)
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    const state = await job.getState()
    const progress = job.progress

    return NextResponse.json({
      jobId,
      state, // 'active', 'completed', 'failed'
      progress,
      result: state === 'completed' ? job.returnvalue : null
    })
  }

  // Return latest profile
  // ... existing code ...
}
```

**Frontend Update (Polling):**
```typescript
// app/analyst/datasets/[id]/page.tsx
async function startProfiling() {
  const res = await fetch(`/api/analyst/datasets/${id}/profile`, {
    method: 'POST'
  })
  const { jobId } = await res.json()

  // Poll for status
  const interval = setInterval(async () => {
    const statusRes = await fetch(`/api/analyst/datasets/${id}/profile?jobId=${jobId}`)
    const status = await statusRes.json()

    if (status.state === 'completed') {
      clearInterval(interval)
      setProfile(status.result)
    } else if (status.state === 'failed') {
      clearInterval(interval)
      alert('Profiling failed')
    } else {
      setProgress(status.progress)
    }
  }, 2000) // Poll every 2 seconds
}
```

**Add Worker Scripts:**
```json
// package.json
{
  "scripts": {
    "worker:profiling": "tsx lib/workers/profiling-worker.ts",
    "worker:cleaning": "tsx lib/workers/cleaning-worker.ts",
    "worker:analysis": "tsx lib/workers/analysis-worker.ts",
    "workers": "concurrently \"npm run worker:profiling\" \"npm run worker:cleaning\" \"npm run worker:analysis\""
  }
}
```

```bash
# Install concurrently
pnpm add -D concurrently tsx
```

**Testing:**
- Start Redis
- Start workers: `pnpm workers`
- Start dev server: `pnpm dev`
- Upload dataset and profile
- Verify API returns instantly
- Check worker logs for processing

**Time Estimate:** 10 hours

---

#### Day 5: Redis Caching
**Goal:** Reduce OpenAI API costs by 90%

```bash
# Install
pnpm add @upstash/redis
```

**Implementation:**

```typescript
// lib/cache/redis.ts
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
})

export async function getCached<T>(key: string): Promise<T | null> {
  const cached = await redis.get(key)
  return cached as T | null
}

export async function setCache(key: string, value: any, ttl: number) {
  await redis.setex(key, ttl, JSON.stringify(value))
}

export async function hashKey(...parts: string[]): Promise<string> {
  const crypto = require('crypto')
  return crypto
    .createHash('sha256')
    .update(parts.join(':'))
    .digest('hex')
}
```

```typescript
// lib/agents/profiling-agent.ts (Updated)
import { getCached, setCache, hashKey } from '@/lib/cache/redis'

async profileDataset(datasetId: string) {
  // Check cache
  const cacheKey = await hashKey('profile', datasetId)
  const cached = await getCached(cacheKey)
  if (cached) {
    console.log('[Cache HIT] Profile for', datasetId)
    return cached
  }

  console.log('[Cache MISS] Generating profile for', datasetId)
  
  // Generate (hits OpenAI API)
  const profile = await this.generateProfile(datasetId)

  // Cache for 24 hours
  await setCache(cacheKey, profile, 86400)

  return profile
}
```

**Apply to All Agents:**
- Profiling Agent: 24 hours
- Cleaning Agent: 6 hours
- Analysis Agent: 12 hours
- NL Query Engine: 7 days (by query text hash)

**Cost Impact:**
- Before: 1000 profiles = $50
- After (90% cache hit): 100 profiles = $5
- **Savings: $45/day = $1,350/month**

**Time Estimate:** 4 hours

---

### Week 2: Database & Performance

#### Day 6: Database Indexes
**Goal:** Fast queries on large datasets

```prisma
// prisma/schema.prisma (Add indexes)

model Dataset {
  id             String   @id @default(cuid())
  userId         String
  name           String
  status         DatasetStatus
  uploadedAt     DateTime @default(now())
  
  // ... existing fields ...

  @@index([userId, uploadedAt(sort: Desc)]) // Fast: user's recent datasets
  @@index([userId, status]) // Fast: filter by status
  @@index([status]) // Fast: admin queries
}

model Query {
  id           String   @id @default(cuid())
  datasetId    String
  userId       String
  executedAt   DateTime @default(now())
  
  // ... existing fields ...

  @@index([datasetId, executedAt(sort: Desc)]) // Fast: dataset query history
  @@index([userId, executedAt(sort: Desc)]) // Fast: user query history
}

model DatasetVersion {
  id            String @id @default(cuid())
  datasetId     String
  versionNumber Int
  versionType   VersionType
  createdAt     DateTime @default(now())
  
  // ... existing fields ...

  @@index([datasetId, versionNumber(sort: Desc)]) // Fast: get latest version
  @@unique([datasetId, versionNumber]) // Prevent duplicate versions
}

model Analysis {
  id          String @id @default(cuid())
  datasetId   String
  generatedAt DateTime @default(now())
  
  // ... existing fields ...

  @@index([datasetId, generatedAt(sort: Desc)]) // Fast: latest analysis
}
```

**Apply Migration:**
```bash
pnpm prisma db push
```

**Time Estimate:** 2 hours

---

#### Day 7: Streaming File Uploads
**Goal:** Handle large files without memory issues

```typescript
// lib/storage/streaming-uploader.ts
import { pipeline } from 'stream/promises'
import { createWriteStream } from 'fs'
import { ObjectStorage } from './object-storage'

export class StreamingUploader {
  async uploadLargeFile(
    file: File,
    datasetId: string,
    fileName: string
  ): Promise<string> {
    const storage = new ObjectStorage()
    const tempPath = `/tmp/${datasetId}-${fileName}`

    // Stream to temp file (no memory spike)
    const writeStream = createWriteStream(tempPath)
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    await new Promise((resolve, reject) => {
      writeStream.write(buffer, (err) => {
        if (err) reject(err)
        else {
          writeStream.end()
          resolve(null)
        }
      })
    })

    // Upload to object storage
    const key = await storage.uploadRaw(
      await fs.readFile(tempPath),
      datasetId,
      fileName
    )

    // Cleanup
    await fs.unlink(tempPath)

    return key
  }

  async streamCSVSample(filePath: string, limit: number = 1000) {
    const csv = require('csv-parser')
    const rows: any[] = []

    await pipeline(
      fs.createReadStream(filePath),
      csv(),
      async function* (source) {
        for await (const row of source) {
          if (rows.length < limit) rows.push(row)
          else break
          yield row
        }
      }
    )

    return rows
  }
}
```

**Time Estimate:** 4 hours

---

#### Day 8: API Rate Limiting
**Goal:** Prevent abuse and manage costs

```bash
pnpm add @upstash/ratelimit
```

```typescript
// lib/middleware/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
})

export const queryRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 per minute
  analytics: true,
})

export const uploadRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '1 m'), // 3 per minute
})

export const profileRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'), // 5 per minute
})
```

```typescript
// app/api/analyst/query/nl/route.ts (Updated)
import { queryRateLimit } from '@/lib/middleware/rate-limit'

export async function POST(req: Request) {
  const userId = await getUserId()
  
  // Check rate limit
  const { success, remaining } = await queryRateLimit.limit(userId)
  
  if (!success) {
    return NextResponse.json({
      error: 'Rate limit exceeded. Try again in 1 minute.',
      remaining: 0
    }, { status: 429 })
  }

  // ... rest of handler ...

  return NextResponse.json({
    // ... response ...
    rateLimit: { remaining }
  })
}
```

**Time Estimate:** 3 hours

---

### Week 3: Polish & Deploy

#### Day 9-10: Testing
- Unit tests for agents
- Integration tests for API routes
- E2E tests for critical flows
- Load testing with k6

**Time Estimate:** 10 hours

---

#### Day 11-12: Deployment

**Setup:**

1. **Vercel Deployment**
```bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy
vercel --prod
```

2. **Environment Variables (Vercel Dashboard)**
```env
# Database
DATABASE_URL=postgresql://...

# OpenAI
OPENAI_API_KEY=sk-...

# Redis/Upstash
UPSTASH_REDIS_URL=https://...
UPSTASH_REDIS_TOKEN=...

# Object Storage
USE_LOCAL_STORAGE=false
OBJECT_STORAGE_ENDPOINT=https://...
OBJECT_STORAGE_ACCESS_KEY=...
OBJECT_STORAGE_SECRET_KEY=...
OBJECT_STORAGE_BUCKET=...

# JWT
JWT_SECRET=...
```

3. **Worker Deployment (Separate Service)**
```bash
# Option 1: Railway.app
railway up

# Option 2: Render.com
# Deploy as background worker

# Option 3: DigitalOcean App Platform
# Add worker component
```

4. **Monitoring Setup**
```bash
pnpm add @sentry/nextjs
pnpm add @vercel/analytics
```

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
})
```

**Time Estimate:** 12 hours

---

## 📊 Success Metrics

After Phase 3 implementation:

| Metric | Before | After | Target |
|--------|--------|-------|--------|
| API Response Time | 5-30s | <500ms | ✅ |
| Max File Size | 10MB | 1GB | ✅ |
| OpenAI Cost (1000 req) | $50 | $5 | ✅ |
| Concurrent Users | 1 | 100+ | ✅ |
| Upload Time (100MB) | 30s | 10s | ✅ |
| Query Latency | 5s | 1s | ✅ |

---

## 💰 Cost Breakdown (After Optimization)

### Development/Staging
- Neon PostgreSQL: **Free tier**
- Upstash Redis: **Free tier** (10K commands/day)
- Cloudflare R2: **Free tier** (10GB)
- Vercel: **Free tier**
- OpenAI: **$20-50/month** (with caching)
- **Total: ~$20-50/month**

### Production (1000 users)
- Neon PostgreSQL: **$19/month**
- Upstash Redis: **$10/month** (100K commands/day)
- Cloudflare R2: **$5/month** (100GB)
- Vercel Pro: **$20/month**
- Railway (Workers): **$10/month**
- OpenAI: **$150/month** (90% cached)
- **Total: ~$214/month**

---

## 🚀 Quick Start Commands

### Development
```bash
# Start Redis
docker run -d -p 6379:6379 redis:alpine

# Start workers
pnpm workers

# Start dev server
pnpm dev
```

### Production
```bash
# Deploy API
vercel --prod

# Deploy workers
railway up
```

---

## 📝 Next Steps

1. **Week 1**: DuckDB + BullMQ + Redis (Critical)
2. **Week 2**: Indexes + Streaming + Rate Limiting
3. **Week 3**: Testing + Deployment

**Ready to start?** Begin with Day 1: DuckDB Integration! 🎯

