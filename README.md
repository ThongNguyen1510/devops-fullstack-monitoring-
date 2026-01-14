# Task Manager - DevOps Full-Stack Project

[![CI/CD Pipeline](https://github.com/ThongNguyen1510/devops-fullstack-monitoring/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/ThongNguyen1510/devops-fullstack-monitoring/actions)

A production-ready Task Management application demonstrating modern DevOps practices with React, Node.js, PostgreSQL, Docker, CI/CD, and comprehensive monitoring.

## 🎯 Project Overview

This project showcases a complete DevOps workflow:
- **Full-stack application**: React frontend + Node.js/Express backend + PostgreSQL database
- **Containerization**: Docker & Docker Compose for all services
- **CI/CD Pipeline**: Automated testing, building, and deployment with GitHub Actions
- **Monitoring**: Prometheus (metrics) + Grafana (visualization) + Loki (logs)
- **Infrastructure**: Nginx reverse proxy, PostgreSQL exporter
- **Cloud Deployment**: AWS EC2 + RDS (free tier compatible)

## 🏗️ Architecture

```
┌─────────────┐
│   Nginx     │ ← Reverse Proxy & Load Balancer
│  (Port 80)  │
└──────┬──────┘
       │
   ┌───┴────────────┐
   │                │
┌──▼────┐     ┌────▼────┐
│Frontend│     │ Backend │ ← Express API + Prometheus Metrics
│ React  │     │Node.js  │
└────────┘     └────┬────┘
                    │
              ┌─────▼──────┐
              │ PostgreSQL │
              │  Database  │
              └────────────┘

Monitoring Stack:
┌────────────┐  ┌──────────┐  ┌──────┐
│ Prometheus │→ │ Grafana  │← │ Loki │
└────────────┘  └──────────┘  └───▲──┘
                                  │
                              ┌───┴────┐
                              │Promtail│
                              └────────┘
```

## 🚀 Tech Stack

### Application
- **Frontend**: React 18, Vite, Axios
- **Backend**: Node.js 20, Express, Winston (logging)
- **Database**: PostgreSQL 15
- **API**: RESTful API with full CRUD operations

### DevOps & Infrastructure
- **Containerization**: Docker, Docker Compose
- **Reverse Proxy**: Nginx
- **CI/CD**: GitHub Actions
- **Monitoring**: 
  - Prometheus - Metrics collection
  - Grafana - Dashboards & visualization
  - Loki - Log aggregation
  - Promtail - Log shipping
- **Cloud**: AWS (EC2, RDS)

## 📦 Quick Start

### Prerequisites
- Docker & Docker Compose installed
- Git
- Node.js 20+ (for local development)

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/YOUR_USERNAME/devops-fullstack-monitoring.git
cd devops-fullstack-monitoring
```

2. **Start all services with Docker Compose**
```bash
docker-compose up -d
```

3. **Access the application**
- **Application**: http://localhost
- **Backend API**: http://localhost:5000
- **Grafana**: http://localhost:3001 (admin/admin)
- **Prometheus**: http://localhost:9090
- **Nginx Proxy**: http://localhost

4. **View logs**
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

5. **Stop all services**
```bash
docker-compose down
```

## 🔧 Development

### Backend Development
```bash
cd backend
npm install
npm run dev     # Start with nodemon
npm test        # Run tests
npm run lint    # Lint code
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev     # Start Vite dev server
npm run build   # Build for production
```

### Database
```bash
# Access PostgreSQL
docker exec -it taskdb psql -U postgres -d taskdb

# Run migrations
docker exec -it taskdb psql -U postgres -d taskdb -f /docker-entrypoint-initdb.d/init.sql
```

## 📊 Monitoring

### Prometheus Metrics
Access Prometheus at http://localhost:9090

Available metrics:
- `http_request_duration_seconds` - HTTP request latency
- `http_requests_total` - Total HTTP requests by endpoint
- `active_connections` - Current active connections
- `db_query_duration_seconds` - Database query performance

### Grafana Dashboards
Access Grafana at http://localhost:3001 (default: admin/admin)

Pre-configured data sources:
- Prometheus (metrics)
- Loki (logs)

To create dashboards:
1. Login to Grafana
2. Create new dashboard
3. Add panels with PromQL queries
4. Example query: `rate(http_requests_total[5m])`

### Loki Logs
Query logs in Grafana Explore:
```logql
{container="backend"}
{job="nginx"} |= "error"
{container="backend"} | json | status >= 400
```

## 🚀 CI/CD Pipeline

The GitHub Actions workflow automatically:

1. **Test Stage**
   - Runs unit tests
   - Performs linting
   - Security audit with npm audit

2. **Build Stage**
   - Builds Docker images
   - Tags with commit SHA and branch name
   - Pushes to Docker Hub

3. **Deploy Stage** (main branch only)
   - SSH to AWS EC2
   - Pulls latest images
   - Restarts services with docker-compose
   - Verifies health checks

### Required GitHub Secrets
```
DOCKER_USERNAME       # Docker Hub username
DOCKER_PASSWORD       # Docker Hub password/token
EC2_HOST             # AWS EC2 public IP
EC2_USERNAME         # SSH username (ubuntu)
EC2_SSH_KEY          # Private SSH key
```

## ☁️ AWS Deployment

### Setup AWS Infrastructure

1. **Launch EC2 Instance**
```bash
# Instance type: t2.micro (free tier)
# AMI: Ubuntu 22.04 LTS
# Security Group: Allow ports 80, 443, 22, 3000
```

2. **Setup RDS PostgreSQL**
```bash
# Instance: t2.micro
# Engine: PostgreSQL 15
# Free tier eligible
```

3. **Configure EC2**
```bash
# SSH to EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Clone repository
git clone https://github.com/YOUR_USERNAME/devops-fullstack-monitoring.git
cd devops-fullstack-monitoring

# Set environment variables
cp backend/.env.example backend/.env
# Edit backend/.env with RDS connection string

# Start application
docker-compose up -d
```

### Environment Variables

Create `.env` file in backend/:
```bash
DATABASE_URL=postgresql://user:password@your-rds-endpoint:5432/taskdb
NODE_ENV=production
PORT=5000
CORS_ORIGIN=http://your-domain.com
```

## 📝 API Documentation

### Endpoints

**Get all tasks**
```http
GET /api/tasks
Response: Array of task objects
```

**Get single task**
```http
GET /api/tasks/:id
Response: Task object
```

**Create task**
```http
POST /api/tasks
Body: { "title": "string", "description": "string", "status": "todo|in-progress|done" }
Response: Created task object
```

**Update task**
```http
PUT /api/tasks/:id
Body: { "title": "string", "description": "string", "status": "todo|in-progress|done" }
Response: Updated task object
```

**Delete task**
```http
DELETE /api/tasks/:id
Response: { "message": "Task deleted successfully" }
```

**Health check**
```http
GET /health
Response: { "status": "healthy", "database": "connected" }
```

**Metrics**
```http
GET /metrics
Response: Prometheus metrics in text format
```

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Test coverage
npm run test:coverage

# API testing with curl
curl http://localhost:5000/health
curl http://localhost:5000/api/tasks
```

## 📚 Project Structure

```
devops-fullstack-monitoring/
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── config/         # Database & logger config
│   │   ├── middleware/     # Prometheus metrics
│   │   ├── models/         # Task model
│   │   ├── routes/         # API routes
│   │   └── server.js       # Express server
│   ├── tests/              # Unit tests
│   ├── Dockerfile
│   └── package.json
├── frontend/               # React application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/      # API service
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── Dockerfile
│   └── package.json
├── database/              # PostgreSQL
│   └── init.sql          # DB initialization
├── nginx/                # Reverse proxy
│   └── nginx.conf
├── monitoring/           # Monitoring stack
│   ├── prometheus/
│   ├── grafana/
│   ├── loki/
│   └── promtail/
├── .github/
│   └── workflows/
│       └── ci-cd.yml     # GitHub Actions
├── docker-compose.yml    # Development stack
└── README.md
```

## 🔒 Security

- Non-root Docker containers
- Environment variables for secrets
- CORS configuration
- Security headers in Nginx
- npm audit in CI pipeline
- PostgreSQL connection pooling

## 🐛 Troubleshooting

**Container won't start**
```bash
docker-compose logs <service-name>
docker-compose restart <service-name>
```

**Database connection issues**
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Test connection
docker exec -it taskdb pg_isready -U postgres
```

**Monitoring not working**
```bash
# Check Prometheus targets
# Visit: http://localhost:9090/targets

# Check Grafana datasources
# Visit: http://localhost:3001/datasources
```

## 📈 Performance

- Docker multi-stage builds for smaller images
- Nginx gzip compression
- PostgreSQL connection pooling
- React production build optimization
- Prometheus metric scraping every 15s

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

Nguyen Luong Minh Thong   
[GitHub](https://github.com/ThongNguyen1510) | [LinkedIn](https://www.linkedin.com/in/thongnguyen1510/)

## 🙏 Acknowledgments

- React team for amazing frontend framework
- Express.js for backend simplicity
- Prometheus & Grafana for observability
- Docker for containerization
- GitHub Actions for CI/CD

---

⭐ Star this repo if you find it helpful!

🐛 Found a bug? [Open an issue](https://github.com/YOUR_USERNAME/devops-fullstack-monitoring/issues)
