# 🔐 GitHub Secrets Setup Guide

## Overview

Your CI/CD pipeline requires GitHub Secrets to deploy to AWS EC2 and push Docker images. This guide shows you how to set them up.

---

## 🎯 Required Secrets

Your pipeline needs **5 secrets**:

| Secret Name | Purpose | Example Value |
|-------------|---------|---------------|
| `EC2_HOST` | EC2 public IP or DNS | `13.237.113.37` |
| `EC2_USERNAME` | SSH username | `ubuntu` |
| `EC2_SSH_KEY` | Private SSH key (.pem file content) | `-----BEGIN RSA PRIVATE KEY-----...` |
| `DOCKER_USERNAME` | Docker Hub username | `your-dockerhub-username` |
| `DOCKER_PASSWORD` | Docker Hub password/token | `your-dockerhub-password` |

---

## 📝 Step-by-Step: Add GitHub Secrets

### Step 1: Go to Repository Settings

1. Open your GitHub repository: https://github.com/ThongNguyen1510/devops-fullstack-monitoring-
2. Click **"Settings"** tab (top menu)
3. In left sidebar, click **"Secrets and variables"** → **"Actions"**

### Step 2: Add EC2_HOST Secret

1. Click **"New repository secret"** (green button)
2. **Name**: `EC2_HOST`
3. **Secret**: `13.237.113.37` (your EC2 public IP)
4. Click **"Add secret"**

**How to get EC2_HOST**:
- AWS Console → EC2 → Instances
- Select your instance `task-manager-app`
- Copy **Public IPv4 address**: `13.237.113.37`

### Step 3: Add EC2_USERNAME Secret

1. Click **"New repository secret"**
2. **Name**: `EC2_USERNAME`
3. **Secret**: `ubuntu` (for Ubuntu AMI) or `ec2-user` (for Amazon Linux)
4. Click **"Add secret"**

**For your Ubuntu instance**: Use `ubuntu`

### Step 4: Add EC2_SSH_KEY Secret

This is your **private SSH key** content from `taskapp-key.pem`.

**Get key content**:

**Option 1: From File** (Windows PowerShell):
```powershell
Get-Content "D:\code projects\aws\taskapp-key.pem" -Raw | Set-Clipboard
```
This copies the entire key to clipboard.

**Option 2: Open in Notepad**:
```powershell
notepad "D:\code projects\aws\taskapp-key.pem"
```
Copy all content including:
- `-----BEGIN RSA PRIVATE KEY-----`
- All the encrypted content
- `-----END RSA PRIVATE KEY-----`

**Add to GitHub**:
1. Click **"New repository secret"**
2. **Name**: `EC2_SSH_KEY`
3. **Secret**: Paste the entire key content
   ```
   -----BEGIN RSA PRIVATE KEY-----
   MIIEpAIBAAKCAQEAx...
   (many lines)
   ...xyz==
   -----END RSA PRIVATE KEY-----
   ```
4. Click **"Add secret"**

⚠️ **IMPORTANT**: Include the BEGIN and END lines!

### Step 5: Add DOCKER_USERNAME Secret

You need a Docker Hub account for this.

**If you DON'T have Docker Hub account**:
1. Go to https://hub.docker.com/signup
2. Create free account
3. Remember your username

**Add to GitHub**:
1. Click **"New repository secret"**
2. **Name**: `DOCKER_USERNAME`
3. **Secret**: Your Docker Hub username (e.g., `thongnguyen1510`)
4. Click **"Add secret"**

### Step 6: Add DOCKER_PASSWORD Secret

**Option A: Use Password** (Quick):
1. Click **"New repository secret"**
2. **Name**: `DOCKER_PASSWORD`
3. **Secret**: Your Docker Hub password
4. Click **"Add secret"**

**Option B: Use Access Token** (Recommended, More Secure):

