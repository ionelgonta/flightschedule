# Hetzner Server - Comenzi Rapide

## Conectare SSH
```bash
# Conectare standard
ssh -i "~/.ssh/hetzner_server_key" -p 22 deploy@YOUR_SERVER_IP

# Conectare cu port custom
ssh -i "~/.ssh/hetzner_server_key" -p 2222 deploy@YOUR_SERVER_IP

# Conectare cu forwarding port local
ssh -i "~/.ssh/hetzner_server_key" -L 8080:localhost:80 deploy@YOUR_SERVER_IP
```

## Rulare Script Setup
```powershell
# Setup basic
.\setup-hetzner-server.ps1 -ServerIP "95.216.123.45"

# Setup cu parametri custom
.\setup-hetzner-server.ps1 -ServerIP "95.216.123.45" -Username "webadmin" -SSHPort 2222

# Setup cu nume cheie custom
.\setup-hetzner-server.ps1 -ServerIP "95.216.123.45" -KeyName "my_hetzner_key"
```

## Verificări Securitate
```bash
# Status SSH
sudo systemctl status sshd

# Verifică configurația SSH
sudo sshd -T | grep -E "(passwordauth|permitroot|pubkey)"

# Status Firewall
sudo ufw status verbose

# Status Fail2Ban
sudo fail2ban-client status
sudo fail2ban-client status sshd

# Log-uri autentificare
sudo tail -f /var/log/auth.log

# Verifică utilizatori conectați
who
w
```

## Managementul Serviciilor
```bash
# Restart SSH (ATENȚIE!)
sudo systemctl restart sshd

# Reload SSH config
sudo systemctl reload sshd

# Restart Fail2Ban
sudo systemctl restart fail2ban

# Restart Firewall
sudo ufw --force enable
```

## Instalare Stack Web

### Docker
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker
```

### Node.js LTS
```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Nginx
```bash
sudo apt update
sudo apt install nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### PM2 (Process Manager)
```bash
sudo npm install -g pm2
pm2 startup
```

## Configurare Domeniu și SSL

### Nginx Virtual Host
```bash
# Creează configurația
sudo nano /etc/nginx/sites-available/your-domain.com

# Activează site-ul
sudo ln -s /etc/nginx/sites-available/your-domain.com /etc/nginx/sites-enabled/

# Testează configurația
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Let's Encrypt SSL
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
sudo certbot renew --dry-run
```

## Monitorizare și Întreținere

### System Resources
```bash
# CPU și RAM
htop
free -h
df -h

# Procese active
ps aux | grep nginx
ps aux | grep node

# Network connections
sudo netstat -tulpn
sudo ss -tulpn
```

### Log Files
```bash
# SSH attempts
sudo tail -f /var/log/auth.log

# Nginx access
sudo tail -f /var/log/nginx/access.log

# Nginx errors
sudo tail -f /var/log/nginx/error.log

# System messages
sudo tail -f /var/log/syslog
```

### Updates și Cleanup
```bash
# Update sistem
sudo apt update && sudo apt upgrade -y

# Cleanup pachete
sudo apt autoremove -y
sudo apt autoclean

# Cleanup log-uri vechi
sudo journalctl --vacuum-time=7d
```

## Backup și Recovery

### Backup Configurații
```bash
# Creează director backup
mkdir -p ~/backups/$(date +%Y%m%d)

# Backup SSH config
sudo cp /etc/ssh/sshd_config ~/backups/$(date +%Y%m%d)/

# Backup Nginx configs
sudo cp -r /etc/nginx/sites-available ~/backups/$(date +%Y%m%d)/

# Backup UFW rules
sudo cp /etc/ufw/user.rules ~/backups/$(date +%Y%m%d)/
```

### Recovery SSH Access
```bash
# Prin Hetzner Console (dacă SSH nu funcționează)
sudo cp /etc/ssh/sshd_config.backup /etc/ssh/sshd_config
sudo systemctl restart sshd

# Reset UFW (dacă firewall blochează)
sudo ufw --force reset
sudo ufw allow 22/tcp
sudo ufw --force enable
```

## Troubleshooting Rapid

### SSH Connection Issues
```bash
# Test conexiune verbose
ssh -v -i "~/.ssh/hetzner_server_key" deploy@YOUR_SERVER_IP

# Verifică permisiuni cheie
chmod 600 ~/.ssh/hetzner_server_key
chmod 644 ~/.ssh/hetzner_server_key.pub
```

### Port Issues
```bash
# Verifică ce porturile sunt deschise
sudo netstat -tulpn | grep LISTEN
sudo ss -tulpn | grep LISTEN

# Testează port extern
telnet YOUR_SERVER_IP 80
telnet YOUR_SERVER_IP 443
```

### Performance Issues
```bash
# Verifică load average
uptime
cat /proc/loadavg

# Verifică disk space
df -h
du -sh /var/log/*

# Verifică memory usage
free -h
cat /proc/meminfo
```

## Comenzi de Urgență

### Stop All Services
```bash
sudo systemctl stop nginx
sudo systemctl stop fail2ban
pm2 stop all
```

### Emergency SSH Reset
```bash
# Prin Hetzner Console
sudo sed -i 's/PasswordAuthentication no/PasswordAuthentication yes/' /etc/ssh/sshd_config
sudo systemctl restart sshd
# ATENȚIE: Reactivează imediat security după debug!
```

### Firewall Emergency Disable
```bash
sudo ufw --force disable
# ATENȚIE: Reactivează imediat după debug!
```

Păstrează această listă la îndemână pentru administrarea rapidă a serverului!