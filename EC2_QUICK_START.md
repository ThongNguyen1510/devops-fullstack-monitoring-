# EC2 Launch Quick Start

## 🎯 Quick Steps Checklist

### Step 1: Navigate to EC2 ✅
- [ ] Go to AWS Console: https://console.aws.amazon.com/
- [ ] Search bar → Type "EC2"
- [ ] Click "EC2" service

### Step 2: Launch Instance 🚀
- [ ] Click "Launch instance" (orange button)
- [ ] Name: `taskapp-server`

### Step 3: Choose AMI
- [ ] Quick Start: **Ubuntu**
- [ ] Select: **Ubuntu Server 22.04 LTS**
- [ ] Verify: "Free tier eligible" tag ✅

### Step 4: Instance Type
- [ ] Select: **t2.micro** ✅
- [ ] Verify: "Free tier eligible"

### Step 5: Key Pair (IMPORTANT!)
- [ ] Click "Create new key pair"
- [ ] Name: `taskapp-key`
- [ ] Type: RSA
- [ ] Format: **.pem**
- [ ] Click "Create key pair"
- [ ] **SAVE THE FILE!** (password for SSH)

### Step 6: Network Settings
- [ ] Click "Edit" button
- [ ] Auto-assign public IP: **Enable**
- [ ] Create security group: `taskapp-sg`
- [ ] Add these rules:

| Type | Port | Source |
|------|------|--------|
| SSH | 22 | My IP |
| HTTP | 80 | Anywhere (0.0.0.0/0) |
| HTTPS | 443 | Anywhere (0.0.0.0/0) |
| Custom TCP | 3000 | Anywhere (0.0.0.0/0) |
| Custom TCP | 3001 | Anywhere (0.0.0.0/0) |
| Custom TCP | 5000 | Anywhere (0.0.0.0/0) |
| Custom TCP | 9090 | Anywhere (0.0.0.0/0) |

**Note**: Click "Add security group rule" for each port!

### Step 7: Storage
- [ ] Keep default: **20 GB gp3**

### Step 8: Launch!
- [ ] Verify "Free tier eligible" in summary
- [ ] Click "Launch instance" (orange)
- [ ] Wait for "Success" message
- [ ] Click "View all instances"

### Step 9: Wait for Ready
- [ ] Instance State: Pending → **Running** ✅
- [ ] Status Checks: Initializing → **2/2 checks passed** ✅
- [ ] Wait ~2 minutes

### Step 10: Get Public IP
- [ ] Select your instance (checkbox)
- [ ] Copy **Public IPv4 address**: `3.xxx.xxx.xxx`
- [ ] **SAVE THIS IP!**

## 📝 Info to Save

```
EC2 Instance Info:
==================
Name: taskapp-server
Instance Type: t2.micro
AMI: Ubuntu 22.04 LTS
Public IP: [will get after launch]
Key File: taskapp-key.pem

Security Group Ports:
- 22 (SSH)
- 80 (HTTP)
- 443 (HTTPS)
- 3000 (Frontend direct)
- 3001 (Grafana)
- 5000 (Backend)
- 9090 (Prometheus)
```

## ⏭️ After EC2 Launches

**Next steps**:
1. Connect via SSH
2. Install Docker
3. Deploy application

See full guide: [EC2_SETUP_GUIDE.md](file:///d:/code%20projects/devops-fullstack-monitoring-/docs/EC2_SETUP_GUIDE.md)

## 🚨 Important Notes

**DON'T FORGET**:
- ⚠️ Download and save `.pem` key file
- ⚠️ Save Public IP address
- ⚠️ Only launch 1 instance
- ⚠️ Choose t2.micro only

**SCREENSHOT**:
- Take screenshot when instance is Running
- Save for your portfolio!

---

**Ready? Go to AWS Console and start! 🚀**

Report back when:
- Instance is running ✅
- You have Public IP ✅
- Key file downloaded ✅
