# Task Manager Application - Grafana Dashboard

This directory contains Grafana dashboard JSON files.

## Available Dashboards

1. **Application Metrics Dashboard**
   - HTTP request rates and latencies
   - API endpoint performance
   - Database query metrics
   - Active connections
   - Error rates

2. **System Metrics Dashboard**
   - CPU and memory usage
   - Network I/O
   - Container metrics

## Creating Custom Dashboards

1. Access Grafana at http://localhost:3001
2. Login with admin/admin
3. Create your dashboard
4. Export JSON and save to this directory
5. Restart Grafana to load the dashboard

## Dashboard Variables

- **datasource**: Prometheus datasource
- **job**: Filter by job name (backend, postgres, etc.)
- **interval**: Time interval for queries
