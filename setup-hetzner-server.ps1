# Hetzner Server Setup Script - Configurare automată server securizat
# Autor: Kiro AI Assistant
# Scop: Configurează automat un server Hetzner cu Ubuntu 22.04+, securizat cu SSH key

param(
    [Parameter(Mandatory=$true)]
    [string]$ServerIP,
    
    [Parameter(Mandatory=$false)]
    [string]$Username = "deploy",
    
    [Parameter(Mandatory=$false)]
    [int]$SSHPort = 22,
    
    [Parameter(Mandatory=$false)]
    [string]$KeyName = "hetzner_server_key"
)

# Culori pentru output
$Red = "`e[31m"
$Green = "`e[32m"
$Yellow = "`e[33m"
$Blue = "`e[34m"
$Reset = "`e[0m"

function Write-ColorOutput {
    param([string]$Message, [string]$Color = $Reset)
    Write-Host "$Color$Message$Reset"
}

function Test-SSHConnection {
    param([string]$Host, [string]$User, [string]$KeyPath, [int]$Port = 22)
    
    $testResult = ssh -i $KeyPath -p $Port -o ConnectTimeout=10 -o BatchMode=yes $User@$Host "echo 'Connection successful'" 2>$null
    return $testResult -eq "Connection successful"
}

Write-ColorOutput "=== HETZNER SERVER SETUP - CONFIGURARE AUTOMATĂ ===" $Blue
Write-ColorOutput "Server IP: $ServerIP" $Yellow
Write-ColorOutput "Username: $Username" $Yellow
Write-ColorOutput "SSH Port: $SSHPort" $Yellow

# Pas 1: SSH KEY Generation
Write-ColorOutput "`n[STEP 1] Generare SSH Key..." $Blue

$sshDir = "$env:USERPROFILE\.ssh"
$privateKeyPath = "$sshDir\$KeyName"
$publicKeyPath = "$sshDir\$KeyName.pub"

if (!(Test-Path $sshDir)) {
    New-Item -ItemType Directory -Path $sshDir -Force | Out-Null
}

if (!(Test-Path $privateKeyPath)) {
    Write-ColorOutput "Generez cheie SSH ed25519..." $Yellow
    ssh-keygen -t ed25519 -f $privateKeyPath -N '""' -C "hetzner-server-$Username"
    
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput "EROARE: Nu s-a putut genera cheia SSH!" $Red
        exit 1
    }
    
    Write-ColorOutput "Cheie SSH generată cu succes!" $Green
} else {
    Write-ColorOutput "Cheia SSH există deja: $privateKeyPath" $Green
}

# Afișează public key
if (Test-Path $publicKeyPath) {
    $publicKey = Get-Content $publicKeyPath
    Write-ColorOutput "`n=== PUBLIC KEY ===" $Yellow
    Write-ColorOutput $publicKey $Green
    Write-ColorOutput "===================" $Yellow
    
    Write-ColorOutput "`nPASUL MANUAL NECESAR:" $Red
    Write-ColorOutput "1. Copiază public key-ul de mai sus" $Yellow
    Write-ColorOutput "2. Mergi în Hetzner Cloud Console" $Yellow
    Write-ColorOutput "3. SSH Keys -> Add SSH Key" $Yellow
    Write-ColorOutput "4. Lipește public key-ul și salvează" $Yellow
    Write-ColorOutput "5. Când creezi serverul, selectează această cheie SSH" $Yellow
    
    $continue = Read-Host "`nAi adăugat cheia în Hetzner și serverul este creat? (y/N)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        Write-ColorOutput "Opresc scriptul. Rulează din nou după ce adaugi cheia SSH." $Red
        exit 0
    }
} else {
    Write-ColorOutput "EROARE: Nu s-a găsit public key-ul!" $Red
    exit 1
}

# Pas 2: Conectare inițială ca root
Write-ColorOutput "`n[STEP 2] Testez conexiunea SSH ca root..." $Blue

if (!(Test-SSHConnection -Host $ServerIP -User "root" -KeyPath $privateKeyPath -Port $SSHPort)) {
    Write-ColorOutput "EROARE: Nu mă pot conecta ca root! Verifică:" $Red
    Write-ColorOutput "- IP-ul serverului: $ServerIP" $Yellow
    Write-ColorOutput "- Cheia SSH este adăugată în Hetzner" $Yellow
    Write-ColorOutput "- Serverul este pornit" $Yellow
    exit 1
}

Write-ColorOutput "Conexiune SSH ca root: SUCCESS!" $Green

# Pas 3: Creează user non-root
Write-ColorOutput "`n[STEP 3] Creez user non-root: $Username..." $Blue

$createUserScript = @"
#!/bin/bash
set -e

# Creează user dacă nu există
if ! id "$1" &>/dev/null; then
    useradd -m -s /bin/bash "$1"
    echo "User $1 creat cu succes"
else
    echo "User $1 există deja"
fi

# Adaugă în grupul sudo
usermod -aG sudo "$1"

