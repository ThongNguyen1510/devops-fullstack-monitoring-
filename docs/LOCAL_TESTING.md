# 🧪 Hướng Dẫn Test Locally với Docker

## ✅ Bước Đã Hoàn Thành

1. ✅ Cài đặt backend dependencies
2. ✅ Cài đặt frontend dependencies  
3. ⏳ Docker đang build và start containers...

## 📝 Các Bước Test Sau Khi Docker Chạy

### Bước 1: Kiểm Tra Services Đang Chạy

```bash
docker-compose ps
```

**Expected output**: Tất cả 9 services status = "running"
- postgres
- backend
- frontend
- nginx
- prometheus
- grafana
- loki
- promtail
- postgres-exporter

### Bước 2: Kiểm Tra Logs

**Backend logs**:
```bash
docker-compose logs -f backend
```
Tìm dòng: `Server running on port 5000` ✅

**Frontend logs**:
```bash
docker-compose logs -f frontend
```

**Database logs**:
```bash
docker-compose logs postgres
```
Tìm: `database system is ready to accept connections` ✅

### Bước 3: Test Health Checks

**Backend health**:
```bash
curl http://localhost:5000/health
```
Expected: `{"status":"healthy","database":"connected"}`

**Hoặc mở browser**: http://localhost:5000/health

### Bước 4: Test API Endpoints

**1. Get all tasks (ban đầu sẽ có 4 sample tasks)**:
```bash
curl http://localhost:5000/api/tasks
```

**2. Create new task**:
```bash
curl -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"Test Docker\",\"description\":\"Testing from local\",\"status\":\"todo\"}"
```

**3. Update task** (thay <ID> bằng task ID thực tế):
```bash
curl -X PUT http://localhost:5000/api/tasks/<ID> \
  -H "Content-Type: application/json" \
  -d "{\"status\":\"done\"}"
```

**4. Delete task**:
```bash
curl -X DELETE http://localhost:5000/api/tasks/<ID>
```

### Bước 5: Test Frontend UI

**Mở browser**:
1. http://localhost - Frontend qua Nginx
2. http://localhost:3000 - Frontend trực tiếp

**Test UI**:
- ✅ Thấy header "🚀 DevOps Task Manager"
- ✅ Form "Add New Task" màu gradient
- ✅ List tasks hiện sample data
- ✅ Click "Edit" button → inline editing
- ✅ Click "Delete" button → xóa task
- ✅ Add new task → hiện ngay trong list

### Bước 6: Test Monitoring Stack

