# AWS EC2 Setup Guide - Phase 3

## ✅ Prerequisites

Before starting EC2 setup:
- [x] RDS database `taskdb-production` is Available
- [ ] RDS endpoint saved (will get in this phase)
- [ ] RDS security group configured for PostgreSQL
- [ ] ~30 minutes of time

## 🎯 Phase 3: Launch and Configure EC2 Instance

### Part A: Launch EC2 Instance

#### Step 1: Navigate to EC2 Console

1. **AWS Console** → Search bar → Type: `EC2`
2. Click **EC2** (Virtual servers in the cloud)
3. Or direct link: https://console.aws.amazon.com/ec2/

#### Step 2: Launch Instance

1. Click **"Launch instance"** button (orange, top right)

2. **Name and tags**:
   ```
   Name: taskapp-server
   ```

3. **Application and OS Images (AMI)**:
   - Quick Start: **Ubuntu**
   - AMI: **Ubuntu Server 22.04 LTS** (Free tier eligible)
   - Architecture: **64-bit (x86)**

4. **Instance type**:
   - Select: **t2.micro** ✅ Free tier eligible
   - vCPUs: 1, Memory: 1 GiB

5. **Key pair (login)**:
   
   **Option A: Create new key pair**
   - Click "Create new key pair"
   - Key pair name: `taskapp-key`
   - Key pair type: **RSA**
   - Private key file format: **.pem** (for SSH)
   - Click "Create key pair"
   - ⚠️ **File will download - SAVE IT!** You need this to SSH!

   **Option B: Use existing key pair**
   - Select from dropdown if you have one

6. **Network settings**:
   
   Click **"Edit"** button to customize:
   
   **VPC**: Default VPC (hoặc same VPC với RDS)
   
   **Subnet**: No preference
   
   **Auto-assign public IP**: **Enable** ✅
   
   **Firewall (security groups)**:
   - Select: **Create security group** ✅
   - Security group name: `taskapp-sg`
   - Description: `Security group for task manager app`
   
   **Inbound security group rules** - Add these rules:
   
   | Type | Protocol | Port Range | Source |
   |------|----------|------------|--------|
   | SSH | TCP | 22 | My IP (your IP) |
   | HTTP | TCP | 80 | Anywhere (0.0.0.0/0) |
   | HTTPS | TCP | 443 | Anywhere (0.0.0.0/0) |
   | Custom TCP | TCP | 3000 | Anywhere (0.0.0.0/0) |
   | Custom TCP | TCP | 3001 | Anywhere (0.0.0.0/0) |
   | Custom TCP | TCP | 5000 | Anywhere (0.0.0.0/0) |
   | Custom TCP | TCP | 9090 | Anywhere (0.0.0.0/0) |
   
   Click **"Add security group rule"** for each one above.

7. **Configure storage**:
   - Storage: **20 GB** gp3 (Free tier: up to 30 GB)
   - Root volume: Keep defaults

8. **Advanced details**:
   - Keep all defaults
   - (Optional) Add startup script in "User data" - we'll install manually

9. **Summary**:
   - Verify: "Free tier eligible"
   - Number of instances: **1**

10. **Launch**:
    - Click **"Launch instance"** (orange button)
    - Wait for "Success" message
    - Click **"View all instances"**

#### Step 3: Wait for Instance Ready

Instance will go through states:
```
Pending → Running ✅
```

Status checks:
```
Initializing → 2/2 checks passed ✅
```

**Wait ~2 minutes** for both Running + 2/2 checks.

#### Step 4: Get Instance Connection Info

1. **Select your instance** (checkbox)
2. **Instance details** will show below:
   - **Instance ID**: i-xxxxx
   - **Public IPv4 address**: `3.xxx.xxx.xxx` ← Copy this!
   - **Public IPv4 DNS**: ec2-xx-xx-xx-xx.compute.amazonaws.com

3. **Save these**:
   ```
   EC2 Public IP: 3.xxx.xxx.xxx
   EC2 DNS: ec2-xx-xx-xx-xx.ap-southeast-2.compute.amazonaws.com
   ```

#### Step 5: Allocate Elastic IP (Optional but Recommended)

**Why?** IP won't change when you stop/start instance.

1. Left sidebar → **Elastic IPs**
2. Click **"Allocate Elastic IP address"**
3. Click **"Allocate"**
4. Select the new IP → **Actions** → **Associate Elastic IP address**
5. Select your instance `taskapp-server`
6. Click **"Associate"**
7. **Save new Elastic IP** - this is your permanent IP!

### Part B: Connect to EC2 Instance

#### Option 1: SSH from Windows (PowerShell)

```powershell
# Navigate to key file location
cd Downloads

# Set key permissions (if needed)
icacls taskapp-key.pem /inheritance:r
icacls taskapp-key.pem /grant:r "$($env:USERNAME):(R)"

# Connect
ssh -i taskapp-key.pem ubuntu@3.xxx.xxx.xxx
```

#### Option 2: SSH from Mac/Linux

```bash
# Set key permissions
chmod 400 taskapp-key.pem

# Connect
ssh -i taskapp-key.pem ubuntu@3.xxx.xxx.xxx
```

#### Option 3: EC2 Instance Connect (Browser-based)

