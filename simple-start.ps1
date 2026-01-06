# simple-start.ps1
Write-Host "Starting in single window mode..." -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Cyan
Write-Host ""

docker-compose up -d

Write-Host "Starting Next.js and Worker..." -ForegroundColor Green
Write-Host "Next.js: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Worker processes predictions in background" -ForegroundColor Cyan
Write-Host ""

$nextjsJob = Start-Job -ScriptBlock {
    Set-Location 'C:\Users\PUSH\OneDrive\Desktop\all-soccer-predictions'
    npm run dev
}

$workerJob = Start-Job -ScriptBlock {
    Set-Location 'C:\Users\PUSH\OneDrive\Desktop\all-soccer-predictions'
    npx tsx src/workers/feedback.worker.ts
}

Receive-Job -Job $nextjsJob, $workerJob -Wait
