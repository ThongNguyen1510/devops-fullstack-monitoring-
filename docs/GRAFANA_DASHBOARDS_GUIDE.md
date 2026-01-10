# 📊 Grafana Dashboards Guide - Custom Monitoring

## 🎯 Overview

This guide will help you create custom Grafana dashboards to visualize your application's metrics, performance, and business data.

## 🚀 Quick Start - Access Grafana

1. **Open Grafana**: http://13.237.113.37:3001
2. **Login**: admin / admin
3. **Change password** (optional but recommended)

---

## 📈 Available Metrics

Your application exposes these metrics that you can visualize:

### Application Metrics (from Backend)

```promql
# HTTP Request Duration (Response Time)
http_request_duration_seconds

# Total HTTP Requests
http_requests_total

# Active Connections
active_connections

# Database Query Duration
db_query_duration_seconds

# Node.js Default Metrics
nodejs_heap_size_total_bytes
nodejs_heap_size_used_bytes
nodejs_external_memory_bytes
process_cpu_seconds_total
```

### System Metrics (from Node Exporter - if enabled)

```promql
# CPU Usage
node_cpu_seconds_total

# Memory Usage
node_memory_MemAvailable_bytes
node_memory_MemTotal_bytes

# Disk Usage
node_filesystem_avail_bytes
node_filesystem_size_bytes
```

### PostgreSQL Metrics (from postgres-exporter)

```promql
# Database Connections
pg_stat_database_numbackends

# Database Size
pg_database_size_bytes

# Transaction Rate
pg_stat_database_xact_commit
pg_stat_database_xact_rollback
```

---

## 🎨 Dashboard 1: Application Performance Overview

### Create New Dashboard

**Steps**:
1. Click **"+"** icon → **"Dashboard"**
2. Click **"Add visualization"**
3. Select **"Prometheus"** as data source
4. Follow panels below

### Panel 1: API Response Time (Graph)

**Query**:
```promql
# Average response time
rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m])

# 95th percentile
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# 99th percentile
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))
```

**Settings**:
- **Panel Title**: "API Response Time"
- **Visualization**: Time series (line graph)
- **Unit**: seconds (s)
- **Legend**: Show, Bottom
- **Thresholds**: 
  - Green: < 0.2s
  - Yellow: 0.2s - 0.5s
  - Red: > 0.5s

### Panel 2: Request Rate (Graph)

**Query**:
```promql
# Requests per second
sum(rate(http_requests_total[5m]))

# By status code
sum by (status_code) (rate(http_requests_total[5m]))

# By endpoint
sum by (path) (rate(http_requests_total[5m]))
```

**Settings**:
- **Panel Title**: "Request Rate (req/s)"
- **Visualization**: Time series
- **Unit**: requests/sec
- **Legend**: Show values

### Panel 3: Error Rate (Stat)

**Query**:
```promql
# Error percentage
sum(rate(http_requests_total{status_code=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) * 100
```

**Settings**:
- **Panel Title**: "Error Rate %"
- **Visualization**: Stat (big number)
- **Unit**: Percent (0-100)
- **Thresholds**:
  - Green: < 1%
  - Yellow: 1-5%
  - Red: > 5%

### Panel 4: Active Connections (Gauge)

**Query**:
```promql
active_connections
```

**Settings**:
- **Panel Title**: "Active Connections"
- **Visualization**: Gauge
- **Min**: 0
- **Max**: 100
- **Thresholds**:
  - Green: < 50
  - Yellow: 50-80
  - Red: > 80

### Panel 5: Database Query Performance (Graph)

**Query**:
```promql
# Average query time
rate(db_query_duration_seconds_sum[5m]) / rate(db_query_duration_seconds_count[5m])

# 95th percentile
histogram_quantile(0.95, rate(db_query_duration_seconds_bucket[5m]))
```

**Settings**:
- **Panel Title**: "Database Query Duration"
- **Visualization**: Time series
- **Unit**: seconds (s)

### Panel 6: HTTP Status Codes (Bar Gauge)

**Query**:
```promql
sum by (status_code) (increase(http_requests_total[5m]))
```

**Settings**:
- **Panel Title**: "HTTP Status Codes (Last 5m)"
- **Visualization**: Bar gauge
- **Orientation**: Horizontal

---

## 📊 Dashboard 2: System Resources

### Panel 1: Memory Usage (Graph)

**Query**:
```promql
# Heap used
nodejs_heap_size_used_bytes / 1024 / 1024

# Heap total
nodejs_heap_size_total_bytes / 1024 / 1024

# Memory usage percentage
(nodejs_heap_size_used_bytes / nodejs_heap_size_total_bytes) * 100
```

**Settings**:
- **Panel Title**: "Node.js Memory Usage"
- **Unit**: MB (for bytes) or Percent
- **Legend**: Show

### Panel 2: CPU Usage (Graph)

**Query**:
```promql
rate(process_cpu_seconds_total[5m]) * 100
```

