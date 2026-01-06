# Quick Reference Commands

## 🚀 Start Everything

```powershell
# Main command - starts all services in new terminals
.\start-all.ps1
```

## 🌐 Access URLs

```
Application:          http://localhost:3000
Create Prediction:    http://localhost:3000/predictions/create
View Predictions:     http://localhost:3000/predictions
Queue Monitor:        http://localhost:3000/admin/queue
Prisma Studio:        http://localhost:5555 (run: npx prisma studio)
API Queue Stats:      http://localhost:3000/api/admin/queue-stats
```

## 🧪 Quick Tests

```powershell
# Test Redis
docker exec all-soccer-redis redis-cli ping

# Test Database
docker exec all-soccer-db psql -U postgres -d allsoccer -c "SELECT COUNT(*) as predictions FROM predictions;"

# Check TypeScript
npx tsc --noEmit

# View Docker logs
docker-compose logs -f

# Run test script
.\test-predictions.ps1
```

## 🐳 Docker Commands

```powershell
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View status
docker-compose ps

# View logs
docker-compose logs -f

# Reset everything
docker-compose down -v
docker-compose up -d

# Check specific service
docker-compose logs all-soccer-redis
docker-compose logs all-soccer-db
```

## 🔄 Database Commands

```powershell
# Run migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Open Prisma Studio
npx prisma studio

# Reset database
npx prisma migrate reset

# View schema
cat prisma/schema.prisma
```

## 👷 Worker Commands

```powershell
# Start worker
npx tsx src/workers/feedback.worker.ts

# Check queue stats via Redis
docker exec all-soccer-redis redis-cli

# Inside Redis CLI:
# > LLEN bull:predictions:waiting    # Waiting jobs
# > LLEN bull:predictions:active     # Active jobs
# > HGETALL bull:predictions:        # All job data
# > FLUSHALL                         # Clear all queues
```

## 📦 NPM Commands

```powershell
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Start production build
npm start

# Type check
npx tsc --noEmit

# Check imports
npx tsc --noEmit src/lib/queue.ts
```

## 🐛 Troubleshooting Commands

```powershell
# Kill process on port 3000
netstat -ano | findstr :3000

# Kill process on port 6379
netstat -ano | findstr :6379

# Kill process on port 5432
netstat -ano | findstr :5432

# Force kill by PID
taskkill /PID <PID> /F

# Check if Docker Desktop is running
docker ps
```

## 📊 Monitoring

```powershell
# Real-time queue monitoring
# Option 1: Via UI
http://localhost:3000/admin/queue

# Option 2: Via API
curl http://localhost:3000/api/admin/queue-stats

# Option 3: Via Redis CLI
docker exec all-soccer-redis redis-cli
> INFO stats
> DBSIZE
> MONITOR
```

## 🧹 Cleanup Commands

```powershell
# Clear Redis queue
docker exec all-soccer-redis redis-cli FLUSHALL

# Clear Next.js cache
rm -r .next

# Clear node_modules and reinstall
rm -r node_modules
npm install

# Reset everything
docker-compose down -v
docker-compose up -d
npx prisma migrate dev
npx prisma generate
```

## 📝 Create Test Prediction (Manual)

```powershell
# After signing in, use this data:

Competition:   "Premier League"
Home Team:     "Manchester United"
Away Team:     "Liverpool"
Kickoff Time:  Tomorrow (e.g., 2026-01-06 15:00)
Market:        "1X2"
Pick:          "Home Win"
Odds:          "2.50"
Reasoning:     "Man United has strong home form"
```

## 🚨 Emergency Commands

```powershell
# Hard reset - stop everything
docker-compose down -v
docker volume prune -f
docker system prune -f

# Fresh start
docker-compose up -d
npx prisma migrate dev

# Check system health
docker-compose ps
npx tsc --noEmit
```

## ✅ Verification Checklist

```powershell
# Run all checks
.\test-predictions.ps1

# Manual checks:
# ✓ Docker services running: docker-compose ps
# ✓ Redis responds: docker exec all-soccer-redis redis-cli ping
# ✓ Database works: docker exec all-soccer-db psql -U postgres -d allsoccer -c "SELECT 1"
# ✓ TypeScript OK: npx tsc --noEmit
# ✓ App loads: http://localhost:3000
# ✓ Worker starts: Terminal shows "waiting for jobs"
```

---

**Pro Tip:** Bookmark this file and the main SETUP_GUIDE.md for quick reference!
