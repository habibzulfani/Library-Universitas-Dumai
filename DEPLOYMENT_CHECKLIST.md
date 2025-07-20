# ✅ Hostinger VPS Deployment Checklist

## 📋 Pre-Deployment Checklist

- [ ] **Hostinger VPS** purchased and activated
- [ ] **Server IP address** noted down
- [ ] **SSH credentials** or **Web Terminal access** ready
- [ ] **Domain** purchased (optional for initial testing)
- [ ] **Local application** tested and working

## 🚀 Deployment Steps

### **Step 1: Server Access**
- [ ] Access Hostinger control panel
- [ ] Navigate to VPS → Your VPS → Terminal
- [ ] Launch Web Terminal (or SSH from local machine)

### **Step 2: Run Deployment Script**
- [ ] Download deployment script: `wget https://raw.githubusercontent.com/habibzulfani/e-repository/main/deploy.sh`
- [ ] Make executable: `chmod +x deploy.sh`
- [ ] Run script: `./deploy.sh`
- [ ] Wait for completion (15-30 minutes)

### **Step 3: Configure Environment**
- [ ] Copy production template: `cp env.production.template .env`
- [ ] Edit configuration: `nano .env`
- [ ] Change all passwords to secure ones
- [ ] Update API URL when domain is ready

### **Step 4: Start Application**
- [ ] Build and start: `docker compose --env-file .env up -d --build`
- [ ] Check status: `docker compose ps`
- [ ] Verify all containers are running

### **Step 5: Test Application**
- [ ] Test frontend: `http://YOUR_SERVER_IP`
- [ ] Test API: `http://YOUR_SERVER_IP/api`
- [ ] Test admin login: admin@demo.com / password123
- [ ] Test file upload functionality
- [ ] Test search functionality

## 🔒 Security Setup

### **Immediate Actions**
- [ ] Change admin password
- [ ] Change MySQL root password
- [ ] Change application passwords in .env
- [ ] Set up firewall rules
- [ ] Disable root SSH login (optional)

### **When Domain is Ready**
- [ ] Configure domain DNS in Hostinger
- [ ] Update Nginx configuration with domain
- [ ] Set up SSL certificate: `sudo certbot --nginx -d repository.unidum.ac.id`
- [ ] Test HTTPS access
- [ ] Update API URL in .env to use HTTPS

## 📊 Post-Deployment

### **Monitoring**
- [ ] Set up log monitoring
- [ ] Check application performance
- [ ] Monitor disk space usage
- [ ] Set up backup schedule
- [ ] Test backup restoration

### **Maintenance**
- [ ] Schedule regular updates
- [ ] Set up automated backups
- [ ] Monitor error logs
- [ ] Set up uptime monitoring
- [ ] Plan for scaling if needed

## 🐛 Troubleshooting

### **Common Issues**
- [ ] Application not starting → Check logs: `docker compose logs -f`
- [ ] Port conflicts → Check: `sudo lsof -i :3306`
- [ ] Nginx issues → Check: `sudo systemctl status nginx`
- [ ] Database connection → Check: `docker exec -it e-repository-mysql mysql -u root -p`

### **Performance Issues**
- [ ] High memory usage → Check: `free -h`
- [ ] High disk usage → Check: `df -h`
- [ ] Slow response → Check: `docker stats`

## 📞 Support Resources

### **Hostinger Support**
- [ ] Knowledge Base: https://www.hostinger.com/help
- [ ] Live Chat: Available 24/7
- [ ] Support Ticket: Via control panel
- [ ] Phone Support: Available during business hours

### **Application Support**
- [ ] Check logs: `docker compose logs -f`
- [ ] Restart services: `docker compose restart`
- [ ] Update application: `git pull && docker compose up -d --build`
- [ ] Backup database: `docker exec e-repository-mysql mysqldump -u root -p e_repository_db > backup.sql`

## 🎯 Success Criteria

Your deployment is successful when:
- [ ] Frontend loads at `http://YOUR_SERVER_IP`
- [ ] API responds at `http://YOUR_SERVER_IP/api`
- [ ] Admin can login and access dashboard
- [ ] Users can register and login
- [ ] File upload works
- [ ] Search functionality works
- [ ] All features tested and working

## 📱 Final Access Information

After successful deployment:
- **Frontend URL**: `http://YOUR_SERVER_IP` (or `https://repository.unidum.ac.id` when domain is ready)
- **API URL**: `http://YOUR_SERVER_IP/api` (or `https://repository.unidum.ac.id/api`)
- **Admin Email**: admin@demo.com
- **Admin Password**: password123 (CHANGE THIS!)

---

**🎉 Congratulations!** Your E-Repository is now live on the internet!

**Next Steps:**
1. Share the URL with your university
2. Set up user training
3. Configure regular backups
4. Monitor usage and performance
5. Plan for future enhancements 