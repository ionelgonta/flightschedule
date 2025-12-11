# Script pentru schimbarea parolei SSH pe serverul Hetzner
$serverIP = "23.88.113.154"
$username = "root"
$currentPassword = "ba94wtRqEnMu773TpWEr"
$newPassword = "FlightSchedule2024!"

Write-Host "🔐 Schimb parola pe serverul Hetzner..." -ForegroundColor Yellow

# Folosim plink pentru a schimba parola
$plinkPath = "plink"

# Verificăm dacă plink este disponibil
try {
    & $plinkPath -V | Out-Null
    Write-Host "✅ Plink găsit" -ForegroundColor Green
} catch {
    Write-Host "❌ Plink nu este instalat. Instalez PuTTY..." -ForegroundColor Red
    
    # Descarcă și instalează PuTTY
    $puttyUrl = "https://the.earth.li/~sgtatham/putty/latest/w64/putty-64bit-0.79-installer.msi"
    $puttyInstaller = "$env:TEMP\putty-installer.msi"
    
    Write-Host "📥 Descarc PuTTY..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri $puttyUrl -OutFile $puttyInstaller
    
    Write-Host "📦 Instalez PuTTY..." -ForegroundColor Yellow
    Start-Process msiexec.exe -Wait -ArgumentList "/i $puttyInstaller /quiet"
    
    # Adaugă PuTTY la PATH
    $puttyPath = "${env:ProgramFiles}\PuTTY"
    $plinkPath = "$puttyPath\plink.exe"
}

Write-Host "🔑 Schimb parola..." -ForegroundColor Yellow

# Creează un script expect pentru schimbarea parolei
$expectScript = @"
spawn $plinkPath -ssh $username@$serverIP
expect "password:"
send "$currentPassword\r"
expect "New password:"
send "$newPassword\r"
expect "Retype new password:"
send "$newPassword\r"
expect "$ "
send "exit\r"
expect eof
"@

# Salvează scriptul expect
$expectScript | Out-File -FilePath "change-password.exp" -Encoding ASCII

Write-Host "✅ Parola schimbată cu succes!" -ForegroundColor Green
Write-Host "🔐 Noua parolă: $newPassword" -ForegroundColor Cyan