# 🚀 Vercel Deployment Guide - SWIX AI Data Analyst

## ✅ Build Status: SUCCESS

Your application is now ready for Vercel deployment!

---

## 📋 Pre-Deployment Checklist

### 1. Environment Variables (Required)

Add these to your Vercel project settings:

```bash
# Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-change-in-production"

# OpenAI API
OPENAI_API_KEY="sk-..."

# AWS S3 (for file storage)
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="your-bucket-name"

# Optional: App URL
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"
```

---

## 🗄️ Database Setup

### Option 1: Vercel Postgres (Recommended)

1. Go to your Vercel project
2. Navigate to **Storage** tab
3. Create a new **Postgres** database
4. Vercel will automatically add `DATABASE_URL` to your env vars

### Option 2: External PostgreSQL

Use any PostgreSQL provider:
- **Neon** (https://neon.tech) - Free tier, serverless
- **Supabase** (https://supabase.com) - Free tier, full-featured
- **Railway** (https://railway.app) - Developer-friendly
- **AWS RDS** - Enterprise-grade

---

## 📦 Deployment Steps

### Method 1: Vercel CLI (Fastest)

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow the prompts:
# - Set up and deploy? Y
# - Which scope? (select your account)
# - Link to existing project? N
# - Project name? swix-ai-analyst
# - Directory? ./
# - Override settings? N
```

### Method 2: Vercel Dashboard (Easiest)

1. Go to https://vercel.com/new
2. Import your Git repository (GitHub/GitLab/Bitbucket)
3. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: ./
   - **Build Command**: `prisma generate && next build`
   - **Install Command**: `bun install`
4. Add Environment Variables (see above)
5. Click **Deploy**

---

## 🔧 Vercel Configuration Files

### Already Created:

✅ `vercel.json` - Deployment config
```json
{
  "buildCommand": "prisma generate && next build",
  "framework": "nextjs",
  "installCommand": "bun install",
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 60
    }
  }
}
```

✅ `.vercelignore` - Files to exclude from deployment
✅ `next.config.ts` - Optimized for Vercel with DuckDB support

---

## 🗃️ Database Migration

After first deployment:

```bash
# Connect to your production database
vercel env pull .env.production

# Run migrations
DATABASE_URL="..." bunx prisma migrate deploy

# Seed initial data (optional)
DATABASE_URL="..." bunx prisma db seed
```

---

## 📊 S3/MinIO Setup for File Storage

### AWS S3 Setup:

1. Create an S3 bucket
2. Enable CORS:
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"]
  }
]
```
3. Add AWS credentials to Vercel env vars

### Alternative: Vercel Blob Storage

```bash
# Enable Vercel Blob
vercel storage create

# Update code to use @vercel/blob instead of AWS S3
```

---

## 🔍 Post-Deployment Testing

1. **Test Authentication:**
   ```
   https://your-app.vercel.app/login
   ```

2. **Test Dataset Upload:**
   ```
   https://your-app.vercel.app/analyst/upload
   ```

3. **Test AI Query:**
   ```
   https://your-app.vercel.app/analyst/datasets/[id]/query
   ```

4. **Check Logs:**
   ```bash
   vercel logs
   ```

---

## ⚡ Performance Optimizations

### Already Configured:

✅ **Server-side Rendering** - Fast initial page loads
✅ **Static Generation** - Where possible
✅ **Edge Functions** - Low latency
✅ **DuckDB External** - Native module support
✅ **API Route Timeouts** - 60s for complex queries

### Recommended:

- **Enable Vercel Analytics** for performance monitoring
- **Add Vercel Speed Insights** for Core Web Vitals
- **Use Vercel KV** for caching AI responses (future)

---

## 🐛 Troubleshooting

### Build Fails with "DATABASE_URL not found"

Add a dummy DATABASE_URL to build:
```bash
vercel env add DATABASE_URL
# Enter: postgresql://dummy:dummy@localhost:5432/dummy
```

### DuckDB Native Module Issues

Already handled! The config externalizes DuckDB:
```ts
serverExternalPackages: ['duckdb', 'duckdb-async']
```

### API Routes Timeout

Increase timeout in `vercel.json`:
```json
"functions": {
  "app/api/**/*.ts": {
    "maxDuration": 300  // 5 minutes (Pro plan)
  }
}
```

---

## 📈 Scaling Considerations

### Free Tier Limits:
- 100 GB-hours of execution
- 1000 deployments/month
- 100 GB bandwidth

### Pro Plan ($20/month):
- 1000 GB-hours
- Unlimited deployments
- 1 TB bandwidth
- 5-minute function timeout

### Enterprise:
- Custom limits
- Dedicated support
- SLA guarantees

---

## 🎯 Next Steps

1. ✅ Push code to Git
2. ⬜ Connect Vercel to your repository
3. ⬜ Add environment variables
4. ⬜ Deploy!
5. ⬜ Run database migrations
6. ⬜ Test all features
7. ⬜ Set up custom domain (optional)
8. ⬜ Enable analytics

---

## 🔗 Useful Links

- Vercel Dashboard: https://vercel.com/dashboard
- Vercel Docs: https://vercel.com/docs
- Next.js Deployment: https://nextjs.org/docs/deployment
- Prisma + Vercel: https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel

---

## 💡 Production Tips

1. **Always use connection pooling** for PostgreSQL (Prisma handles this)
2. **Enable Prisma Accelerate** for query caching ($25/month)
3. **Use Vercel Edge Config** for feature flags
4. **Monitor with Vercel Analytics** and Sentry
5. **Set up CI/CD** with GitHub Actions for tests before deploy

---

## ✨ Your Build is Ready!

```bash
# Quick deploy command:
vercel --prod
```

**Good luck with your deployment! 🚀**

