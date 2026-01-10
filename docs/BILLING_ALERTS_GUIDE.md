# AWS Billing Alerts Setup Guide

## 🎯 Why Setup Billing Alerts?

**Prevent unexpected charges!** Get email notifications if your AWS usage exceeds your budget.

**Recommended alerts**:
- $1 - Testing threshold
- $5 - Warning threshold  
- $10 - Critical threshold

## 📋 Step-by-Step Setup

### Method 1: AWS Budgets (Recommended)

#### Step 1: Navigate to Billing Console

**Option A: From AWS Console**
1. Click your **account name** (top right)
2. Click **Billing and Cost Management**

**Option B: Direct link**
- https://console.aws.amazon.com/billing/

#### Step 2: Enable Billing Alerts (First time only)

1. In Billing console, left sidebar → **Billing preferences**
2. Scroll to **Alert preferences**
3. Check: ✅ **Receive Billing Alerts**
4. Enter your email address
5. Click **Save preferences**
6. **Check your email** and confirm subscription

#### Step 3: Create Budget

1. Left sidebar → **Budgets**
2. Click **Create budget** (orange button)

3. **Budget setup**:
   - **Budget type**: Choose **Cost budget** ✅
   - Click **Next**

4. **Set budget amount**:
   
   **Budget name**: `Monthly-Free-Tier-Budget`
   
   **Period**: Monthly
   
   **Budget effective dates**: Recurring budget
   
   **Start month**: Current month
   
   **Budgeting method**: Fixed
   
   **Enter your budget amount**: `$5.00` (or $10)
   
   Click **Next**

5. **Configure alerts**:
   
   Click **Add an alert threshold**
   
   **Alert 1 - Warning**:
   - Threshold: `50%` (of budgeted amount)
   - Trigger: Actual costs
   - Email recipients: Your email
   - Click **Add**
   
   **Alert 2 - Critical**:
   - Click **Add alert threshold** again
   - Threshold: `80%` (of budgeted amount)
   - Trigger: Actual costs
   - Email recipients: Your email
   - Click **Add**
   
   **Alert 3 - Exceeded**:
   - Click **Add alert threshold** again
   - Threshold: `100%` (of budgeted amount)
   - Trigger: Actual costs
   - Email recipients: Your email
   
   Click **Next**

6. **Review**:
   - Verify settings
   - Click **Create budget**

7. **Confirm email**:
   - Check inbox for "AWS Budget Notification"
   - Click confirmation link

### Method 2: CloudWatch Billing Alarms (Alternative)

#### Step 1: Enable Billing Alerts

Same as Method 1, Step 2 above.

#### Step 2: Create CloudWatch Alarm

1. Navigate to **CloudWatch**: https://console.aws.amazon.com/cloudwatch/

2. **IMPORTANT**: Switch region to **US East (N. Virginia)** 
   - Top right corner → Select **us-east-1**
   - Billing metrics only available in this region!

3. Left sidebar → **Alarms** → **All alarms**

4. Click **Create alarm**

5. **Specify metric**:
   - Click **Select metric**
   - Choose **Billing** → **Total Estimated Charge**
   - Select checkbox for **USD**
   - Click **Select metric**

6. **Define conditions**:
   - Threshold type: **Static**
   - Whenever EstimatedCharges is: **Greater than**
   - Define threshold value: `5` (or your threshold)
   - Click **Next**

7. **Configure actions**:
   - Alarm state trigger: **In alarm**
   - Select SNS topic: **Create new topic**
   - Topic name: `billing-alerts`
   - Email: Your email
   - Click **Create topic**
   - Click **Next**

8. **Add name and description**:
   - Alarm name: `Billing-Alert-$5`
   - Description: `Alert when charges exceed $5`
   - Click **Next**

9. **Preview and create**:
   - Review all settings
   - Click **Create alarm**

10. **Confirm SNS subscription**:
    - Check email
    - Click "Confirm subscription" link

#### Step 3: Create Multiple Alarms

Repeat steps 4-10 for different thresholds:
- `Billing-Alert-$1` → threshold: $1
- `Billing-Alert-$10` → threshold: $10

## ✅ Verify Setup

### Check Budgets

1. **Billing console** → **Budgets**
2. Should see your budget listed
3. Status: Active
4. Current vs Budgeted: $0.00 / $5.00

### Check CloudWatch Alarms

1. **CloudWatch console** (us-east-1 region!)
2. **Alarms** → Should see your alarms
3. Status: OK (green)

### Test Email

- You should have received confirmation emails
- Save sender email for future alerts