**Prometheus**:
1. Mở http://localhost:9090
2. Go to **Status** → **Targets**
3. Kiểm tra tất cả targets = "UP":
   - backend (http://backend:5000/metrics)
   - postgres (http://postgres-exporter:9187)
   - prometheus (http://localhost:9090)

**Query metrics trong Prometheus**:
```promql
# Request rate
rate(http_requests_total[5m])

# Active connections
active_connections

# Database size
pg_database_size_bytes{datname="taskdb"}
```

**Grafana**:
1. Mở http://localhost:3001
2. Login: `admin` / `admin`
3. Skip change password nếu testing
4. Go to **Explore** (compass icon)
5. Select **Prometheus** datasource
6. Query: `rate(http_requests_total[5m])`
7. Click "Run Query" → Thấy graph

**Loki Logs**:
1. Trong Grafana Explore
2. Switch datasource to **Loki**
3. Query: `{container="backend"}`
4. Click "Run Query" → Thấy logs

### Bước 7: Test Database Trực Tiếp

**Connect vào PostgreSQL**:
```bash
docker exec -it taskdb psql -U postgres -d taskdb
```

**Trong psql shell**:
```sql
-- List tables
\dt

-- View all tasks
SELECT * FROM tasks;

-- Count tasks
SELECT COUNT(*) FROM tasks;

-- View schema
\d tasks

-- Exit
\q
```

### Bước 8: Test Metrics Endpoint

```bash
curl http://localhost:5000/metrics
```

**Tìm các metrics**:
- `http_request_duration_seconds`
- `http_requests_total`
- `active_connections`
- `db_query_duration_seconds`
- `process_cpu_seconds_total`
- `nodejs_heap_size_total_bytes`

### Bước 9: Performance Testing (Optional)

**Generate traffic để xem metrics**:

PowerShell:
```powershell
# Tạo 100 requests
1..100 | ForEach-Object {
    Invoke-WebRequest -Uri "http://localhost:5000/api/tasks" -UseBasicParsing
}
```

Sau đó check Prometheus:
```promql
rate(http_requests_total[1m])
```

## 🎯 Checklist Verification

### Application
- [ ] Backend health check returns "healthy"
- [ ] API GET /api/tasks returns data
- [ ] Can create new task via API
- [ ] Can update task via API
- [ ] Can delete task via API
- [ ] Frontend loads at http://localhost
- [ ] Can add task in UI
- [ ] Can edit task inline
- [ ] Can delete task in UI
- [ ] Data persists after page refresh

### Monitoring
- [ ] Prometheus targets all UP
- [ ] Can query metrics in Prometheus
- [ ] Grafana login works
- [ ] Prometheus datasource connected
- [ ] Loki datasource connected
- [ ] Can see backend logs in Loki
- [ ] Metrics visible in Grafana Explore

### Database
- [ ] Can connect to PostgreSQL via psql
- [ ] Tasks table exists
- [ ] Sample data loaded
- [ ] PostgreSQL exporter metrics available

## 🐛 Troubleshooting

### Container không start được

```bash
# Check container logs
docker-compose logs <service-name>

# Restart service
docker-compose restart <service-name>

# Rebuild specific service
docker-compose up -d --build <service-name>
```

### Backend error "Cannot connect to database"

```bash
# Check PostgreSQL running
docker-compose ps postgres

# Check database logs
docker-compose logs postgres

# Restart both
docker-compose restart postgres backend
```

### Frontend không load

```bash
# Check nginx logs
docker-compose logs nginx

# Check frontend logs
docker-compose logs frontend

# Rebuild
docker-compose up -d --build frontend
```

### Port already in use

```bash
# Find process using port
netstat -ano | findstr :5000
netstat -ano | findstr :80

# Option 1: Stop the process
# Option 2: Change port in docker-compose.yml
```

### Grafana "Data source not found"

```bash
# Restart Grafana
docker-compose restart grafana

# Check provisioning
docker-compose logs grafana | findstr "provisioning"
```

## 🧹 Cleanup Commands

**Stop all services**:
```bash
docker-compose down
```

**Stop và xóa volumes (reset database)**:
```bash
docker-compose down -v
```

**Remove images**:
```bash
docker-compose down --rmi all
```

**Clean everything**:
```bash
docker-compose down -v --rmi all
docker system prune -a
```

## 🎬 Demo Scenarios

### Scenario 1: Complete User Flow

1. Open http://localhost
2. Create task "Deploy to production"
3. Refresh page → task still there
4. Edit task → change status to "in-progress"
5. Check Prometheus → see increased metrics
6. Check Grafana Loki → see API logs

### Scenario 2: Monitoring Flow

1. Open Grafana http://localhost:3001
2. Explore → Prometheus
3. Query: `rate(http_requests_total[5m])`
4. Create traffic by refreshing frontend
5. See graph update in real-time
6. Switch to Loki
7. Query: `{container="backend"} | json | method="GET"`
8. See logs streaming

### Scenario 3: Database Flow

1. Connect to psql
2. View current tasks
3. Create task via UI
4. Refresh psql query → see new task
5. Check PostgreSQL metrics in Prometheus

## 📸 Screenshots to Take

Để thêm vào CV/Portfolio:

1. ✅ Frontend UI với tasks
2. ✅ Grafana dashboard với metrics
3. ✅ Prometheus targets page
4. ✅ Loki logs viewer
5. ✅ Docker containers running (`docker-compose ps`)
6. ✅ API response trong Postman/curl

## 🚀 Next Steps After Testing

1. ✅ Test local thành công
2. 📤 Push code lên GitHub
3. 🔑 Setup GitHub Secrets cho CI/CD
4. ☁️ Deploy lên AWS (follow docs/DEPLOYMENT.md)
5. 🎯 Add project to CV with GitHub link

---

**Good luck với testing!** 🎉
