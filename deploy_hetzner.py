#!/usr/bin/env python3
"""
Script de deployment automat pentru serverul Hetzner
Gestionează schimbarea parolei și deployment-ul aplicației
"""

import subprocess
import sys
import time
import os

# Configurație
SERVER_IP = "23.88.113.154"
OLD_PASSWORD = "ba94wtRqEnMu773TpWEr"
NEW_PASSWORD = "FlightSchedule2024!"
DOMAIN = "victoriaocara.com"
USERNAME = "root"

def run_command(command, input_text=None):
    """Rulează o comandă și returnează rezultatul"""
    try:
        if input_text:
            result = subprocess.run(command, shell=True, input=input_text, 
                                  text=True, capture_output=True, timeout=60)
        else:
            result = subprocess.run(command, shell=True, capture_output=True, 
                                  text=True, timeout=60)
        return result.returncode == 0, result.stdout, result.stderr
    except subprocess.TimeoutExpired:
        return False, "", "Timeout"

def print_status(message, status="INFO"):
    """Afișează mesaje cu culori"""
    colors = {
        "INFO": "\033[94m",
        "SUCCESS": "\033[92m", 
        "WARNING": "\033[93m",
        "ERROR": "\033[91m"
    }
    print(f"{colors.get(status, '')}{message}\033[0m")

def change_password():
    """Schimbă parola pe server folosind expect"""
    print_status("🔐 Schimb parola pe server...", "INFO")
    
    expect_script = f'''
import pexpect
import sys

try:
    child = pexpect.spawn('ssh -o StrictHostKeyChecking=no {USERNAME}@{SERVER_IP}')
    child.timeout = 30
    
    # Așteaptă prompt-ul pentru parolă
    child.expect('password:')
    child.sendline('{OLD_PASSWORD}')
    
    # Așteaptă cererea pentru parola nouă
    child.expect('New password:')
    child.sendline('{NEW_PASSWORD}')
    
    # Confirmă parola nouă
    child.expect('Retype new password:')
    child.sendline('{NEW_PASSWORD}')
    
    # Așteaptă prompt-ul shell
    child.expect(['# ', '$ '])
    child.sendline('echo "Parola schimbată cu succes"')
    child.expect(['# ', '$ '])
    
    child.sendline('exit')
    child.close()
    
    print("SUCCESS")
    
except Exception as e:
    print(f"ERROR: {{e}}")
    sys.exit(1)
'''
    
    # Salvează scriptul Python temporar
    with open('temp_password_change.py', 'w') as f:
        f.write(expect_script)
    
    # Încearcă să instaleze pexpect dacă nu există
    subprocess.run([sys.executable, '-m', 'pip', 'install', 'pexpect'], 
                   capture_output=True)
    
    # Rulează scriptul
    success, stdout, stderr = run_command(f'{sys.executable} temp_password_change.py')
    
    # Șterge fișierul temporar
    if os.path.exists('temp_password_change.py'):
        os.remove('temp_password_change.py')
    
    if success and "SUCCESS" in stdout:
        print_status("✅ Parola schimbată cu succes!", "SUCCESS")
        return True
    else:
        print_status(f"❌ Eroare la schimbarea parolei: {stderr}", "ERROR")
        return False

def test_ssh_connection():
    """Testează conexiunea SSH cu noua parolă"""
    print_status("🔍 Testez conexiunea SSH...", "INFO")
    
    # Folosește sshpass dacă este disponibil
    command = f'sshpass -p "{NEW_PASSWORD}" ssh -o StrictHostKeyChecking=no {USERNAME}@{SERVER_IP} "echo \\"Conexiune reușită\\""'
    success, stdout, stderr = run_command(command)
    
    if success:
        print_status("✅ Conexiunea SSH funcționează!", "SUCCESS")
        return True
    else:
        print_status("❌ Conexiunea SSH a eșuat", "ERROR")
        return False

