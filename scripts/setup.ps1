# ============================================
# Setup Script - Sistema de Inventario
# Windows 11 / PowerShell
# ============================================

param(
    [switch]$SkipDocker,
    [switch]$SkipBuild,
    [switch]$SeedOnly
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Sistema de Inventario - Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
Set-Location $ProjectRoot

# --- Step 1: Verificar Docker ---
if (-not $SkipDocker) {
    Write-Host "[1/6] Verificando Docker..." -ForegroundColor Yellow
    try {
        $dockerVersion = docker --version
        Write-Host "  OK: $dockerVersion" -ForegroundColor Green
    } catch {
        Write-Host "  ERROR: Docker no esta instalado o no esta en el PATH." -ForegroundColor Red
        Write-Host "  Instala Docker Desktop: https://www.docker.com/products/docker-desktop" -ForegroundColor Red
        exit 1
    }

    try {
        docker info | Out-Null
        Write-Host "  OK: Docker daemon esta corriendo." -ForegroundColor Green
    } catch {
        Write-Host "  ERROR: Docker daemon no esta corriendo. Inicia Docker Desktop." -ForegroundColor Red
        exit 1
    }
}

# --- Step 2: Copiar .env ---
Write-Host "[2/6] Verificando archivo .env..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "  Creado .env desde .env.example" -ForegroundColor Green
} else {
    Write-Host "  .env ya existe, se mantiene." -ForegroundColor Green
}

# --- Step 3: Build containers ---
if (-not $SkipBuild -and -not $SeedOnly) {
    Write-Host "[3/6] Construyendo contenedores..." -ForegroundColor Yellow
    docker compose build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ERROR: Fallo al construir contenedores." -ForegroundColor Red
        exit 1
    }
    Write-Host "  OK: Contenedores construidos." -ForegroundColor Green
}

# --- Step 4: Start services ---
if (-not $SeedOnly) {
    Write-Host "[4/6] Iniciando servicios..." -ForegroundColor Yellow
    docker compose up -d
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ERROR: Fallo al iniciar servicios." -ForegroundColor Red
        exit 1
    }
    Write-Host "  OK: Servicios iniciados." -ForegroundColor Green

    # Wait for postgres
    Write-Host "  Esperando a que PostgreSQL este listo..." -ForegroundColor Gray
    Start-Sleep -Seconds 10
}

# --- Step 5: Run migrations ---
Write-Host "[5/6] Ejecutando migraciones Prisma..." -ForegroundColor Yellow
docker compose exec backend npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) {
    Write-Host "  WARN: Migraciones fallaron. Intentando generar cliente..." -ForegroundColor Yellow
    docker compose exec backend npx prisma db push
}
Write-Host "  OK: Migraciones completadas." -ForegroundColor Green

# --- Step 6: Run seed ---
Write-Host "[6/6] Ejecutando seed de datos..." -ForegroundColor Yellow
docker compose exec backend npx prisma db seed
if ($LASTEXITCODE -ne 0) {
    Write-Host "  WARN: Seed fallo. Verifica la conexion a la base de datos." -ForegroundColor Yellow
} else {
    Write-Host "  OK: Datos semilla insertados." -ForegroundColor Green
}

# --- Done ---
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Setup completado!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Servicios disponibles:" -ForegroundColor Cyan
Write-Host "    Frontend:   http://localhost" -ForegroundColor White
Write-Host "    API:        http://localhost/api" -ForegroundColor White
Write-Host "    Keycloak:   http://localhost:8080" -ForegroundColor White
Write-Host "    MinIO:      http://localhost:9001" -ForegroundColor White
Write-Host "    Netdata:    http://localhost:19999" -ForegroundColor White
Write-Host ""
Write-Host "  Usuarios de prueba:" -ForegroundColor Cyan
Write-Host "    superadmin / admin123 (SUPER_ADMINISTRADOR)" -ForegroundColor White
Write-Host "    administrador / admin123 (ADMINISTRADOR)" -ForegroundColor White
Write-Host "    cajero / cajero123 (CAJERO)" -ForegroundColor White
Write-Host ""
