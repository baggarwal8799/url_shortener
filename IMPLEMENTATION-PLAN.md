# URL Shortener - Step-by-Step Implementation Plan

## **IMPLEMENTATION PHILOSOPHY**
- Build incrementally, test at each step
- Complete one full feature before moving to next
- Test backend in Postman, then build frontend
- Each milestone is fully functional

---

## **MILESTONE 1: Infrastructure Setup**
**Goal**: Get Docker environment running with databases

### **Step 1.1: Docker Compose Setup**
**What to create:**
- `docker-compose.yml` with PostgreSQL, Redis, Zookeeper, Kafka

**Services to configure:**
```yaml
- PostgreSQL (port 5432)
- Redis (port 6379)
- Zookeeper (port 2181)
- Kafka (port 9092)
```

**Testing:**
```bash
# Start all services
docker-compose up -d

# Verify PostgreSQL
docker exec -it <postgres-container> psql -U admin -d urlshortener

# Verify Redis
docker exec -it <redis-container> redis-cli ping

# Verify Kafka
docker exec -it <kafka-container> kafka-topics --list --bootstrap-server localhost:9092
```

**Success Criteria:**
- ✅ All containers running
- ✅ Can connect to PostgreSQL
- ✅ Redis responds to PING
- ✅ Kafka is accessible

---

## **MILESTONE 2: Auth Flow (Complete)**
**Goal**: User can register, login, logout with OTP verification

### **Step 2.1: Database Schema for Auth**
**What to create:**
- SQL migration file for `users` table

**Schema:**
```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Testing:**
```bash
# Run migration
docker exec -it <postgres-container> psql -U admin -d urlshortener -f /path/to/migration.sql

# Verify table exists
docker exec -it <postgres-container> psql -U admin -d urlshortener -c "\dt"
```

**Success Criteria:**
- ✅ Users table created with correct schema

---

### **Step 2.2: Auth Service - Register Endpoint**
**What to create:**
- Auth service Node.js project with TypeScript
- Database connection (pg library)
- Redis connection (ioredis library)
- POST `/auth/register` endpoint
- Password hashing (bcrypt)
- JWT generation

**Implementation:**
```typescript
// Endpoint: POST /auth/register
// Body: { email, password, full_name }
// Logic:
1. Validate email and password
2. Check if email already exists
3. Hash password with bcrypt
4. Insert user into database
5. Generate JWT token
6. Return { token, user }
```

**Dependencies:**
```json
{
  "express": "^4.18.0",
  "pg": "^8.11.0",
  "bcrypt": "^5.1.0",
  "jsonwebtoken": "^9.0.0",
  "ioredis": "^5.3.0",
  "dotenv": "^16.0.0"
}
```

**Testing in Postman:**
```
POST http://localhost:3001/auth/register
Body: {
  "email": "test@example.com",
  "password": "Test@123",
  "full_name": "Test User"
}

Expected Response:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "test@example.com",
    "full_name": "Test User"
  }
}
```

**Success Criteria:**
- ✅ Returns 201 with token
- ✅ User saved in database
- ✅ Password is hashed (not plain text)
- ✅ Duplicate email returns 400 error

---

### **Step 2.3: Auth Service - Login Endpoint**
**What to create:**
- POST `/auth/login` endpoint
- Password comparison logic

**Implementation:**
```typescript
// Endpoint: POST /auth/login
// Body: { email, password }
// Logic:
1. Find user by email
2. Compare password with bcrypt
3. Generate JWT token
4. Return { token, user }
```

**Testing in Postman:**
```
POST http://localhost:3001/auth/login
Body: {
  "email": "test@example.com",
  "password": "Test@123"
}

