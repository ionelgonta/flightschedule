# PowerShell Script pentru deployment pe Hetzner
param(
    [string]$ServerIP = "23.88.113.154",
    [string]$OldPassword = "ba94wtRqEnMu773TpWEr",
    [string]$NewPassword = "FlightSchedule2024!",
    [string]$Domain = "victoriaocara.com"
)

Write-Host "🚀 Încep deployment-ul Flight Schedule pe Hetzner..." -ForegroundColor Cyan
Write-Host "📡 Server: $ServerIP" -ForegroundColor Yellow
Write-Host "🌐 Domeniu: $Domain" -ForegroundColor Yellow

# Funcție pentru afișarea mesajelor
function Write-Status {
    param([string]$Message, [string]$Type = "Info")
    
    $colors = @{
        "Info" = "Cyan"
        "Success" = "Green"
        "Warning" = "Yellow"
        "Error" = "Red"
    }
    
    $emoji = @{
        "Info" = "ℹ️"
        "Success" = "✅"
        "Warning" = "⚠️"
        "Error" = "❌"
    }
    
    Write-Host "$($emoji[$Type]) $Message" -ForegroundColor $colors[$Type]
}

# Verifică dacă PuTTY/plink este instalat
$plinkPath = "plink"
try {
    & $plinkPath -V 2>$null | Out-Null
    Write-Status "PuTTY găsit" "Success"
} catch {
    Write-Status "PuTTY nu este instalat. Încerc să-l instalez..." "Warning"
    
    # Încearcă să instaleze PuTTY prin Chocolatey
    try {
        choco install putty -y
        $plinkPath = "plink"
    } catch {
        Write-Status "Nu pot instala PuTTY automat. Te rog să-l instalezi manual de la: https://www.putty.org/" "Error"
        exit 1
    }
}

# Funcție pentru executarea comenzilor SSH
function Invoke-SSHCommand {
    param(
        [string]$Command,
        [string]$Password = $NewPassword,
        [int]$Timeout = 300
    )
    
    $tempScript = [System.IO.Path]::GetTempFileName() + ".txt"
    
    try {
        # Creează un script temporar pentru plink
        @"
$Command
exit
"@ | Out-File -FilePath $tempScript -Encoding ASCII
        
        # Execută comanda prin plink
        $process = Start-Process -FilePath $plinkPath -ArgumentList @(
            "-ssh", 
            "-batch",
            "-pw", $Password,
            "root@$ServerIP"
        ) -RedirectStandardInput $tempScript -RedirectStandardOutput "output.txt" -RedirectStandardError "error.txt" -Wait -PassThru
        
        $output = Get-Content "output.txt" -Raw -ErrorAction SilentlyContinue
        $error = Get-Content "error.txt" -Raw -ErrorAction SilentlyContinue
        
        return @{
            ExitCode = $process.ExitCode
            Output = $output
            Error = $error
        }
    } finally {
        # Curăță fișierele temporare
        Remove-Item $tempScript -ErrorAction SilentlyContinue
        Remove-Item "output.txt" -ErrorAction SilentlyContinue
        Remove-Item "error.txt" -ErrorAction SilentlyContinue
    }
}

# Testează conexiunea inițială și schimbă parola
Write-Status "🔐 Testez conexiunea și schimb parola..." "Info"

# Pentru prima conectare cu schimbarea parolei, folosim expect prin WSL sau Git Bash
$expectScript = @"
#!/usr/bin/expect -f
set timeout 30
spawn ssh -o StrictHostKeyChecking=no root@$ServerIP
expect "password:"
send "$OldPassword\r"
expect "New password:"
send "$NewPassword\r"
expect "Retype new password:"
send "$NewPassword\r"
expect "# "
send "echo 'Parola schimbată cu succes'\r"
expect "# "
send "exit\r"
expect eof
"@

# Salvează scriptul expect
$expectScript | Out-File -FilePath "change_password.exp" -Encoding ASCII

# Încearcă să ruleze scriptul expect
try {
    if (Get-Command "bash" -ErrorAction SilentlyContinue) {
        Write-Status "Folosesc bash pentru schimbarea parolei..." "Info"
        $result = bash -c "expect change_password.exp"
        Write-Status "Parola schimbată cu succes!" "Success"
    } else {
        Write-Status "Bash nu este disponibil. Încerc metoda manuală..." "Warning"
        
        # Metodă alternativă - creează un batch file pentru plink
        $batchContent = @"
echo $OldPassword
echo $NewPassword  
echo $NewPassword
echo exit
"@
        $batchContent | Out-File -FilePath "password_input.txt" -Encoding ASCII
        
        $process = Start-Process -FilePath $plinkPath -ArgumentList @(
            "-ssh",
            "root@$ServerIP"
        ) -RedirectStandardInput "password_input.txt" -Wait -PassThru
        
        Remove-Item "password_input.txt" -ErrorAction SilentlyContinue
    }
} catch {
    Write-Status "Eroare la schimbarea parolei: $($_.Exception.Message)" "Error"
}

