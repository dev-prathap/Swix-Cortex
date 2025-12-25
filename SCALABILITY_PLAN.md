# Scalability Improvements Plan

## Current State
- ✅ Object storage (R2/local files)
- ✅ PostgreSQL metadata
- ✅ Agent architecture
- ⚠️ Mock data (not real queries)
- ❌ Synchronous processing
- ❌ No background jobs
- ❌ No caching

---

## Phase 1: Real Data Querying (High Priority)

### Problem
Currently returning mock data. Need to query actual CSV data.

### Solution Options

#### Option A: DuckDB (Recommended)
```typescript
import duckdb from 'duckdb'

// Fast SQL on CSV/Parquet without loading into memory
const db = new duckdb.Database(':memory:')
db.run(`SELECT * FROM read_csv_auto('${filePath}') LIMIT 10`)
```

**Pros:**
- Queries CSV directly (no import needed)
- Fast (columnar engine)
- Handles GB files easily
- SQL interface

**Cons:**
- Need to install DuckDB

#### Option B: Parquet + Apache Arrow
```typescript
import parquet from 'parquetjs'

// Convert CSV → Parquet on upload
// Query Parquet files (10x faster than CSV)
```

**Pros:**
- Extremely fast
- Small file size

**Cons:**
- Need conversion step

#### Option C: Load into PostgreSQL
```typescript
// COPY CSV into temp table per dataset
await prisma.$executeRaw`COPY dataset_${id} FROM '${path}' CSV HEADER`
```

**Pros:**
- Use existing PostgreSQL

**Cons:**
- Slow for large files
- Not designed for analytics

**Recommendation: DuckDB** → Fast, simple, perfect for analytics

---

## Phase 2: Background Jobs (Critical)

### Problem
Long operations block HTTP requests:
- Profiling: 10-60 seconds
- Cleaning: 5-30 seconds
- Analysis: 10-40 seconds

### Solution: BullMQ + Redis

```typescript
// app/api/analyst/datasets/[id]/profile/route.ts
import { profilingQueue } from '@/lib/queues'

export async function POST(req: Request) {
  const job = await profilingQueue.add('profile-dataset', {
    datasetId: id,
    userId
  })

  return NextResponse.json({
    jobId: job.id,
    status: 'processing'
  })
}

// lib/workers/profiling-worker.ts
profilingQueue.process(async (job) => {
  const { datasetId } = job.data
  await profilingAgent.profileDataset(datasetId)
})
```

**Setup:**
```bash
# Install
pnpm add bullmq ioredis

# Run Redis (for queue)
docker run -d -p 6379:6379 redis

# OR use Upstash Redis (free cloud)
```

**Benefits:**
- API responds instantly
- Jobs run in background
- Retry on failure
- Progress tracking
- Can scale to multiple workers

---

## Phase 3: Caching Layer

### Problem
Every query hits OpenAI API:
- Expensive ($$$)
- Slow (2-5 seconds)
- Rate limited

### Solution: Redis Cache

```typescript
// lib/agents/profiling-agent.ts
import redis from '@/lib/redis'

async profileDataset(datasetId: string) {
  // Check cache first
  const cached = await redis.get(`profile:${datasetId}`)
  if (cached) return JSON.parse(cached)

  // Generate
  const profile = await this.generateProfile(datasetId)

  // Cache for 24 hours
  await redis.setex(`profile:${datasetId}`, 86400, JSON.stringify(profile))

  return profile
}
```

**Cache Strategy:**
- Profile results: 24 hours
- Cleaning plans: 1 hour
- Query interpretations: 7 days (by query text hash)
- Visualizations: 7 days

**Cost Savings:**
- Without cache: 1000 queries = $50/day
- With cache (90% hit rate): 100 queries = $5/day

---

## Phase 4: Streaming File Processing

### Problem
```typescript
const buffer = Buffer.from(await file.arrayBuffer())
// 1GB file = 1GB RAM usage
```

### Solution: Stream Processing

```typescript
import { pipeline } from 'stream/promises'
import { createReadStream, createWriteStream } from 'fs'
import csv from 'csv-parser'

// Don't load full file into memory
async uploadFile(file: File) {
  const readStream = file.stream()
  const writeStream = createWriteStream(destPath)

  await pipeline(
    readStream,
    writeStream
  )
}

// Profile without loading full CSV
async profileCSV(filePath: string) {
  let rowCount = 0
  const sample: any[] = []

  await pipeline(
    createReadStream(filePath),
    csv(),
    async function* (source) {
      for await (const row of source) {
        rowCount++
        if (sample.length < 1000) sample.push(row)
        yield row
      }
    }
  )

  return { rowCount, sample }
}
```

