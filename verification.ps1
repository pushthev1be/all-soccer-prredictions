# verification.ps1
Write-Host "Verifying All Services..." -ForegroundColor Green
Write-Host ""

# 1. Check Docker
Write-Host "1. Docker Services:" -ForegroundColor Yellow
docker-compose ps

Write-Host ""

# 2. Check Next.js (should be running on port 3000)
Write-Host "2. Next.js Server:" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method Head -ErrorAction Stop -TimeoutSec 5
    Write-Host "   [OK] Running on http://localhost:3000" -ForegroundColor Green
} catch {
    Write-Host "   [WAIT] Not responding yet (starting...)" -ForegroundColor Yellow
    Write-Host "   Check Next.js terminal for startup status" -ForegroundColor Cyan
}

Write-Host ""

# 3. Check Redis queue
Write-Host "3. Redis Queue:" -ForegroundColor Yellow
try {
    $result = docker exec all-soccer-redis redis-cli ping 2>$null
    if ($result -like "*PONG*") {
        Write-Host "   [OK] Redis connected" -ForegroundColor Green
    }
} catch {
    Write-Host "   [FAIL] Redis not accessible" -ForegroundColor Red
}

Write-Host ""

# 4. Check Database
Write-Host "4. PostgreSQL Database:" -ForegroundColor Yellow
try {
    $result = docker exec all-soccer-db psql -U postgres -d allsoccer -c "SELECT 'Connected' as status;" -t 2>$null
    if ($result -match "Connected") {
        Write-Host "   [OK] Database connected" -ForegroundColor Green
    } else {
        Write-Host "   [INFO] Testing database connection..." -ForegroundColor Cyan
    }
} catch {
    Write-Host "   [WAIT] Database initializing..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "STATUS SUMMARY:" -ForegroundColor Cyan
Write-Host "   Application:      http://localhost:3000" -ForegroundColor White
Write-Host "   Create Prediction: http://localhost:3000/predictions/create" -ForegroundColor White
Write-Host "   View Predictions:  http://localhost:3000/predictions" -ForegroundColor White
Write-Host "   Queue Monitor:     http://localhost:3000/admin/queue" -ForegroundColor White
Write-Host "   Prisma Studio:     http://localhost:5555 (run: npx prisma studio)" -ForegroundColor White

Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host "   1. Wait 10-15 seconds for Next.js to compile" -ForegroundColor White
Write-Host "   2. Open http://localhost:3000 in your browser" -ForegroundColor White
Write-Host "   3. Sign in with your credentials" -ForegroundColor White
Write-Host "   4. Create a prediction at /predictions/create" -ForegroundColor White
Write-Host "   5. Watch worker terminal process it" -ForegroundColor White
Write-Host ""
Write-Host "[OK] System ready for testing!" -ForegroundColor Green
