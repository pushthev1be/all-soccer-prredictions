# clean-start.ps1
Write-Host "CLEAN START - Soccer Predictions System" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Stop any running processes
Write-Host "1. Stopping existing processes..." -ForegroundColor Yellow
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
Stop-Process -Name "docker" -Force -ErrorAction SilentlyContinue
Stop-Process -Name "com.docker.backend" -Force -ErrorAction SilentlyContinue
Stop-Process -Name "com.docker.service" -Force -ErrorAction SilentlyContinue
docker-compose down

Write-Host ""

# 2. Start fresh Docker services
Write-Host "2. Starting Docker services..." -ForegroundColor Yellow
docker-compose up -d
Start-Sleep -Seconds 5

Write-Host "   Docker Status:" -ForegroundColor Cyan
docker-compose ps

Write-Host ""

# 3. Clear Redis queue (clean slate)
Write-Host "3. Clearing Redis queue..." -ForegroundColor Yellow
try {
    docker exec all-soccer-redis redis-cli FLUSHALL
    Write-Host "   Redis cleared" -ForegroundColor Green
} catch {
    Write-Host "   Redis flush skipped (container not ready)" -ForegroundColor Yellow
}

Write-Host ""

# 4. Ensure NEXTAUTH_SECRET exists and is non-empty
Write-Host "4. Checking environment..." -ForegroundColor Yellow
if (-not (Test-Path .env)) {
    Write-Host "   .env file missing. Please create it and set NEXTAUTH_SECRET." -ForegroundColor Red
    exit 1
}

$envLines = Get-Content .env
$hasSecret = $envLines | Where-Object { $_ -match '^NEXTAUTH_SECRET=' }
if (-not $hasSecret) {
    Write-Host "   Generating NEXTAUTH_SECRET..." -ForegroundColor Cyan
    $secret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 48 | ForEach-Object {[char]$_})
    Add-Content .env "NEXTAUTH_SECRET=$secret"
    Write-Host "   Secret added to .env" -ForegroundColor Green
} else {
    Write-Host "   NEXTAUTH_SECRET found" -ForegroundColor Green
}

Write-Host ""

# 5. Start Next.js in background (single window mode)
Write-Host "5. Starting Next.js Dev Server..." -ForegroundColor Yellow
Write-Host "   Press Ctrl+C in this window to stop everything." -ForegroundColor Cyan
Write-Host ""

$nextjsJob = Start-Job -Name "NextJS" -ScriptBlock {
    Set-Location 'C:\Users\PUSH\OneDrive\Desktop\all-soccer-predictions'
    npm run dev
}

# 6. Start Worker in background
Write-Host "6. Starting Feedback Worker..." -ForegroundColor Yellow
$workerJob = Start-Job -Name "Worker" -ScriptBlock {
    Set-Location 'C:\Users\PUSH\OneDrive\Desktop\all-soccer-predictions'
    npx tsx src/workers/feedback.worker.ts
}

Write-Host ""

# 7. Monitor both jobs
Write-Host "7. Monitoring Services..." -ForegroundColor Yellow
Write-Host "   Waiting for services to start..." -ForegroundColor Cyan
Start-Sleep -Seconds 10

# 8. Show status
Write-Host ""
Write-Host "SYSTEM STATUS:" -ForegroundColor Cyan
Write-Host "   Next.js:   http://localhost:3000" -ForegroundColor White
Write-Host "   Database:  localhost:5432/allsoccer" -ForegroundColor White
Write-Host "   Redis:     localhost:6379" -ForegroundColor White
Write-Host "   Prisma:    http://localhost:5555" -ForegroundColor White

Write-Host ""
Write-Host "QUICK START GUIDE:" -ForegroundColor Cyan
Write-Host "   1. Open browser to http://localhost:3000" -ForegroundColor White
Write-Host "   2. Click 'Quick Sign In (Dev)'" -ForegroundColor White
Write-Host "   3. Use test@example.com" -ForegroundColor White
Write-Host "   4. Create a prediction" -ForegroundColor White
Write-Host "   5. Watch logs below for processing" -ForegroundColor White

Write-Host ""
Write-Host "LIVE LOGS (Ctrl+C to stop):" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan

try {
    while ($true) {
        $nextjsOutput = Receive-Job -Job $nextjsJob -Keep
        $workerOutput = Receive-Job -Job $workerJob -Keep
        if ($nextjsOutput) { Write-Host "[Next.js] $nextjsOutput" -ForegroundColor Blue }
        if ($workerOutput) { Write-Host "[Worker] $workerOutput" -ForegroundColor Magenta }
        Start-Sleep -Milliseconds 200
    }
} finally {
    Write-Host "`nStopping services..." -ForegroundColor Yellow
    Stop-Job -Job $nextjsJob, $workerJob -ErrorAction SilentlyContinue
    Remove-Job -Job $nextjsJob, $workerJob -Force -ErrorAction SilentlyContinue
    docker-compose down
    Write-Host "All services stopped" -ForegroundColor Green
}