Expected Response:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "test@example.com",
    "full_name": "Test User"
  }
}
```

**Success Criteria:**
- ✅ Correct credentials return token
- ✅ Wrong password returns 401
- ✅ Non-existent email returns 404

---

### **Step 2.4: Auth Service - OTP Flow**
**What to create:**
- POST `/auth/send-otp` endpoint (sends OTP to email)
- POST `/auth/verify-otp` endpoint (verifies OTP)
- OTP generation (6-digit random number)
- Store OTP in Redis with 5-minute TTL
- Email sending (Nodemailer with Gmail/SendGrid)

**Implementation:**
```typescript
// Endpoint 1: POST /auth/send-otp
// Body: { email }
// Logic:
1. Generate 6-digit OTP
2. Store in Redis: SET otp:{email} {otp_code} EX 300
3. Send email with OTP
4. Return { message: "OTP sent" }

// Endpoint 2: POST /auth/verify-otp
// Body: { email, otp }
// Logic:
1. Get OTP from Redis: GET otp:{email}
2. Compare with provided OTP
3. If match, mark user as verified
4. Delete OTP from Redis
5. Return { success: true }
```

**Dependencies:**
```json
{
  "nodemailer": "^6.9.0"
}
```

**Testing in Postman:**
```
# Step 1: Send OTP
POST http://localhost:3001/auth/send-otp
Body: { "email": "test@example.com" }

# Step 2: Check email for OTP (or check Redis)
docker exec -it <redis-container> redis-cli GET "otp:test@example.com"

# Step 3: Verify OTP
POST http://localhost:3001/auth/verify-otp
Body: {
  "email": "test@example.com",
  "otp": "123456"
}
```

**Success Criteria:**
- ✅ OTP sent to email
- ✅ OTP stored in Redis with TTL
- ✅ Correct OTP verifies successfully
- ✅ Wrong OTP returns error
- ✅ Expired OTP (after 5 min) returns error

---

### **Step 2.5: Auth Service - Logout**
**What to create:**
- POST `/auth/logout` endpoint
- Token blacklisting in Redis

**Implementation:**
```typescript
// Endpoint: POST /auth/logout
// Headers: Authorization: Bearer {token}
// Logic:
1. Extract token from header
2. Decode token to get expiry time
3. Store token in Redis blacklist: SET blacklist:{token} 1 EX {ttl}
4. Return { message: "Logged out" }
```

**Testing in Postman:**
```
POST http://localhost:3001/auth/logout
Headers: Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Expected Response:
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Success Criteria:**
- ✅ Token added to blacklist
- ✅ Blacklisted token cannot access protected routes

---

### **Step 2.6: API Gateway Setup**
**What to create:**
- API Gateway Node.js project
- Proxy middleware to route requests
- JWT validation middleware
- Rate limiting middleware

**Routing Configuration:**
```typescript
// Routes:
POST /api/auth/register    → auth-service:3001/auth/register
POST /api/auth/login       → auth-service:3001/auth/login
POST /api/auth/send-otp    → auth-service:3001/auth/send-otp
POST /api/auth/verify-otp  → auth-service:3001/auth/verify-otp
POST /api/auth/logout      → auth-service:3001/auth/logout (protected)
```

**Dependencies:**
```json
{
  "express": "^4.18.0",
  "http-proxy-middleware": "^2.0.0",
  "jsonwebtoken": "^9.0.0",
  "express-rate-limit": "^6.0.0",
  "ioredis": "^5.3.0"
}
```

**Testing in Postman:**
```
# Now test through API Gateway (port 3000)
POST http://localhost:3000/api/auth/register
Body: {
  "email": "user2@example.com",
  "password": "Pass@123",
  "full_name": "User Two"
}
```

**Success Criteria:**
- ✅ All auth endpoints work through gateway
- ✅ Protected routes require valid JWT
- ✅ Rate limiting works (e.g., 100 req/min per IP)

---

### **Step 2.7: Frontend - Auth Pages (Next.js)**
**What to create:**
- Next.js project setup
- Login page (`/login`)
- Register page (`/register`)
- OTP verification page (`/verify-otp`)
- Auth context for global state
- API client for backend calls

