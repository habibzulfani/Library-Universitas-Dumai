# 🚀 VPS Management Guide for E-Repository

This guide explains how to **run**, **update**, and **stop** your E-Repository application on your VPS server, including all necessary Git commands.

---

## 1. 🟢 Start/Deploy the Application

### **First-Time Setup or Redeploy (Recommended: Non-root, Production)**
1. **Connect to your VPS via SSH:**
   ```bash
   ssh youruser@YOUR_SERVER_IP
   # or use Hostinger's web terminal
   ```
2. **Go to the application directory:**
   ```bash
   cd /var/www/e-repository
   ```
3. **Pull the latest code from GitHub:**
   ```bash
   git pull
   ```
4. **Make the script file executable**
   ```bash
   chmod +x deploy.sh
   ```
5. **Run the deployment script:**
   ```bash
   ./deploy.sh
   ```
   - This will build, start, and seed your app automatically.
   - The script will create a Python virtual environment (`venv`) and install dependencies. If you see errors about missing `venv/bin/python3`, re-run the script to ensure the venv is created after cloning.

---

### **Alternative: Root-Only Quick Deploy**
- Use `deploy-root.sh` **only if you must run as root** and do not need Nginx/SSL/firewall setup.
- The process is similar, but the app directory is `/opt/erepository` and security best practices are not enforced.

---

## 2. 🔄 Update the Application (Pull New Code & Restart)

1. **Connect to your VPS and go to the app directory:**
   ```bash
   ssh youruser@YOUR_SERVER_IP
   cd /var/www/e-repository
   ```
2. **Pull the latest code:**
   ```bash
   git pull
   ```
3. **Make the script file executable**
   ```bash
   chmod +x deploy.sh
   ```
4. **Restart the app with the latest code:**
   ```bash
   ./deploy.sh
   ```
   - This will rebuild, restart, and reseed the database.

---

## 3. 🛑 Stop the Application

1. **Go to the app directory:**
   ```bash
   cd /var/www/e-repository
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
- The deployment script (`deploy.sh` or `deploy-root.sh`) will reseed your database every time you run it (overwriting data!).
- For production, consider customizing the script to skip reseeding if you want to preserve data.
- **For best security and maintainability, use `deploy.sh` as a regular (non-root) user.**

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
   ssh youruser@YOUR_SERVER_IP
   cd /var/www/e-repository
   ```
4. **Pull the latest code:**
   ```bash
   git pull
   ```
5. **Redeploy your app:**
   ```bash
   ./deploy.sh
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

## 11. 🛠️ Troubleshooting

- **Missing venv or Python errors:**
  - If you see errors like `No such file or directory: 'venv/bin/python3'`, re-run the deployment script to ensure the virtual environment is created after cloning.
  - Make sure the script block for venv creation and dependency installation runs after the repository is cloned or updated.
- **Missing setup.sh:**
  - If you see `chmod: cannot access 'setup.sh'`, ensure the repository was cloned successfully and contains all files.
  - You may need to fully clean the directory (including hidden files) and re-clone.
- **Cloning errors:**
  - If `git clone` fails due to a non-empty directory, remove all files (including hidden ones) before cloning:
    ```bash
    rm -rf * .[^.]*
    ```

---

**For any issues, check the logs or contact your developer.** 