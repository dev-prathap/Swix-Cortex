# AI Data Analyst Platform - Setup Guide

## Prerequisites

- Node.js 18+
- PostgreSQL database
- OpenAI API key
- MinIO (local dev) or AWS S3 (production)

## Installation

### 1. Install Dependencies

```bash
pnpm install

# Add new dependency for S3 storage
pnpm add @aws-sdk/client-s3
```

### 2. Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

**Required Variables:**
- `DATABASE_URL`: PostgreSQL connection string
- `OPENAI_API_KEY`: Your OpenAI API key
- `JWT_SECRET`: Secret key for JWT tokens (min 32 characters)
- `OBJECT_STORAGE_*`: Object storage credentials

### 3. Setup MinIO (Local Development)

Run MinIO locally using Docker:

```bash
docker run -d \
  -p 9000:9000 \
  -p 9001:9001 \
  -e "MINIO_ROOT_USER=admin" \
  -e "MINIO_ROOT_PASSWORD=password" \
  --name minio \
  minio/minio server /data --console-address ":9001"
```

Access MinIO console at http://localhost:9001

Create bucket named `swix-analyst-raw`:
1. Login with admin/password
2. Go to Buckets
3. Create New Bucket: `swix-analyst-raw`

### 4. Database Setup

```bash
# Generate Prisma client
pnpm prisma generate

# Run migrations
pnpm prisma db push

# Optional: Seed demo data
pnpm prisma db seed
```

### 5. Start Development Server

```bash
pnpm dev
```

Access the application at http://localhost:3000

## First Time Setup

1. Register a new user at `/signup`
2. Login at `/login`
3. You'll be redirected to the analyst dashboard at `/analyst`
4. Upload a CSV file to get started

## Architecture Overview

The new AI Analyst platform consists of:

### Backend (lib/)
- `storage/`: Object storage and raw data handling
- `agents/`: AI agents for profiling, cleaning, analysis, etc.
- `versioning/`: Data version management
- `query/`: Natural language query engine
- `learning/`: User preference learning system
- `datasets/`: Multi-dataset operations

### API Routes (app/api/analyst/)
- `upload/`: Raw data upload
- `datasets/`: Dataset management and operations
- `datasets/[id]/profile/`: AI profiling
- `datasets/[id]/cleaning/`: Data cleaning
- `datasets/[id]/analyze/`: Analysis generation
- `datasets/[id]/versions/`: Version history
- `query/nl/`: Natural language queries
- `reports/`: Report generation and export

### Frontend (app/analyst/)
- `/analyst`: Main dashboard (dataset list)
- `/analyst/upload`: Upload interface
- `/analyst/datasets/[id]`: Dataset details with tabs
- `/analyst/datasets/[id]/cleaning`: Cleaning UI
- `/analyst/datasets/[id]/analysis`: Analysis viewer
- `/analyst/datasets/[id]/query`: Natural language query
- `/analyst/reports`: Generated reports

## Key Features

### 1. Raw Data Upload
- No schema validation
- Streams to object storage
- Never rejects uploads
- Stores original files immutably

### 2. AI Profiling
- Detects business domain
- Identifies metrics vs dimensions
- Calculates data quality score
- Finds issues automatically

### 3. Cleaning Strategy
- Suggests fixes (never auto-cleans)
- Provides multiple options
- Explains impact
- User approval required

### 4. Data Versioning
- Every cleaning creates new version
- Rollback support
- Full history tracking
- No data loss

### 5. Semantic Layer
- Maps columns to business concepts
- Schema-independent queries
- Handles column renames
- AI-powered understanding

### 6. Analysis Agent
- Consultant-level insights
- Trend detection
- Anomaly identification
- Confidence scores

### 7. Natural Language Queries
- No SQL required
- Plain English questions
- Auto visualization
- Query history

### 8. Learning System
- Remembers user preferences
- Improves over time
- Personalized suggestions
- Pattern recognition

## Production Deployment

### Use AWS S3 Instead of MinIO

Update `.env`:
```env
OBJECT_STORAGE_ENDPOINT="https://s3.amazonaws.com"
OBJECT_STORAGE_ACCESS_KEY="your-aws-access-key"
OBJECT_STORAGE_SECRET_KEY="your-aws-secret-key"
OBJECT_STORAGE_BUCKET="your-bucket-name"
OBJECT_STORAGE_REGION="us-east-1"
```

### Recommended Infrastructure

- **Compute**: Vercel, AWS ECS, or similar
- **Database**: AWS RDS PostgreSQL or Supabase
- **Storage**: AWS S3 with versioning enabled
- **Queue**: Bull/BullMQ with Redis for background jobs
- **Monitoring**: Sentry for errors, DataDog for metrics

### Security Checklist

- [ ] Change JWT_SECRET to strong random value
- [ ] Enable HTTPS in production
- [ ] Set secure cookie flags
- [ ] Configure CORS properly
- [ ] Enable database SSL
- [ ] Set up S3 bucket policies
- [ ] Implement rate limiting
- [ ] Add audit logging

## Troubleshooting

**MinIO Connection Error:**
- Check Docker container is running: `docker ps`
- Verify endpoint in .env matches container port
- Ensure bucket exists in MinIO console

**Prisma Client Error:**
- Run `pnpm prisma generate` after schema changes
- Clear node_modules and reinstall if needed

**OpenAI API Error:**
- Verify API key is valid and has credits
- Check rate limits in OpenAI dashboard
- Ensure model name is correct (`gpt-4o`)

**Upload Fails:**
- Check file size limit (default 500MB)
- Verify object storage is accessible
- Check database connection

## Migration from Old Dashboard

The old dashboard at `/dashboard` remains functional during transition.

To redirect users to new platform:
1. Update middleware.ts to redirect `/dashboard` to `/analyst`
2. Test thoroughly
3. Archive old code

## Development Tips

- Use `pnpm prisma studio` to inspect database
- Check MinIO console for uploaded files
- Monitor OpenAI API usage dashboard
- Use `console.log` in agents for debugging
- Test with various CSV formats

## Next Steps

After setup, try:
1. Upload a sample CSV
2. Run profiling to see AI understanding
3. Review cleaning suggestions
4. Generate analysis
5. Ask natural language questions
6. Export a report

For issues or questions, refer to the main plan document or README.