**Settings**:
- **Panel Title**: "CPU Usage %"
- **Unit**: Percent (0-100)
- **Min**: 0
- **Max**: 100

### Panel 3: Event Loop Lag (if available)

**Query**:
```promql
nodejs_eventloop_lag_seconds
```

**Settings**:
- **Panel Title**: "Event Loop Lag"
- **Unit**: seconds (s)

---

## 💼 Dashboard 3: Business Metrics

### Panel 1: Total Tasks (Stat)

You'll need to add custom metrics to backend first. Example:

**In backend code** (`src/middleware/metrics.js`):
```javascript
const tasksTotal = new client.Gauge({
  name: 'tasks_total',
  help: 'Total number of tasks',
  labelNames: ['status']
});

// Update periodically
async function updateTaskMetrics() {
  const counts = await Task.countByStatus();
  tasksTotal.set({ status: 'todo' }, counts.todo);
  tasksTotal.set({ status: 'in_progress' }, counts.inProgress);
  tasksTotal.set({ status: 'done' }, counts.done);
}
```

**Query**:
```promql
sum(tasks_total)
```

**Settings**:
- **Panel Title**: "Total Tasks"
- **Visualization**: Stat

### Panel 2: Tasks by Status (Pie Chart)

**Query**:
```promql
tasks_total
```

**Settings**:
- **Panel Title**: "Tasks Distribution"
- **Visualization**: Pie chart
- **Legend**: Show values

---

## 🎨 Step-by-Step: Creating Your First Dashboard

### Step 1: Create Dashboard

1. Open Grafana: http://13.237.113.37:3001
2. Click **"+"** (plus) in left sidebar
3. Click **"Dashboard"**
4. Click **"Add visualization"**

### Step 2: Select Data Source

1. Click **"Prometheus"**
2. You should see Prometheus already configured

### Step 3: Write Query

1. In query editor, switch to **"Code"** mode
2. Enter a query, for example:
   ```promql
   rate(http_requests_total[5m])
   ```
3. Click **"Run queries"** to preview

### Step 4: Configure Visualization

1. **Panel Title**: Give it a name
2. **Visualization Type**: Select from right panel
   - Time series (line graph)
   - Stat (single number)
   - Gauge
   - Bar chart
   - Pie chart
   - Table
3. **Unit**: Select appropriate unit (seconds, bytes, percent)
4. **Legend**: Show/hide, position

### Step 5: Set Thresholds (Optional)

1. In right panel → **"Thresholds"**
2. Add threshold values:
   - Green: Good (< X)
   - Yellow: Warning (X - Y)
   - Red: Critical (> Y)

### Step 6: Save Panel

1. Click **"Apply"** (top right)
2. Panel added to dashboard

### Step 7: Add More Panels

1. Click **"Add"** → **"Visualization"**
2. Repeat steps 3-6

### Step 8: Save Dashboard

1. Click **"Save dashboard"** (disk icon, top right)
2. Enter dashboard name: "Application Performance"
3. Click **"Save"**

---

## 🔧 Dashboard Configuration Tips

### Time Range Selection

- **Top right corner**: Choose time range
- Common options:
  - Last 5 minutes
  - Last 15 minutes
  - Last 1 hour
  - Last 24 hours
  - Custom range

### Refresh Rate

- **Auto-refresh**: Top right → Set to 5s, 10s, 30s, 1m
- Great for real-time monitoring

### Variables (Advanced)

Create dynamic dashboards with variables:

1. Dashboard settings → **"Variables"**
2. Click **"Add variable"**
3. Example: Create `endpoint` variable
   ```promql
   label_values(http_requests_total, path)
   ```
4. Use in queries: `http_requests_total{path="$endpoint"}`

### Panel Layout

- **Drag and drop** panels to rearrange
- **Resize** panels by dragging corners
- **Duplicate** panel: Panel menu → More → Duplicate

---

## 📚 Pre-built Dashboard Templates

### Import Existing Dashboards

Grafana has community dashboards you can import:

1. Go to **"Dashboards"** → **"Import"**
2. Enter dashboard ID or upload JSON
3. Select Prometheus data source
4. Click **"Import"**

**Recommended Dashboard IDs**:
- **1860**: Node Exporter Full (system metrics)
- **9628**: PostgreSQL Database
- **11074**: Node.js Application Dashboard
- **7362**: Docker and system monitoring

### How to Import

1. Grafana → **"+"** → **"Import"**
2. Enter ID: `1860` (for Node Exporter)
3. Click **"Load"**
4. Select **Prometheus** data source
5. Click **"Import"**

---

## 🎯 Example: Complete Application Dashboard JSON

Save this as `application-dashboard.json`:

```json
{
  "dashboard": {
    "title": "Application Performance",
    "panels": [
      {
        "id": 1,
        "title": "Request Rate",
        "type": "timeseries",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total[5m]))",
            "legendFormat": "Requests/sec"
          }
        ],
        "gridPos": {
          "x": 0,
          "y": 0,
          "w": 12,
          "h": 8
        }
      },
      {
        "id": 2,
        "title": "Response Time (95th percentile)",
        "type": "timeseries",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "p95"
          }
        ],
        "gridPos": {
          "x": 12,
          "y": 0,
          "w": 12,
          "h": 8
        },
        "fieldConfig": {
          "defaults": {
            "unit": "s"
          }
        }
      },
      {
        "id": 3,
        "title": "Error Rate",
        "type": "stat",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total{status_code=~\"5..\"}[5m])) / sum(rate(http_requests_total[5m])) * 100"
          }
        ],
        "gridPos": {
          "x": 0,
          "y": 8,
          "w": 6,
          "h": 4
        },
        "fieldConfig": {
          "defaults": {
            "unit": "percent",
            "thresholds": {
              "steps": [
                { "value": 0, "color": "green" },
                { "value": 1, "color": "yellow" },
                { "value": 5, "color": "red" }
              ]
            }
          }
        }
      }
    ]
  }
}
```

**Import this**:
1. Grafana → **"+"** → **"Import"**
2. **"Upload JSON file"**
3. Select the file
4. Click **"Import"**

---

## 🚀 Quick Actions

### Test Your Dashboards

Generate some traffic to see metrics:

```bash
# On your local machine
for i in {1..100}; do
  curl http://13.237.113.37:5000/health
  curl http://13.237.113.37/api/tasks
  sleep 0.1
done
```

Watch the dashboards update in real-time!

### Set Up Alerts (Optional)

1. Open a panel
2. Click panel title → **"Edit"**
3. Go to **"Alert"** tab
4. Click **"Create alert rule from this panel"**
5. Set conditions:
   - When: `avg()` of `query(A, 5m, now)` is `above` `0.5`
   - Evaluate: Every 1m, For 5m
6. Add notification channel (email, Slack, etc.)
7. Save

---

## 📊 Dashboard Best Practices

### 1. Organization
- **Group related metrics** in same dashboard
- **Use rows** to organize panels logically
- **Consistent color scheme**

### 2. Performance
- **Limit queries** per panel (max 5-10)
- **Use appropriate time ranges** (don't query years of data)
- **Aggregate data** for long time ranges

### 3. Readability
- **Clear panel titles**
- **Show units** (seconds, %, MB)
- **Use legends** for multi-line graphs
- **Color code thresholds** (green/yellow/red)

### 4. Useful Metrics
- **RED Method**: Rate, Errors, Duration
- **USE Method**: Utilization, Saturation, Errors
- **Golden Signals**: Latency, Traffic, Errors, Saturation

---

## 🎓 Learning Resources

**Prometheus Query Language (PromQL)**:
- Rate: `rate(metric[5m])` - per-second rate
- Increase: `increase(metric[5m])` - total increase
- Sum: `sum(metric)` - aggregate
- By: `sum by (label) (metric)` - group by label
- Histogram percentile: `histogram_quantile(0.95, metric)`

**Grafana Docs**:
- Official docs: https://grafana.com/docs/
- Prometheus datasource: https://grafana.com/docs/grafana/latest/datasources/prometheus/
- Dashboard best practices: https://grafana.com/docs/grafana/latest/dashboards/

---

## ✅ Checklist: Dashboard Setup

- [ ] Access Grafana at http://13.237.113.37:3001
- [ ] Login and change password
- [ ] Verify Prometheus data source configured
- [ ] Create "Application Performance" dashboard
- [ ] Add Request Rate panel
- [ ] Add Response Time panel
- [ ] Add Error Rate panel
- [ ] Add Active Connections panel
- [ ] Add Database Query Duration panel
- [ ] Save dashboard
- [ ] Generate test traffic to see metrics
- [ ] Take screenshots for portfolio
- [ ] (Optional) Import Node Exporter dashboard
- [ ] (Optional) Set up alerts

---

## 📸 For Your Portfolio

After creating dashboards:

1. **Take screenshots** of:
   - Dashboard overview with multiple panels
   - Individual interesting panels
   - Real-time metrics with data
   
2. **Add to README.md**:
   ```markdown
   ### Monitoring Dashboards
   
   ![Grafana Dashboard](./docs/images/grafana-dashboard.png)
   
   Custom Grafana dashboards provide real-time visibility into:
   - Application performance metrics
   - System resource utilization
   - Business metrics and KPIs
   ```

3. **Update CV**:
   ```
   • Created custom Grafana dashboards for real-time monitoring of 
     application performance, system metrics, and business KPIs
   ```

---

## 🎯 Next Steps

1. **Create first dashboard** following steps above
2. **Generate traffic** to see real data
3. **Iterate and improve** based on what you see
4. **Add more custom metrics** to backend as needed
5. **Share screenshots** in portfolio/LinkedIn

---

**Ready to create your dashboards?** 🚀

Go to http://13.237.113.37:3001 and start building!
