# ============================================
# Seed — Prisma migrate deploy + db seed
# Windows 11 / PowerShell
# ============================================

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$Backend = Join-Path $ProjectRoot "backend"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Prisma: migrate deploy + db seed" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $Backend)) {
    Write-Host "No se encontró la carpeta backend: $Backend" -ForegroundColor Red
    exit 1
}

Set-Location $Backend

Write-Host "[1/2] npx prisma migrate deploy..." -ForegroundColor Yellow
npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "[2/2] npx prisma db seed..." -ForegroundColor Yellow
npx prisma db seed
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "Seed completado." -ForegroundColor Green
Write-Host ""
