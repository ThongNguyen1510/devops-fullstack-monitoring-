# 🌐 Custom Domain Setup Guide

## Overview

Transform your application from `http://13.237.113.37` to `https://yourdomain.com`!

This guide covers:
- Domain registration
- DNS configuration (AWS Route 53)
- SSL/HTTPS setup (Let's Encrypt)
- Nginx configuration

---

## 🎯 What You'll Achieve

**Before**:
```
http://13.237.113.37           → Application
http://13.237.113.37:3001      → Grafana
http://13.237.113.37:9090      → Prometheus
```

**After**:
```
https://taskmanager.yourdomain.com     → Application (SSL!)
https://grafana.yourdomain.com         → Grafana (SSL!)
https://prometheus.yourdomain.com      → Prometheus (SSL!)
```

---

## 📋 Options Overview

### Option 1: Free Domain (.tk, .ml, .ga) 🆓
- **Cost**: FREE
- **Provider**: Freenom
- **Pros**: No cost, good for learning
- **Cons**: Less professional, may be blocked by some services
- **Time**: 10 minutes

### Option 2: Cheap Domain (.xyz, .online) 💰
- **Cost**: $1-5/year
- **Provider**: Namecheap, GoDaddy
- **Pros**: Very affordable, professional
- **Cons**: Small annual cost
- **Time**: 15 minutes

### Option 3: AWS Route 53 Domain ☁️
- **Cost**: $12/year (.com), $0.50/month for hosted zone
- **Provider**: AWS Route 53
- **Pros**: Integrated with AWS, easy setup
- **Cons**: More expensive
- **Time**: 20 minutes

### Option 4: Free Subdomain (Recommended for Students!) 🎓
- **Cost**: FREE
- **Provider**: No-IP, DuckDNS, Cloudflare Tunnel
- **Pros**: Completely free, works well
- **Cons**: Subdomain only (e.g., `yourapp.duckdns.org`)
- **Time**: 5 minutes

---

## 🚀 Quick Start: Option 4 - Free Subdomain (DuckDNS)

**Fastest way to get a domain (5 minutes!)**

### Step 1: Get Free Subdomain

1. **Go to**: https://www.duckdns.org
2. Click **"Sign in"** with GitHub/Google
3. **Enter subdomain**: `taskmanager-yourname` 
   - Example: `taskmanager-thong.duckdns.org`
4. **Enter IP**: `13.237.113.37` (your EC2 public IP)
5. Click **"Add domain"**
6. **Done!** Domain created instantly ✅

### Step 2: Test Domain

```bash
# Should now work
curl http://taskmanager-thong.duckdns.org

# Or open in browser
http://taskmanager-thong.duckdns.org
```

### Step 3: (Optional) Add SSL

See "SSL Setup with Let's Encrypt" section below.

**That's it! You now have a custom domain!** 🎉

---

## 💰 Detailed Guide: Option 2 - Cheap Domain

**Best value for money ($1-5/year)**

### Step 1: Buy Domain

**Recommended providers**:

**Namecheap** (Popular, cheap):
1. Go to: https://www.namecheap.com
2. Search domain (e.g., `taskmanager-demo`)
3. Choose extension:
   - `.xyz` → $1-2/year ⭐ Cheapest!
   - `.online` → $2-3/year
   - `.site` → $2-3/year
   - `.fun` → $2-3/year
   - `.com` → $9-12/year (most professional)
4. Add to cart
5. Checkout (~$1-5)

**Alternative providers**:
- GoDaddy: https://www.godaddy.com
- Google Domains: https://domains.google
- Porkbun: https://porkbun.com (very cheap!)

### Step 2: Configure DNS

**Option A: Use Domain Provider's DNS**

On Namecheap:
1. Login → **Domain List**
2. Click **"Manage"** next to your domain
3. Tab **"Advanced DNS"**
4. Click **"Add New Record"**
5. Add A Record:
   ```
   Type: A Record
   Host: @
   Value: 13.237.113.37
   TTL: Automatic
   ```
6. Click **"Save All Changes"**

**Option B: Use AWS Route 53 (Better integration)**

See "AWS Route 53 Setup" section below.

### Step 3: Wait for DNS Propagation

```bash
# Check if domain resolves (wait 5-30 minutes)
nslookup yourdomain.xyz
ping yourdomain.xyz

# Should return: 13.237.113.37
```

### Step 4: Test

```bash
curl http://yourdomain.xyz
# Should show your application!
```

---

## ☁️ AWS Route 53 Setup (Professional Option)

**Best for AWS-integrated setup**

### Step 1: Buy Domain in Route 53 (Optional)

If you want to buy domain through AWS:

1. **AWS Console** → **Route 53**
2. Click **"Registered domains"**
3. Click **"Register domain"**
4. Search for domain → Choose → Purchase (~$12/year for .com)
5. Wait 10-30 minutes for registration

### Step 2: Create Hosted Zone

1. **Route 53** → **"Hosted zones"**
2. Click **"Create hosted zone"**
3. **Domain name**: `yourdomain.com`
4. **Type**: Public hosted zone
5. Click **"Create hosted zone"**
6. **Cost**: $0.50/month

### Step 3: Add DNS Records

1. Click **"Create record"**

**Record 1: Main domain**
```
Record name: (leave blank or type @)
Record type: A
Value: 13.237.113.37
TTL: 300
Routing policy: Simple routing
```

**Record 2: Subdomain - Grafana**
```
Record name: grafana
Record type: A
Value: 13.237.113.37
TTL: 300
```

**Record 3: Subdomain - Prometheus**
```
Record name: prometheus
Record type: A
Value: 13.237.113.37
TTL: 300
```

**Record 4: WWW**
```
Record name: www
Record type: CNAME
Value: yourdomain.com
TTL: 300
```

### Step 4: Update Domain Nameservers

If you bought domain elsewhere (e.g., Namecheap):

1. **Route 53** → Your hosted zone
2. Copy the 4 **NS (nameserver) records**, example:
   ```
   ns-123.awsdns-12.com
   ns-456.awsdns-45.org
   ns-789.awsdns-78.net
   ns-012.awsdns-01.co.uk
   ```

3. **Go to domain registrar** (Namecheap, GoDaddy, etc.)
4. Find **"Nameservers"** or **"DNS"** settings
5. Choose **"Custom nameservers"**
6. Enter the 4 AWS nameservers
7. Save

8. **Wait 24-48 hours** for propagation

---

## 🔒 SSL/HTTPS Setup with Let's Encrypt

**FREE SSL certificates!**

### Prerequisites

- Domain pointing to your EC2 IP ✅
- SSH access to EC2 ✅
- Domain propagated (test with `ping yourdomain.com`)

### Step 1: SSH to EC2

```bash
ssh -i "D:\code projects\aws\taskapp-key.pem" ubuntu@13.237.113.37
```

### Step 2: Install Certbot

```bash
# Update system
sudo apt update

# Install Certbot for Nginx
sudo apt install -y certbot python3-certbot-nginx
```

### Step 3: Stop Docker Nginx (Temporarily)

```bash
cd ~/devops-fullstack-monitoring-
docker compose stop nginx
```

### Step 4: Install Nginx on Host (Temporarily for SSL)

```bash
sudo apt install -y nginx
sudo systemctl start nginx
```

### Step 5: Get SSL Certificate

Replace `yourdomain.com` with your actual domain:

```bash
# For main domain
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# For subdomains
sudo certbot --nginx -d grafana.yourdomain.com
sudo certbot --nginx -d prometheus.yourdomain.com

# Follow prompts:
# - Enter email
# - Agree to terms
# - Choose redirect HTTP to HTTPS (option 2)
```

### Step 6: Copy Certificates to Project

```bash
# Create certs directory
cd ~/devops-fullstack-monitoring-
mkdir -p nginx/certs

# Copy certificates
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/certs/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/certs/

# Fix permissions
sudo chown ubuntu:ubuntu nginx/certs/*
```

### Step 7: Update Nginx Configuration

Edit `nginx/nginx.conf` on your local machine:

```nginx
# Frontend - HTTPS
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    location / {
        proxy_pass http://frontend:5173;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api {
        proxy_pass http://backend:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# HTTP redirect to HTTPS
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# Grafana - HTTPS
server {
    listen 443 ssl http2;
    server_name grafana.yourdomain.com;

    ssl_certificate /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://grafana:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Prometheus - HTTPS
server {
    listen 443 ssl http2;
    server_name prometheus.yourdomain.com;

    ssl_certificate /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://prometheus:9090;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Step 8: Update docker-compose.yml

Add volume mount for certificates:

```yaml
nginx:
  image: nginx:alpine
  ports:
    - "80:80"
    - "443:443"  # Add HTTPS port
  volumes:
    - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    - ./nginx/certs:/etc/nginx/certs:ro  # Add this line
  depends_on:
    - frontend
    - backend
```

### Step 9: Deploy Changes

```bash
# On local machine
git add .
git commit -m "feat: add SSL and custom domain"
git push origin main

# Or manually on EC2
cd ~/devops-fullstack-monitoring-
git pull origin main
docker compose down
docker compose up -d
```

### Step 10: Test HTTPS

```bash
# Should work with HTTPS now!
curl https://yourdomain.com
curl https://grafana.yourdomain.com
curl https://prometheus.yourdomain.com
```

### Step 11: Setup Auto-Renewal

```bash
# On EC2
sudo certbot renew --dry-run

# Add to crontab for auto-renewal
sudo crontab -e

# Add this line (check twice daily, renew if needed)
0 0,12 * * * certbot renew --quiet --post-hook "systemctl reload nginx"
```

---

## 🔧 Update Application URLs

### Update Backend CORS

Edit `backend/src/server.js`:

```javascript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://yourdomain.com',
    'https://www.yourdomain.com',
    'https://grafana.yourdomain.com'
  ],
  credentials: true
}));
```

### Update Frontend API URL

Edit `frontend/src/services/api.js`:

```javascript
const API_BASE_URL = process.env.VITE_API_URL || 'https://yourdomain.com/api';
```

---

## 📊 Domain Comparison

| Option | Cost | Time | Professional | SSL | Recommended For |
|--------|------|------|--------------|-----|-----------------|
| DuckDNS | FREE | 5 min | ⭐⭐ | ✅ | Students, Learning |
| Freenom (.tk) | FREE | 10 min | ⭐ | ✅ | Testing |
| Namecheap (.xyz) | $1/year | 15 min | ⭐⭐⭐⭐ | ✅ | Portfolio |
| Route 53 (.com) | $12/year | 20 min | ⭐⭐⭐⭐⭐ | ✅ | Professional Projects |

---

## 💼 For Your CV

**With custom domain**, you can write:

```
DevOps Full-Stack Application
https://taskmanager.yourdomain.com

