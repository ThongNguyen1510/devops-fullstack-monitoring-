# 🔄 CI/CD Pipeline - Giải Thích Chi Tiết

## 📋 Tổng Quan

CI/CD pipeline của project này tự động hóa toàn bộ quá trình từ code → test → build → deploy.

**Khi nào chạy**: Mỗi khi bạn push code lên GitHub (branch `main` hoặc `develop`)

**Mất bao lâu**: ~5-10 phút (tùy network và server)

**Kết quả**: Code mới tự động deploy lên AWS EC2 production server

---

## 🎯 Pipeline Flow - 3 Giai Đoạn Chính

```
┌──────────────────────────────────────────────────────────┐
│              GIT PUSH TO GITHUB                          │
│           (main or develop branch)                       │
└──────────────────┬───────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────┐
│  STAGE 1: TEST                                           │
│  ├─ Checkout code từ GitHub                             │
│  ├─ Setup Node.js 20                                     │
│  ├─ Install dependencies (npm ci)                        │
│  ├─ Run ESLint (code quality check)                      │
│  ├─ Run unit tests                                       │
│  └─ Security audit (npm audit)                           │
│                                                           │
│  ❌ Nếu FAIL → STOP pipeline                            │
│  ✅ Nếu PASS → Continue to Build                        │
└──────────────────┬───────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────┐
│  STAGE 2: BUILD                                          │
│  ├─ Setup Docker Buildx                                  │
│  ├─ Login to Docker Hub                                  │
│  ├─ Build Backend Docker image                           │
│  ├─ Tag: latest, branch name, git SHA                    │
│  ├─ Push Backend image to Docker Hub                     │
│  ├─ Build Frontend Docker image                          │
│  ├─ Tag: latest, branch name, git SHA                    │
│  └─ Push Frontend image to Docker Hub                    │
│                                                           │
│  ❌ Nếu FAIL → STOP pipeline                            │
│  ✅ Nếu PASS → Continue to Deploy                       │
└──────────────────┬───────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────┐
│  STAGE 3: DEPLOY (only on main branch)                   │
│  ├─ SSH vào EC2 instance                                 │
│  ├─ Pull latest Docker images từ Docker Hub              │
│  ├─ Git pull latest code                                 │
│  ├─ docker compose down (stop old containers)            │
│  ├─ docker compose up -d (start new containers)          │
│  ├─ Wait 30 seconds (containers start up)                │
│  ├─ Check container status (docker compose ps)           │
│  ├─ Test health endpoint (curl /health)                  │
│  └─ Verify deployment success                            │
│                                                           │
│  ❌ Nếu FAIL → Rollback manual required                 │
│  ✅ Nếu PASS → Deployment successful! 🎉               │
└──────────────────────────────────────────────────────────┘
```

---

## 📊 Chi Tiết Từng Stage

### STAGE 1: TEST 🧪

**Mục đích**: Đảm bảo code quality và không có bugs trước khi deploy

**Steps**:

1. **Checkout code**: Tải code từ GitHub repository
2. **Setup Node.js**: Cài Node.js version 20
3. **Install dependencies**: `npm ci` (clean install, faster và consistent hơn `npm install`)
4. **Run linting**: Check code style, syntax errors
5. **Run tests**: Execute unit tests
6. **Security audit**: Scan for known vulnerabilities trong dependencies

**Khi nào FAIL**:
- Code có syntax errors
- Tests không pass
- Critical security vulnerabilities found

**Thời gian**: ~2-3 phút

---

### STAGE 2: BUILD 🏗️

**Mục đích**: Build Docker images và push lên Docker Hub registry

**Steps**:

1. **Setup Docker Buildx**: Enhanced Docker build tool
2. **Login Docker Hub**: Authenticate với Docker Hub account
3. **Build Backend Image**:
   ```dockerfile
   FROM node:20-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   EXPOSE 5000
   CMD ["node", "src/server.js"]
   ```
4. **Tag Backend Image**:
   - `latest` (current production)
   - `main-abc123` (git commit SHA)
   - `main` (branch name)

5. **Push Backend to Docker Hub**:
   - Registry: `docker.io/yourusername/task-manager-backend`
   
6. **Build Frontend Image**:
   ```dockerfile
   FROM node:20-alpine AS builder
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   COPY . .
   RUN npm run build
   
   FROM nginx:alpine
   COPY --from=builder /app/dist /usr/share/nginx/html
   EXPOSE 80
   ```

7. **Tag & Push Frontend**:
   - Similar to backend
   - Registry: `docker.io/yourusername/task-manager-frontend`

**Cache Strategy**:
- Use BuildKit cache để speed up builds
- Reuse layers khi dependencies không thay đổi

**Khi nào FAIL**:
- Docker build errors
- Docker Hub authentication fail
- Network issues

**Thời gian**: ~3-5 phút (first build), ~1-2 phút (subsequent builds with cache)

---

### STAGE 3: DEPLOY 🚀

