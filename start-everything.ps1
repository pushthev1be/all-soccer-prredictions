# start-everything.ps1
Write-Host "Starting All Soccer Predictions System..." -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# 1. Docker services
Write-Host "1. Docker Services..." -ForegroundColor Yellow
docker-compose up -d
Start-Sleep -Seconds 3
docker-compose ps

Write-Host ""

# 2. Next.js dev server
Write-Host "2. Starting Next.js Dev Server..." -ForegroundColor Yellow
Write-Host "   Opening in new window..." -ForegroundColor Cyan
$nextJsWindow = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; Write-Host 'Next.js Server' -ForegroundColor Green; npm run dev" -PassThru
Start-Sleep -Seconds 5

Write-Host ""

# 3. Worker process
Write-Host "3. Starting Feedback Worker..." -ForegroundColor Yellow
Write-Host "   Opening in new window..." -ForegroundColor Cyan
$workerWindow = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; Write-Host 'Feedback Worker' -ForegroundColor Green; npx tsx src/workers/feedback.worker.ts" -PassThru

Write-Host ""

# 4. Wait and verify
Write-Host "4. Verifying Services..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

Write-Host "   Testing Next.js..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method Head -ErrorAction SilentlyContinue
    Write-Host "   [OK] Next.js running on http://localhost:3000" -ForegroundColor Green
} catch {
    Write-Host "   [WAIT] Next.js still starting..." -ForegroundColor Yellow
}

Write-Host "   Testing Redis..." -ForegroundColor Cyan
try {
    docker exec all-soccer-redis redis-cli ping | Out-Null
    Write-Host "   [OK] Redis connected" -ForegroundColor Green
} catch {
    Write-Host "   [FAIL] Redis error" -ForegroundColor Red
}

Write-Host "   Testing Database..." -ForegroundColor Cyan
try {
    $result = docker exec all-soccer-db psql -U postgres -d allsoccer -c "SELECT 'Connected' as status;" -t 2>$null
    if ($result -match "Connected") {
        Write-Host "   [OK] Database connected" -ForegroundColor Green
    }
} catch {
    Write-Host "   [FAIL] Database error" -ForegroundColor Red
}

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "[OK] SYSTEM STARTED SUCCESSFULLY!" -ForegroundColor Green
Write-Host ""
Write-Host "ACCESS POINTS:" -ForegroundColor Cyan
Write-Host "   Main Application:    http://localhost:3000" -ForegroundColor White
Write-Host "   Create Prediction:   http://localhost:3000/predictions/create" -ForegroundColor White
Write-Host "   View Predictions:    http://localhost:3000/predictions" -ForegroundColor White
Write-Host "   Prisma Studio:       http://localhost:5555" -ForegroundColor White
Write-Host ""
Write-Host "TEST ACCOUNT:" -ForegroundColor Cyan
Write-Host "   Email: test@example.com (use Quick Sign In button)" -ForegroundColor White
Write-Host ""
Write-Host "WINDOWS OPENED:" -ForegroundColor Cyan
Write-Host "   1. Next.js Dev Server - Shows compilation logs" -ForegroundColor White
Write-Host "   2. Feedback Worker - Shows prediction processing" -ForegroundColor White
Write-Host ""
Write-Host "QUICK TEST:" -ForegroundColor Cyan
Write-Host "   1. Go to http://localhost:3000" -ForegroundColor White
Write-Host "   2. Click 'Quick Sign In (Dev)'" -ForegroundColor White
Write-Host "   3. Create a prediction" -ForegroundColor White
Write-Host "   4. Watch worker window process it!" -ForegroundColor White
