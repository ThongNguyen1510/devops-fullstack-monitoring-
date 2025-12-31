# Monitoring Guide

This guide explains how to use Prometheus, Grafana, and Loki to monitor your Task Manager application.

## 📊 Monitoring Stack Overview

```
Application Metrics → Prometheus → Grafana
Application Logs    → Promtail  → Loki → Grafana
PostgreSQL Metrics  → PG Exporter → Prometheus → Grafana
```

## 🎯 Quick Access

- **Grafana**: http://localhost:3001 (Login: admin/admin)
- **Prometheus**: http://localhost:9090
- **Backend Metrics**: http://localhost:5000/metrics

## 1. Prometheus - Metrics Collection

### Accessing Prometheus

1. Open http://localhost:9090
2. Go to **Status** → **Targets** to see all scrape endpoints

### Available Metrics

#### HTTP Metrics
```promql
# Request duration histogram
http_request_duration_seconds_bucket

# Total requests counter
http_requests_total

# Active connections gauge
active_connections
```

#### Database Metrics
```promql
# Query duration
db_query_duration_seconds_bucket

# PostgreSQL stats (via postgres-exporter)
pg_up
pg_database_size_bytes
pg_stat_database_numbackends
```

### Example PromQL Queries

**Average request duration (last 5 minutes)**
```promql
rate(http_request_duration_seconds_sum[5m]) 
/ 
rate(http_request_duration_seconds_count[5m])
```

**Request rate by status code**
```promql
sum(rate(http_requests_total[5m])) by (status_code)
```

**95th percentile response time**
```promql
histogram_quantile(0.95, 
  rate(http_request_duration_seconds_bucket[5m])
)
```

**Database connection count**
```promql
pg_stat_database_numbackends{datname="taskdb"}
```

## 2. Grafana - Visualization

### First Time Setup

