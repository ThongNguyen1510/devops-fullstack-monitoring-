# RDS PostgreSQL Setup - Detailed Guide

## ✅ Prerequisites
- AWS Account logged in
- Browser open to AWS Console
- ~15 minutes

## 📋 Step-by-Step Instructions

### Step 1: Navigate to RDS Console

**Option A: From AWS Console Home**
1. Go to https://console.aws.amazon.com/
2. In the search bar at top, type: `RDS`
3. Click on **RDS** (Relational Database Service)

**Option B: Direct Link**
- Navigate directly to: https://console.aws.amazon.com/rds/

### Step 2: Create Database

1. **Click "Create database" button** (orange button, top right)

2. **Choose database creation method**:
   - Select: **Standard create** ✅

3. **Engine options**:
   - Engine type: **PostgreSQL** ✅
   - Version: **PostgreSQL 15.x** (latest stable)

4. **Templates**:
   - Select: **Free tier** ✅✅✅
   - ⚠️ IMPORTANT: This limits instance to db.t2.micro/db.t3.micro

### Step 3: Settings Configuration

**DB Instance identifier**:
```
taskdb-production
```
(hoặc tên khác bạn thích)

**Credentials Settings**:

**Master username**:
```
postgres
```

**Master password**:
```
[Choose a strong password]
```

**Confirm password**: 
```
[Same password]
```

📝 **SAVE THESE!** Bạn sẽ cần cho connection string:
```
Username: postgres
Password: [your-password]
```

### Step 4: Instance Configuration

**DB instance class**:
- **Burstable classes (includes t classes)** ✅
- Select: **db.t3.micro** hoặc **db.t2.micro**
- ✅ Free tier eligible

**Storage**:
- Storage type: **General Purpose SSD (gp2)**
- Allocated storage: **20 GB** (free tier limit)
- ❌ **Uncheck** "Enable storage autoscaling" (để tránh charges)

### Step 5: Connectivity

**Compute resource**:
- Select: **Don't connect to an EC2 compute resource** 
  (chúng ta sẽ connect sau)

**Network type**:
- IPv4

**Virtual private cloud (VPC)**:
- Default VPC (hoặc VPC của bạn)

**DB Subnet group**:
- default

**Public access**:
- Select: **No** ✅ (An toàn hơn)
  - EC2 sẽ connect qua private network
  - Nếu muốn connect từ máy local để test: chọn "Yes"

**VPC security group**:
- **Create new** ✅
- New VPC security group name: `taskdb-sg`

**Availability Zone**:
- No preference

### Step 6: Database Authentication

**Database authentication**:
- Select: **Password authentication** ✅

### Step 7: Additional Configuration

**Expand "Additional configuration"**

**Initial database name**:
```
taskdb
```
⚠️ **IMPORTANT**: Phải điền tên database!

**DB parameter group**:
- default.postgres15

**Backup**:
- ❌ **Uncheck** "Enable automated backups" (để tiết kiệm trong free tier)
- Hoặc giữ enabled với retention 1 day

**Encryption**:
- ✅ Keep enabled (free)

**Maintenance**:
- ❌ **Uncheck** "Enable auto minor version upgrade" (để tránh unexpected changes)

**Deletion protection**:
- ❌ **Uncheck** (để dễ xóa khi test)

### Step 8: Create Database

1. **Review summary** panel bên phải
   - Verify: Free tier eligible
   - Check monthly cost estimate: **$0.00**

2. **Click "Create database"** button (orange, bottom right)

3. **Wait for creation** (5-10 minutes)
   - Status will show: **Creating** → **Backing up** → **Available**
   - Refresh page to check status

### Step 9: Get Connection Endpoint

**Once status = "Available"**:

1. Click on database name: `taskdb-production`

2. **Connectivity & security** tab:
   - Find **Endpoint**: 
     ```
     taskdb-production.xxxxx.us-east-1.rds.amazonaws.com
     ```
   - Copy this! You'll need it.

3. **Port**: Should be `5432`

### Step 10: Configure Security Group

**Allow EC2 to connect**:

1. In database details, click on VPC security group: `taskdb-sg`

2. **Inbound rules** tab → Click **Edit inbound rules**

3. **Add rule**:
   - Type: **PostgreSQL**
   - Protocol: TCP
   - Port range: 5432
   - Source: 
     - **Option A**: Custom → Select EC2 security group (sau khi tạo EC2)
     - **Option B**: My IP → [Your IP] (để test từ local)
     - **Option C**: Anywhere (0.0.0.0/0) - ⚠️ Không khuyến khích cho production

4. **Save rules**

### Step 11: Test Database Connection (Optional)

**From your local machine**:

```bash
# Install PostgreSQL client nếu chưa có
# Windows: Download from postgresql.org
# Mac: brew install postgresql
# Linux: sudo apt install postgresql-client

# Test connection
psql -h taskdb-production.xxxxx.us-east-1.rds.amazonaws.com \
     -U postgres \
     -d taskdb

# Enter password when prompted
```

**If connection successful**:
```sql
taskdb=> \dt
-- Lists tables (should be empty initially)

taskdb=> SELECT version();
-- Shows PostgreSQL version

taskdb=> \q
-- Quit
```

## ✅ Success Criteria

- [ ] Database status = "Available"
- [ ] Endpoint copied and saved
- [ ] Security group configured
- [ ] Can connect (test connection successful)
- [ ] Database name = `taskdb`

## 📝 Save This Information

**Connection String Format**:
```
postgresql://postgres:[PASSWORD]@[ENDPOINT]:5432/taskdb
```

**Example**:
```
postgresql://postgres:MySecurePass123@taskdb-production.abc123.us-east-1.rds.amazonaws.com:5432/taskdb
```

**Save to**: Notepad or password manager! Bạn sẽ cần để:
1. Configure backend `.env` trên EC2
2. Add to GitHub Secrets
3. Update docker-compose

## 🐛 Troubleshooting

**Problem**: Can't connect from local machine

**Solution**:
1. Check security group allows your IP
2. Verify "Public access" = Yes (nếu connect từ internet)
3. Check VPC and subnet settings

**Problem**: Creation takes too long

**Solution**:
- Normal to take 5-10 minutes
- Refresh page to check status
- Look for error messages in Events tab

**Problem**: "Free tier not available"

**Solution**:
- Make sure instance class = db.t2.micro or db.t3.micro
- Storage = 20 GB or less
- Check you haven't exceeded free tier hours (750/month)

## 💰 Cost Reminder

**Free Tier Limits**:
- 750 hours/month of db.t2.micro or db.t3.micro
- 20 GB storage
- 20 GB backup storage

**Stays FREE if**:
- Only 1 database running
- Within storage limits
- Account less than 12 months old (free tier period)

## ⏭️ Next Step

Once RDS is ready → **Phase 3: EC2 Instance Setup**

Update progress in [`AWS_DEPLOYMENT_PROGRESS.md`](file:///d:/code%20projects/devops-fullstack-monitoring-/AWS_DEPLOYMENT_PROGRESS.md):

```markdown
## Phase 2: RDS PostgreSQL Setup ✅
- [x] Navigate to RDS console
- [x] Create database instance (t2.micro)
- [x] Configure security group
- [x] Get connection endpoint
- [x] Test database connection

Endpoint: taskdb-production.xxxxx.us-east-1.rds.amazonaws.com:5432
Database: taskdb
Username: postgres
```

---

**Ready to continue?** → [Phase 3: EC2 Setup](file:///d:/code%20projects/devops-fullstack-monitoring-/docs/DEPLOYMENT.md#step-2-setup-ec2-instance)