**Pages to build:**
1. **Register Page**: Form with email, password, name
2. **Login Page**: Form with email, password
3. **OTP Page**: Form with 6-digit input

**API Integration:**
```typescript
// lib/api/auth.api.ts
export const register = async (email, password, name) => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, full_name: name })
  });
  return res.json();
};
```

**Testing in Browser:**
```
1. Navigate to http://localhost:3000/register
2. Fill form and submit
3. Check if redirected to /verify-otp
4. Enter OTP from email
5. Verify and redirect to /dashboard
6. Test /login page
7. Test logout functionality
```

**Success Criteria:**
- ✅ Can register new user
- ✅ Receive OTP email
- ✅ Can verify OTP
- ✅ Can login with credentials
- ✅ Token stored in localStorage/cookies
- ✅ Protected routes redirect to login if not authenticated
- ✅ Can logout successfully

---

## **✅ CHECKPOINT: Auth Flow Complete**
At this point, you have:
- ✅ Working Docker environment
- ✅ Auth Service with register/login/OTP/logout
- ✅ API Gateway routing and protecting routes
- ✅ Next.js frontend with auth pages
- ✅ End-to-end auth flow tested

**Time to celebrate! 🎉 Auth is done. Now move to URL shortening.**

---

## **MILESTONE 3: URL Shortening (Complete)**
**Goal**: User can create short URLs, view them, and redirect works

### **Step 3.1: Database Schema for URLs**
**What to create:**
- SQL migration for `urls` table

**Schema:**
```sql
CREATE TABLE urls (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    short_code VARCHAR(10) UNIQUE NOT NULL,
    original_url TEXT NOT NULL,
    custom_alias VARCHAR(50) UNIQUE,
    clicks BIGINT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_urls_short_code ON urls(short_code);
CREATE INDEX idx_urls_user_id ON urls(user_id);
```

**Testing:**
```bash
docker exec -it <postgres-container> psql -U admin -d urlshortener -f /path/to/urls_migration.sql
```

**Success Criteria:**
- ✅ URLs table created with indexes

---

### **Step 3.2: URL Shortener Service - Create Short URL**
**What to create:**
- URL Shortener Service Node.js project
- POST `/urls` endpoint (create short URL)
- Base62 encoding algorithm
- Store URL in database
- Cache URL in Redis

**Implementation:**
```typescript
// Endpoint: POST /urls
// Headers: Authorization: Bearer {token}
// Body: { original_url, custom_alias?, expires_at? }
// Logic:
1. Validate original_url (must be valid URL)
2. Check if custom_alias already exists
3. If no custom_alias, generate short_code using Base62
4. Insert into database
5. Cache in Redis: SET url:shortcode:{code} {original_url} EX 86400
6. Return { short_code, short_url, original_url }
```

**Base62 Algorithm:**
```typescript
const BASE62 = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

function encodeBase62(num: number): string {
  let encoded = '';
  while (num > 0) {
    encoded = BASE62[num % 62] + encoded;
    num = Math.floor(num / 62);
  }
  return encoded || BASE62[0];
}

// Use auto-increment ID from database
const shortCode = encodeBase62(urlId);
```

**Dependencies:**
```json
{
  "express": "^4.18.0",
  "pg": "^8.11.0",
  "ioredis": "^5.3.0",
  "validator": "^13.11.0"
}
```

**Testing in Postman:**
```
POST http://localhost:3002/urls
Headers: Authorization: Bearer {your_token}
Body: {
  "original_url": "https://www.example.com/very-long-url"
}

Expected Response:
{
  "success": true,
  "data": {
    "id": 1,
    "short_code": "b",
    "short_url": "http://localhost:3003/b",
    "original_url": "https://www.example.com/very-long-url",
    "created_at": "2025-01-15T10:30:00Z"
  }
}
```