**Mục đích**: Deploy code mới lên AWS EC2 production server

**Steps**:

1. **SSH to EC2**:
   - Uses `appleboy/ssh-action`
   - Connects to: `ubuntu@13.237.113.37`
   - Authentication: SSH private key

2. **Navigate to app directory**:
   ```bash
   cd /home/ubuntu/devops-fullstack-monitoring-
   ```

3. **Pull latest images**:
   ```bash
   docker compose pull
   ```
   - Downloads: backend:latest, frontend:latest from Docker Hub

4. **Update code**:
   ```bash
   git pull origin main
   ```
   - Ensures docker-compose.yml và configs are latest

5. **Stop old containers**:
   ```bash
   docker compose down
   ```
   - Gracefully stops all running containers
   - Preserves data volumes

6. **Start new containers**:
   ```bash
   docker compose up -d
   ```
   - `-d`: detached mode (background)
   - Starts 9 services:
     - frontend
     - backend
     - postgres
     - nginx
     - prometheus
     - grafana
     - loki
     - promtail
     - postgres-exporter

7. **Wait for startup**:
   ```bash
   sleep 30
   ```
   - Containers need time to:
     - Start processes
     - Connect to database
     - Pass health checks

8. **Verify containers**:
   ```bash
   docker compose ps
   ```
   - Shows status of all containers
   - Should all show "Up" hoặc "Up (healthy)"

9. **Test health endpoint**:
   ```bash
   curl -f http://localhost:5000/health
   ```
   - `-f`: fail on HTTP errors
   - Expected response: `{"status":"healthy","database":"connected"}`
   - If fails → deployment fails

10. **Success message**:
    ```bash
    echo "✅ Deployment successful!"
    ```

**Khi nào FAIL**:
- SSH connection fails (wrong credentials, EC2 stopped)
- Docker images not found (Docker Hub issue)
- Containers fail to start (config errors, resource limits)
- Health check fails (backend not ready, DB connection issue)

**Rollback strategy**:
- Manual rollback required if deployment fails
- Can SSH to EC2 và run: `docker compose up -d` với previous image tags

**Thời gian**: ~2-3 phút

---

## 🎛️ Configuration

### Triggers (Khi nào Pipeline chạy)

```yaml
on:
  push:
    branches: [ main, develop ]  # Chạy khi push vào main hoặc develop
  pull_request:
    branches: [ main ]            # Chạy khi tạo PR vào main
```

**Tóm tắt**:
- ✅ Push to `main` → Run all 3 stages (test, build, deploy)
- ✅ Push to `develop` → Run test + build (NO deploy)
- ✅ Create PR to `main` → Run test only
- ❌ Push to other branches → Pipeline KHÔNG chạy

### Environment Variables

```yaml
env:
  DOCKER_USERNAME: ${{ secrets.DOCKER_USERNAME }}
  DOCKER_PASSWORD: ${{ secrets.DOCKER_PASSWORD }}
```

### Secrets Required

| Secret | Usage | Where |
|--------|-------|-------|
| `DOCKER_USERNAME` | Login to Docker Hub | Build stage |
| `DOCKER_PASSWORD` | Login to Docker Hub | Build stage |
| `EC2_HOST` | SSH to EC2 | Deploy stage |
| `EC2_USERNAME` | SSH to EC2 | Deploy stage |
| `EC2_SSH_KEY` | SSH authentication | Deploy stage |

---

## 📈 Benefits của CI/CD Pipeline này

### 1. **Automation** ⚡
- Không cần manual deployment
- Reduce human errors
- Consistent deployment process

### 2. **Fast Feedback** 🚀
- Biết ngay code có bug hay không (tests)
- Catch errors trước khi deploy production
- Fail fast, fix faster

### 3. **Version Control** 📦
- Mỗi deployment có version (git SHA)
- Easy rollback to previous versions
- Track what code is running in production

### 4. **Quality Assurance** ✅
- Automated testing
- Code linting
- Security scanning
- All code must pass checks trước khi deploy

### 5. **Reliability** 🛡️
- Health checks ensure deployment success
- Container status verification
- Fail early if issues detected

### 6. **Efficiency** ⏱️
- Deploy trong 5-10 minutes
- So với manual: ~30-60 minutes
- Can deploy multiple times per day

---

## 🔍 Monitoring Pipeline

### View Pipeline Status

1. **GitHub Repository**: https://github.com/ThongNguyen1510/devops-fullstack-monitoring-
2. Click **"Actions"** tab
3. See all workflow runs:
   - ✅ Green checkmark: Success
   - ❌ Red X: Failed
   - 🟡 Yellow circle: Running

### Check Logs

1. Click on workflow run
2. Click on job (test, build, deploy)
3. Click on step to see detailed logs
4. Debug failures from logs

### Notifications

Pipeline automatically:
- ✅ Shows status on GitHub
- ❌ Notifies on failure (in logs)
- 📧 Can configure email/Slack notifications

