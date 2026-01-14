# EC2 Deployment - Step by Step Commands

## ✅ Prerequisites
- [x] EC2 Instance running: 13.237.113.37
- [x] Connected via EC2 Instance Connect (browser)
- [x] RDS Database available: taskdb-production

## 🚀 Deployment Steps

### Step 1: Update System & Install Docker

**Copy and paste this entire block, then press Enter:**

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add ubuntu user to docker group
sudo usermod -aG docker ubuntu

# Install Git
sudo apt install -y git

echo "✅ Installation complete! Now reconnecting..."
```

**Wait**: ~3-4 minutes for this to complete.

When done, you'll see: `✅ Installation complete!`

### Step 2: Reconnect (IMPORTANT!)

**Why?** Group changes need a new session.

1. In the browser terminal, type: `exit`
2. Browser terminal will close
3. Go back to EC2 Console → Instance → Click **"Connect"** again
4. Username: `ubuntu`
5. Click **"Connect"**
6. New terminal opens

### Step 3: Verify Docker Installation

```bash
docker --version
docker compose version
```

**Should see**:
```
Docker version 24.x.x
Docker Compose version v2.x.x
```

### Step 4: Clone Repository

```bash
git clone https://github.com/ThongNguyen1510/devops-fullstack-monitoring-.git
cd devops-fullstack-monitoring-
ls -la
```

**Should see**: All project folders (backend, frontend, docker-compose.yml, etc.)

### Step 5: Get RDS Endpoint

**BEFORE continuing**, you need your RDS connection string!

1. **Open new tab** → AWS Console → RDS
2. Click `taskdb-production` database
3. Tab **"Connectivity & security"**
4. Copy **Endpoint**: `taskdb-production.xxxxx.ap-southeast-2.rds.amazonaws.com`
5. **Save it** in notepad with your password!

**Connection String Format**:
```
postgresql://postgres:YOUR_PASSWORD@taskdb-production.xxxxx.ap-southeast-2.rds.amazonaws.com:5432/postgres
```

### Step 6: Create Environment Variables

**In EC2 terminal**:

```bash
nano backend/.env
```

**Paste this** (Replace with YOUR actual values!):

```env
PORT=5000
NODE_ENV=production
LOG_LEVEL=info

# REPLACE with your actual RDS endpoint and password!
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@YOUR_RDS_ENDPOINT:5432/postgres

CORS_ORIGIN=*
```

**Example** (with fake values - use YOUR real ones!):
```env
PORT=5000
NODE_ENV=production
LOG_LEVEL=info
DATABASE_URL=postgresql://postgres:MySecurePass123@taskdb-production.c9abc1def2gh.ap-southeast-2.rds.amazonaws.com:5432/postgres
CORS_ORIGIN=*
```

**Save file**:
- Press `Ctrl+X`
- Press `Y`
- Press `Enter`

### Step 7: Verify .env File

```bash
cat backend/.env
```

**Check**: DATABASE_URL has your actual RDS endpoint and password!

### Step 8: Deploy Application! 🚀

```bash
docker compose up -d
```

**Wait**: ~5-7 minutes for:
- Downloading images
- Building containers
- Starting services

You'll see lines like:
```
[+] Running 9/9
✔ Container postgres       Started
✔ Container backend        Started
✔ Container frontend       Started
✔ Container nginx          Started
✔ Container prometheus     Started
✔ Container grafana        Started
✔ Container loki           Started
✔ Container promtail       Started
✔ Container postgres-exporter Started
```

### Step 9: Check Container Status

```bash
docker compose ps
```

**Should see 9 services** with STATE = "Up":
- postgres
- backend
- frontend
- nginx
- prometheus
- grafana
- loki
- promtail
- postgres-exporter

### Step 10: Check Backend Logs

```bash
docker compose logs backend -f
```

**Look for**:
```
Server running on port 5000
Database connected successfully
```

**Exit logs**: Press `Ctrl+C`

### Step 11: Create Database (If Needed)

If you see "database taskdb does not exist" in logs:

```bash
# Connect to PostgreSQL
docker compose exec postgres psql -U postgres

# Create database
CREATE DATABASE taskdb;

# Exit
\q

# Restart backend
docker compose restart backend

# Check logs again
docker compose logs backend
```

### Step 12: Test Application! 🎉

**Open browser**, visit these URLs:

1. **Backend Health Check**:
   ```
   http://13.237.113.37:5000/health
   ```
   Should return:
   ```json
   {"status":"healthy","database":"connected","timestamp":"..."}
   ```

2. **Frontend Application**:
   ```
   http://13.237.113.37
   ```
   Should show the Task Manager app!

3. **Grafana Dashboard**:
   ```
   http://13.237.113.37:3001
   ```
   Login: `admin` / `admin`

4. **Prometheus**:
   ```
   http://13.237.113.37:9090
   ```
   Check Status → Targets (should be UP)

## 📸 Take Screenshots!

For your portfolio/CV:
- ✅ Running application
- ✅ Health check response
- ✅ Grafana dashboard
- ✅ Prometheus targets

## 🐛 Troubleshooting

### Containers not starting?

```bash
# Check logs
docker compose logs

# Check specific service
docker compose logs backend
docker compose logs postgres
```

### Backend can't connect to RDS?

**Check**:
1. `.env` file has correct DATABASE_URL
2. RDS security group allows EC2 (port 5432)
3. RDS endpoint is correct

**Fix RDS Security Group**:
- RDS Console → Database → Connectivity
- Click security group
- Inbound rules → Add rule:
  - Type: PostgreSQL (5432)
  - Source: Custom → EC2 security group OR 0.0.0.0/0

### Port 80 not accessible?

**Check EC2 Security Group**:
- EC2 Console → Instance → Security tab
- Click security group
- Inbound rules → Should have HTTP (80) from 0.0.0.0/0

## ✅ Success Criteria

- [x] All 9 containers running
- [x] Backend health check returns "healthy"
- [x] Frontend accessible at http://13.237.113.37
- [x] Can create/view/edit/delete tasks
- [x] Grafana login works
- [x] Prometheus shows targets UP

## 🎉 Congratulations!

Your DevOps Full-Stack Monitoring application is now:
- ✅ Running on AWS EC2
- ✅ Connected to AWS RDS PostgreSQL
- ✅ Fully monitored with Prometheus + Grafana
- ✅ Production-ready!

## 📝 Useful Commands

```bash
# View all logs
docker compose logs -f

# Stop all services
docker compose down

# Restart all services
docker compose restart

# Rebuild and restart
docker compose up -d --build

# Check resource usage
docker stats

# Clean up unused images
docker system prune -a
```

## ⏭️ Next Steps

After successful deployment:
- [ ] Setup domain name (optional)
- [ ] Configure SSL/HTTPS with Let's Encrypt
- [ ] Create Grafana dashboards
- [ ] Setup automated backups
- [ ] Update GitHub README with live demo link
- [ ] Add to your CV/portfolio!

---

**EC2 Public IP**: 13.237.113.37  
**Application**: http://13.237.113.37  
**Grafana**: http://13.237.113.37:3001  
**Prometheus**: http://13.237.113.37:9090