**Benefits:**
- Constant memory usage
- Handle TB files
- Faster

---

## Phase 5: Database Optimizations

### Current Schema Issues
```prisma
model Dataset {
  fileSize BigInt // OK
  // Missing indexes!
}
```

### Add Indexes
```prisma
model Dataset {
  userId   String
  status   DatasetStatus
  uploadedAt DateTime

  @@index([userId, uploadedAt]) // Fast user dataset list
  @@index([status]) // Fast filtering
}

model Query {
  datasetId String
  userId    String
  executedAt DateTime

  @@index([datasetId, executedAt]) // Fast query history
  @@index([userId, executedAt]) // Fast user queries
}
```

---

## Phase 6: API Rate Limiting

### Problem
No rate limiting → users can spam expensive AI calls

### Solution: Rate Limiter

```typescript
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
})

export async function POST(req: Request) {
  const userId = await getUserId()
  const { success } = await ratelimit.limit(userId)

  if (!success) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  // ... rest of handler
}
```

**Limits:**
- Query API: 10/min per user
- Profile API: 5/min per user
- Upload API: 3/min per user

---

## Phase 7: Horizontal Scaling

### Load Balancer
```
User → Load Balancer → Next.js Instance 1
                     → Next.js Instance 2
                     → Next.js Instance 3
```

### Separate Worker Processes
```
Next.js API → Queue → Worker 1 (Profiling)
                   → Worker 2 (Cleaning)
                   → Worker 3 (Analysis)
```

**Deployment:**
```yaml
# docker-compose.yml
services:
  api:
    build: .
    ports: ["3000:3000"]
    replicas: 3

  worker-profiling:
    build: .
    command: npm run worker:profiling
    replicas: 2

  worker-analysis:
    build: .
    command: npm run worker:analysis
    replicas: 2

  redis:
    image: redis:alpine

  postgres:
    image: postgres:16
```

---

## Implementation Priority

### Week 1: Critical Path
1. ✅ Setup BullMQ + Redis (background jobs)
2. ✅ Integrate DuckDB (real data queries)
3. ✅ Add Redis caching (OpenAI responses)

### Week 2: Performance
4. ✅ Streaming file uploads
5. ✅ Database indexes
6. ✅ API rate limiting

### Week 3: Scale
7. ✅ Horizontal scaling setup
8. ✅ Monitoring (Sentry, DataDog)
9. ✅ Load testing

---

## Scalability Targets

| Metric | Current | Target |
|--------|---------|--------|
| Max file size | 10 MB | 1 GB |
| Concurrent users | 1 | 1,000 |
| Query latency | 5s | 500ms |
| Upload time (100MB) | 30s | 5s |
| Cost per 1000 queries | $50 | $5 |
| Profile time | 30s | 5s (async) |

---

## Quick Wins (Do First)

### 1. Add BullMQ (Biggest Impact)
```bash
pnpm add bullmq ioredis
```

### 2. Add Redis Caching
```bash
pnpm add @upstash/redis
```

### 3. Add DuckDB
```bash
pnpm add duckdb
```

### 4. Add Streaming
```bash
pnpm add csv-parser
```

**Total Setup Time: 2-3 hours**
**Performance Gain: 10-50x**

---

## Cost Analysis

### Current (Unoptimized)
- 1000 profiles/day × $0.05 = **$50/day**
- API hosting: **$20/month**
- Database: **$25/month**
- **Total: ~$1,500/month**

### After Optimization
- 1000 profiles/day × $0.005 (cached) = **$5/day**
- Background workers: **$30/month**
- Redis: **$10/month** (Upstash free tier)
- **Total: ~$200/month**

**Cost Reduction: 87%**

---

## Next Steps

**Option 1: Quick Optimization (4 hours)**
- Add Redis caching
- Add background jobs
- Deploy to Vercel

**Option 2: Full Scale (1 week)**
- Implement all phases
- DuckDB integration
- Horizontal scaling
- Load testing

**Recommendation: Start with Option 1**, then iterate to Option 2 based on usage.

