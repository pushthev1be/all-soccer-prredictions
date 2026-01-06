# quick-fix.ps1
Write-Host "Quick Fix for NextAuth JWT Error" -ForegroundColor Yellow

# 1. Rotate NEXTAUTH_SECRET (preserves other .env settings)
if (-not (Test-Path .env)) {
    Write-Host ".env file missing. Please create it and re-run." -ForegroundColor Red
    exit 1
}

$envLines = Get-Content .env
$hasSecret = $envLines | Where-Object { $_ -match '^NEXTAUTH_SECRET=' }
$newSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 48 | ForEach-Object {[char]$_})
if ($hasSecret) {
    $envLines = $envLines -replace '^NEXTAUTH_SECRET=.*', "NEXTAUTH_SECRET=$newSecret"
    $envLines | Set-Content .env
    Write-Host "Updated NEXTAUTH_SECRET in .env" -ForegroundColor Green
} else {
    Add-Content .env "NEXTAUTH_SECRET=$newSecret"
    Write-Host "Added NEXTAUTH_SECRET to .env" -ForegroundColor Green
}

Write-Host ""
Write-Host "Clear browser cookies for localhost:3000 (DevTools > Application > Storage > Cookies)." -ForegroundColor Cyan
Write-Host "Then restart services:" -ForegroundColor Cyan
Write-Host "   docker-compose down" -ForegroundColor White
Write-Host "   docker-compose up -d" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor White
Write-Host "   npx tsx src/workers/feedback.worker.ts" -ForegroundColor White
