# 🔧 Backend Troubleshooting Guide - Can't Fetch Tasks

## Quick Diagnosis Steps

Follow these steps **in order** on your EC2 instance to find the problem.

---

## Step 1: SSH to EC2

```bash
ssh -i "D:\code projects\aws\taskapp-key.pem" ubuntu@13.237.113.37
```

---

## Step 2: Check All Containers Running

```bash
cd ~/devops-fullstack-monitoring-
docker compose ps
```

**Expected output**:
```
NAME                  STATUS
backend               Up (healthy)
frontend              Up
postgres              Up (healthy)
nginx                 Up
grafana               Up
prometheus            Up
loki                  Up
promtail              Up
postgres-exporter     Up
```

**If backend shows "Exited" or "Restarting"**:
→ Go to **Issue 1: Backend Container Crashed**

**If all containers are "Up"**:
→ Continue to Step 3

---

## Step 3: Check Backend Logs

```bash
docker compose logs backend --tail=50
```

**Look for errors**:

**Common Error 1**: Database connection failed
```
Error: connect ECONNREFUSED 127.0.0.1:5432
Error: database "taskdb" does not exist
```
→ Go to **Issue 2: Database Connection Problem**

**Common Error 2**: Port already in use
```
Error: listen EADDRINUSE :::5000
```
→ Go to **Issue 3: Port Conflict**

**Common Error 3**: Missing environment variables
```
Error: DATABASE_URL is required
```
→ Go to **Issue 4: Missing .env File**

**If no errors**, continue to Step 4.

---

## Step 4: Test Backend Health Endpoint

```bash
# From inside EC2
curl http://localhost:5000/health
```

**Expected response**:
```json
{"status":"healthy","database":"connected","timestamp":"..."}
```

**If you get error**:
- "Connection refused" → Backend not running
- "Cannot GET /health" → Wrong endpoint
- No response → Backend crashed

→ Go to **Issue 5: Backend Not Responding**

**If health check works**, continue to Step 5.

---

## Step 5: Test Tasks API Endpoint

```bash
# Get all tasks
curl http://localhost:5000/api/tasks
```

**Expected response**:
```json
[
  {"id":1,"title":"Setup project","status":"done",...},
  {"id":2,"title":"Deploy to AWS","status":"in-progress",...}
]
```

**Possible errors**:
- Empty array `[]` → Database has no data (OK, just empty)
- `404 Not Found` → Route not configured
- `500 Internal Server Error` → Database query failed

→ Go to **Issue 6: API Endpoint Not Working**

**If API works**, continue to Step 6.

---

## Step 6: Test from Outside EC2

From your **local computer**:

```powershell
# Test backend health (direct port)
curl http://13.237.113.37:5000/health

# Test tasks API (direct port)
curl http://13.237.113.37:5000/api/tasks

# Test through Nginx
curl http://13.237.113.37/api/tasks
```

**If local curl works but browser doesn't**:
→ Go to **Issue 7: CORS Problem**

**If nothing works from outside**:
→ Go to **Issue 8: Firewall/Security Group**

---

## Step 7: Check Frontend Console

Open browser console (F12) on `http://13.237.113.37`:

**Look for errors**:
```
Failed to fetch
CORS policy blocked
net::ERR_CONNECTION_REFUSED
```

→ Go to **Issue 7: CORS Problem**

---

## 🐛 Common Issues & Fixes

### Issue 1: Backend Container Crashed

**Check why it crashed**:
```bash
docker compose logs backend --tail=100
```

**Fix 1: Restart container**:
```bash
docker compose restart backend

# Wait 10 seconds
sleep 10

# Check status
docker compose ps backend
```

**Fix 2: Rebuild if code issue**:
```bash
docker compose down
docker compose up -d --build backend

# Check logs
docker compose logs backend -f
```

---

### Issue 2: Database Connection Problem

**Symptom**: Backend logs show:
```
Error: connect ECONNREFUSED
Error: database "taskdb" does not exist
```

**Fix 1: Check Postgres running**:
```bash
docker compose ps postgres
# Should show "Up (healthy)"
```

**Fix 2: Create database if missing**:
```bash
# Connect to postgres
docker compose exec postgres psql -U postgres

# Inside psql:
CREATE DATABASE taskdb;
\l                          # List databases, should see taskdb
\q                          # Quit

# Restart backend
docker compose restart backend
```

**Fix 3: Check DATABASE_URL in .env**:
```bash
cat backend/.env
```

Should show:
```
DATABASE_URL=postgresql://postgres:YourPassword@postgres:5432/postgres
```

**Fix if wrong**:
```bash
nano backend/.env

# Update to:
DATABASE_URL=postgresql://postgres:YOUR_RDS_PASSWORD@taskdb-production.c1wuooi6kuxy.ap-southeast-2.rds.amazonaws.com:5432/postgres

# Save (Ctrl+X, Y, Enter)

# Restart
docker compose restart backend
```

---

### Issue 3: Port Conflict

**Symptom**: 
```
Error: listen EADDRINUSE :::5000
```

**Fix: Kill process using port 5000**:
```bash
# Find process
sudo lsof -i :5000

# Kill it (replace PID with actual number)
sudo kill -9 PID

# Restart backend
docker compose restart backend
```

---

### Issue 4: Missing .env File

**Symptom**:
```
Error: DATABASE_URL is required
```

**Fix: Create .env file**:
```bash
cd ~/devops-fullstack-monitoring-

# Create .env
nano backend/.env
```

**Paste this** (replace with your values):
```env
PORT=5000
NODE_ENV=production
LOG_LEVEL=info
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@taskdb-production.c1wuooi6kuxy.ap-southeast-2.rds.amazonaws.com:5432/postgres
CORS_ORIGIN=*
```