---

## 🐛 Common Issues & Solutions

### Issue 1: Tests Fail

**Error**: `npm test failed`

**Solutions**:
- Fix code bugs
- Update tests
- Check dependencies

### Issue 2: Docker Build Fails

**Error**: `docker build failed`

**Solutions**:
- Check Dockerfile syntax
- Verify dependencies exist
- Review build logs

### Issue 3: SSH Connection Failed

**Error**: `ssh: connect to host failed`

**Solutions**:
- Verify EC2 instance running
- Check security group allows SSH
- Verify SSH key correct
- Confirm EC2_HOST IP is current

### Issue 4: Health Check Failed ⚠️ (CURRENT ISSUE)

**Error**: `curl: (22) The requested URL returned error: 404`

**Causes**:
- Containers not fully started (10s not enough)
- Health endpoint wrong URL
- Backend not healthy yet

**Fix** (ALREADY APPLIED):
```yaml
# Increased from sleep 10 to sleep 30
sleep 30

# Changed from http://localhost/health to http://localhost:5000/health
curl -f http://localhost:5000/health
```

**Why this fixes it**:
- 30 seconds gives containers time to:
  - Start Node.js processes
  - Connect to PostgreSQL
  - Pass internal health checks
  - Be ready to serve requests
- Correct endpoint `localhost:5000` (backend direct port)

---

## 📊 Pipeline Metrics

**Typical Execution Times**:
```
├─ Test stage:   2-3 minutes
├─ Build stage:  3-5 minutes (first), 1-2 minutes (cached)
└─ Deploy stage: 2-3 minutes
───────────────────────────────
Total:          7-11 minutes
```

**Success Rate** (target):
- Tests: 95%+ (should be high)
- Build: 98%+ (rarely fails)
- Deploy: 90%+ (network dependent)

---

## 🎯 How to Use Pipeline

### Normal Development Workflow

```bash
# 1. Make code changes locally
vim backend/src/server.js

# 2. Test locally
npm test

# 3. Commit changes
git add .
git commit -m "feat: add new feature"

# 4. Push to GitHub
git push origin main

# 5. Pipeline automatically:
#    - Runs tests
#    - Builds Docker images
#    - Deploys to production
#    - You just wait & monitor!

# 6. Verify deployment
curl http://13.237.113.37/health
# Should return new version
```

### If Pipeline Fails

```bash
# 1. Check GitHub Actions logs
# 2. Fix the issue locally
# 3. Commit fix
git commit -m "fix: resolve deployment issue"

# 4. Push again
git push origin main

# 5. Pipeline re-runs automatically
```

---

## ✅ Best Practices

### ✅ DO:
- Write tests for new features
- Test locally before pushing
- Use descriptive commit messages
- Monitor pipeline status
- Fix failures immediately

### ❌ DON'T:
- Push directly to main without testing
- Ignore failed pipelines
- Deploy on Fridays (harder to fix issues over weekend)
- Skip tests to "move faster"
- Commit secrets/credentials to code

---

## 🎓 For Interview

**How to explain your pipeline**:

```
"I implemented a 3-stage CI/CD pipeline using GitHub Actions:

1. TEST stage runs automated tests, linting, and security scans
   to ensure code quality

2. BUILD stage creates Docker images for backend and frontend,
   tags them with version info, and pushes to Docker Hub registry

3. DEPLOY stage SSHs into AWS EC2, pulls latest images, and
   deploys using docker compose with health check verification

This automates the entire deployment process, reducing deployment
time from 30 minutes to 5 minutes, and eliminates manual errors.
Every commit to main branch automatically deploys to production
after passing all quality checks."
```

**Questions you might get**:

Q: "What happens if deployment fails?"  
A: "Pipeline fails early with health check. I SSH into EC2, check container logs with `docker compose logs`, fix the issue, and push again. For critical failures, I can rollback to previous working image tags."

Q: "How do you ensure zero downtime?"  
A: "Currently there's brief downtime during `docker compose down/up`. To achieve zero downtime, I would implement blue-green deployment or rolling updates with multiple instances behind a load balancer."

---

## 📚 Related Documentation

- GitHub Actions Workflow: `.github/workflows/ci-cd.yml`
- Dockerfile Backend: `backend/Dockerfile`
- Dockerfile Frontend: `frontend/Dockerfile`
- Docker Compose: `docker-compose.yml`
- GitHub Secrets Setup: [`docs/GITHUB_SECRETS_SETUP.md`](./GITHUB_SECRETS_SETUP.md)

---

## 🎉 Summary

**Your CI/CD pipeline**:
- ✅ Runs automatically on every push
- ✅ Tests code quality
- ✅ Builds Docker images
- ✅ Deploys to AWS production
- ✅ Verifies deployment success
- ✅ All in 5-10 minutes!

**This is a PROFESSIONAL DevOps workflow!** 🚀

Perfect cho CV và interviews!