# Creează directorul .ssh pentru user
mkdir -p /home/$1/.ssh
chmod 700 /home/$1/.ssh

# Copiază authorized_keys de la root
cp /root/.ssh/authorized_keys /home/$1/.ssh/authorized_keys
chmod 600 /home/$1/.ssh/authorized_keys
chown -R $1:$1 /home/$1/.ssh

echo "User $1 configurat cu succes pentru SSH key authentication"
"@

$createUserScript | ssh -i $privateKeyPath -p $SSHPort root@$ServerIP "cat > /tmp/create_user.sh && chmod +x /tmp/create_user.sh && /tmp/create_user.sh $Username"

if ($LASTEXITCODE -ne 0) {
    Write-ColorOutput "EROARE: Nu s-a putut crea user-ul $Username!" $Red
    exit 1
}

Write-ColorOutput "User $Username creat și configurat!" $Green

# Testează conexiunea cu noul user
Write-ColorOutput "Testez conexiunea cu user-ul $Username..." $Yellow
if (Test-SSHConnection -Host $ServerIP -User $Username -KeyPath $privateKeyPath -Port $SSHPort) {
    Write-ColorOutput "Conexiune cu $Username: SUCCESS!" $Green
} else {
    Write-ColorOutput "EROARE: Nu mă pot conecta cu user-ul $Username!" $Red
    exit 1
}

# Pas 4: SSH Hardening
Write-ColorOutput "`n[STEP 4] SSH Hardening..." $Blue

$sshHardeningScript = @"
#!/bin/bash
set -e

# Backup configurația SSH
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup

# Configurează SSH securizat
cat > /etc/ssh/sshd_config << 'EOF'
# SSH Configuration - Securizat pentru Hetzner
Port $SSHPort
Protocol 2

# Authentication
PubkeyAuthentication yes
PasswordAuthentication no
PermitEmptyPasswords no
PermitRootLogin no
AuthenticationMethods publickey

# Security
X11Forwarding no
AllowAgentForwarding no
AllowTcpForwarding no
PermitTunnel no

# Connection settings
ClientAliveInterval 300
ClientAliveCountMax 2
MaxAuthTries 3
MaxSessions 2

# Logging
SyslogFacility AUTH
LogLevel INFO

# Allow only specific user
AllowUsers $Username

EOF

# Testează configurația SSH
sshd -t
if [ \$? -eq 0 ]; then
    echo "SSH config valid"
    systemctl restart sshd
    systemctl enable sshd
    echo "SSH service restartat cu succes"
else
    echo "EROARE: SSH config invalid!"
    cp /etc/ssh/sshd_config.backup /etc/ssh/sshd_config
    exit 1
fi
"@

$sshHardeningScript | ssh -i $privateKeyPath -p $SSHPort $Username@$ServerIP "sudo bash"

if ($LASTEXITCODE -ne 0) {
    Write-ColorOutput "EROARE: SSH hardening a eșuat!" $Red
    exit 1
}

Write-ColorOutput "SSH hardening completat!" $Green

# Testează din nou conexiunea după hardening
Write-ColorOutput "Testez conexiunea după hardening..." $Yellow
Start-Sleep -Seconds 5

if (Test-SSHConnection -Host $ServerIP -User $Username -KeyPath $privateKeyPath -Port $SSHPort) {
    Write-ColorOutput "Conexiune după hardening: SUCCESS!" $Green
} else {
    Write-ColorOutput "EROARE: Conexiunea a eșuat după hardening!" $Red
    exit 1
}

# Pas 5: Firewall (UFW)
Write-ColorOutput "`n[STEP 5] Configurez Firewall (UFW)..." $Blue

$firewallScript = @"
#!/bin/bash
set -e

# Resetează UFW la default
ufw --force reset

# Configurează default policies
ufw default deny incoming
ufw default allow outgoing

# Allow SSH
ufw allow $SSHPort/tcp comment 'SSH'

# Allow HTTP/HTTPS
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'

# Activează UFW
ufw --force enable

# Afișează status
ufw status verbose
"@

$firewallScript | ssh -i $privateKeyPath -p $SSHPort $Username@$ServerIP "sudo bash"

Write-ColorOutput "Firewall configurat și activat!" $Green
# Pas 6: Update sistem și pachete de bază
Write-ColorOutput "`n[STEP 6] Update sistem și instalez pachete de bază..." $Blue

$systemUpdateScript = @"
#!/bin/bash
set -e

# Update package lists
apt update

# Upgrade system
DEBIAN_FRONTEND=noninteractive apt upgrade -y

# Install essential packages
DEBIAN_FRONTEND=noninteractive apt install -y \
    curl \
    wget \
    git \
    unzip \
    htop \
    nano \
    vim \
    build-essential \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    fail2ban \
    ufw

echo "Pachete de bază instalate cu succes"
"@

$systemUpdateScript | ssh -i $privateKeyPath -p $SSHPort $Username@$ServerIP "sudo bash"

Write-ColorOutput "Sistem actualizat și pachete instalate!" $Green

