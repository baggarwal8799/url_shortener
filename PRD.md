# URL Shortener Service - Product Requirements Document

## URL Shortener Service - System Architecture Plan

### **1. SYSTEM ARCHITECTURE OVERVIEW**

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                            │
│                    Next.js Application                      │
│           (Login, Register, Dashboard, URL Mgmt)            │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌────────────────────────────────────────────────────────────┐
│                      API GATEWAY                           │
│        (Kong/Express Gateway - Rate Limiting, Auth)        │
└────┬─────────┬─────────┬──────────┬──────────┬─────────────┘
     │         │         │          │          │
     ▼         ▼         ▼          ▼          ▼
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│  Auth   │ │   URL   │ │Analytics│ │  User   │ │Redirect │
│ Service │ │Shortener│ │ Service │ │ Service │ │ Service │
│         │ │ Service │ │         │ │         │ │         │
└────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘
     │           │           │           │           │
     └───────────┴───────────┴───────────┴───────────┘
                            │
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
     ┌──────────┐    ┌──────────┐   ┌──────────┐
     │PostgreSQL│    │  Redis   │   │  Kafka   │
     │ Cluster  │    │ Cluster  │   │ Cluster  │
     └──────────┘    └──────────┘   └──────────┘
                                          │
                      ┌───────────────────┴────────────┐
                      ▼                                ▼
              ┌──────────────┐              ┌──────────────┐
              │Notification  │              │Email Service │
              │   Service    │              │   Service    │
              └──────────────┘              └──────────────┘
