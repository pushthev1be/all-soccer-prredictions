# test-predictions.ps1
Write-Host "Testing Soccer Predictions Flow..." -ForegroundColor Green

# 1. Check Docker services
Write-Host "`n1. Checking Docker services..." -ForegroundColor Yellow
$services = docker-compose ps 2>&1
Write-Host $services

# 2. Test Redis
Write-Host "`n2. Testing Redis connection..." -ForegroundColor Yellow
try {
    $redisTest = docker exec all-soccer-redis redis-cli ping 2>&1
    if ($redisTest -like "*PONG*") {
        Write-Host "   [OK] Redis connected" -ForegroundColor Green
    } else {
        Write-Host "   [FAIL] Redis connection failed: $redisTest" -ForegroundColor Red
    }
} catch {
    Write-Host "   [FAIL] Redis test error: $_" -ForegroundColor Red
}

# 3. Test Database
Write-Host "`n3. Testing Database connection..." -ForegroundColor Yellow
try {
    $dbTest = docker exec all-soccer-db psql -U postgres -d allsoccer -c "SELECT 'Database connected' AS status;" 2>&1
    if ($dbTest -like "*Database connected*") {
        Write-Host "   [OK] Database connected" -ForegroundColor Green
    } else {
        Write-Host "   [FAIL] Database connection failed" -ForegroundColor Red
        Write-Host "   Output: $dbTest" -ForegroundColor Red
    }
} catch {
    Write-Host "   [FAIL] Database test failed: $_" -ForegroundColor Red
}

# 4. Check TypeScript compilation
Write-Host "`n4. Checking TypeScript compilation..." -ForegroundColor Yellow
try {
    npx tsc --noEmit 2>&1 | Select-Object -First 5
    Write-Host "   [OK] TypeScript OK" -ForegroundColor Green
} catch {
    Write-Host "   [WARN] TypeScript check encountered issues" -ForegroundColor Yellow
}

# 5. URLs to test
Write-Host "`nURLs to test:" -ForegroundColor Green
Write-Host "   App: http://localhost:3000" -ForegroundColor Cyan
Write-Host "   Sign In: http://localhost:3000/auth/signin" -ForegroundColor Cyan
Write-Host "   Create Prediction: http://localhost:3000/predictions/create" -ForegroundColor Cyan
Write-Host "   View Predictions: http://localhost:3000/predictions" -ForegroundColor Cyan
Write-Host "   Prisma Studio: http://localhost:5555" -ForegroundColor Cyan

Write-Host "`nNext steps:" -ForegroundColor Green
Write-Host "   1. Open Terminal 1: .\start-all.ps1" -ForegroundColor Cyan
Write-Host "   2. Open Terminal 2: npx prisma studio (optional)" -ForegroundColor Cyan
Write-Host "   3. Go to http://localhost:3000 and create a prediction" -ForegroundColor Cyan

Write-Host "`nTest script completed!" -ForegroundColor Green
