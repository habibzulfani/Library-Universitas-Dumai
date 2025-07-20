# 🚀 Hostinger VPS Deployment Guide

## 📋 Prerequisites

- ✅ Hostinger VPS purchased
- ✅ Server access credentials
- ✅ Domain (optional for initial testing)

## 🔧 Step-by-Step Deployment

### **Step 1: Access Your Hostinger VPS**

#### **Option A: Web Terminal (Recommended for beginners)**
1. Log in to your Hostinger control panel
2. Go to **VPS** → **Your VPS** → **Terminal**
3. Click **Launch Terminal**

#### **Option B: SSH from your computer**
```bash
ssh root@YOUR_SERVER_IP
```

### **Step 2: Run the Deployment Script**

Once you're connected to your server, run:

```bash
# Download the deployment script
wget https://raw.githubusercontent.com/habibzulfani/e-repository/main/deploy.sh

# Make it executable
chmod +x deploy.sh

# Run the deployment
./deploy.sh
```

**Or if you want to run it step by step:**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Nginx
sudo apt install -y nginx certbot python3-certbot-nginx

# Create application directory
sudo mkdir -p /var/www/e-repository
sudo chown $USER:$USER /var/www/e-repository
cd /var/www/e-repository

# Clone your repository
git clone https://github.com/habibzulfani/e-repository.git .
```

### **Step 3: Configure Production Environment**

```bash
# Copy production template
cp env.production.template .env

# Edit the configuration
nano .env
```

**Important: Change these values in `.env`:**
```bash
# Change these passwords to secure ones
MYSQL_ROOT_PASSWORD=your-very-secure-root-password
MYSQL_PASSWORD=your-very-secure-password
JWT_SECRET=your-super-secure-jwt-secret-key

# Update API URL when domain is ready
NEXT_PUBLIC_API_URL=https://repository.unidum.ac.id/api
```

### **Step 4: Start the Application**

```bash
# Build and start all services
docker compose --env-file .env up -d --build

# Check if everything is running
docker compose ps

# View logs if needed
docker compose logs -f
```

### **Step 5: Test Your Application**

Your application should now be accessible at:
- **Frontend**: `http://YOUR_SERVER_IP`
- **API**: `http://YOUR_SERVER_IP/api`

## 🔒 Security Setup

### **Change Default Passwords**
```bash
# Access MySQL container
docker exec -it e-repository-mysql mysql -u root -p

# Change root password
ALTER USER 'root'@'localhost' IDENTIFIED BY 'your-new-secure-password';
FLUSH PRIVILEGES;
```

### **Set Up SSL Certificate (when domain is ready)**
```bash
# Get SSL certificate
sudo certbot --nginx -d repository.unidum.ac.id

# Test auto-renewal
sudo certbot renew --dry-run
```

## 📊 Monitoring & Maintenance

### **Check Application Status**
```bash
# View running containers
docker compose ps

# View logs
docker compose logs -f

# Check system resources
htop
```

### **Update Application**
```bash
cd /var/www/e-repository
git pull
docker compose --env-file .env up -d --build
```

### **Backup Database**
```bash
# Create backup
docker exec e-repository-mysql mysqldump -u root -p e_repository_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
docker exec -i e-repository-mysql mysql -u root -p e_repository_db < backup_file.sql
```

## 🐛 Troubleshooting

### **Application Not Starting**
```bash
# Check logs
docker compose logs

# Check disk space
df -h

# Check memory
free -h

# Restart services
docker compose restart
```

### **Port Already in Use**
```bash
# Check what's using the port
sudo lsof -i :3306

# Kill process if needed
sudo kill -9 PROCESS_ID
```

### **Nginx Issues**
```bash
# Check Nginx status
sudo systemctl status nginx

# Check Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

## 📞 Hostinger Support

If you encounter issues with your VPS:

1. **Check Hostinger Knowledge Base**
2. **Contact Hostinger Support** via:
   - Live Chat
   - Support Ticket
   - Phone Support

## 🎯 Next Steps After Deployment

1. **✅ Test all features** of your application
2. **✅ Set up SSL certificate** when domain is ready
3. **✅ Configure domain** in Hostinger DNS
4. **✅ Set up regular backups**
5. **✅ Monitor performance**
6. **✅ Set up alerts** for downtime

## 📱 Access Information

After successful deployment, you'll have:

- **Frontend**: `http://YOUR_SERVER_IP`
- **API**: `http://YOUR_SERVER_IP/api`
- **Admin Panel**: `http://YOUR_SERVER_IP` (login with admin credentials)
- **Database**: Accessible via Docker container

## 🔑 Default Admin Credentials

- **Email**: admin@demo.com
- **Password**: password123

**⚠️ IMPORTANT**: Change these credentials immediately after deployment!

---

**Need help?** Check the logs with `docker compose logs -f` or contact support. 