```

### **2. MICROSERVICES BREAKDOWN**

#### **A. API Gateway (Port: 3000)**
- **Purpose**: Single entry point, routing, load balancing
- **Tech**: Express.js with http-proxy-middleware or Kong
- **Responsibilities**:
  - Request routing to microservices
  - Rate limiting (1000 req/sec+ handling)
  - JWT validation
  - CORS handling
  - Request/Response logging

#### **B. Auth Service (Port: 3001)**
- **Purpose**: Authentication & Authorization
- **Tech**: Node.js + Express + JWT + bcrypt
- **Features**:
  - User registration with email verification
  - Login/Logout (JWT tokens)
  - OTP generation & validation (Redis cache)
  - Password reset
  - Refresh token mechanism
- **Database**: PostgreSQL (users table)
- **Cache**: Redis (OTP storage, blacklisted tokens)

#### **C. URL Shortener Service (Port: 3002)**
- **Purpose**: Core URL shortening logic
- **Tech**: Node.js + Express + Base62 encoding
- **Features**:
  - Generate short URL codes (6-7 characters)
  - Custom alias support
  - URL validation
  - Expiration handling
  - Duplicate URL detection
- **Database**: PostgreSQL (urls table)
- **Cache**: Redis (hot URLs for fast lookup)
- **Algorithm**: Base62 encoding + Auto-increment ID OR Hash-based

#### **D. Redirect Service (Port: 3003)**
- **Purpose**: High-performance URL redirection
- **Tech**: Node.js + Fastify (fastest Node.js framework)
- **Features**:
  - Ultra-fast redirect (< 10ms)
  - Cache-first strategy
  - 301/302 redirect support
  - Track click events (async via Kafka)
- **Cache**: Redis (99% cache hit rate target)
- **Event**: Publish click events to Kafka

#### **E. User Service (Port: 3004)**
- **Purpose**: User profile management
- **Tech**: Node.js + Express
- **Features**:
  - Profile updates (name, email, avatar)
  - Password change
  - User preferences
  - API key generation for developers
- **Database**: PostgreSQL (users table)

#### **F. Analytics Service (Port: 3005)**
- **Purpose**: Track URL performance
- **Tech**: Node.js + Express
- **Features**:
  - Click tracking (timestamp, IP, user-agent, referrer)
  - Geographic analytics
  - Time-series data
  - Dashboard statistics
- **Database**: PostgreSQL (clicks table) + TimescaleDB extension
- **Consumer**: Kafka consumer for click events

#### **G. Notification Service (Port: 3006)**
- **Purpose**: Handle all notifications
- **Tech**: Node.js + Express
- **Features**:
  - Kafka consumer for events
  - Route to Email/SMS/Push services
  - Notification templates
  - Retry logic
- **Queue**: Kafka topics

#### **H. Email Service (Port: 3007)**
- **Purpose**: Send transactional emails
- **Tech**: Node.js + Nodemailer + SendGrid/AWS SES
- **Features**:
  - Welcome emails
  - OTP emails
  - Password reset emails
  - URL creation notifications
- **Queue**: Kafka consumer

### **3. DATABASE DESIGN**

#### **PostgreSQL Schema**

```sql
-- Auth Service DB
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- URL Shortener Service DB
CREATE TABLE urls (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    short_code VARCHAR(10) UNIQUE NOT NULL,
    original_url TEXT NOT NULL,
    custom_alias VARCHAR(50) UNIQUE,
    title VARCHAR(255),
    description TEXT,
    clicks BIGINT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_urls_short_code ON urls(short_code);
CREATE INDEX idx_urls_user_id ON urls(user_id);
CREATE INDEX idx_urls_custom_alias ON urls(custom_alias);

-- Analytics Service DB
CREATE TABLE clicks (
    id BIGSERIAL PRIMARY KEY,
    url_id BIGINT REFERENCES urls(id),
    short_code VARCHAR(10) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    country VARCHAR(2),
    city VARCHAR(100),
    device_type VARCHAR(50),
    clicked_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_clicks_url_id ON clicks(url_id);
CREATE INDEX idx_clicks_short_code ON clicks(short_code);
CREATE INDEX idx_clicks_clicked_at ON clicks(clicked_at DESC);
```

#### **Redis Data Structures**

```
1. URL Cache (Hash)
   Key: url:shortcode:{code}
   Value: { original_url, user_id, expires_at }
   TTL: 24 hours

2. OTP Storage (String)
   Key: otp:{email}
   Value: {otp_code}
   TTL: 5 minutes

3. Rate Limiting (String)
   Key: ratelimit:{ip}:{endpoint}
   Value: request_count
   TTL: 1 minute

4. Blacklisted Tokens (Set)
   Key: blacklist:token
   Value: jwt_token
   TTL: token expiry time

5. Hot URLs Counter (Sorted Set)
   Key: hot_urls
   Score: click_count
   Member: short_code
```

### **4. KAFKA TOPICS**

```
1. click.events
   - Producer: Redirect Service
   - Consumer: Analytics Service
   - Payload: { short_code, url_id, ip, user_agent, referrer, timestamp }

2. user.registered
   - Producer: Auth Service
   - Consumer: Email Service, Notification Service
   - Payload: { user_id, email, name }

3. url.created
   - Producer: URL Shortener Service
   - Consumer: Notification Service
   - Payload: { user_id, short_code, original_url }

4. email.send
   - Producer: Notification Service
   - Consumer: Email Service
   - Payload: { to, subject, template, data }
```

### **5. URL SHORTENING ALGORITHM**

```javascript
// Strategy 1: Base62 Encoding (Auto-increment)
const BASE62 = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

function encodeBase62(num) {
    if (num === 0) return BASE62[0];
    let encoded = '';
    while (num > 0) {
        encoded = BASE62[num % 62] + encoded;
        num = Math.floor(num / 62);
    }
    return encoded;
}

// Strategy 2: MD5 Hash + Collision Detection (Better for distributed systems)
function generateShortCode(url, attempt = 0) {
    const hash = crypto.createHash('md5').update(url + attempt).digest('hex');
    return hash.substring(0, 7); // 7 chars = 62^7 = 3.5 trillion combinations
}
```

### **6. SCALABILITY STRATEGY**

#### **Horizontal Scaling**
- Each microservice runs in Docker containers
- Kubernetes for orchestration (3+ replicas per service)
- Load balancer (NGINX/HAProxy) in front of API Gateway

#### **Caching Strategy**
- **L1 Cache**: In-memory cache in Redirect Service (LRU, 10k URLs)
- **L2 Cache**: Redis cluster (1M+ URLs)
- **Cache warming**: Pre-load top 10k URLs on startup
- **Write-through**: Update cache on URL creation

#### **Database Optimization**
- **Read Replicas**: 2-3 PostgreSQL read replicas for analytics
- **Connection Pooling**: pg-pool with 20-50 connections per service
- **Partitioning**: Partition clicks table by month
- **Indexing**: Indexes on short_code, user_id, created_at

#### **Rate Limiting**
- Redis-based sliding window counter
- Per-IP: 100 req/min for creation, 1000 req/min for redirects
- Per-User: 500 URL creations/day

#### **Monitoring**
- Prometheus + Grafana for metrics
- ELK Stack (Elasticsearch, Logstash, Kibana) for logs
- Alert on > 100ms redirect latency

### **7. API DESIGN**

#### **Frontend → API Gateway → Services**

```javascript
// Auth Service APIs
POST   /api/auth/register        { email, password, name }
POST   /api/auth/login           { email, password }
POST   /api/auth/logout          { refresh_token }
POST   /api/auth/verify-email    { token }
POST   /api/auth/send-otp        { email }
POST   /api/auth/verify-otp      { email, otp }
POST   /api/auth/refresh-token   { refresh_token }
POST   /api/auth/reset-password  { email }

// URL Shortener APIs
POST   /api/urls                 { original_url, custom_alias?, expires_at? }
GET    /api/urls                 (get user's URLs)
GET    /api/urls/:shortCode      (get URL details)
PUT    /api/urls/:shortCode      { title, description }
DELETE /api/urls/:shortCode

// Redirect API (Direct, no auth)
GET    /:shortCode               (redirect to original URL)

// User Service APIs
GET    /api/users/profile
PUT    /api/users/profile        { name, avatar_url }
PUT    /api/users/password       { old_password, new_password }

// Analytics APIs
GET    /api/analytics/:shortCode
GET    /api/analytics/:shortCode/clicks
GET    /api/analytics/dashboard
```

### **8. TECHNOLOGY STACK**

```yaml
Backend:
  - Node.js (v20+)
  - Express.js (most services)
  - Fastify (Redirect Service)
  - TypeScript

Frontend:
  - Next.js 14+ (App Router)
  - React 18
  - TailwindCSS
  - ShadcN UI
  - React Query (API calls)

Databases:
  - PostgreSQL 15+ (Primary)
  - Redis 7+ (Cache + Sessions)

Message Queue:
  - Apache Kafka

Infrastructure:
  - Docker + Docker Compose
  - Kubernetes (production)
  - NGINX (Load Balancer)

Monitoring:
  - Prometheus
  - Grafana
  - Winston (Logging)

Testing:
  - Jest
  - Supertest
  - K6 (Load testing)
```

### **9. PROJECT STRUCTURE**

```
url-shortener/
├── services/
│   ├── api-gateway/
│   ├── auth-service/
│   ├── url-shortener-service/
│   ├── redirect-service/
│   ├── user-service/
│   ├── analytics-service/
│   ├── notification-service/
│   └── email-service/
├── frontend/
│   └── next-app/
├── shared/
│   ├── types/
│   ├── utils/
│   └── constants/
├── docker-compose.yml
├── k8s/
└── scripts/
```

### **10. IMPLEMENTATION ROADMAP**

**Phase 1: Foundation (Week 1-2)**
1. Setup monorepo structure
2. Configure Docker Compose (PostgreSQL, Redis, Kafka)
3. Implement Auth Service + JWT
4. Implement User Service
5. Build basic API Gateway

**Phase 2: Core Features (Week 3-4)**
1. URL Shortener Service + Base62 algorithm
2. Redirect Service with Redis caching
3. Analytics Service + Kafka consumer
4. Next.js frontend (Login, Register, Dashboard)

**Phase 3: Advanced Features (Week 5-6)**
1. Email Service + Notification Service
2. OTP validation flow
3. Rate limiting + Redis counters
4. Custom alias support
5. URL analytics dashboard

**Phase 4: Optimization (Week 7-8)**
1. Load testing with K6 (target: 1000+ req/sec)
2. Cache optimization
3. Database query optimization
4. Horizontal scaling setup
5. Monitoring dashboards

### **KEY PERFORMANCE OPTIMIZATIONS**

1. **Redirect Speed < 10ms**
   - Check Redis first (99% hit rate)
   - Async click tracking via Kafka
   - No database queries in hot path

2. **Handle 1000+ req/sec**
   - Stateless services (easy to scale)
   - Connection pooling
   - Redis cluster with read replicas
   - CDN for frontend

3. **Database Efficiency**
   - Batch insert clicks (every 5 seconds)
   - Index on frequently queried columns
   - Archive old clicks data

4. **Memory Management**
   - Redis max memory policy: allkeys-lru
   - Service memory limits in K8s
   - Connection pool limits

### **DEPLOYMENT CONFIGURATION**

```yaml
# docker-compose.yml (Development)
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    ports: ["5432:5432"]
    environment:
      POSTGRES_DB: urlshortener
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: admin123
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
    command: redis-server --maxmemory 512mb --maxmemory-policy allkeys-lru

  kafka:
    image: confluentinc/cp-kafka:latest
    ports: ["9092:9092"]
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092

  zookeeper:
    image: confluentinc/cp-zookeeper:latest
    ports: ["2181:2181"]
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181

volumes:
  postgres_data:
```

---

## **PERFORMANCE TARGETS**

- **Redirect Latency**: < 10ms (p99)
- **Throughput**: 1000+ requests/second
- **Availability**: 99.9% uptime
- **Cache Hit Rate**: > 99% for redirects
- **Database Queries**: < 50ms (p95)

## **SECURITY CONSIDERATIONS**

1. **Authentication**: JWT with refresh tokens
2. **Rate Limiting**: Redis-based per IP/user
3. **Input Validation**: Sanitize all user inputs
4. **SQL Injection**: Use parameterized queries
5. **XSS Protection**: Content Security Policy headers
6. **HTTPS**: Enforce SSL/TLS in production
7. **Secrets Management**: Environment variables, never hardcoded