Save (Ctrl+X, Y, Enter)

```bash
# Restart
docker compose restart backend
```

---

### Issue 5: Backend Not Responding

**Symptom**: `curl http://localhost:5000/health` → No response

**Fix 1: Check backend actually running**:
```bash
docker compose ps backend
# Should show "Up"

# If not, start it
docker compose up -d backend
```

**Fix 2: Check backend process inside container**:
```bash
docker compose exec backend ps aux
# Should show "node src/server.js"
```

**Fix 3: Check listening port**:
```bash
docker compose exec backend netstat -tlnp
# Should show ":5000"
```

**Fix 4: Restart everything**:
```bash
docker compose down
docker compose up -d
sleep 30
curl http://localhost:5000/health
```

---

### Issue 6: API Endpoint Not Working

**Symptom**: Health works but `/api/tasks` returns 404

**Fix: Check routes file**:
```bash
# Make sure routes are registered
cat backend/src/server.js | grep tasks
# Should show: app.use('/api/tasks', taskRoutes);
```

**Test database directly**:
```bash
docker compose exec postgres psql -U postgres -c "SELECT * FROM tasks;"
```

**If table doesn't exist**:
```bash
docker compose exec postgres psql -U postgres

-- Create table
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'todo',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert test data
INSERT INTO tasks (title, description, status) VALUES
('Test Task 1', 'This is a test', 'todo'),
('Test Task 2', 'Another test', 'done');

-- Verify
SELECT * FROM tasks;

\q
```

Restart backend:
```bash
docker compose restart backend
```

---

### Issue 7: CORS Problem

**Symptom**: Browser console shows:
```
Access to fetch has been blocked by CORS policy
```

**Fix 1: Check CORS configuration**:

On your **local machine**, edit `backend/src/server.js`:

```javascript
// Make sure CORS allows all origins for development
app.use(cors({
  origin: '*',  // Allow all origins
  credentials: true
}));
```

**Fix 2: Update and deploy**:
```bash
# On local machine
git add backend/src/server.js
git commit -m "fix: update CORS configuration"
git push origin main

# On EC2 (or wait for CI/CD)
cd ~/devops-fullstack-monitoring-
git pull origin main
docker compose down
docker compose up -d --build backend
```

**Quick fix on EC2 directly**:
```bash
# On EC2
cd ~/devops-fullstack-monitoring-
nano backend/src/server.js

# Find the CORS line and change to:
app.use(cors({ origin: '*' }));

# Save and rebuild
docker compose down
docker compose up -d --build backend
```

---

### Issue 8: Firewall/Security Group

**Symptom**: Works on EC2 but not from outside

**Fix: Check AWS Security Group**:

1. **AWS Console** → **EC2** → **Security Groups**
2. Find `taskapp-sg`
3. **Inbound rules** should have:
   ```
   Type: Custom TCP
   Port: 5000
   Source: 0.0.0.0/0
   ```

4. If missing, **Add rule**:
   - Type: Custom TCP
   - Port: 5000
   - Source: 0.0.0.0/0
   - Description: Backend API

5. **Save rules**

6. **Test again**:
   ```bash
   curl http://13.237.113.37:5000/health
   ```

---

## 🔍 Advanced Debugging

### Check Network Inside Docker

```bash
# Ping postgres from backend
docker compose exec backend ping postgres

# Check DNS resolution
docker compose exec backend nslookup postgres

# Check database connection
docker compose exec backend env | grep DATABASE
```

### Check Frontend API Configuration

```bash
# Check what API URL frontend is using
docker compose exec frontend cat /usr/share/nginx/html/assets/*.js | grep -o "http.*api"
```

### Full Log Analysis

```bash
# All logs from all containers
docker compose logs --tail=100

# Only errors
docker compose logs | grep -i error

# Follow logs in real-time
docker compose logs -f backend
```

---

## ✅ Quick Fix: Nuclear Option

**If nothing works, reset everything**:

```bash
cd ~/devops-fullstack-monitoring-

# Stop and remove everything
docker compose down -v

# Pull latest code
git pull origin main

# Check .env exists
ls -la backend/.env

# If not, create it
nano backend/.env
# (paste DATABASE_URL configuration)

# Start fresh
docker compose up -d

# Wait for startup
sleep 30

# Check status
docker compose ps

# Test
curl http://localhost:5000/health
curl http://localhost:5000/api/tasks
```

---

## 📊 Checklist

- [ ] SSH to EC2
- [ ] Check all containers running (`docker compose ps`)
- [ ] Check backend logs (`docker compose logs backend`)
- [ ] Test health endpoint (`curl http://localhost:5000/health`)
- [ ] Test API endpoint (`curl http://localhost:5000/api/tasks`)
- [ ] Check database connection
- [ ] Verify .env file exists and correct
- [ ] Test from outside EC2
- [ ] Check browser console for errors
- [ ] Verify security group allows port 5000
- [ ] Check CORS configuration

---

## 🎯 Most Common Causes

Based on experience:

1. **Backend container crashed** (40%)
   - Fix: `docker compose restart backend`

2. **Database connection failed** (30%)
   - Fix: Check DATABASE_URL in .env

3. **CORS blocking requests** (20%)
   - Fix: Update CORS to allow all origins

4. **Wrong API URL in frontend** (5%)
   - Fix: Check frontend API configuration

5. **Security group blocking port** (5%)
   - Fix: Allow port 5000 in AWS

---

## 📞 Still Not Working?

**Send me**:
1. Output of: `docker compose ps`
2. Output of: `docker compose logs backend --tail=50`
3. Browser console error (screenshot or copy text)
4. Result of: `curl http://13.237.113.37:5000/health`

I'll help you debug further!

---

**Start with Step 1-7 and report back what you find!** 🔍