1. Select instance in EC2 console
2. Click **"Connect"** button
3. Tab **"EC2 Instance Connect"**
4. Click **"Connect"**
5. Browser terminal will open

**First login prompt**:
```
The authenticity of host '...' can't be established.
Are you sure you want to continue? (yes/no)
```
Type: `yes`

**Success!** You'll see:
```
ubuntu@ip-xxx-xx-xx-xx:~$
```

### Part C: Install Docker & Docker Compose on EC2

Run these commands one by one:

```bash
# Update system
sudo apt update
sudo apt upgrade -y

# Install prerequisites
sudo apt install -y ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add ubuntu user to docker group (no need for sudo)
sudo usermod -aG docker ubuntu

# Logout and login again for group to take effect
exit
```

**SSH back in**:
```bash
ssh -i taskapp-key.pem ubuntu@3.xxx.xxx.xxx
```

**Verify Docker installation**:
```bash
docker --version
# Should show: Docker version 24.x.x

docker compose version
# Should show: Docker Compose version v2.x.x
```

### Part D: Clone Repository & Configure

```bash
# Install git
sudo apt install -y git

# Clone your repository
git clone https://github.com/ThongNguyen1510/devops-fullstack-monitoring-.git

# Navigate to project
cd devops-fullstack-monitoring-

# Create backend .env file
nano backend/.env
```

**In nano editor, paste**:
```env
PORT=5000
NODE_ENV=production
LOG_LEVEL=info

# Replace with YOUR RDS endpoint!
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@taskdb-production.xxxxx.ap-southeast-2.rds.amazonaws.com:5432/postgres

CORS_ORIGIN=*
```

**Save file**: 
- Press `Ctrl+X`
- Press `Y`
- Press `Enter`

### Part E: Deploy Application

```bash
# Make sure you're in project directory
cd ~/devops-fullstack-monitoring-

# Start all services
docker compose up -d

# Wait ~2 minutes for all containers to start

# Check running containers
docker compose ps

# Should see 9 services running

# Check logs
docker compose logs -f backend
# Ctrl+C to exit logs
```

### Part F: Verify Deployment

**From your local machine browser**:

1. **Application**: http://3.xxx.xxx.xxx
2. **Backend Health**: http://3.xxx.xxx.xxx:5000/health
3. **Grafana**: http://3.xxx.xxx.xxx:3001 (admin/admin)
4. **Prometheus**: http://3.xxx.xxx.xxx:9090

Replace `3.xxx.xxx.xxx` with your EC2 public IP!

## ✅ Success Criteria

- [ ] EC2 instance running and accessible via SSH
- [ ] Docker and Docker Compose installed
- [ ] Repository cloned
- [ ] Environment variables configured with RDS endpoint
- [ ] All 9 containers running
- [ ] Application accessible from browser
- [ ] Health check returns "healthy"
- [ ] Can create/view tasks

## 📝 Important Info to Save

```
EC2 Instance Details:
====================
Instance ID: i-xxxxx
Public IP: 3.xxx.xxx.xxx
Elastic IP: 3.xxx.xxx.xxx (if allocated)
SSH Key: taskapp-key.pem
Username: ubuntu

Connection:
ssh -i taskapp-key.pem ubuntu@3.xxx.xxx.xxx

Application URLs:
Frontend: http://3.xxx.xxx.xxx
Backend: http://3.xxx.xxx.xxx:5000
Grafana: http://3.xxx.xxx.xxx:3001
Prometheus: http://3.xxx.xxx.xxx:9090
```

## 🐛 Troubleshooting

### Can't SSH to instance

**Check**:
- Security group allows SSH (port 22) from your IP
- Using correct key file
- Instance is running
- Public IP is correct

### Docker containers won't start

```bash
# Check Docker status
sudo systemctl status docker

# Restart Docker
sudo systemctl restart docker

# Check logs
docker compose logs
```

### Backend can't connect to RDS

**Check**:
- RDS security group allows EC2 security group on port 5432
- DATABASE_URL in .env is correct
- RDS endpoint is correct
- Password is correct

**Fix RDS Security Group**:
1. Go to RDS console
2. Click on database
3. Connectivity & security → VPC security group
4. Inbound rules → Edit
5. Add rule:
   - Type: PostgreSQL
   - Source: Custom → Select EC2 security group `taskapp-sg`

### Application not accessible from browser

**Check**:
- EC2 security group allows HTTP (80), port 3000
- Docker containers running: `docker compose ps`
- Nginx running: `docker compose logs nginx`

## 💰 Cost Monitoring

**Free Tier Usage**:
- EC2 t2.micro: 750 hours/month
- Running 24/7 = 720 hours/month ✅ Within limit
- 1 instance only!

**To avoid charges**:
- Stop instance when not using
- Monitor billing dashboard
- Set up billing alerts

## ⏭️ Next Steps

After successful deployment:
- [ ] Test all application features
- [ ] Setup CI/CD auto-deployment
- [ ] Configure domain name (optional)
- [ ] Setup SSL/HTTPS
- [ ] Create Grafana dashboards
- [ ] Take screenshots for portfolio!

---

**Ready to launch EC2? Let's do it!** 🚀
