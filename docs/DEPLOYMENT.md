# AWS Deployment Guide

This guide walks you through deploying the Task Manager application to AWS using EC2 and RDS.

## Prerequisites

- AWS Account
- AWS CLI installed and configured
- SSH key pair created in AWS

## Architecture on AWS

```
┌─────────────────────────────────────┐
│         AWS Cloud (Free Tier)       │
│                                     │
│  ┌──────────────┐  ┌─────────────┐ │
│  │   EC2        │  │    RDS      │ │
│  │  t2.micro    │──│  PostgreSQL │ │
│  │              │  │  t2.micro   │ │
│  │ Docker Host  │  └─────────────┘ │
│  └──────┬───────┘                  │
│         │                          │
└─────────┼──────────────────────────┘
          │
     Public Internet
```

## Step 1: Setup RDS PostgreSQL

### 1.1 Create RDS Instance

1. Go to **RDS Console** → **Create database**
2. **Configuration**:
   - Engine: PostgreSQL 15
   - Template: Free tier
   - DB instance identifier: `taskdb`
   - Master username: `postgres`
   - Master password: [Choose secure password]
   - DB instance class: `db.t2.micro`
   - Storage: 20 GB
   - Enable auto minor version upgrade

3. **Connectivity**:
   - VPC: Default VPC
   - Public access: **No** (for security)
   - VPC security group: Create new → `taskdb-sg`

4. **Additional configuration**:
   - Initial database name: `taskdb`
   - Backup retention: 7 days

5. Click **Create database**

### 1.2 Configure Security Group

