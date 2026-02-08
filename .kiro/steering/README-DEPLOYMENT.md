# Deployment Guide - anyway.ro Server

## 🚀 Quick Reference

### **Project Isolation (READ FIRST!)**
📖 **See**: [project-isolation-rules.md](./project-isolation-rules.md)

### **Port Assignments**
- **anyway.ro** → Port 3000
- **victoriaocara.com** → Port 3001
- **citytravel.ro** → Port 3002

### **Deployment Workflows**
📖 **See**: [nginx-deployment-rules.md](./nginx-deployment-rules.md)

### **Port Configuration**
📖 **See**: [port-configuration-rules.md](./port-configuration-rules.md)

## ⚠️ CRITICAL RULES

1. **NEVER** change port assignments
2. **NEVER** modify project directories
3. **NEVER** mix configurations between projects
4. **ALWAYS** check isolation rules before deployment
5. **ALWAYS** verify all sites after changes

## 🔍 Quick Verification

```bash
# Check all sites
curl -I https://anyway.ro
curl -I https://victoriaocara.com
curl -I https://citytravel.ro

# Check ports
netstat -tulpn | grep -E ':(3000|3001|3002)' | grep LISTEN

# Check PM2
pm2 list
```

## 📚 Documentation Files

- `project-isolation-rules.md` - Complete isolation rules
- `nginx-deployment-rules.md` - Nginx configuration rules
- `port-configuration-rules.md` - Port assignment rules
- `citytravel-separation-explanation.md` - **Why citytravel.ro has separate config**
- `troubleshooting-guide.md` - Troubleshooting procedures

---
**Remember**: Each project is completely isolated. Changes to one project NEVER affect others.
