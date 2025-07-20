# 🚀 VPS Management Guide for E-Repository

This guide explains how to **run**, **update**, and **stop** your E-Repository application on your VPS server, including all necessary Git commands.

---

## 1. 🟢 Start/Deploy the Application

### **First-Time Setup or Redeploy**
1. **Connect to your VPS via SSH:**
   ```bash
   ssh root@YOUR_SERVER_IP
   # or use Hostinger's web terminal
   ```
2. **Go to the application directory:**
   ```bash
   cd /opt/erepository
   ```
3. **Pull the latest code from GitHub:**
   ```bash
   git pull
   ```
4. **Make the script file executable**
   ```bash
   chmod +x deploy-root.sh
   ```
5. **Run the deployment script:**
   ```bash
   ./deploy-root.sh
   ```
   - This will build, start, and seed your app automatically.

---

## 2. 🔄 Update the Application (Pull New Code & Restart)

1. **Connect to your VPS and go to the app directory:**
   ```bash
   ssh root@YOUR_SERVER_IP
   cd /opt/erepository
   ```
2. **Pull the latest code:**
   ```bash
   git pull
   ```
3. **Make the script file executable**
   ```bash
   chmod +x deploy-root.sh
   ```
4. **Restart the app with the latest code:**
   ```bash
   ./deploy-root.sh
   ```
   - This will rebuild, restart, and reseed the database.

---

## 3. 🛑 Stop the Application

1. **Go to the app directory:**
   ```bash
   cd /opt/erepository
   ```
2. **Stop all services:**
   ```bash
   docker compose down
   ```

---

## 4. 📝 Useful Docker & Git Commands

- **View logs:**
  ```bash
  docker compose logs -f
  ```
- **Restart services:**
  ```bash
  docker compose restart
  ```
- **Update code only (no reseed):**
  ```bash
  git pull
  docker compose up -d --build
  ```
- **Check running containers:**
  ```bash
  docker compose ps
  ```

---

## 5. 🔒 Security & Maintenance
- Change your `.env` secrets after first deploy.
- Set up regular backups for your database.
- Keep your server updated:
  ```bash
  apt update && apt upgrade -y
  ```

---

## 6. 🌐 Accessing Your App
- **Frontend:** `http://YOUR_SERVER_IP:3000`
- **API:** `http://YOUR_SERVER_IP:8080`
- **PDF Service:** `http://YOUR_SERVER_IP:8000`

---

## 7. 💡 Notes
- Always pull the latest code before redeploying.
- The deployment script (`deploy-root.sh`) will reseed your database every time you run it (overwriting data!).
- For production, consider customizing the script to skip reseeding if you want to preserve data.

---

## 8. 🔄 Typical Update & Deploy Workflow

1. **Update your code locally**
   - Make your changes, test them.
2. **Commit and push to GitHub:**
   ```bash
   git add .
   git commit -m "Describe your changes"
   git push origin main
   ```
3. **Connect to your VPS:**
   ```bash
   ssh root@YOUR_SERVER_IP
   cd /opt/erepository
   ```
4. **Pull the latest code:**
   ```bash
   git pull
   ```
5. **Redeploy your app:**
   ```bash
   ./deploy-root.sh
   ```
   - This will rebuild, restart, and reseed the database (overwriting data!).

---

## 9. ⚠️ Update Without Reseeding the Database

If you want to update your code but **keep your existing data** (no reseed):

1. **Pull the latest code:**
   ```bash
   git pull
   ```
2. **Rebuild and restart the app (no reseed):**
   ```bash
   docker compose up -d --build
   ```

- This will update your app without touching the database contents.
- Use this for production or when you want to preserve user data.

---

## 10. ⚠️ Environment Variable Enforcement (Required for Docker Compose)

- The `docker-compose.yml` file now **requires all environment variables to be set**.
- If any required variable is missing, Docker Compose will fail to start with an error.
- **Always copy the correct environment file before running Docker Compose:**
  - For local development:
    ```bash
    cp env.development .env
    ```
  - For production:
    ```bash
    cp env.production .env
    ```
  - Or use:
    ```bash
    docker compose --env-file env.production up -d
    ```
- This ensures you never run with missing or insecure secrets/passwords.

---

**For any issues, check the logs or contact your developer.** 