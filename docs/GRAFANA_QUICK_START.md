# 🎯 Quick Grafana Dashboard Setup - 5 Minutes

## ⚡ Fast Track: Create Your First Dashboard

### Step 1: Access Grafana (30 seconds)
```
URL: http://13.237.113.37:3001
Login: admin / admin
```

### Step 2: Create Dashboard (1 minute)

1. Click **"+"** icon (left sidebar) → **"Dashboard"**
2. Click **"Add visualization"**
3. Select **"Prometheus"** data source

### Step 3: Add First Panel - Request Rate (2 minutes)

**Query** (copy-paste):
```promql
sum(rate(http_requests_total[5m]))
```

**Settings**:
- Panel Title: "Request Rate (req/s)"
- Unit: Select "requests/sec" (or "short")
- Click **"Apply"**

### Step 4: Add Second Panel - Response Time (2 minutes)

1. Click **"Add"** → **"Visualization"**
2. Select **"Prometheus"**

**Query**:
```promql
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

**Settings**:
- Panel Title: "Response Time (p95)"
- Unit: "seconds (s)"
- Click **"Apply"**

### Step 5: Save Dashboard (30 seconds)

1. Click **"Save dashboard"** icon (top right)
2. Name: "Application Performance"
3. Click **"Save"**

## ✅ Done! You Now Have a Dashboard!

---

## 📊 5 Essential Panels (Copy-Paste Ready)

### Panel 1: Request Rate ⭐
```promql
sum(rate(http_requests_total[5m]))
```
**Type**: Time series | **Unit**: req/sec

### Panel 2: Response Time (95th percentile) ⭐
```promql
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```
**Type**: Time series | **Unit**: seconds (s)

### Panel 3: Error Rate ⭐
```promql
sum(rate(http_requests_total{status_code=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) * 100
```
**Type**: Stat (big number) | **Unit**: percent (0-100)

### Panel 4: Active Connections
```promql
active_connections
```
**Type**: Gauge | **Unit**: short

### Panel 5: Database Query Time
```promql
rate(db_query_duration_seconds_sum[5m]) / rate(db_query_duration_seconds_count[5m])
```
**Type**: Time series | **Unit**: seconds (s)

---

## 🚀 Generate Traffic to See Metrics

Run this on your local computer to generate traffic:

```powershell
# PowerShell (Windows)
for ($i=1; $i -le 100; $i++) {
    Invoke-WebRequest -Uri "http://13.237.113.37:5000/health"
    Invoke-WebRequest -Uri "http://13.237.113.37/api/tasks"
    Start-Sleep -Milliseconds 100
}
```

```bash
# Bash (Mac/Linux)
for i in {1..100}; do
  curl http://13.237.113.37:5000/health
  curl http://13.237.113.37/api/tasks
  sleep 0.1
done
```

Watch your dashboards update in real-time! 📈

---

## 🎨 Dashboard Layout Recommendation

```
┌─────────────────────────────────────────────────┐
│  Application Performance Dashboard              │
├──────────────────────┬──────────────────────────┤
│  Request Rate        │  Response Time (p95)     │
│  [Time series graph] │  [Time series graph]     │
├──────────────────────┼──────────────────────────┤
│  Error Rate %        │  Active Connections      │
│  [Big number]        │  [Gauge]                 │
├──────────────────────┴──────────────────────────┤
│  Database Query Time                            │
│  [Time series graph]                            │
└─────────────────────────────────────────────────┘
```

To arrange:
- **Drag panels** to reorder
- **Resize** by dragging corners
- **Auto-refresh**: Top right → Set to "10s"

---

## 📸 For Portfolio

After creating dashboard:

1. **Set time range**: Last 15 minutes
2. **Generate traffic** with the script above
3. **Take screenshot** showing all panels with data
4. **Add to**:
   - GitHub README
   - LinkedIn post
   - Portfolio website

---

## 🎯 Next Level (Optional)

### Import Professional Dashboard

1. Click **"+"** → **"Import"**
2. Enter ID: **1860** (Node Exporter Full)
3. Select **Prometheus** data source
4. Click **"Import"**

This gives you a professional-looking dashboard instantly!

---

## ✅ You're Done!

You now have:
- ✅ Custom Grafana dashboard
- ✅ Real-time metrics visualization
- ✅ Portfolio-worthy screenshots
- ✅ Another skill for CV: "Created custom Grafana dashboards"

**For detailed guide**: See [`GRAFANA_DASHBOARDS_GUIDE.md`](./GRAFANA_DASHBOARDS_GUIDE.md)

---

**Time to create**: 5-10 minutes  
**CV impact**: ⭐⭐⭐⭐ High  
**Difficulty**: Easy 🟢