1. **Create Docker Hub Token**:
   - Login to Docker Hub: https://hub.docker.com
   - Click your username (top right) → **"Account Settings"**
   - Click **"Security"** → **"Access Tokens"**
   - Click **"New Access Token"**
   - Description: `GitHub Actions CI/CD`
   - Permissions: **Read, Write, Delete**
   - Click **"Generate"**
   - **COPY THE TOKEN** (you won't see it again!)

2. **Add to GitHub**:
   - Click **"New repository secret"**
   - **Name**: `DOCKER_PASSWORD`
   - **Secret**: Paste the token
   - Click **"Add secret"**

---

## ✅ Verify Secrets

After adding all secrets, you should see:

```
Secrets (5)
├─ DOCKER_PASSWORD    ****
├─ DOCKER_USERNAME    ****
├─ EC2_HOST          ****
├─ EC2_SSH_KEY       ****
└─ EC2_USERNAME      ****
```

**GitHub only shows `****` for security** - this is normal!

---

## 🧪 Test Your Secrets

### Option 1: Manual Test (Recommended)

Push a small change to trigger the workflow:

```bash
# Make a small change
echo "# CI/CD Configured" >> README.md

# Commit and push
git add README.md
git commit -m "test: trigger CI/CD pipeline"
git push origin main
```

### Option 2: Manual Workflow Trigger

1. Go to **"Actions"** tab in GitHub
2. Select **"CI-CD Pipeline"** workflow
3. Click **"Run workflow"** → **"Run workflow"**

---

## 📊 Monitor Pipeline

After pushing:

1. Go to **"Actions"** tab
2. Click on the running workflow
3. Watch the jobs:
   - ✅ **test**: Should pass (linting, tests)
   - ✅ **build**: Should build Docker images
   - ✅ **deploy**: Should deploy to EC2

**If deploy fails**, check:
- Secrets are correct
- EC2 instance is running
- Security group allows SSH from GitHub IPs

---

## 🔧 Troubleshooting

### Error: "missing server host"

**Cause**: `EC2_HOST` secret not set or incorrect

**Fix**:
1. Check secret name is exactly `EC2_HOST` (case-sensitive)
2. Value should be IP only: `13.237.113.37` (no http://, no port)
3. Verify EC2 instance is running

### Error: "Permission denied (publickey)"

**Cause**: `EC2_SSH_KEY` incorrect or malformed

**Fix**:
1. Make sure you copied ENTIRE key including BEGIN/END lines
2. No extra spaces or newlines
3. Check key matches your EC2 instance key pair

### Error: "unauthorized: incorrect username or password"

**Cause**: Docker Hub credentials incorrect

**Fix**:
1. Verify Docker Hub username (case-sensitive)
2. If using password, try creating access token instead
3. Make sure Docker Hub account is active

### Error: "Host key verification failed"

**Cause**: EC2 instance changed or new instance

**Fix**:
Add this to workflow (already in your .github/workflows/ci-cd.yml):
```yaml
- name: Deploy to AWS EC2
  env:
    DISABLE_HOST_KEY_CHECKING: true
```

---

## 🎯 Your Exact Values

Based on your project:

```yaml
EC2_HOST: 13.237.113.37
EC2_USERNAME: ubuntu
EC2_SSH_KEY: [Content of taskapp-key.pem file]
DOCKER_USERNAME: [Your Docker Hub username]
DOCKER_PASSWORD: [Your Docker Hub password or token]
```

---

## 🔐 Security Best Practices

✅ **DO**:
- Use access tokens instead of passwords when possible
- Rotate secrets periodically
- Use minimal permissions
- Never commit secrets to Git

❌ **DON'T**:
- Share secrets publicly
- Commit `.pem` files to repository
- Use same password for multiple services
- Hard-code credentials in code

---

## 📝 Quick Checklist

Before running pipeline:

- [ ] EC2 instance is running
- [ ] EC2 public IP is current (IP changes if instance stopped/started)
- [ ] All 5 secrets added to GitHub
- [ ] Docker Hub account created
- [ ] SSH key is correct key for EC2 instance
- [ ] Pushed to `main` branch (workflow only runs on main)

---

## 🚀 After Secrets Configured

Your CI/CD pipeline will:

1. **On every push to main**:
   - Run tests
   - Build Docker images
   - Push to Docker Hub
   - Deploy to EC2 automatically

2. **Result**:
   - Zero-downtime deployments
   - Automated testing
   - Version-controlled deployments
   - Professional DevOps workflow

---

## 💡 Optional: GitHub Actions Badge

Add to README.md:

```markdown
![CI/CD Pipeline](https://github.com/ThongNguyen1510/devops-fullstack-monitoring-/actions/workflows/ci-cd.yml/badge.svg)
```

This shows build status on your README!

---

## 📚 Next Steps

After configuring secrets:

1. ✅ Push a change to trigger pipeline
2. ✅ Watch workflow run in Actions tab
3. ✅ Verify deployment to EC2
4. ✅ Add badge to README
5. ✅ Update CV: "Implemented automated CI/CD pipeline with GitHub Actions"

---

**Ready to configure your secrets?** 🔐

Follow steps 1-6 above to add all 5 secrets to GitHub!