def deploy_application():
    """Deployment-ul aplicației pe server"""
    print_status("🚀 Încep deployment-ul aplicației...", "INFO")
    
    # Upload fișiere
    print_status("📤 Upload fișiere proiect...", "INFO")
    rsync_command = f'rsync -avz --exclude node_modules --exclude .next --exclude .git ./ {USERNAME}@{SERVER_IP}:/opt/flight-schedule/'
    
    # Folosește sshpass pentru rsync
    rsync_with_pass = f'sshpass -p "{NEW_PASSWORD}" {rsync_command}'
    success, stdout, stderr = run_command(rsync_with_pass)
    
    if not success:
        print_status(f"❌ Eroare la upload: {stderr}", "ERROR")
        return False
    
    print_status("✅ Fișiere uploadate cu succes!", "SUCCESS")
    
    # Rulează comenzile de setup pe server
    print_status("🔧 Configurez serverul...", "INFO")
    
    setup_commands = f'''
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
        curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
    fi
    
    echo "📁 Configurez proiectul..."
    cd /opt/flight-schedule
    
    mkdir -p ssl
    
    if [ ! -f ssl/cert.pem ]; then
        echo "🔒 Generez certificat SSL temporar..."
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \\
            -keyout ssl/key.pem \\
            -out ssl/cert.pem \\
            -subj "/C=RO/ST=Romania/L=Bucharest/O=FlightSchedule/CN={DOMAIN}"
    fi
    
    sed -i "s/your-domain.com/{DOMAIN}/g" nginx.conf
    
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
    '''
    
    ssh_command = f'sshpass -p "{NEW_PASSWORD}" ssh -o StrictHostKeyChecking=no {USERNAME}@{SERVER_IP} "{setup_commands}"'
    success, stdout, stderr = run_command(ssh_command)
    
    if success:
        print_status("✅ Deployment finalizat cu succes!", "SUCCESS")
        return True
    else:
        print_status(f"❌ Eroare la deployment: {stderr}", "ERROR")
        return False

def main():
    """Funcția principală"""
    print_status("🚀 Încep deployment-ul Flight Schedule pe Hetzner...", "INFO")
    print_status(f"📡 Server: {SERVER_IP}", "INFO")
    print_status(f"🌐 Domeniu: {DOMAIN}", "INFO")
    
    # Verifică dacă sshpass este instalat
    success, _, _ = run_command("sshpass -V")
    if not success:
        print_status("📦 Instalez sshpass...", "WARNING")
        if sys.platform.startswith('linux'):
            run_command("sudo apt-get update && sudo apt-get install -y sshpass")
        elif sys.platform == 'darwin':
            run_command("brew install sshpass")
        else:
            print_status("❌ Te rog să instalezi sshpass manual", "ERROR")
            return False
    
    # Schimbă parola
    if not change_password():
        print_status("❌ Nu am putut schimba parola. Încearcă manual.", "ERROR")
        return False
    
    # Testează conexiunea
    if not test_ssh_connection():
        return False
    
    # Deploy aplicația
    if not deploy_application():
        return False
    
    # Afișează informații finale
    print_status("🎉 Deployment finalizat cu succes!", "SUCCESS")
    print()
    print_status("📋 Informații importante:", "INFO")
    print(f"🌐 Site-ul: https://{DOMAIN}")
    print(f"🎯 Admin panel: https://{DOMAIN}/admin")
    print(f"🔐 Parola admin: admin123 (schimb-o în producție!)")
    print(f"🔑 Parola SSH nouă: {NEW_PASSWORD}")
    print()
    print_status("📋 Pașii următori:", "WARNING")
    print("1. 🌐 Pointează DNS-ul domeniului către serverul tău")
    print("2. 🔒 Configurează Let's Encrypt pentru SSL real")
    print("3. 🔐 Schimbă parola admin din panoul /admin")
    print("4. 📊 Adaugă Publisher ID-ul Google AdSense")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)