**Success Criteria:**
- ✅ Returns short code
- ✅ URL saved in database
- ✅ URL cached in Redis
- ✅ Custom alias works
- ✅ Duplicate original_url returns existing short code

---

### **Step 3.3: URL Shortener Service - Get User URLs**
**What to create:**
- GET `/urls` endpoint (list user's URLs)

**Implementation:**
```typescript
// Endpoint: GET /urls
// Headers: Authorization: Bearer {token}
// Query: ?page=1&limit=10
// Logic:
1. Extract user_id from JWT
2. Query database for user's URLs with pagination
3. Return { urls: [...], total, page, limit }
```

**Testing in Postman:**
```
GET http://localhost:3002/urls?page=1&limit=10
Headers: Authorization: Bearer {your_token}

Expected Response:
{
  "success": true,
  "data": {
    "urls": [
      {
        "id": 1,
        "short_code": "b",
        "original_url": "https://www.example.com/very-long-url",
        "clicks": 0,
        "created_at": "2025-01-15T10:30:00Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10
  }
}
```

**Success Criteria:**
- ✅ Returns only user's URLs
- ✅ Pagination works correctly

---

### **Step 3.4: Redirect Service - Ultra-Fast Redirect**
**What to create:**
- Redirect Service with Fastify (fastest Node.js framework)
- GET `/:shortCode` endpoint (redirect)
- Cache-first strategy (check Redis → fallback to DB)
- Async click tracking (publish to Kafka)

**Implementation:**
```typescript
// Endpoint: GET /:shortCode
// Logic:
1. Check Redis: GET url:shortcode:{code}
2. If found, redirect immediately (99% case)
3. If not in Redis, query database
4. If found in DB, cache in Redis and redirect
5. If not found, return 404
6. Asynchronously publish click event to Kafka
```

**Dependencies:**
```json
{
  "fastify": "^4.25.0",
  "ioredis": "^5.3.0",
  "pg": "^8.11.0",
  "kafkajs": "^2.2.0"
}
```

**Testing in Browser:**
```
# Visit: http://localhost:3003/b
# Should redirect to: https://www.example.com/very-long-url

# Check response time (should be < 10ms)
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3003/b
```

**Success Criteria:**
- ✅ Redirects to original URL
- ✅ Redirect time < 10ms (cached)
- ✅ 404 for non-existent short codes
- ✅ Click event published to Kafka

---

### **Step 3.5: API Gateway - Add URL Routes**
**What to create:**
- Add URL routes to API Gateway

**Routing:**
```typescript
// Add to gateway routing:
POST   /api/urls           → url-shortener-service:3002/urls
GET    /api/urls           → url-shortener-service:3002/urls
GET    /api/urls/:id       → url-shortener-service:3002/urls/:id
DELETE /api/urls/:id       → url-shortener-service:3002/urls/:id

// Direct redirect (no /api prefix)
GET    /:shortCode         → redirect-service:3003/:shortCode
```

**Testing in Postman:**
```
POST http://localhost:3000/api/urls
Headers: Authorization: Bearer {your_token}
Body: { "original_url": "https://google.com" }

# Test redirect
GET http://localhost:3000/abc123
```

**Success Criteria:**
- ✅ URL creation works through gateway
- ✅ Redirect works through gateway

---

### **Step 3.6: Frontend - URL Pages**
**What to create:**
- Dashboard page (`/dashboard`) - show user's URLs
- Create URL page (`/urls/create`) - form to create short URL
- URL detail page (`/urls/:shortCode`) - show URL stats
- URL list component with copy-to-clipboard

**Pages:**
1. **Dashboard**: List of URLs with short link, original URL, clicks, created date
2. **Create URL**: Form with original URL input, optional custom alias
3. **URL Detail**: Show URL info and basic stats

**Testing in Browser:**
```
1. Login to app
2. Navigate to /dashboard
3. See list of URLs (empty initially)
4. Click "Create URL" → /urls/create
5. Enter URL: https://example.com
6. Submit and see new short URL
7. Click "Copy" to copy short link
8. Open short link in new tab (should redirect)
9. Navigate back to dashboard, see clicks = 1
```

**Success Criteria:**
- ✅ Can create short URL from frontend
- ✅ Dashboard shows all user URLs
- ✅ Copy-to-clipboard works
- ✅ Short URL redirects correctly
- ✅ Custom alias works

---

## **✅ CHECKPOINT: URL Shortening Complete**
At this point, you have:
- ✅ URL Shortener Service (create, list URLs)
- ✅ Redirect Service (ultra-fast redirects)
- ✅ API Gateway routing URL requests
- ✅ Next.js frontend with URL management
- ✅ End-to-end URL shortening flow tested

**Time to celebrate again! 🎉 Core functionality is done.**

---

## **MILESTONE 4: Analytics & Click Tracking (Complete)**
**Goal**: Track every click and show analytics

### **Step 4.1: Database Schema for Clicks**
**What to create:**
- SQL migration for `clicks` table

**Schema:**
```sql
CREATE TABLE clicks (
    id BIGSERIAL PRIMARY KEY,
    url_id BIGINT REFERENCES urls(id),
    short_code VARCHAR(10) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    country VARCHAR(2),
    device_type VARCHAR(50),
    clicked_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_clicks_url_id ON clicks(url_id);
CREATE INDEX idx_clicks_short_code ON clicks(short_code);
CREATE INDEX idx_clicks_clicked_at ON clicks(clicked_at DESC);
```

**Success Criteria:**
- ✅ Clicks table created

---

### **Step 4.2: Kafka Setup**
**What to create:**
- Create Kafka topic: `click.events`
- Configure producer in Redirect Service
- Configure consumer in Analytics Service

**Create Topic:**
```bash
docker exec -it <kafka-container> kafka-topics --create \
  --topic click.events \
  --bootstrap-server localhost:9092 \
  --partitions 3 \
  --replication-factor 1
```

**Success Criteria:**
- ✅ Topic created and visible in Kafka

---

### **Step 4.3: Redirect Service - Publish Click Events**
**What to modify:**
- Update Redirect Service to publish to Kafka after redirect

**Implementation:**
```typescript
// After successful redirect, publish event:
await kafkaProducer.send({
  topic: 'click.events',
  messages: [{
    value: JSON.stringify({
      short_code: shortCode,
      url_id: urlId,
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
      referrer: req.headers['referer'] || null,
      timestamp: new Date().toISOString()
    })
  }]
});
```

**Testing:**
```
# Click a short URL
curl http://localhost:3003/b

# Verify message in Kafka
docker exec -it <kafka-container> kafka-console-consumer \
  --topic click.events \
  --from-beginning \
  --bootstrap-server localhost:9092
```

**Success Criteria:**
- ✅ Click event published to Kafka
- ✅ Event contains IP, user-agent, referrer

---

### **Step 4.4: Analytics Service - Consume Click Events**
**What to create:**
- Analytics Service Node.js project
- Kafka consumer for `click.events` topic
- Insert click data into `clicks` table
- Batch insert (every 5 seconds or 100 events)

**Implementation:**
```typescript
// Kafka consumer
const consumer = kafka.consumer({ groupId: 'analytics-group' });

await consumer.subscribe({ topic: 'click.events' });

await consumer.run({
  eachMessage: async ({ message }) => {
    const clickData = JSON.parse(message.value.toString());

    // Add to batch
    clickBatch.push(clickData);

    // Insert batch every 100 events or 5 seconds
    if (clickBatch.length >= 100 || timeSinceLastInsert > 5000) {
      await insertClicksBatch(clickBatch);
      clickBatch = [];
    }
  }
});
```

**Testing:**
```
# Generate multiple clicks
for i in {1..10}; do curl http://localhost:3003/b; done

# Check database
docker exec -it <postgres-container> psql -U admin -d urlshortener \
  -c "SELECT * FROM clicks ORDER BY clicked_at DESC LIMIT 10;"
```

**Success Criteria:**
- ✅ Clicks saved in database
- ✅ All click metadata captured (IP, user-agent, etc.)

---

### **Step 4.5: Analytics Service - Analytics Endpoints**
**What to create:**
- GET `/analytics/:shortCode` - get URL analytics
- GET `/analytics/:shortCode/clicks` - get click history

**Implementation:**
```typescript
// Endpoint: GET /analytics/:shortCode
// Logic:
1. Get URL info from database
2. Get total clicks
3. Get clicks by day (last 30 days)
4. Get top countries
5. Get device breakdown
6. Return analytics data
```

**Testing in Postman:**
```
GET http://localhost:3005/analytics/b
Headers: Authorization: Bearer {your_token}

Expected Response:
{
  "success": true,
  "data": {
    "short_code": "b",
    "total_clicks": 150,
    "clicks_by_day": [
      { "date": "2025-01-15", "clicks": 50 },
      { "date": "2025-01-14", "clicks": 100 }
    ],
    "top_countries": [
      { "country": "US", "clicks": 80 },
      { "country": "IN", "clicks": 70 }
    ],
    "devices": {
      "mobile": 90,
      "desktop": 60
    }
  }
}
```

**Success Criteria:**
- ✅ Analytics data accurate
- ✅ Only URL owner can view analytics

---

### **Step 4.6: API Gateway - Add Analytics Routes**
**What to create:**
- Add analytics routes to gateway

**Routing:**
```typescript
GET /api/analytics/:shortCode        → analytics-service:3005/analytics/:shortCode
GET /api/analytics/:shortCode/clicks → analytics-service:3005/analytics/:shortCode/clicks
```

**Success Criteria:**
- ✅ Analytics endpoints accessible through gateway

---

### **Step 4.7: Frontend - Analytics Dashboard**
**What to create:**
- Analytics page (`/urls/:shortCode/analytics`)
- Charts for clicks over time (Chart.js or Recharts)
- Geographic distribution
- Device breakdown

**Components:**
1. **Click Chart**: Line chart showing clicks over time
2. **Stats Cards**: Total clicks, today's clicks, top country
3. **Device Pie Chart**: Mobile vs Desktop vs Tablet

**Testing in Browser:**
```
1. Login to app
2. Go to /dashboard
3. Click on any URL
4. See analytics page with charts
5. Verify data matches database
```

**Success Criteria:**
- ✅ Charts display correctly
- ✅ Real-time data updates
- ✅ Analytics only visible to URL owner

---

## **✅ CHECKPOINT: Analytics Complete**
At this point, you have:
- ✅ Click tracking via Kafka
- ✅ Analytics Service storing clicks
- ✅ Analytics API endpoints
- ✅ Frontend analytics dashboard
- ✅ End-to-end click tracking tested

**Amazing! 🎉 Core platform is fully functional.**

---

## **MILESTONE 5: User Profile & Settings**
**Goal**: User can update profile, change password

### **Step 5.1: User Service - Profile Endpoints**
**What to create:**
- User Service Node.js project
- GET `/users/profile` - get current user
- PUT `/users/profile` - update profile
- PUT `/users/password` - change password

**Testing in Postman:**
```
GET http://localhost:3004/users/profile
Headers: Authorization: Bearer {token}

PUT http://localhost:3004/users/profile
Headers: Authorization: Bearer {token}
Body: { "full_name": "New Name" }

PUT http://localhost:3004/users/password
Headers: Authorization: Bearer {token}
Body: {
  "old_password": "Test@123",
  "new_password": "NewPass@456"
}
```

**Success Criteria:**
- ✅ Can get user profile
- ✅ Can update name
- ✅ Can change password with validation

---

### **Step 5.2: API Gateway - Add User Routes**
**Routing:**
```typescript
GET /api/users/profile     → user-service:3004/users/profile
PUT /api/users/profile     → user-service:3004/users/profile
PUT /api/users/password    → user-service:3004/users/password
```

---

### **Step 5.3: Frontend - Profile Page**
**What to create:**
- Profile page (`/profile`)
- Edit profile form
- Change password form

**Testing in Browser:**
```
1. Login
2. Navigate to /profile
3. Update name, save
4. Change password
5. Logout and login with new password
```

**Success Criteria:**
- ✅ Profile updates work
- ✅ Password change works
- ✅ Old password required for password change

---

## **✅ CHECKPOINT: User Management Complete**

---

## **MILESTONE 6: Email & Notification Services**
**Goal**: Send emails for registration, OTP, URL creation

### **Step 6.1: Email Service**
**What to create:**
- Email Service Node.js project
- Kafka consumer for `email.send` topic
- Nodemailer setup with SMTP
- Email templates (HTML)

**Templates:**
1. Welcome email (on registration)
2. OTP email
3. Password reset email
4. URL created notification

**Testing:**
```
# Publish test email event to Kafka
docker exec -it <kafka-container> kafka-console-producer \
  --topic email.send \
  --bootstrap-server localhost:9092

# Enter:
{"to":"test@example.com","subject":"Test","template":"welcome","data":{}}
```

**Success Criteria:**
- ✅ Email received in inbox
- ✅ HTML template renders correctly

---

### **Step 6.2: Notification Service**
**What to create:**
- Notification Service Node.js project
- Kafka consumers for:
  - `user.registered` → send welcome email
  - `url.created` → send URL created notification
- Route to Email Service via Kafka

**Testing:**
```
# Register new user
# Should automatically receive welcome email

# Create new URL
# Should receive URL creation notification
```

**Success Criteria:**
- ✅ Welcome email sent on registration
- ✅ Notification sent on URL creation

---

## **✅ CHECKPOINT: Notifications Complete**

---

## **MILESTONE 7: Advanced Features**
**Goal**: Custom aliases, expiration, QR codes

### **Step 7.1: Custom Alias Feature**
- Already implemented in Step 3.2
- Just test in frontend

### **Step 7.2: URL Expiration**
**What to add:**
- Cron job in URL Shortener Service
- Check expired URLs every hour
- Mark as inactive

**Implementation:**
```typescript
// Cron job (node-cron)
cron.schedule('0 * * * *', async () => {
  await db.query(`
    UPDATE urls
    SET is_active = false
    WHERE expires_at < NOW() AND is_active = true
  `);
});
```

**Testing:**
```
# Create URL with expiration
POST /api/urls
Body: {
  "original_url": "https://example.com",
  "expires_at": "2025-01-16T00:00:00Z"
}

# Wait for expiration or manually update DB
# Try to access short code → should return 404 or "Link expired"
```

**Success Criteria:**
- ✅ Expired URLs don't redirect
- ✅ Dashboard shows expired status

---

### **Step 7.3: QR Code Generation**
**What to add:**
- QR code generation library (qrcode)
- Add QR code URL to API response

**Implementation:**
```typescript
import QRCode from 'qrcode';

const qrCodeUrl = await QRCode.toDataURL(`http://short.ly/${shortCode}`);
// Return in response
```

**Testing in Frontend:**
```
# Create URL
# See QR code image in response
# Display QR code on dashboard
# Scan with phone → should redirect
```

**Success Criteria:**
- ✅ QR code generated for each URL
- ✅ Scanning QR code redirects correctly

---

## **MILESTONE 8: Performance & Scalability**
**Goal**: Optimize for 1000+ req/sec

### **Step 8.1: Load Testing with K6**
**What to create:**
- K6 test script for redirect endpoint
- Target: 1000 requests/second for 1 minute

**K6 Script:**
```javascript
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 100, // 100 virtual users
  duration: '1m',
  thresholds: {
    http_req_duration: ['p(99)<10'], // 99% under 10ms
  },
};

