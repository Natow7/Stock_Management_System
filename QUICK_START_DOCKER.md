# 🚀 Quick Start - Docker Deployment

## Prerequisites

1. **Docker** installed ([Install Docker](https://docs.docker.com/get-docker/))
2. **Docker Compose** installed ([Install Docker Compose](https://docs.docker.com/compose/install/))
3. **Git** installed

---

## 🏃 Deploy in 5 Minutes

### Step 1: Clone Repository (if deploying to a server)

```bash
git clone <your-repo-url>
cd Stock_Management_System
```

### Step 2: Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit with your settings (IMPORTANT!)
nano .env
```

**Change these values in `.env`:**
```env
DB_PASSWORD=YourSecurePasswordHere123!
JWT_SECRET=YourVeryLongSecureRandomStringAtLeast32CharactersLong
```

### Step 3: Deploy

```bash
# Make deploy script executable
chmod +x deploy.sh

# Start the application
./deploy.sh start
```

That's it! 🎉

### Step 4: Access the Application

- **Frontend**: http://localhost (or http://your-server-ip)
- **Backend API**: http://localhost:4000 (or http://your-server-ip:4000)
- **Database**: localhost:5432

---

## 📋 Common Commands

```bash
# View logs
./deploy.sh logs

# View specific service logs
./deploy.sh logs backend
./deploy.sh logs frontend
./deploy.sh logs database

# Check status
./deploy.sh status

# Restart application
./deploy.sh restart

# Stop application
./deploy.sh stop

# Create database backup
./deploy.sh backup

# Update application (pull latest code)
./deploy.sh update

# Restore from backup
./deploy.sh restore ./backups/sms_backup_20240917_120000.sql.gz
```

---

## 🔧 Manual Docker Commands (if needed)

```bash
# Build containers
docker-compose build

# Start containers
docker-compose up -d

# Stop containers
docker-compose down

# View logs
docker-compose logs -f

# Access database
docker-compose exec database psql -U postgres spms

# Access backend shell
docker-compose exec backend sh

# Rebuild specific service
docker-compose build backend
docker-compose up -d backend
```

---

## 🌐 Deploy to VPS/Cloud Server

### Option 1: DigitalOcean ($6/month)

1. **Create Droplet**
   - Ubuntu 22.04
   - Basic plan ($6/month, 1GB RAM)
   - Choose datacenter region

2. **SSH into server**
   ```bash
   ssh root@your-server-ip
   ```

3. **Install Docker**
   ```bash
   # Update system
   apt update && apt upgrade -y

   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh

   # Install Docker Compose
   apt install docker-compose -y

   # Verify installation
   docker --version
   docker-compose --version
   ```

4. **Clone and Deploy**
   ```bash
   git clone <your-repo-url>
   cd Stock_Management_System
   cp .env.example .env
   nano .env  # Edit settings
   ./deploy.sh start
   ```

5. **Setup Firewall**
   ```bash
   # Allow HTTP, HTTPS, SSH
   ufw allow 22/tcp
   ufw allow 80/tcp
   ufw allow 443/tcp
   ufw enable
   ```

6. **Access**
   - Visit: http://your-server-ip

### Option 2: Oracle Cloud (FREE Forever)

1. **Create Account** at oracle.com/cloud/free
2. **Create Compute Instance**
   - VM.Standard.E2.1.Micro (Always Free)
   - Ubuntu 22.04
   - Assign public IP

3. **Configure Security List**
   - Allow ingress: Port 80, 443, 22

4. **Follow same steps as DigitalOcean** (steps 2-6 above)

---

## 🔒 Production Setup (HTTPS + Domain)

### 1. Point Domain to Server

Add DNS A record:
```
Type: A
Name: @ (or subdomain like 'sms')
Value: your-server-ip
TTL: 300
```

### 2. Install nginx Reverse Proxy

```bash
# Install nginx
apt install nginx -y

# Create nginx config
nano /etc/nginx/sites-available/sms
```

**Paste this configuration:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://localhost;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Enable site:**
```bash
ln -s /etc/nginx/sites-available/sms /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### 3. Install SSL Certificate (Free)

```bash
# Install Certbot
apt install certbot python3-certbot-nginx -y

# Get certificate
certbot --nginx -d your-domain.com

# Auto-renewal is configured automatically
# Test renewal
certbot renew --dry-run
```

Now access: https://your-domain.com 🔒

---

## 📊 Monitoring & Logs

### View Real-time Logs
```bash
./deploy.sh logs
```

### Check Container Status
```bash
docker-compose ps
```

### Check Resource Usage
```bash
docker stats
```

### Access Database
```bash
docker-compose exec database psql -U postgres spms
```

---

## 🔄 Updates & Maintenance

### Update Application
```bash
# Pull latest code and rebuild
./deploy.sh update
```

### Backup Database
```bash
# Create backup (saved in ./backups/)
./deploy.sh backup
```

### Restore Database
```bash
# List available backups
ls -lh backups/

# Restore from backup
./deploy.sh restore backups/sms_backup_20240917_120000.sql.gz
```

---

## 🐛 Troubleshooting

### Problem: Containers won't start

```bash
# Check logs
docker-compose logs

# Check specific service
docker-compose logs backend
```

### Problem: Port already in use

```bash
# Find process using port 80
sudo lsof -i :80

# Kill process
sudo kill -9 <PID>

# Or change port in docker-compose.yml
```

### Problem: Database connection failed

```bash
# Check if database is running
docker-compose ps database

# Check database logs
docker-compose logs database

# Restart database
docker-compose restart database
```

### Problem: Frontend shows "API not available"

```bash
# Check backend is running
docker-compose ps backend

# Check backend logs
docker-compose logs backend

# Check backend health
curl http://localhost:4000/api/health
```

### Reset Everything

```bash
# Stop and remove everything
docker-compose down -v

# Remove all images
docker-compose down --rmi all

# Start fresh
./deploy.sh start
```

---

## 💾 Data Persistence

Data is stored in Docker volumes:
- **Database**: `postgres_data` volume
- **Backend Logs**: `./sms-backend/logs/` folder

Even if containers are removed, data persists in volumes.

To completely remove data:
```bash
docker-compose down -v  # WARNING: This deletes all data!
```

---

## 🎯 Performance Tips

### For Production (2GB+ RAM):

1. **Increase Database Connections** in backend `.env`:
   ```env
   PG_POOL_MAX=20
   ```

2. **Enable Database Replication** (for high availability)

3. **Add Redis** for session management and caching

4. **Use CDN** for static assets (Cloudflare)

### For Low Memory (<1GB RAM):

1. **Reduce Database Connections**:
   ```env
   PG_POOL_MAX=5
   ```

2. **Add Swap Space**:
   ```bash
   fallocate -l 2G /swapfile
   chmod 600 /swapfile
   mkswap /swapfile
   swapon /swapfile
   echo '/swapfile none swap sw 0 0' >> /etc/fstab
   ```

---

## 📞 Need Help?

- Check logs: `./deploy.sh logs`
- Check status: `./deploy.sh status`
- Docker docs: https://docs.docker.com
- Contact support with logs attached

---

## ✅ Success Checklist

- [ ] Docker and Docker Compose installed
- [ ] `.env` file configured with secure passwords
- [ ] Application started: `./deploy.sh start`
- [ ] Frontend accessible on http://localhost
- [ ] Backend API responding on http://localhost:4000
- [ ] Can login with default credentials
- [ ] Backup created: `./deploy.sh backup`
- [ ] (Optional) Domain pointed to server
- [ ] (Optional) SSL certificate installed
- [ ] (Optional) Firewall configured

**Your Stock Management System is now live!** 🎉
