# E-Repository Deployment Guide

## 🚀 Quick Start

### Local Development (with Docker)
```bash
# Use development configuration (port 3307 for MySQL)
./setup.sh
```

### Production Deployment
```bash
# Use production configuration (port 3306 for MySQL)
docker compose --env-file env.production up -d
```

## 🔧 Environment Configurations

### Development Environment (`env.development`)
- **MySQL Port**: 3307 (avoids conflict with local MySQL)
- **Use Case**: Local development with Docker
- **Command**: `./setup.sh` (automatically loads this config)

### Production Environment (`env.production`)
- **MySQL Port**: 3306 (standard port)
- **Use Case**: Production deployment
- **Command**: `docker compose --env-file env.production up -d`

## 🌐 Deployment Options

### 1. Traditional VPS/Dedicated Server
```bash
# Clone repository
git clone <your-repo>
cd e-repository

# Copy production environment
cp env.production .env

# Edit .env with your production values
nano .env

# Deploy
docker compose --env-file .env up -d
```

### 2. Cloud Platforms

#### Heroku/Railway/Render
- Use their database services
- Set environment variables in their dashboard
- Deploy using their Git integration

#### AWS/GCP/Azure
- Use managed databases (RDS, Cloud SQL, etc.)
- Deploy containers to ECS/GKE/AKS
- Use load balancers for traffic distribution

### 3. Docker Swarm/Kubernetes
```bash
# For Docker Swarm
docker stack deploy -c docker-compose.yml e-repository

# For Kubernetes (create deployment files)
kubectl apply -f k8s/
```

## 🔒 Security Considerations

### Production Checklist
- [ ] Change default passwords
- [ ] Use strong JWT secrets
- [ ] Enable HTTPS
- [ ] Configure firewall rules
- [ ] Set up database backups
- [ ] Use environment variables for secrets

### Environment Variables to Update
```bash
# Required for production
MYSQL_ROOT_PASSWORD=your-secure-root-password
MYSQL_PASSWORD=your-secure-password
JWT_SECRET=your-very-secure-jwt-secret-key
NEXT_PUBLIC_API_URL=https://your-domain.com/api

# Optional
MYSQL_PORT=3306  # or any available port
API_PORT=8080    # or any available port
FRONTEND_PORT=3000  # or any available port
```

## 📊 Database Migration

### Local to Production
```bash
# Export local data
docker exec e-repository-mysql mysqldump -u root -prootpassword e_repository_db > backup.sql

# Import to production
mysql -h your-production-host -u your-user -p your-database < backup.sql
```

### Production to Local
```bash
# Export production data
mysqldump -h your-production-host -u your-user -p your-database > production_backup.sql

# Import to local
docker exec -i e-repository-mysql mysql -u root -prootpassword e_repository_db < production_backup.sql
```

## 🔄 Port Configuration

### Why Different Ports?
- **Development**: Port 3307 avoids conflict with local MySQL
- **Production**: Port 3306 is standard and usually available

### Changing Ports
```bash
# For development (if you want to use 3306)
export MYSQL_PORT=3306
./setup.sh

# For production (if 3306 is taken)
export MYSQL_PORT=3307
docker compose --env-file env.production up -d
```

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Check what's using the port
sudo lsof -i :3306

# Stop conflicting service
sudo brew services stop mysql  # macOS
sudo service mysql stop        # Linux

# Or use different port
export MYSQL_PORT=3308
```

### Database Connection Issues
```bash
# Check if MySQL is running
docker ps | grep mysql

# Check MySQL logs
docker logs e-repository-mysql

# Test connection
docker exec e-repository-mysql mysql -u root -prootpassword -e "SELECT 1;"
```

### Service Health Checks
```bash
# Check all services
docker compose ps

# Check specific service logs
docker compose logs api
docker compose logs frontend
docker compose logs mysql
```

## 📝 Environment File Examples

### Minimal Production Config
```bash
MYSQL_PORT=3306
MYSQL_ROOT_PASSWORD=secure123
MYSQL_PASSWORD=secure123
JWT_SECRET=your-super-secret-key
NEXT_PUBLIC_API_URL=https://your-domain.com/api
```

### Custom Ports Config
```bash
MYSQL_PORT=13306
API_PORT=18080
FRONTEND_PORT=13000
PDF_SERVICE_PORT=18000
```

## 🎯 Best Practices

1. **Never commit secrets** to version control
2. **Use different databases** for development and production
3. **Regular backups** of production data
4. **Monitor logs** and set up alerts
5. **Use HTTPS** in production
6. **Keep dependencies updated**
7. **Test deployment** in staging environment first 