export default function () {
  const res = http.get('http://localhost:3003/b');
  check(res, {
    'status is 301': (r) => r.status === 301,
    'redirect time < 10ms': (r) => r.timings.duration < 10,
  });
}
```

**Run Test:**
```bash
k6 run load-test.js
```

**Success Criteria:**
- ✅ Handle 1000+ req/sec
- ✅ p99 latency < 10ms
- ✅ No errors

---

### **Step 8.2: Redis Cache Optimization**
**What to optimize:**
- Increase Redis memory
- Set cache warming on startup (pre-load top 10k URLs)
- Monitor cache hit rate

**Success Criteria:**
- ✅ Cache hit rate > 99%

---

### **Step 8.3: Database Optimization**
**What to optimize:**
- Add connection pooling
- Create read replicas (if using cloud DB)
- Optimize slow queries

**Success Criteria:**
- ✅ All queries < 50ms

---

### **Step 8.4: Horizontal Scaling**
**What to do:**
- Add docker-compose scaling
- Run 3 instances of Redirect Service
- Add NGINX load balancer

**Command:**
```bash
docker-compose up --scale redirect-service=3
```

**Success Criteria:**
- ✅ Multiple instances running
- ✅ Load balanced across instances

---

## **MILESTONE 9: Monitoring & Deployment**
**Goal**: Production-ready deployment

### **Step 9.1: Logging**
- Winston logger in all services
- Centralized logging (optional: ELK stack)

### **Step 9.2: Health Checks**
- Add `/health` endpoint to all services
- Check DB, Redis, Kafka connections

### **Step 9.3: Docker Production Build**
- Multi-stage Dockerfiles
- Environment-specific configs
- docker-compose.prod.yml

### **Step 9.4: Documentation**
- API documentation (Swagger/Postman collection)
- README for each service
- Deployment guide

---

## **FINAL CHECKLIST**

### **Backend Services (8 total):**
- ✅ API Gateway (port 3000)
- ✅ Auth Service (port 3001)
- ✅ URL Shortener Service (port 3002)
- ✅ Redirect Service (port 3003)
- ✅ User Service (port 3004)
- ✅ Analytics Service (port 3005)
- ✅ Notification Service (port 3006)
- ✅ Email Service (port 3007)

### **Frontend:**
- ✅ Next.js app (port 3000)

### **Infrastructure:**
- ✅ PostgreSQL
- ✅ Redis
- ✅ Kafka + Zookeeper

### **Features:**
- ✅ User registration/login/logout
- ✅ OTP verification
- ✅ Create short URLs
- ✅ Custom aliases
- ✅ URL expiration
- ✅ Fast redirects (< 10ms)
- ✅ Click tracking
- ✅ Analytics dashboard
- ✅ User profile management
- ✅ Email notifications
- ✅ QR code generation

### **Performance:**
- ✅ Handle 1000+ requests/second
- ✅ 99% cache hit rate
- ✅ p99 latency < 10ms

---

## **ESTIMATED TIMELINE**

- **Milestone 1**: Infrastructure (1 day)
- **Milestone 2**: Auth Flow (3-4 days)
- **Milestone 3**: URL Shortening (3-4 days)
- **Milestone 4**: Analytics (2-3 days)
- **Milestone 5**: User Profile (1-2 days)
- **Milestone 6**: Notifications (2 days)
- **Milestone 7**: Advanced Features (2 days)
- **Milestone 8**: Performance (2-3 days)
- **Milestone 9**: Deployment (2 days)

**Total**: ~20-25 days (working full-time)

---

## **READY TO START?**

Follow this plan step-by-step. Test thoroughly at each step before moving forward. You'll have a production-ready URL shortener service that can handle 1000+ requests per second!

Let me know when you want to begin, and I'll start implementing from Milestone 1!