## 📊 Monitor Your Costs

### Daily Checks (Recommended during testing)

**Billing Dashboard**:
- https://console.aws.amazon.com/billing/home#/
- Check **Month-to-date balance**
- Should be $0.00 or very low

**Free Tier Usage**:
- Billing console → **Free Tier**
- Monitor:
  - EC2 hours: 0/750 hours
  - RDS hours: 0/750 hours
  - Data transfer: 0/15 GB

### What to Watch

**EC2**:
- ✅ Only 1 t2.micro running
- ✅ Max 750 hours/month (31 days × 24h = 744h ✅)
- ⚠️ Stop when not using

**RDS**:
- ✅ Only 1 db.t3.micro or db.t2.micro
- ✅ Storage ≤ 20 GB
- ⚠️ No automated backups beyond 20 GB

**Data Transfer**:
- ✅ Keep under 15 GB/month
- ⚠️ Minimize large file downloads

**Elastic IP**:
- ✅ Free if attached to running instance
- ⚠️ Charges $0.005/hour if NOT attached!

## 💡 Tips to Stay in Free Tier

### Do's ✅
- ✅ Use only t2.micro/t3.micro instances
- ✅ Stop EC2 when not using (weekends, nights)
- ✅ Monitor Free Tier dashboard weekly
- ✅ Set up billing alerts
- ✅ Delete unused resources

### Don'ts ❌
- ❌ Don't run multiple instances simultaneously
- ❌ Don't exceed 750 hours/month per service
- ❌ Don't enable expensive features (NAT gateway, Load Balancer)
- ❌ Don't leave Elastic IPs unattached
- ❌ Don't ignore billing alerts!

## 🚨 If You Get a Billing Alert

### Step 1: Check Current Charges

1. **Billing Dashboard** → **Bills**
2. Expand current month
3. See breakdown by service

### Step 2: Identify Problem

**Common causes**:
- Multiple EC2 instances running
- RDS storage over 20 GB
- Data transfer exceeded
- Unattached Elastic IP
- Wrong instance type (not t2.micro)

### Step 3: Take Action

```bash
# Stop EC2 instance (doesn't delete, just stops)
# From EC2 console → Select instance → Instance State → Stop

# Delete unused snapshots
# EC2 → Snapshots → Delete old ones

# Release Elastic IPs not in use
# EC2 → Elastic IPs → Release
```

### Step 4: Monitor

- Wait 24 hours
- Check if charges stopped increasing
- Adjust budget if needed

## 📧 What Billing Emails Look Like

**Budget Alert**:
```
Subject: AWS Budgets: Monthly-Free-Tier-Budget has exceeded your alert threshold

Your budget Monthly-Free-Tier-Budget has exceeded 
50% of your $5.00 budget threshold...
```

**CloudWatch Alarm**:
```
Subject: ALARM: "Billing-Alert-$5" in US East (N. Virginia)

You are receiving this email because your Amazon CloudWatch 
Alarm "Billing-Alert-$5" in the US East (N. Virginia) region 
has entered the ALARM state...
```

## 🎯 Recommended Setup for This Project

**For DevOps Project Testing**:

1. **Budget**: $10/month
   - Alert at $5 (50%)
   - Alert at $8 (80%)
   - Alert at $10 (100%)

2. **CloudWatch**: Single alarm at $5

3. **Check frequency**: Daily for first week

**Why $10?**
- RDS + EC2 should be $0 in free tier
- $10 buffer for accidental overages
- Peace of mind while learning

## 📋 Billing Alert Checklist

- [ ] Enabled "Receive Billing Alerts" in preferences
- [ ] Confirmed email subscription
- [ ] Created budget with 3 alert thresholds
- [ ] Created CloudWatch alarm (optional)
- [ ] Bookmarked Billing Dashboard
- [ ] Bookmarked Free Tier page
- [ ] Set calendar reminder to check weekly

## ⏭️ After Setup

**You're now protected!** ✅

You can safely proceed to:
- Continue with EC2 deployment
- Test your application
- Learn AWS without cost worries

**Next**: Return to [EC2 Setup Guide](file:///d:/code%20projects/devops-fullstack-monitoring-/docs/EC2_SETUP_GUIDE.md)

---

**Remember**: AWS Free Tier is VERY generous. If you:
- Use only 1 EC2 t2.micro
- Use only 1 RDS t3.micro
- Stay under 750 hours each
- Keep storage under limits

Your cost will be **$0.00** ✅

**Questions?** Check [AWS Free Tier FAQ](https://aws.amazon.com/free/free-tier-faqs/)