1. Go to **EC2 Console** → **Security Groups**
2. Find `taskdb-sg`
3. Add inbound rule:
   - Type: PostgreSQL
   - Port: 5432
   - Source: EC2 security group (we'll create this next)

## Step 2: Setup EC2 Instance

### 2.1 Launch EC2 Instance

1. Go to **EC2 Console** → **Launch Instance**
2. **Configuration**:
   - Name: `task-manager-app`
   - AMI: Ubuntu Server 22.04 LTS
   - Instance type: `t2.micro` (free tier)
   - Key pair: Select or create new
   - Network: Default VPC
   - Security group: Create new → `task-app-sg`

3. **Security group rules**:
   ```
   SSH          TCP    22     Your IP
   HTTP         TCP    80     0.0.0.0/0
   HTTPS        TCP    443    0.0.0.0/0
   Custom TCP   TCP    3000   Your IP  (Grafana)
   ```

4. **Storage**: 20 GB gp2

5. Click **Launch instance**

### 2.2 Allocate Elastic IP

1. Go to **EC2 Console** → **Elastic IPs**
2. Click **Allocate Elastic IP address**
3. Associate with your EC2 instance

## Step 3: Configure EC2 Instance

### 3.1 Connect to EC2

```bash
ssh -i your-key.pem ubuntu@YOUR_ELASTIC_IP
```

### 3.2 Install Docker

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker ubuntu

# Logout and login again
exit
ssh -i your-key.pem ubuntu@YOUR_ELASTIC_IP

# Verify Docker installation
docker --version
```

### 3.3 Install Docker Compose

```bash
# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Make executable
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker-compose --version
```

### 3.4 Clone Repository

```bash
# Create app directory
mkdir -p /home/ubuntu/app
cd /home/ubuntu/app

# Clone your repository
git clone https://github.com/YOUR_USERNAME/devops-fullstack-monitoring.git .

# Or if using private repo
git clone https://<TOKEN>@github.com/YOUR_USERNAME/devops-fullstack-monitoring.git .
```

## Step 4: Configure Application

### 4.1 Setup Environment Variables

```bash
cd /home/ubuntu/app

# Create backend .env file
cat > backend/.env << EOF
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@YOUR_RDS_ENDPOINT:5432/taskdb
NODE_ENV=production
PORT=5000
LOG_LEVEL=info
CORS_ORIGIN=http://YOUR_ELASTIC_IP
EOF
```

To find your RDS endpoint:
```bash
# In AWS Console: RDS → Databases → taskdb → Connectivity & security
# Example: taskdb.xxxxx.us-east-1.rds.amazonaws.com
```

### 4.2 Modify docker-compose for production

```bash
# Use production compose file (create if needed)
cp docker-compose.yml docker-compose.prod.yml

# Edit to remove postgres service (using RDS instead)
nano docker-compose.prod.yml
```

Remove or comment out the `postgres` service and update backend environment:

```yaml
services:
  backend:
    environment:
      DATABASE_URL: postgresql://postgres:PASSWORD@RDS_ENDPOINT:5432/taskdb
      NODE_ENV: production
```

## Step 5: Deploy Application

### 5.1 Initial Deployment

```bash
cd /home/ubuntu/app

# Pull/Build images
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 5.2 Initialize Database

```bash
# If init.sql didn't run automatically
docker exec -i taskdb-backend psql $DATABASE_URL < database/init.sql
```

### 5.3 Verify Deployment

```bash
# Check backend health
curl http://localhost:5000/health

# Check frontend
curl http://localhost

# Check metrics
curl http://localhost:5000/metrics
```

## Step 6: Configure GitHub Actions

### 6.1 Add GitHub Secrets

Go to GitHub repository → Settings → Secrets and variables → Actions

Add the following secrets:
```
DOCKER_USERNAME        # Your Docker Hub username
DOCKER_PASSWORD        # Docker Hub access token
EC2_HOST              # Your Elastic IP
EC2_USERNAME          # ubuntu
EC2_SSH_KEY           # Content of your .pem file
```

### 6.2 Setup SSH Key

```bash
# On your local machine, copy your EC2 key
cat your-key.pem
# Copy entire content including -----BEGIN/END-----

# Paste into GitHub Secrets as EC2_SSH_KEY
```

### 6.3 Test CI/CD

```bash
# Make a change and push
git add .
git commit -m "Test CI/CD pipeline"
git push origin main

# Check GitHub Actions tab for pipeline execution
```

## Step 7: Access Application

- **Application**: `http://YOUR_ELASTIC_IP`
- **Grafana**: `http://YOUR_ELASTIC_IP:3001` (admin/admin)
- **Prometheus**: `http://YOUR_ELASTIC_IP:9090`

## Step 8: Setup Domain (Optional)

### 8.1 Configure Route 53

1. Register domain or use existing
2. Create hosted zone
3. Add A record pointing to Elastic IP

### 8.2 Setup SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is configured automatically
```

## Monitoring & Maintenance

### View Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend

# Last 100 lines
docker-compose -f docker-compose.prod.yml logs --tail=100 backend
```

### Restart Services

```bash
# All services
docker-compose -f docker-compose.prod.yml restart

# Specific service
docker-compose -f docker-compose.prod.yml restart backend
```

### Update Application

```bash
cd /home/ubuntu/app
git pull origin main
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

### Backup Database

```bash
# Create backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore backup
psql $DATABASE_URL < backup_20240101.sql
```

## Cost Optimization

### Free Tier Limits (Monthly)

- **EC2**: 750 hours of t2.micro (1 instance = 24/7 free)
- **RDS**: 750 hours of db.t2.micro
- **Storage**: 20 GB EBS, 20 GB database storage
- **Data Transfer**: 15 GB out

### Tips to Stay in Free Tier

1. ✅ Use only 1 EC2 t2.micro instance
2. ✅ Use only 1 RDS db.t2.micro instance
3. ⚠️ Monitor data transfer (keep under 15 GB/month)
4. ⚠️ Delete unused snapshots and AMIs
5. ⚠️ Stop/terminate test instances

### Monitor Costs

```bash
# Setup billing alerts in AWS Console
# CloudWatch → Billing → Create alarm
# Set threshold at $1-5 to get notified
```

## Troubleshooting

### Can't connect to RDS from EC2

```bash
# Check security group allows EC2 → RDS on port 5432
# Test connection
telnet YOUR_RDS_ENDPOINT 5432
```

### Backend can't connect to database

```bash
# Check environment variables
docker-compose -f docker-compose.prod.yml exec backend env | grep DATABASE

# Check logs
docker-compose -f docker-compose.prod.yml logs backend

# Test connection manually
docker-compose -f docker-compose.prod.yml exec backend node -e "const {Pool}=require('pg'); const pool=new Pool({connectionString:process.env.DATABASE_URL}); pool.query('SELECT NOW()').then(console.log).catch(console.error);"
```

### Out of disk space

```bash
# Check disk usage
df -h

# Clean Docker
docker system prune -a

# Remove old logs
sudo journalctl --vacuum-time=7d
```

## Security Best Practices

1. ✅ RDS not publicly accessible
2. ✅ Use strong passwords
3. ✅ Restrict SSH to your IP only
4. ✅ Enable AWS CloudWatch monitoring
5. ✅ Regular security updates: `sudo apt update && sudo apt upgrade`
6. ✅ Use IAM roles instead of access keys when possible

## Next Steps

- [ ] Setup CloudWatch logs
- [ ] Configure auto-scaling (if needed beyond free tier)
- [ ] Setup automated backups
- [ ] Implement CloudFront CDN
- [ ] Add WAF rules
- [ ] Configure AWS Systems Manager

---

🎉 **Congratulations!** Your application is now running on AWS with full CI/CD pipeline!