1. **Login to Grafana**
   - URL: http://localhost:3001
   - Username: `admin`
   - Password: `admin`
   - (You'll be prompted to change password)

2. **Verify Data Sources**
   - Go to **Configuration** → **Data Sources**
   - Should see:
     - ✅ Prometheus (default)
     - ✅ Loki

3. **Create Your First Dashboard**

**Option 1: Create from scratch**
1. Click **+** → **Dashboard** → **Add new panel**
2. Select **Prometheus** as data source
3. Enter query (e.g., `rate(http_requests_total[5m])`)
4. Choose visualization type (Graph, Gauge, Table, etc.)
5. Save dashboard

**Option 2: Import pre-built dashboard**
1. Click **+** → **Import**
2. Use dashboard ID:
   - Node Exporter: `1860`
   - PostgreSQL: `9628`
3. Select Prometheus as data source
4. Click **Import**

### Creating Application Dashboard

#### Panel 1: Request Rate
```promql
sum(rate(http_requests_total[5m])) by (method, route)
```
Visualization: **Time series**

#### Panel 2: Error Rate
```promql
sum(rate(http_requests_total{status_code=~"5.."}[5m]))
```
Visualization: **Stat** (with red color threshold)

#### Panel 3: Response Time
```promql
histogram_quantile(0.95, 
  sum(rate(http_request_duration_seconds_bucket[5m])) by (le)
)
```
Visualization: **Graph**

#### Panel 4: Active Connections
```promql
active_connections
```
Visualization: **Gauge**

#### Panel 5: Database Size
```promql
pg_database_size_bytes{datname="taskdb"}
```
Visualization: **Stat**

### Dashboard Example JSON

Save this to `monitoring/grafana/dashboards/app-dashboard.json`:

```json
{
  "dashboard": {
    "title": "Task Manager Application",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total[5m])) by (method)"
          }
        ],
        "type": "graph"
      },
      {
        "title": "95th Percentile Response Time",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))"
          }
        ],
        "type": "graph"
      }
    ]
  }
}
```

## 3. Loki - Log Aggregation

### Accessing Logs in Grafana

1. Go to **Explore** (compass icon)
2. Select **Loki** as data source
3. Use LogQL to query logs

### LogQL Query Examples

**All backend logs**
```logql
{container="backend"}
```

**Error logs only**
```logql
{container="backend"} |= "error"
```

**HTTP 500 errors**
```logql
{container="backend"} | json | status >= 500
```

**Nginx access logs**
```logql
{job="nginx"}
```

**Logs with filtering and parsing**
```logql
{container="backend"} 
  | json 
  | level="error" 
  | line_format "{{.timestamp}} - {{.message}}"
```

**Request count by status**
```logql
sum by (status) (
  rate({job="nginx"} | json [5m])
)
```

### Log Patterns

Our backend uses structured JSON logging:
```json
{
  "level": "info",
  "message": "GET /api/tasks",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "service": "task-api"
}
```

Query by level:
```logql
{container="backend"} | json | level="error"
```

## 4. Alerts (Optional)

### Setting up Alerts in Grafana

1. **Create Alert Rule**
   - Go to **Alerting** → **Alert rules**
   - Click **New alert rule**

2. **Example: High Error Rate Alert**
   - Name: `High Error Rate`
   - Query: 
     ```promql
     sum(rate(http_requests_total{status_code=~"5.."}[5m])) > 0.1
     ```
   - Threshold: Alert when above 0.1
   - Evaluation: Every 1m for 5m

3. **Notification Channels**
   - Email, Slack, Discord, etc.
   - Go to **Alerting** → **Contact points**

### Example Alert Rules

**Database Down**
```promql
pg_up == 0
```

**High Response Time**
```promql
histogram_quantile(0.95, 
  rate(http_request_duration_seconds_bucket[5m])
) > 2
```

**High Memory Usage**
```promql
container_memory_usage_bytes{name="backend"} 
/ 
container_spec_memory_limit_bytes{name="backend"} 
> 0.9
```

## 5. Common Dashboards

### System Overview Dashboard

Panels:
- CPU Usage
- Memory Usage
- Disk I/O
- Network I/O
- Container Status

### Application Performance Dashboard

Panels:
- Request Rate (requests/sec)
- Error Rate (errors/sec)
- Response Time (p50, p95, p99)
- Active Connections
- Database Query Time

### Database Dashboard

Panels:
- Connection Count
- Database Size
- Query Performance
- Cache Hit Ratio
- Active Queries

## 6. Best Practices

### Query Optimization

✅ **Use rate() for counters**
```promql
rate(http_requests_total[5m])  # Good
http_requests_total            # Bad for graphing
```

✅ **Use appropriate time ranges**
```promql
rate(metric[5m])   # For recent trends
rate(metric[1h])   # For longer trends
```

✅ **Aggregate when possible**
```promql
sum(rate(http_requests_total[5m])) by (status_code)
```

### Dashboard Organization

1. **Group related metrics** together
2. **Use consistent time ranges** across panels
3. **Add descriptions** to panels
4. **Use variables** for filtering (e.g., by environment)
5. **Set appropriate refresh** intervals (5s, 10s, 30s)

### Log Management

1. **Use structured logging** (JSON format)
2. **Include context** (request ID, user ID, etc.)
3. **Set appropriate log levels**
4. **Limit log retention** (7-30 days for Loki)

## 7. Troubleshooting

### Prometheus not scraping metrics

```bash
# Check if backend /metrics endpoint is accessible
curl http://localhost:5000/metrics

# Check Prometheus targets
# Go to http://localhost:9090/targets
# Look for "UP" status
```

### Grafana not showing data

1. Check data source connection
2. Verify query syntax
3. Check time range (adjust to "Last 5 minutes")
4. Look at Query inspector for errors

### Loki logs not appearing

```bash
# Check Promtail is running
docker-compose ps promtail

# Check Promtail logs
docker-compose logs promtail

# Verify Loki is receiving logs
curl http://localhost:3100/ready
```

### Metrics missing

```bash
# Check backend is running
docker-compose ps backend

# Check backend logs
docker-compose logs backend

# Restart services
docker-compose restart backend prometheus
```

## 8. Advanced Topics

### Custom Metrics

Add custom metrics in your backend code:

```javascript
const { Counter, Histogram } = require('prom-client');

// Custom counter
const taskCreated = new Counter({
  name: 'tasks_created_total',
  help: 'Total number of tasks created'
});

// Use in code
taskCreated.inc();

// Custom histogram
const taskProcessingTime = new Histogram({
  name: 'task_processing_duration_seconds',
  help: 'Time taken to process task',
  buckets: [0.1, 0.5, 1, 2, 5]
});

// Use with timing
const end = taskProcessingTime.startTimer();
// ... do work ...
end();
```

### Recording Rules

Create `monitoring/prometheus/rules.yml`:

```yaml
groups:
  - name: application
    interval: 30s
    rules:
      - record: job:http_requests:rate5m
        expr: sum(rate(http_requests_total[5m])) by (job)
      
      - record: job:http_request_duration:p95
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

### Log-based Metrics

In Grafana, create metrics from logs:

```logql
sum(rate({container="backend"} | json | level="error" [5m]))
```

## 9. Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Loki Documentation](https://grafana.com/docs/loki/latest/)
- [PromQL Cheat Sheet](https://promlabs.com/promql-cheat-sheet/)
- [LogQL Guide](https://grafana.com/docs/loki/latest/logql/)

---

🎉 **Happy Monitoring!** Now you can observe your application's behavior in real-time!
