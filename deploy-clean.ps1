# Script pentru deployment pe Hetzner - versiune curata
$ServerIP = "23.88.113.154"
$NewPassword = "FlightSchedule2024!"
$Domain = "victoriaocara.com"

Write-Host "Incep deployment-ul Flight Schedule pe Hetzner..." -ForegroundColor Cyan

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
Compress-Archive -Path ".\*" -DestinationPath "project.zip" -Force -CompressionLevel Fastest
Write-Host "Arhiva creata: project.zip" -ForegroundColor Green

Write-Host "Upload arhiva pe server..." -ForegroundColor Yellow

# Upload arhiva folosind pscp
try {
    $uploadCmd = "pscp -pw $NewPassword project.zip root@${ServerIP}:/tmp/"
    Invoke-Expression $uploadCmd
    Write-Host "Arhiva uploadata cu succes!" -ForegroundColor Green
} catch {
    Write-Host "Eroare la upload. Verifica conexiunea si parola." -ForegroundColor Red
    exit 1
}

Write-Host "Configurez serverul..." -ForegroundColor Yellow

# Creeaza scriptul de setup
$setupScript = @'
#!/bin/bash
set -e

echo "Actualizez sistemul..."
apt update && apt upgrade -y

echo "Instalez Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl enable docker
    systemctl start docker
fi

echo "Instalez Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

echo "Configurez proiectul..."
mkdir -p /opt/flight-schedule
cd /opt/flight-schedule

unzip -o /tmp/project.zip
rm /tmp/project.zip

mkdir -p ssl

if [ ! -f ssl/cert.pem ]; then
    echo "Generez certificat SSL temporar..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout ssl/key.pem \
        -out ssl/cert.pem \
        -subj "/C=RO/ST=Romania/L=Bucharest/O=FlightSchedule/CN=victoriaocara.com"
fi

sed -i "s/your-domain.com/victoriaocara.com/g" nginx.conf

echo "Build si pornesc containerele..."
docker-compose down || true
docker-compose build --no-cache
docker-compose up -d

echo "Configurez firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "Deployment complet!"
echo "Site disponibil la: https://victoriaocara.com"
echo "Admin panel: https://victoriaocara.com/admin"
'@

# Salveaza scriptul pe server
$setupScript | Out-File -FilePath "setup.sh" -Encoding UTF8
pscp -pw $NewPassword "setup.sh" root@${ServerIP}:/tmp/

# Executa scriptul pe server
Write-Host "Rulez scriptul de setup pe server..." -ForegroundColor Yellow
$runSetup = "plink -ssh -pw $NewPassword root@$ServerIP `"chmod +x /tmp/setup.sh; /tmp/setup.sh`""
Invoke-Expression $runSetup

# Curata fisierele temporare
Remove-Item "project.zip" -ErrorAction SilentlyContinue
Remove-Item "setup.sh" -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Deployment finalizat cu succes!" -ForegroundColor Green
Write-Host ""
Write-Host "Informatii importante:" -ForegroundColor Cyan
Write-Host "Site-ul: https://$Domain" -ForegroundColor White
Write-Host "Admin panel: https://$Domain/admin" -ForegroundColor White
Write-Host "Parola admin: admin123 (schimb-o in productie!)" -ForegroundColor Yellow
Write-Host "Parola SSH: $NewPassword" -ForegroundColor Yellow
Write-Host ""
Write-Host "Pasii urmatori:" -ForegroundColor Cyan
Write-Host "1. Pointeaza DNS-ul domeniului $Domain catre $ServerIP" -ForegroundColor White
Write-Host "2. Configureaza Let's Encrypt pentru SSL real" -ForegroundColor White
Write-Host "3. Schimba parola admin din panoul /admin" -ForegroundColor White
Write-Host "4. Adauga Publisher ID-ul Google AdSense" -ForegroundColor White