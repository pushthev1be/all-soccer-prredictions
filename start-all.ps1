# start-all.ps1
Write-Host "Starting All Soccer Predictions..." -ForegroundColor Green

# 1. Start Docker services
Write-Host "1. Starting Docker services..." -ForegroundColor Yellow
docker-compose up -d

# 2. Wait for services to be ready
Write-Host "2. Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# 3. Show status
Write-Host "3. Checking services..." -ForegroundColor Yellow
docker-compose ps

# 4. Start Next.js dev server
Write-Host "4. Starting Next.js dev server..." -ForegroundColor Yellow
Write-Host "   Opening new terminal for Next.js..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev"

# 5. Start worker
Write-Host "5. Starting feedback worker..." -ForegroundColor Yellow
Write-Host "   Opening new terminal for worker..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npx tsx src/workers/feedback.worker.ts"

# 6. Show URLs
Write-Host "`n[OK] All services started!" -ForegroundColor Green
Write-Host "`nURLS to access:" -ForegroundColor Cyan
Write-Host "   Application:      http://localhost:3000" -ForegroundColor White
Write-Host "   Create Prediction: http://localhost:3000/predictions/create" -ForegroundColor White
Write-Host "   View Predictions:  http://localhost:3000/predictions" -ForegroundColor White
Write-Host "   Prisma Studio:     http://localhost:5555" -ForegroundColor White

Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "   1. Go to http://localhost:3000/auth/signin" -ForegroundColor White
Write-Host "   2. Sign in (use test credentials if configured)" -ForegroundColor White
Write-Host "   3. Create a prediction" -ForegroundColor White
Write-Host "   4. Watch the worker process it in the worker terminal" -ForegroundColor White
