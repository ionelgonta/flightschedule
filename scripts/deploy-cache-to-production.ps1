# Script PowerShell pentru deployment cache restaurat pe serverul de producție
# Respectă toate regulile de siguranță din troubleshooting-guide.md

param(
    [switch]$Force = $false
)

# Configurare
$SERVER = "anyway.ro"
$USER = "root"
$REMOTE_PATH = "/opt/anyway-flight-schedule"
$LOCAL_DATA_DIR = "./data"

Write-Host "🚀 DEPLOYMENT CACHE RESTAURAT PE PRODUCȚIE" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""

# Funcții pentru logging
function Log-Info($message) {
    Write-Host "✓ $message" -ForegroundColor Green
}

function Log-Warning($message) {
    Write-Host "⚠ $message" -ForegroundColor Yellow
}

function Log-Error($message) {
    Write-Host "✗ $message" -ForegroundColor Red
}

# Verifică că fișierele locale există
Write-Host "📋 Verificare fișiere locale..."

if (-not (Test-Path "$LOCAL_DATA_DIR/flights_cache.json")) {
    Log-Error "Fișierul flights_cache.json nu există!"
    exit 1
}

if (-not (Test-Path "$LOCAL_DATA_DIR/historical-flights.db")) {
    Log-Warning "Fișierul historical-flights.db nu există (opțional)"
}

Log-Info "Fișiere locale găsite"

# Verifică dimensiunea fișierelor
$cacheSize = (Get-Item "$LOCAL_DATA_DIR/flights_cache.json").Length
$cacheSizeKB = [math]::Round($cacheSize / 1KB, 2)
Log-Info "Dimensiune flights_cache.json: $cacheSizeKB KB"

# Numără intrările din cache
$cacheContent = Get-Content "$LOCAL_DATA_DIR/flights_cache.json" -Raw
$cacheEntries = ([regex]::Matches($cacheContent, '"flightNumber"')).Count
Log-Info "Intrări în cache: $cacheEntries zboruri"

if ($cacheEntries -lt 100 -and -not $Force) {
    Log-Warning "Cache-ul pare să aibă prea puține intrări ($cacheEntries)"
    $response = Read-Host "Continui deployment? (y/n)"
    if ($response -ne 'y' -and $response -ne 'Y') {
        Log-Error "Deployment anulat"
        exit 1
    }
}

Write-Host ""
Write-Host "🔐 Conectare la server..."

# Test conexiune SSH
try {
    $testResult = ssh -o ConnectTimeout=5 "$USER@$SERVER" "echo 'Conexiune OK'" 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "SSH connection failed"
    }
    Log-Info "Conexiune SSH stabilită"
} catch {
    Log-Error "Nu se poate conecta la $SERVER"
    exit 1
}

Write-Host ""
Write-Host "💾 Backup cache existent pe server..."

# Creează backup pe server
$backupTimestamp = Get-Date -Format "yyyyMMdd_HHmmss"

$backupScript = @"
cd $REMOTE_PATH

# Creează director backup dacă nu există
mkdir -p data/backups

# Backup fișiere existente
if [ -f data/flights_cache.json ]; then
    cp data/flights_cache.json data/backups/flights_cache_backup_${backupTimestamp}.json
    echo "✓ Backup flights_cache.json creat"
fi

if [ -f data/cache-data.json ]; then
    cp data/cache-data.json data/backups/cache-data_backup_${backupTimestamp}.json
    echo "✓ Backup cache-data.json creat"
fi

if [ -f data/historical-flights.db ]; then
    cp data/historical-flights.db data/backups/historical-flights_backup_${backupTimestamp}.db
    echo "✓ Backup historical-flights.db creat"
fi
"@

ssh "$USER@$SERVER" $backupScript
Log-Info "Backup complet pe server"

Write-Host ""
Write-Host "📤 Upload fișiere cache..."

# Upload flights_cache.json
scp "$LOCAL_DATA_DIR/flights_cache.json" "${USER}@${SERVER}:${REMOTE_PATH}/data/flights_cache.json"
Log-Info "flights_cache.json uploaded"

