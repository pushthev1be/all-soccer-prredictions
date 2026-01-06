# Soccer Predictions - Complete Setup Guide

## ✅ System Status

All services are configured and ready to run:

- **PostgreSQL**: ✅ Running on localhost:5432
- **Redis**: ✅ Running on localhost:6379
- **TypeScript**: ✅ No compilation errors
- **Environment**: ✅ All variables configured

## 🚀 Quick Start

### Option 1: Run Everything (Recommended)

```powershell
# From project root directory
.\start-all.ps1
```

This will open 3 new terminal windows:
1. **Terminal 1**: Next.js dev server (http://localhost:3000)
2. **Terminal 2**: Feedback worker (processes predictions)
3. **Main Terminal**: Shows status

### Option 2: Manual Setup

**Terminal 1 - Start services:**
```powershell
docker-compose up -d
```

**Terminal 2 - Start Next.js dev server:**
```powershell
npm run dev
```

**Terminal 3 - Start feedback worker:**
```powershell
npx tsx src/workers/feedback.worker.ts
```

## 🌐 Access Points

After starting, access these URLs:

| Service | URL | Purpose |
|---------|-----|---------|
| **Application** | http://localhost:3000 | Main web app |
| **Sign In** | http://localhost:3000/auth/signin | Authentication |
| **Create Prediction** | http://localhost:3000/predictions/create | Submit predictions |
| **View Predictions** | http://localhost:3000/predictions | See all predictions |
| **Queue Monitor** | http://localhost:3000/admin/queue | Monitor processing queue |
| **Prisma Studio** | http://localhost:5555 | Database viewer (run: `npx prisma studio`) |

## 📋 Complete Testing Flow

### Step 1: Start Everything
```powershell
.\start-all.ps1
```

### Step 2: Sign In
1. Go to http://localhost:3000
2. Click "Sign In"
3. Use your configured email credentials

### Step 3: Create a Prediction
1. Navigate to http://localhost:3000/predictions/create
2. Fill out the form:
   - **Competition**: "Premier League"
   - **Home Team**: "Manchester United"
   - **Away Team**: "Liverpool"
   - **Kickoff Time**: Select tomorrow
   - **Market**: "1X2"
   - **Pick**: "Home Win"
   - **Odds**: "2.50" (optional)
   - **Reasoning**: "Strong home form"
3. Click "Submit"

### Step 4: Watch Worker Process
1. Check the worker terminal window
2. You should see:
   ```
   🎯 Worker processing job prediction-[ID]...
   📊 Prediction found: Manchester United vs Liverpool in Premier League
   ✅ Feedback created: [feedback-id]
   🎉 Successfully processed prediction
   ```

### Step 5: View Feedback
1. Go back to http://localhost:3000/predictions
2. Find your prediction
3. Click to view AI analysis feedback

### Step 6: Check Queue Monitor
1. Go to http://localhost:3000/admin/queue
2. See real-time stats:
   - Jobs waiting
   - Jobs active
   - Jobs completed
   - Jobs failed

## 🧪 Testing Commands

### Test Redis Connection
```powershell
docker exec all-soccer-redis redis-cli ping
# Should return: PONG
```

### Test Database Connection
```powershell
docker exec all-soccer-db psql -U postgres -d allsoccer -c "SELECT COUNT(*) as predictions FROM predictions;"
```

### View Docker Logs
```powershell
docker-compose logs -f
```

### Clear Redis Queue (if needed)
```powershell
docker exec all-soccer-redis redis-cli FLUSHALL
```

### Check Queue Stats
```powershell
# Via API
curl http://localhost:3000/api/admin/queue-stats

# Via UI
http://localhost:3000/admin/queue
```

## 📁 Project Structure

```
all-soccer-predictions/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── predictions/route.ts      (Create prediction API)
│   │   │   └── admin/queue-stats/route.ts (Queue stats API)
│   │   ├── admin/queue/page.tsx          (Queue monitor UI)
│   │   └── predictions/
│   │       ├── create/page.tsx           (Create form)
│   │       └── page.tsx                  (List predictions)
│   ├── components/
│   ├── lib/
│   │   ├── queue.ts                      (BullMQ queue)
│   │   ├── ai-analyzer.ts                (AI feedback logic)
│   │   └── auth.ts                       (NextAuth config)
│   └── workers/
│       └── feedback.worker.ts            (Background worker)
├── prisma/
│   ├── schema.prisma                     (Database schema)
│   └── migrations/                       (Database versions)
├── docker-compose.yml                    (Docker services)
├── start-all.ps1                         (Quick start script)
└── test-predictions.ps1                  (Testing script)
```

## 🔧 Database Schema

The system creates these tables:

- **User**: Users and authentication
- **Prediction**: Soccer predictions submitted by users
- **Feedback**: AI analysis feedback for predictions
- **Source**: Data sources used in analysis
- **Citation**: Links between feedback and sources

## 🎯 How It Works

1. **User submits prediction** → API stores in database with "pending" status
2. **Job queued in Redis** → BullMQ adds to "predictions" queue
3. **Worker picks up job** → Starts processing
4. **AI analyzer runs** → Generates feedback (mock for now)
5. **Data stored** → Feedback, sources, citations saved
6. **Status updated** → Prediction marked as "completed"
7. **User views feedback** → Can see AI analysis on predictions page

## ⚙️ Configuration

### Environment Variables (.env)

Key variables already configured:

```env
REDIS_URL=redis://localhost:6379           # Local Redis
DATABASE_URL=...                           # Production DB
DATABASE_URL_APP=...                       # Pooler connection
NEXTAUTH_URL=http://localhost:3000         # Auth URL
NODE_ENV=development
```

## 🛑 Stopping Services

### Stop All Services
```powershell
docker-compose down
```

### Stop Specific Service
```powershell
docker-compose stop all-soccer-redis
docker-compose stop all-soccer-db
```

### Reset Everything
```powershell
# Remove all containers and volumes
docker-compose down -v

# Start fresh
docker-compose up -d
npx prisma migrate dev
```

## 🐛 Troubleshooting

### Issue: "Redis connection refused"
```powershell
# Check if Redis is running
docker-compose ps

# Start if not running
docker-compose up -d all-soccer-redis
```

### Issue: "Worker not processing jobs"
```powershell
# Check worker logs in worker terminal
# Verify Redis connection
docker exec all-soccer-redis redis-cli ping

# Clear queue and retry
docker exec all-soccer-redis redis-cli FLUSHALL
```

### Issue: "Database connection error"
```powershell
# Check database status
docker-compose ps all-soccer-db

# Run migrations
npx prisma migrate dev

# View database
npx prisma studio
```

### Issue: "TypeScript errors"
```powershell
# Check compilation
npx tsc --noEmit

# Generate Prisma client
npx prisma generate

# Clear cache and rebuild
rm -r .next node_modules
npm install
npm run build
```

## 📊 Performance Tips

1. **Queue Monitor**: Use http://localhost:3000/admin/queue to watch processing
2. **Concurrency**: Worker handles 2 concurrent jobs (configurable in worker.ts)
3. **Rate Limiting**: Max 10 jobs per second to avoid overload
4. **Retries**: Failed jobs retry 3 times with exponential backoff

## 🚀 Production Deployment

When ready for production:

1. Set `NODE_ENV=production`
2. Update `DATABASE_URL` to production database
3. Update `REDIS_URL` to production Redis
4. Set proper `NEXTAUTH_SECRET`
5. Use environment-specific `.env.production`
6. Deploy worker as separate service

## 📚 Additional Resources

- [BullMQ Documentation](https://docs.bullmq.io/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Next.js Documentation](https://nextjs.org/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/)

## 🎓 Learn More

Check the FIXES_LOG.md for detailed information about:
- Worker implementation
- Queue system setup
- Error handling
- Testing strategies

---

**Ready to start?** Run `.\start-all.ps1` and go to http://localhost:3000! ⚽
