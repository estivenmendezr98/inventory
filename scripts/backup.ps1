# ============================================
# backup.ps1 — Respaldo manual de inventory_bd (Docker)
# Windows 11 / PowerShell
# ============================================
# Ejecutar desde la raíz del repositorio:
#   .\scripts\backup.ps1
#   .\scripts\backup.ps1 -OutDir D:\backups-inventory

param(
    [string]$OutDir = ""
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
Set-Location $ProjectRoot

if (-not $OutDir) {
    $OutDir = Join-Path $ProjectRoot "backups-export"
}

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$remote = "/tmp/inventory_bd_$stamp.sql"
$outFile = Join-Path $OutDir "inventory_bd_$stamp.sql"

Write-Host "Generando respaldo en contenedor..." -ForegroundColor Cyan
docker compose exec -T postgres-app pg_dump -U root inventory_bd -f $remote
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: pg_dump falló (¿`docker compose up` está activo?)." -ForegroundColor Red
    exit 1
}

Write-Host "Copiando a: $outFile" -ForegroundColor Cyan
docker compose cp "postgres-app:$remote" $outFile
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: docker compose cp falló." -ForegroundColor Red
    exit 1
}

docker compose exec -T postgres-app rm -f $remote | Out-Null

Write-Host "OK: Respaldo creado." -ForegroundColor Green
Write-Host "  $outFile" -ForegroundColor Gray
