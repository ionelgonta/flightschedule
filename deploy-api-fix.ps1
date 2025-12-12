# Script pentru deployment cu fix API validation pe Hetzner
$ServerIP = "23.88.113.154"
$NewPassword = "FlightSchedule2024!"
$Domain = "anyway.ro"

Write-Host "Incep deployment cu fix API validation..." -ForegroundColor Cyan

# Verifica daca PuTTY este instalat
try {
    plink -V 2>$null | Out-Null
    Write-Host "PuTTY gasit" -ForegroundColor Green
} catch {
    Write-Host "PuTTY nu este instalat. Te rog sa-l instalezi de la: https://www.putty.org/" -ForegroundColor Red
    Write-Host "Sau foloseste: choco install putty" -ForegroundColor Yellow
    exit 1
}

Write-Host "Creez arhiva proiectului..." -ForegroundColor Yellow

# Creaza arhiva proiectului
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$archiveName = "project-api-fix-$timestamp.zip"
Compress-Archive -Path ".\*" -DestinationPath $archiveName -Force -CompressionLevel Fastest
Write-Host "Arhiva creata: $archiveName" -ForegroundColor Green

Write-Host "Upload arhiva pe server..." -ForegroundColor Yellow

# Upload arhiva folosind pscp
try {
    $uploadCmd = "pscp -pw $NewPassword $archiveName root@${ServerIP}:/tmp/"
    Invoke-Expression $uploadCmd
    Write-Host "Arhiva uploadata cu succes!" -ForegroundColor Green
} catch {
    Write-Host "Eroare la upload. Verifica conexiunea si parola." -ForegroundColor Red
    exit 1
}

Write-Host "Configurez serverul cu fix API..." -ForegroundColor Yellow

# Creeaza scriptul de setup cu fix API
$setupScript = @'
#!/bin/bash
set -e

echo "Opresc serviciile existente..."
cd /root/flight-schedule 2>/dev/null || cd /opt/flight-schedule 2>/dev/null || true
docker-compose down 2>/dev/null || true

echo "Backup versiunea curenta..."
if [ -d "/root/flight-schedule" ]; then
    cp -r /root/flight-schedule /root/flight-schedule-backup-$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
fi

echo "Configurez proiectul cu fix API..."
mkdir -p /root/flight-schedule
cd /root/flight-schedule

unzip -o /tmp/project-api-fix-*.zip
rm /tmp/project-api-fix-*.zip

echo "Verific API key in docker-compose.yml..."
grep -q "cmj2peefi0001la04p5rkbbcc" docker-compose.yml && echo "API key gasit in docker-compose.yml" || echo "API key nu gasit!"

echo "Build si pornesc containerele..."
docker-compose build --no-cache
docker-compose up -d

echo "Verific statusul serviciilor..."
sleep 5
docker-compose ps

echo "Deployment complet cu fix API!"
echo "Site disponibil la: https://anyway.ro"
echo "Admin panel: https://anyway.ro/admin"
echo "API Key: cmj2peefi0001la04p5rkbbcc"
'@

# Salveaza scriptul pe server
$setupScript | Out-File -FilePath "setup-api-fix.sh" -Encoding UTF8
pscp -pw $NewPassword "setup-api-fix.sh" root@${ServerIP}:/tmp/

# Executa scriptul pe server
Write-Host "Rulez scriptul de setup cu fix API pe server..." -ForegroundColor Yellow
$runSetup = "plink -ssh -pw $NewPassword root@$ServerIP `"chmod +x /tmp/setup-api-fix.sh; /tmp/setup-api-fix.sh`""
Invoke-Expression $runSetup

# Curata fisierele temporare
Remove-Item $archiveName -ErrorAction SilentlyContinue
Remove-Item "setup-api-fix.sh" -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Deployment cu fix API finalizat!" -ForegroundColor Green
Write-Host ""
Write-Host "Informatii importante:" -ForegroundColor Cyan
Write-Host "Site-ul: https://$Domain" -ForegroundColor White
Write-Host "Admin panel: https://$Domain/admin" -ForegroundColor White
Write-Host "Parola admin: admin123" -ForegroundColor Yellow
Write-Host "API Key: cmj2peefi0001la04p5rkbbcc" -ForegroundColor Yellow
Write-Host ""
Write-Host "Fix-uri aplicate:" -ForegroundColor Green
Write-Host "- API validation foloseste MCP endpoint corect" -ForegroundColor White
Write-Host "- Header x-api-market-key in loc de x-magicapi-key" -ForegroundColor White
Write-Host "- Test endpoint: https://prod.api.market/api/mcp/aedbx/aerodatabox" -ForegroundColor White
Write-Host ""
Write-Host "Testeaza acum admin panel-ul!" -ForegroundColor Cyan