# Pas 7: Fail2Ban
Write-ColorOutput "`n[STEP 7] Configurez Fail2Ban..." $Blue

$fail2banScript = @"
#!/bin/bash
set -e

# Configurează Fail2Ban pentru SSH
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3
backend = systemd

[sshd]
enabled = true
port = $SSHPort
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
EOF

# Pornește și activează Fail2Ban
systemctl enable fail2ban
systemctl restart fail2ban

# Verifică status
systemctl status fail2ban --no-pager
fail2ban-client status
"@

$fail2banScript | ssh -i $privateKeyPath -p $SSHPort $Username@$ServerIP "sudo bash"

Write-ColorOutput "Fail2Ban configurat și activat!" $Green

# Pas 8: Structură server
Write-ColorOutput "`n[STEP 8] Creez structura de directoare..." $Blue

$directoryScript = @"
#!/bin/bash
set -e

# Creează directoare pentru aplicații web
mkdir -p /var/www
mkdir -p /var/log/apps

# Setează ownership către user-ul deploy
chown -R $Username:$Username /var/www
chown -R $Username:$Username /var/log/apps

# Setează permisiuni
chmod 755 /var/www
chmod 755 /var/log/apps

# Creează directorul pentru backup-uri
mkdir -p /home/$Username/backups
chown $Username:$Username /home/$Username/backups

echo "Structura de directoare creată cu succes"
ls -la /var/www
ls -la /var/log/apps
"@

$directoryScript | ssh -i $privateKeyPath -p $SSHPort $Username@$ServerIP "sudo bash"

Write-ColorOutput "Structura de directoare creată!" $Green

# Pas 9: Verificări finale și output
Write-ColorOutput "`n[STEP 9] Verificări finale..." $Blue

# Verifică că root login este dezactivat
$rootTestResult = ssh -i $privateKeyPath -p $SSHPort -o ConnectTimeout=5 -o BatchMode=yes root@$ServerIP "echo 'root access'" 2>$null
if ($rootTestResult -eq "root access") {
    Write-ColorOutput "AVERTISMENT: Root login încă funcționează!" $Red
} else {
    Write-ColorOutput "Root login dezactivat cu succes!" $Green
}

# Verifică că password authentication este dezactivată
$passwordAuthCheck = ssh -i $privateKeyPath -p $SSHPort $Username@$ServerIP "sudo sshd -T | grep passwordauthentication"
Write-ColorOutput "Password Authentication Status: $passwordAuthCheck" $Yellow

# Test final de conectare
if (Test-SSHConnection -Host $ServerIP -User $Username -KeyPath $privateKeyPath -Port $SSHPort) {
    Write-ColorOutput "`n=== CONFIGURARE COMPLETĂ CU SUCCES! ===" $Green
} else {
    Write-ColorOutput "`nERORE: Conexiunea finală a eșuat!" $Red
    exit 1
}

# Output final
Write-ColorOutput "`n" + "="*50 $Blue
Write-ColorOutput "SERVERUL HETZNER ESTE GATA PENTRU UTILIZARE!" $Green
Write-ColorOutput "="*50 $Blue

Write-ColorOutput "`nDetalii server:" $Yellow
Write-ColorOutput "IP Server: $ServerIP" $Green
Write-ColorOutput "User creat: $Username" $Green
Write-ColorOutput "Port SSH: $SSHPort" $Green
Write-ColorOutput "Cheie SSH: $privateKeyPath" $Green

Write-ColorOutput "`nComanda de conectare:" $Yellow
Write-ColorOutput "ssh -i `"$privateKeyPath`" -p $SSHPort $Username@$ServerIP" $Green

Write-ColorOutput "`nSiguranță configurată:" $Yellow
Write-ColorOutput "✓ Autentificare doar prin SSH key" $Green
Write-ColorOutput "✓ Login cu parolă dezactivat" $Green
Write-ColorOutput "✓ Root login dezactivat" $Green
Write-ColorOutput "✓ Firewall (UFW) activ" $Green
Write-ColorOutput "✓ Fail2Ban activ" $Green
Write-ColorOutput "✓ Sistem actualizat" $Green

Write-ColorOutput "`nDirectoare create:" $Yellow
Write-ColorOutput "✓ /var/www (pentru aplicații web)" $Green
Write-ColorOutput "✓ /var/log/apps (pentru log-uri)" $Green
Write-ColorOutput "✓ /home/$Username/backups (pentru backup-uri)" $Green

Write-ColorOutput "`nPașii următori:" $Yellow
Write-ColorOutput "1. Conectează-te: ssh -i `"$privateKeyPath`" -p $SSHPort $Username@$ServerIP" $Blue
Write-ColorOutput "2. Instalează Docker/Nginx/Node.js după necesități" $Blue
Write-ColorOutput "3. Configurează aplicațiile web în /var/www" $Blue

Write-ColorOutput "`n" + "="*50 $Blue
Write-ColorOutput "SETUP COMPLET!" $Green
Write-ColorOutput "="*50 $Blue