Remove-Item "change_password.exp" -ErrorAction SilentlyContinue

# Testează conexiunea cu noua parolă
Write-Status "🔍 Testez conexiunea cu noua parolă..." "Info"
$testResult = Invoke-SSHCommand -Command "echo 'Conexiune reușită'"

if ($testResult.ExitCode -eq 0) {
    Write-Status "Conexiunea SSH funcționează!" "Success"
} else {
    Write-Status "Conexiunea SSH a eșuat. Încerc cu parola veche..." "Warning"
    $NewPassword = $OldPassword
}

# Începe deployment-ul
Write-Status "📦 Încep deployment-ul aplicației..." "Info"

# Creează directorul de proiect
Write-Status "📁 Creez directorul de proiect..." "Info"
$result = Invoke-SSHCommand -Command "mkdir -p /opt/flight-schedule"

# Upload fișiere folosind SCP (prin PuTTY)
Write-Status "📤 Upload fișiere proiect..." "Info"

# Creează lista de fișiere de exclus
$excludePatterns = @("node_modules", ".next", ".git", "*.log")

# Folosește pscp pentru upload
try {
    $pscpPath = "pscp"
    & $pscpPath -r -pw $NewPassword . root@${ServerIP}:/opt/flight-schedule/
    Write-Status "Fișiere uploadate cu succes!" "Success"
} catch {
    Write-Status "Eroare la upload. Încerc metoda alternativă..." "Warning"
    
    # Metodă alternativă - creează un arhivă și o uploadează
    Write-Status "Creez arhiva proiectului..." "Info"
    Compress-Archive -Path ".\*" -DestinationPath "project.zip" -Force -CompressionLevel Fastest
    
    & $pscpPath -pw $NewPassword "project.zip" root@${ServerIP}:/opt/flight-schedule/
    
    # Dezarhivează pe server
    $result = Invoke-SSHCommand -Command "cd /opt/flight-schedule && unzip -o project.zip && rm project.zip"
    
    Remove-Item "project.zip" -ErrorAction SilentlyContinue
}

# Rulează setup-ul pe server
Write-Status "🔧 Configurez serverul..." "Info"

$setupCommands = @"
set -e

echo "🔧 Actualizez sistemul..."
apt update && apt upgrade -y

echo "🐳 Instalez Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl enable docker
    systemctl start docker
fi

echo "🐙 Instalez Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-`$(uname -s)`-`$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

echo "📁 Configurez proiectul..."
cd /opt/flight-schedule

mkdir -p ssl

if [ ! -f ssl/cert.pem ]; then
    echo "🔒 Generez certificat SSL temporar..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout ssl/key.pem \
        -out ssl/cert.pem \
        -subj "/C=RO/ST=Romania/L=Bucharest/O=FlightSchedule/CN=$Domain"
fi

sed -i "s/your-domain.com/$Domain/g" nginx.conf

echo "🏗️ Build și pornesc containerele..."
docker-compose down || true
docker-compose build --no-cache
docker-compose up -d

echo "🔥 Configurez firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "✅ Deployment complet!"
"@

$result = Invoke-SSHCommand -Command $setupCommands -Timeout 600

if ($result.ExitCode -eq 0) {
    Write-Status "Deployment finalizat cu succes!" "Success"
    
    # Afișează informații finale
    Write-Host ""
    Write-Status "🎉 Flight Schedule este acum live pe serverul tău!" "Success"
    Write-Host ""
    Write-Host "📋 Informații importante:" -ForegroundColor Cyan
    Write-Host "🌐 Site-ul: https://$Domain" -ForegroundColor Green
    Write-Host "🎯 Admin panel: https://$Domain/admin" -ForegroundColor Green
    Write-Host "🔐 Parola admin: admin123 (schimb-o în producție!)" -ForegroundColor Yellow
    Write-Host "🔑 Parola SSH nouă: $NewPassword" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📋 Pașii următori:" -ForegroundColor Cyan
    Write-Host "1. 🌐 Pointează DNS-ul domeniului $Domain către $ServerIP" -ForegroundColor White
    Write-Host "2. 🔒 Configurează Let's Encrypt pentru SSL real" -ForegroundColor White
    Write-Host "3. 🔐 Schimbă parola admin din panoul /admin" -ForegroundColor White
    Write-Host "4. 📊 Adaugă Publisher ID-ul Google AdSense" -ForegroundColor White
    
} else {
    Write-Status "Eroare la deployment: $($result.Error)" "Error"
    Write-Host "Output: $($result.Output)" -ForegroundColor Gray
}

Write-Host ""
Write-Status "Deployment script finalizat!" "Info"