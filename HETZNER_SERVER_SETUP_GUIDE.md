# Ghid Configurare Server Hetzner - Securizat și Automat

## Prezentare Generală

Acest script configurează automat un server Hetzner Cloud cu Ubuntu 22.04+ complet securizat, folosind doar autentificare SSH prin cheie, fără acces prin parolă.

## Cerințe Preliminare

### 1. Software Necesar
- PowerShell (Windows/Linux/macOS)
- OpenSSH client
- Cont Hetzner Cloud activ

### 2. Pregătire Hetzner Cloud
1. Creează un proiect în Hetzner Cloud Console
2. Asigură-te că ai acces la SSH Keys management

## Utilizare Script

### Sintaxă Completă
```powershell
.\setup-hetzner-server.ps1 -ServerIP "YOUR_SERVER_IP" [-Username "deploy"] [-SSHPort 22] [-KeyName "hetzner_server_key"]
```

### Parametri
- `ServerIP` (obligatoriu): IP-ul serverului Hetzner
- `Username` (opțional): Numele user-ului non-root (default: "deploy")
- `SSHPort` (opțional): Portul SSH (default: 22)
- `KeyName` (opțional): Numele cheii SSH (default: "hetzner_server_key")

### Exemplu de Utilizare
```powershell
.\setup-hetzner-server.ps1 -ServerIP "95.216.123.45" -Username "webadmin" -SSHPort 2222
```

## Pașii Executați de Script

### 1. Generare SSH Key
- Generează cheie ed25519 în `~/.ssh/`
- Afișează public key-ul pentru adăugare în Hetzner
- Verifică existența cheii (idempotent)

### 2. Conectare Inițială
- Testează conexiunea SSH ca root
- Verifică că cheia SSH funcționează

### 3. Crearea User-ului Non-Root
- Creează user nou (ex: deploy)
- Adaugă în grupul sudo
- Copiază authorized_keys de la root
- Testează conexiunea cu noul user

### 4. SSH Hardening
- Dezactivează PasswordAuthentication
- Dezactivează PermitRootLogin
- Configurează PubkeyAuthentication only
- Limitează MaxAuthTries și MaxSessions
- Restart SSH service

### 5. Configurare Firewall (UFW)
- Activează UFW
- Allow SSH (port configurat)
- Allow HTTP (80) și HTTPS (443)
- Default deny incoming
- Default allow outgoing

### 6. Update Sistem
- `apt update && apt upgrade -y`
- Instalează pachete esențiale:
  - curl, wget, git, unzip
  - htop, nano, vim
  - build-essential
  - fail2ban, ufw

### 7. Fail2Ban
- Configurează protecție SSH
- Bantime: 1 oră
- MaxRetry: 3 încercări
- Activează și pornește serviciul

### 8. Structură Directoare
- Creează `/var/www` (pentru web apps)
- Creează `/var/log/apps` (pentru log-uri)
- Creează `/home/USERNAME/backups`
- Setează ownership corect

### 9. Verificări Finale
- Testează că root login este dezactivat
- Verifică password authentication disabled
- Confirmă conexiunea finală funcționează

## Rezultat Final

### Server Securizat Cu:
✓ Autentificare doar prin SSH key  
✓ Login cu parolă dezactivat  
✓ Root login dezactivat  
✓ Firewall (UFW) activ  
✓ Fail2Ban pentru protecție SSH  
✓ Sistem complet actualizat  
✓ User non-root cu sudo access  
✓ Structură de directoare pentru web apps  

### Informații de Conectare
```bash
ssh -i "~/.ssh/hetzner_server_key" -p 22 deploy@YOUR_SERVER_IP
```

## Pașii Manuali Necesari

### 1. Adăugare SSH Key în Hetzner
1. Scriptul va afișa public key-ul
2. Copiază cheia afișată
3. Mergi în Hetzner Cloud Console
4. SSH Keys → Add SSH Key
5. Lipește public key-ul și salvează
6. Când creezi serverul, selectează această cheie

### 2. Crearea Serverului
1. Hetzner Cloud Console → Servers → Create Server
2. Selectează Ubuntu 22.04 LTS
3. Alege dimensiunea serverului
4. **IMPORTANT**: Selectează SSH key-ul adăugat anterior
5. Creează serverul și notează IP-ul

## Troubleshooting

### Eroare: "Nu mă pot conecta ca root"
**Cauze posibile:**
- Cheia SSH nu a fost adăugată în Hetzner
- IP-ul serverului este greșit
- Serverul nu este pornit
- Firewall local blochează conexiunea

**Soluții:**
```powershell
# Testează manual conexiunea
ssh -i "~/.ssh/hetzner_server_key" root@YOUR_SERVER_IP

# Verifică cheia SSH
Get-Content "~/.ssh/hetzner_server_key.pub"
```

### Eroare: "SSH config invalid"
**Cauză:** Configurația SSH are erori de sintaxă

**Soluție:** Scriptul face automat backup și restore în caz de eroare

### Eroare: "Conexiunea a eșuat după hardening"
**Cauză:** Configurația SSH este prea restrictivă

**Soluție:**
```bash
# Conectează-te prin Hetzner Console (web terminal)
sudo cp /etc/ssh/sshd_config.backup /etc/ssh/sshd_config
sudo systemctl restart sshd
```

## Securitate

### Măsuri Implementate
1. **SSH Key Only**: Doar autentificare prin cheie
2. **No Root Login**: Root dezactivat complet
3. **Firewall**: UFW cu reguli restrictive
4. **Fail2Ban**: Protecție împotriva brute force
5. **System Updates**: Pachete de securitate la zi
6. **Limited Users**: Doar user-ul specificat poate accesa

### Recomandări Suplimentare
1. **Backup regulat** al cheii SSH
2. **Monitorizare log-uri** în `/var/log/auth.log`
3. **Update regulat** al sistemului
4. **Configurare alertă** pentru încercări de login

## Pașii Următori

### 1. Instalare Stack Web
```bash
# Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Node.js (via NodeSource)
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Nginx
sudo apt update
sudo apt install nginx
```

### 2. Configurare Domeniu
```bash
# Editează configurația Nginx
sudo nano /etc/nginx/sites-available/your-domain.com

# Activează site-ul
sudo ln -s /etc/nginx/sites-available/your-domain.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3. SSL Certificate (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Suport și Întreținere

### Comenzi Utile
```bash
# Verifică status servicii
sudo systemctl status sshd
sudo systemctl status fail2ban
sudo ufw status

# Monitorizare log-uri
sudo tail -f /var/log/auth.log
sudo fail2ban-client status sshd

# Update sistem
sudo apt update && sudo apt upgrade -y
```

### Backup Configurații
```bash
# Backup SSH config
sudo cp /etc/ssh/sshd_config ~/backups/sshd_config.backup

# Backup UFW rules
sudo ufw --dry-run > ~/backups/ufw_rules.backup
```

Serverul este acum gata pentru deploy-ul aplicațiilor web în siguranță completă!