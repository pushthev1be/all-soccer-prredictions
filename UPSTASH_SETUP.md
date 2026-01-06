# 🚀 Quick Start Guide

## Upstash Redis + BullMQ Queue System

Your app now uses **Upstash Redis** (cloud) for the job queue system. No Docker required!

---

## ✅ Verified Working
- ✅ Upstash Redis connection tested
- ✅ BullMQ compatibility confirmed
- ✅ TLS encryption enabled
- ✅ Queue operations functional

---

## 📋 How to Run

### Option 1: Full Queue Mode (Recommended)

**Terminal 1 - Next.js App:**
```powershell
npm run dev
```

**Terminal 2 - Background Worker:**
```powershell
npm run worker
```

**What happens:**
1. User creates prediction → API queues job to Upstash
2. Worker picks up job from Upstash
3. Worker runs AI analysis
4. Worker saves feedback and updates status to `completed`
5. Detail page auto-refreshes and shows feedback

---

### Option 2: Dev Sync Mode (No worker needed)

**Update `.env`:**
```env
DEV_ANALYZE_SYNC=1
```

**Run:**
```powershell
npm run dev
```

**What happens:**
1. User creates prediction → API analyzes immediately (synchronous)
2. Status goes straight to `completed` with feedback
3. No queue, no worker needed

---

## 🧪 Test Everything

### 1. Test Redis Connection
```powershell
node test-upstash.js
```
Expected output:
```
✅ Connected to Redis
✅ Value retrieved: Hello Upstash!
✅ Job added to queue
✅ All tests passed! (2/2)
```

### 2. Create a Prediction
1. Go to http://localhost:3000/predictions/create
2. Fill in the form:
   - Competition: Premier League
   - Home: Chelsea
   - Away: Manchester City
   - Market: 1X2
   - Pick: Home
   - Reasoning: "Chelsea strong at home..."
3. Submit

### 3. Watch Processing
**In worker terminal, you should see:**
```
🎯 Worker processing job prediction-xxx...
📊 Prediction: Chelsea vs Manchester City in Premier League
✅ Feedback created: yyy
🎉 Successfully processed prediction xxx
✅ Job prediction-xxx completed successfully
```

**In browser:**
- Detail page auto-refreshes every 3s
- Status changes: Pending → Processing → Ready
- AI feedback appears automatically

---

## 🔍 Troubleshooting

### Redis Connection Errors
**If you see:** `ECONNREFUSED` or similar

**Solution:**
```powershell
# Test the connection
node test-upstash.js

# Check .env has the correct URL
# Should start with: rediss://default:AW1n...
```

### Worker Not Processing
**If predictions stay pending:**

1. Check worker is running:
   ```powershell
   npm run worker
   ```

2. Check for errors in worker terminal

3. Verify Redis in worker logs:
   ```
   ✅ Worker connected to Redis
   ✅ Worker Redis ready for commands
   ✅ Worker ready and waiting for jobs...
   ```

### Predictions Not Completing
**Quick fix:**

1. Enable dev-sync in `.env`:
   ```env
   DEV_ANALYZE_SYNC=1
   ```

2. Restart dev server

3. Predictions will analyze immediately without queue

---

## 📊 Monitor Queue

### Check Queue Stats
Add to any API route:
```typescript
import { getQueueStats } from '@/lib/queue';

const stats = await getQueueStats();
console.log(stats);
// { waiting: 0, active: 1, completed: 5, failed: 0, delayed: 0 }
```

### Upstash Dashboard
- Go to: https://console.upstash.com/
- Select your Redis instance: `national-crab-28007`
- View: Commands, Connections, Memory usage

---

## 🎯 What's Next?

1. **Deploy to Production:**
   - Set `REDIS_URL` in Vercel/Railway env vars
   - Deploy worker as separate process
   - Use Vercel Cron or similar for worker

2. **Add Real AI:**
   - Set `OPENAI_API_KEY` in `.env`
   - Update `src/lib/ai-analyzer.ts` to use real OpenAI API

3. **Integrate Live Data:**
   - Add SportMonks/RapidAPI keys
   - Replace `fixtures-sample.ts` with real API calls

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `.env` | Upstash Redis URL and config |
| `src/lib/queue.ts` | BullMQ queue with TLS support |
| `src/workers/feedback.worker.ts` | Background job processor |
| `src/app/api/predictions/route.ts` | Queue jobs + dev-sync fallback |
| `test-upstash.js` | Connection test script |

---

## ✅ Current Status

- ✅ Upstash Redis connected
- ✅ Queue system operational
- ✅ Worker processes jobs
- ✅ Dev-sync fallback available
- ✅ Auto-refresh on detail page
- ✅ 0 npm vulnerabilities

**You're ready to go!** 🚀
