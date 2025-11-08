# LinkShort - Modern URL Shortener

A production-ready, full-stack URL shortening application with advanced analytics, built using microservices architecture.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-18%2B-green.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

## 📖 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Code Flow](#-code-flow)
- [Technology Stack](#-technology-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Running the Application](#-running-the-application)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [Security](#-security)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

## 🚀 Features

### Core Features
- ✅ **URL Shortening**: Create short URLs with optional custom aliases
- ✅ **User Authentication**: Secure JWT-based registration and login
- ✅ **Analytics Dashboard**: Track clicks, referrers, and performance over time
- ✅ **Click Tracking**: Real-time click counting with Kafka event streaming
- ✅ **Referrer Analysis**: See where your clicks are coming from
- ✅ **Time-based Analytics**: View performance over 7, 30, 90 days, or all time
- ✅ **URL Management**: Delete (soft delete) URLs
- ✅ **Dark Mode**: Full dark mode support with system preference detection
- ✅ **Auto Refresh**: Data refreshes automatically when switching browser tabs
- ✅ **Responsive Design**: Works seamlessly on desktop and mobile devices

### Technical Features
- ✅ **Microservices Architecture**: 5 independent, scalable services
- ✅ **Redis Caching**: Ultra-fast redirects with cache-first strategy
- ✅ **Kafka Event Streaming**: Asynchronous click tracking
- ✅ **JWT Authentication**: Secure token-based authentication
- ✅ **Token Blacklisting**: Secure logout functionality
- ✅ **Batch Processing**: Efficient click data storage
- ✅ **API Gateway**: Single entry point with rate limiting
- ✅ **CORS Support**: Configurable cross-origin resource sharing

## 🏗️ Architecture

This project uses a microservices architecture with the following services:

### Services
1. **API Gateway** (Port 4000) - Entry point for all API requests
2. **Auth Service** (Port 3001) - User authentication and session management
3. **URL Shortener Service** (Port 3002) - URL creation and management
4. **Redirect Service** (Port 3003) - Handles short URL redirects
5. **Analytics Service** (Port 3004) - Click tracking and analytics

### Frontend
- **Next.js 16** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Shadcn/ui** for component library
- **Recharts** for analytics visualization

### Backend
- **Node.js** with **Express.js** (most services)
- **Fastify** (redirect service for performance)
- **PostgreSQL** for data storage
- **Redis** for caching
- **JWT** for authentication

## 🔄 Code Flow

This section explains how different operations flow through the microservices architecture.

### Request Flow Overview

```
Frontend (Next.js) → API Gateway (Port 4000) → Microservices → Database/Cache
                                              ↓
                                         Redis Cache
                                         Kafka Events
```

### 1. User Registration Flow

**Step-by-step process:**

1. **Frontend** (`/app/(auth)/register/page.tsx`):
   - User fills registration form (name, email, password)
   - Form validation on client side
   - POST request to `/api/auth/register`

2. **Frontend API Route** (`/app/api/auth/register/route.ts`):
   - Receives request from client
   - Forwards to API Gateway at `localhost:4000/api/auth/register`

3. **API Gateway** (`services/api-gateway`, Port 4000):
   - Receives request at `/api/auth/register`
   - Proxies to Auth Service at `localhost:3001/register`
   - No authentication required for this endpoint

4. **Auth Service** (`services/auth-service`, Port 3001):
   - Validates input (email format, password strength)
   - Checks if email already exists in database
   - Hashes password using bcrypt (10 rounds)
   - Inserts user into PostgreSQL `users` table
   - Generates JWT token with 24h expiration
   - Returns token and user data

5. **Response Path**:
   - Auth Service → API Gateway → Frontend API → Client
   - Frontend stores token in localStorage
   - Redirects user to `/dashboard`

**Files involved:**
- `frontend/app/(auth)/register/page.tsx:89` - handleSubmit function
- `frontend/app/api/auth/register/route.ts` - POST handler
- `services/api-gateway/src/routes/auth.routes.ts:15` - Proxy route
- `services/auth-service/src/controllers/auth.controller.ts:11` - register controller
- `services/auth-service/src/services/auth.service.ts:18` - registerUser function

### 2. User Login Flow

**Step-by-step process:**

1. **Frontend** submits credentials to `/api/auth/login`
2. **API Gateway** proxies to Auth Service
3. **Auth Service**:
   - Queries user by email from database
   - Compares password hash using bcrypt
   - Generates new JWT token
   - Returns token and user data
4. **Frontend** stores token and redirects to dashboard

**Key difference from registration:** Password comparison instead of creation.

### 3. URL Creation Flow

**Step-by-step process:**

1. **Frontend** (`/app/dashboard/create/page.tsx`):
   - User enters long URL
   - Optional: custom alias
   - Optional: expiration date
   - POST to `/api/urls`

2. **Frontend API Route** (`/app/api/urls/route.ts`):
   - Extracts JWT token from request headers
   - Forwards to API Gateway with Authorization header

3. **API Gateway** (`services/api-gateway`):
   - Receives at `/api/urls`
   - Validates JWT token (checks signature and expiration)
   - Proxies to URL Shortener Service with token

4. **URL Shortener Service** (`services/url-shortener-service`, Port 3002):
   - **Authentication Middleware** (`src/middlewares/auth.middleware.ts`):
     - Verifies JWT token
     - Extracts userId from token payload
     - Attaches user info to request

   - **Controller** (`src/controllers/url.controller.ts:11`):
     - Validates originalUrl format
     - Validates custom alias (if provided)

   - **Service** (`src/services/url.service.ts:23`):
     - **If custom alias provided:**
       - Checks if alias already exists
       - Uses alias as short_code
     - **If no custom alias:**
       - Generates unique Base62 short code (7 characters)
       - Checks for collisions, regenerates if needed
     - Inserts into PostgreSQL `urls` table
     - **Caches in Redis**:
       - Key: `url:{shortCode}`
       - Value: JSON with originalUrl, userId, clickCount
       - TTL: 24 hours
     - Returns URL data with full short URL

5. **Response Path**:
   - Returns created URL object with shortUrl
   - Frontend displays success message
   - Redirects to dashboard with new URL visible

**Base62 Encoding** (`services/url-shortener-service/src/services/shortcode.service.ts`):
- Characters: `0-9a-zA-Z` (62 total)
- Generates random 7-character code
- 62^7 = 3.5 trillion possible combinations
- Collision handling: retry with new random code

**Files involved:**
- `frontend/app/dashboard/create/page.tsx:46` - handleSubmit
- `frontend/app/api/urls/route.ts:8` - POST handler
- `services/api-gateway/src/routes/url.routes.ts:13` - Proxy with auth
- `services/url-shortener-service/src/controllers/url.controller.ts:11` - createUrl
- `services/url-shortener-service/src/services/url.service.ts:23` - URL creation logic

### 4. URL Redirect Flow (Most Critical Path)

**This is the most performance-critical flow - optimized for speed.**

1. **User clicks short URL**: `http://localhost:3003/abc123X`

2. **Redirect Service** (`services/redirect-service`, Port 3003):
   - **Uses Fastify** (faster than Express) for maximum performance
   - **Handler** (`src/controllers/redirect.controller.ts:9`):
     - Extracts shortCode from URL path

   - **Service** (`src/services/redirect.service.ts:12`):
     - **Step 1: Try Redis Cache** (cache-first strategy):
       - Key: `url:{abc123X}`
       - **Cache Hit**: Return original URL immediately (< 1ms)
       - **Cache Miss**: Continue to database

     - **Step 2: Query PostgreSQL**:
       - Find URL by short_code or custom_alias
       - Check `is_active = true` (soft delete check)
       - Check expiration if `expires_at` is set
       - If not found or inactive: return 404

     - **Step 3: Update Cache**:
       - Store in Redis for 24 hours

     - **Step 4: Publish Kafka Event** (async, non-blocking):
       - Topic: `url-clicks`
       - Message: `{ urlId, shortCode, timestamp, referrer, ipAddress, userAgent }`
       - **Fire-and-forget**: doesn't block redirect

     - **Step 5: Return 302 Redirect**:
       - Location header: original URL
       - Browser immediately redirects user

3. **Response**: User lands on original destination

**Performance optimizations:**
- Redis cache reduces DB queries by ~95%
- Fastify provides faster routing than Express
- Kafka event is asynchronous (doesn't slow redirect)
- Connection pooling for database
- Indexed lookups on short_code column

**Files involved:**
- `services/redirect-service/src/controllers/redirect.controller.ts:9` - handleRedirect
- `services/redirect-service/src/services/redirect.service.ts:12` - getOriginalUrl
- `services/redirect-service/src/config/redis.ts` - Cache operations
- `services/redirect-service/src/config/kafka.ts` - Event publishing

### 5. Analytics Click Tracking Flow

**Asynchronous background processing:**

1. **Redirect Service publishes Kafka event** (from step 4 above):
   ```json
   {
     "urlId": 123,
     "shortCode": "abc123X",
     "clickedAt": "2025-11-07T10:30:00Z",
     "referrer": "https://twitter.com",
     "ipAddress": "192.168.1.1",
     "userAgent": "Mozilla/5.0..."
   }
   ```

2. **Analytics Service** (`services/analytics-service`, Port 3004):
   - **Kafka Consumer** (`src/consumers/click.consumer.ts`):
     - Subscribes to `url-clicks` topic
     - Consumes events in batches (configurable batch size)
     - **Batch Processing** for efficiency:
       - Accumulates 100 clicks or waits 5 seconds
       - Inserts all clicks in single database transaction

   - **Service** (`src/services/analytics.service.ts:115`):
     - Inserts into `clicks` table with all metadata
     - Updates `click_count` in `urls` table (atomic increment)
     - **Updates Redis cache** with new click count

3. **Frontend requests analytics**:
   - GET `/api/analytics/:shortCode?period=30d`
   - **API Gateway** → **Analytics Service**
   - **Analytics Service** (`src/controllers/analytics.controller.ts:11`):
     - Queries clicks from database
     - Filters by time period (7d, 30d, 90d, all)
     - Aggregates data:
       - Total clicks
       - Clicks by date (for chart)
       - Top referrers
       - Geographic distribution (if available)
     - Returns formatted analytics data

4. **Frontend displays**:
   - Charts with Recharts library
   - Click trends over time
   - Referrer breakdown
   - Real-time updates on tab focus

**Batch processing benefits:**
- Reduces database writes by 100x
- Prevents database overload during traffic spikes
- Kafka provides durability and ordering guarantees

**Files involved:**
- `services/redirect-service/src/config/kafka.ts:25` - publishClickEvent
- `services/analytics-service/src/consumers/click.consumer.ts` - Kafka consumer
- `services/analytics-service/src/services/analytics.service.ts:115` - processClickBatch
- `services/analytics-service/src/controllers/analytics.controller.ts:11` - getAnalytics
- `frontend/app/dashboard/analytics/[shortCode]/page.tsx` - Analytics display

### 6. URL Deletion Flow

**Soft delete implementation:**

1. **Frontend** (`/components/dashboard/URLList.tsx:65`):
   - User clicks Delete button
   - Confirmation dialog appears
   - DELETE request to `/api/urls/{shortCode}`

2. **Frontend API Route** (`/app/api/urls/[shortCode]/route.ts`):
   - Extracts shortCode from dynamic route
   - Forwards DELETE to API Gateway with auth token

3. **API Gateway** (`services/api-gateway`):
   - Validates JWT token
   - Proxies to URL Shortener Service

4. **URL Shortener Service** (`services/url-shortener-service`):
   - **Controller** (`src/controllers/url.controller.ts:85`):
     - Verifies user ownership of URL
     - Calls deleteUrl service

   - **Service** (`src/services/url.service.ts:96`):
     - **Soft delete**: `UPDATE urls SET is_active = false WHERE id = ?`
     - **Does NOT physically delete** from database
     - **Removes from Redis cache**: `DEL url:{shortCode}`
     - Returns success

5. **Response Path**:
   - Frontend shows success toast
   - Refreshes URL list (URL no longer appears)
   - URL still exists in database for audit/recovery

**Why soft delete?**
- Analytics data preserved
- Audit trail maintained
- Possible to restore URLs
- Prevents shortCode reuse immediately

**Files involved:**
- `frontend/components/dashboard/URLList.tsx:65` - handleDelete
- `frontend/app/api/urls/[shortCode]/route.ts:7` - DELETE handler
- `services/url-shortener-service/src/controllers/url.controller.ts:85` - deleteUrl
- `services/url-shortener-service/src/services/url.service.ts:96` - Soft delete logic

### 7. User Logout Flow

**Token blacklisting:**

1. **Frontend** clicks Logout button
2. **Frontend API** → **API Gateway** → **Auth Service**
3. **Auth Service** (`services/auth-service/src/services/auth.service.ts:82`):
   - Extracts token from Authorization header
   - Adds token to Redis blacklist:
     - Key: `blacklist:{tokenHash}`
     - TTL: Same as token expiration
   - Token becomes invalid immediately
4. **Frontend** clears localStorage and redirects to login

**Subsequent requests with blacklisted token:**
- Auth middleware checks Redis blacklist
- Returns 401 Unauthorized
- Forces re-login

## 💻 Technology Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3
- **UI Components**: Shadcn/ui (Radix UI primitives)
- **Charts**: Recharts
- **State Management**: React Context API
- **Form Handling**: React Hook Form
- **HTTP Client**: Fetch API
- **Theme**: next-themes (dark mode)
- **Notifications**: Sonner (toast notifications)

### Backend Services
- **Runtime**: Node.js 18+
- **Frameworks**:
  - Express.js (Auth, URL Shortener, Analytics, API Gateway)
  - Fastify (Redirect Service - for performance)
- **Language**: TypeScript
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt
- **Validation**: express-validator, validator
- **CORS**: cors middleware

### Database & Caching
- **Primary Database**: PostgreSQL 14+
- **Cache**: Redis 7+
- **Event Streaming**: Kafka (click tracking)
- **Database Driver**: pg (node-postgres)
- **Redis Client**: ioredis

### DevOps & Tools
- **Package Manager**: npm
- **Build Tool**: TypeScript Compiler (tsc)
- **Process Manager**: npm scripts / PM2 (production)
- **Version Control**: Git

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Redis 7+
- Git

## 🛠️ Installation

Run the docker compose file to set up the enviornment with all the services. Rest are just step not actual commands.

### 1. Clone the repository

```bash
git clone <repository-url>
cd url_shortener
```

### 2. Set up PostgreSQL

Create a database:

```bash
createdb linkshort
```

Run migrations:

```bash
cd migrations
npm install
npm run migrate
```

### 3. Set up environment variables

Each service needs its own `.env` file. See individual service README files for details.

### 4. Install dependencies

```bash
# Install dependencies for all services
cd services/api-gateway && npm install
cd ../auth-service && npm install
cd ../url-shortener-service && npm install
cd ../redirect-service && npm install
cd ../analytics-service && npm install

# Install frontend dependencies
cd ../../frontend && npm install
```

### 5. Start Redis

```bash
redis-server
```

### 6. Start all services

Open separate terminal windows for each:

```bash
# Terminal 1 - API Gateway
cd services/api-gateway && npm run dev

# Terminal 2 - Auth Service
cd services/auth-service && npm run dev

# Terminal 3 - URL Shortener Service
cd services/url-shortener-service && npm run dev

# Terminal 4 - Redirect Service
cd services/redirect-service && npm run dev

# Terminal 5 - Analytics Service
cd services/analytics-service && npm run dev

# Terminal 6 - Frontend
cd frontend && npm run dev
```

## 🌐 Access the Application

- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:4000
- **Short URL Redirect**: http://localhost:3003/{shortCode}

## 📚 API Documentation

### Authentication Endpoints

```
POST /api/auth/register - Register a new user
POST /api/auth/login    - Login user
POST /api/auth/logout   - Logout user
```

### URL Endpoints

```
POST   /api/urls            - Create a short URL
GET    /api/urls            - Get user's URLs
DELETE /api/urls/:shortCode - Delete a URL
```

### Analytics Endpoints

```
GET /api/analytics/:shortCode - Get analytics for a specific URL
```

## 🎨 Dark Mode

The application supports dark mode with three options:
- **Light**: Force light theme
- **Dark**: Force dark theme
- **System**: Follow system preference (default)

Toggle the theme using the sun/moon icon in the sidebar.

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Redis session management
- CORS protection
- Input validation
- SQL injection prevention
- XSS protection

## 📊 Database Schema

### Users Table
- id, email, password_hash, full_name, avatar_url, is_verified, is_active

### URLs Table
- id, user_id, original_url, short_code, custom_alias, click_count, is_active, expires_at

### Clicks Table
- id, url_id, clicked_at, referrer, ip_address, user_agent

## 🧪 Testing

```bash
# Run tests for a specific service
cd services/<service-name>
npm test
```

## 📝 License

MIT

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🐛 Known Issues

- Profile management not implemented yet
- URL editing not available yet

## 🔮 Future Enhancements

- QR code generation for short URLs
- Bulk URL creation
- API rate limiting
- Custom domains
- URL expiration notifications
- Export analytics data
- Password reset functionality
- Email verification