# Upload cache-data.json dacă există
if (Test-Path "$LOCAL_DATA_DIR/cache-data.json") {
    scp "$LOCAL_DATA_DIR/cache-data.json" "${USER}@${SERVER}:${REMOTE_PATH}/data/cache-data.json"
    Log-Info "cache-data.json uploaded"
}

# Upload historical-flights.db dacă există
if (Test-Path "$LOCAL_DATA_DIR/historical-flights.db") {
    scp "$LOCAL_DATA_DIR/historical-flights.db" "${USER}@${SERVER}:${REMOTE_PATH}/data/historical-flights.db"
    Log-Info "historical-flights.db uploaded"
}

Write-Host ""
Write-Host "🔧 Verificare permisiuni pe server..."

$permissionsScript = @"
cd $REMOTE_PATH/data

# Setează permisiuni corecte
chmod 644 flights_cache.json
chmod 644 cache-data.json 2>/dev/null || true
chmod 644 historical-flights.db 2>/dev/null || true

# Verifică owner
chown -R root:root .

echo "✓ Permisiuni setate"
"@

ssh "$USER@$SERVER" $permissionsScript
Log-Info "Permisiuni configurate"

Write-Host ""
Write-Host "🔄 Restart aplicație..."

# Restart PM2 (NU nginx - conform troubleshooting-guide.md)
$restartScript = @"
cd $REMOTE_PATH

# Restart PM2
pm2 restart anyway-ro

echo "✓ PM2 restartat"

# Așteaptă 3 secunde pentru inițializare
sleep 3

# Verifică status
pm2 list | grep anyway-ro
"@

ssh "$USER@$SERVER" $restartScript
Log-Info "Aplicație restartată"

Write-Host ""
Write-Host "🧪 Testare deployment..."

# Așteaptă puțin pentru ca aplicația să se încarce
Start-Sleep -Seconds 5

# Test API
Write-Host "Testare API statistici..."
try {
    $response = Invoke-WebRequest -Uri "https://anyway.ro/api/statistici-aeroporturi" -UseBasicParsing
    $responseContent = $response.Content | ConvertFrom-Json
    
    if ($responseContent.success) {
        $airportsWithStats = ($responseContent.data | Where-Object { $_.statistics -ne $null }).Count
        Log-Info "API returnează statistici!"
        Log-Info "Aeroporturi cu statistici: $airportsWithStats"
    } else {
        Log-Warning "API nu returnează statistici încă"
    }
} catch {
    Log-Warning "Eroare la testarea API-ului: $($_.Exception.Message)"
}

Write-Host ""
Write-Host "📊 Verificare finală pe server..."

$finalCheckScript = @"
cd $REMOTE_PATH

echo "📁 Dimensiuni fișiere:"
ls -lh data/flights_cache.json data/cache-data.json 2>/dev/null || true

echo ""
echo "📈 Intrări în cache:"
grep -o '"flightNumber"' data/flights_cache.json | wc -l

echo ""
echo "🔍 Status PM2:"
pm2 list | grep anyway-ro

echo ""
echo "📝 Ultimele 10 linii din log:"
pm2 logs anyway-ro --lines 10 --nostream
"@

ssh "$USER@$SERVER" $finalCheckScript

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "✅ DEPLOYMENT COMPLET!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Următorii pași:"
Write-Host "   1. Verifică https://anyway.ro/statistici-aeroporturi"
Write-Host "   2. Verifică https://anyway.ro/api/statistici-aeroporturi"
Write-Host "   3. Monitorizează logs: ssh root@anyway.ro 'pm2 logs anyway-ro'"
Write-Host ""
Write-Host "🔙 Rollback (dacă e necesar):"
Write-Host "   ssh root@anyway.ro 'cd $REMOTE_PATH/data; cp backups/flights_cache_backup_${backupTimestamp}.json flights_cache.json; pm2 restart anyway-ro'"
Write-Host ""