• Deployed production web application on AWS with custom domain
• Configured DNS using AWS Route 53 for professional domain setup
• Implemented SSL/HTTPS encryption using Let's Encrypt certificates
• Set up subdomains for monitoring services (Grafana, Prometheus)
```

**Much better than**: `http://13.237.113.37` ❌

---

## 🎯 Quick Decision Guide

**If you want**:
- **Fastest setup** → DuckDNS (5 minutes, FREE)
- **Cheapest professional domain** → Namecheap .xyz ($1/year)
- **Best for portfolio** → Namecheap/GoDaddy .com ($9-12/year)
- **AWS integrated** → Route 53 ($12/year + $0.50/month)

**My recommendation for your project**: 
- **DuckDNS** (FREE) or **Namecheap .xyz** ($1-2/year)
- Both look professional enough for portfolio
- Easy SSL setup with Let's Encrypt

---

## ✅ Checklist

- [ ] Choose domain option
- [ ] Register/get domain
- [ ] Configure DNS (point A record to 13.237.113.37)
- [ ] Wait for DNS propagation (5 min - 48 hours)
- [ ] Test domain with ping/curl
- [ ] Install SSL certificate (Let's Encrypt)
- [ ] Update Nginx configuration
- [ ] Update docker-compose.yml
- [ ] Deploy changes
- [ ] Test HTTPS
- [ ] Update CV/portfolio with custom domain URL
- [ ] Setup auto-renewal for SSL

---

## 🐛 Troubleshooting

### Domain doesn't resolve

```bash
# Check DNS propagation
nslookup yourdomain.com
dig yourdomain.com

# Try different DNS server
nslookup yourdomain.com 8.8.8.8
```

Wait longer (up to 48 hours for some registrars).

### SSL certificate fails

- Make sure domain points to your IP
- Check port 80 is accessible (certbot needs it)
- Verify nginx is running
- Check firewall rules

### HTTPS shows "Not Secure"

- Certificate not properly installed
- Mixed content (HTTP resources on HTTPS page)
- Certificate expired (renew with certbot)

---

## 📚 Resources

- **DuckDNS**: https://www.duckdns.org
- **Namecheap**: https://www.namecheap.com
- **Let's Encrypt**: https://letsencrypt.org
- **AWS Route 53 Docs**: https://docs.aws.amazon.com/route53/
- **Certbot**: https://certbot.eff.org

---

**Ready to set up your custom domain?** 🚀

**Recommended**: Start with **DuckDNS** (FREE and fast!) or buy a cheap **$1 .xyz domain** from Namecheap!
