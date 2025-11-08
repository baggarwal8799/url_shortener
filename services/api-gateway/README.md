# API Gateway Service

API Gateway for the URL Shortener microservices application. Handles request routing, rate limiting, CORS, and authentication forwarding to downstream microservices.

## Overview

The API Gateway serves as the single entry point for all client requests in the URL Shortener platform. It routes requests to the appropriate microservices (Auth, URL Shortener, Redirect, Analytics), enforces rate limiting, and handles CORS configuration.

## Features

- ✅ **Request Routing**: Routes requests to appropriate microservices
- ✅ **Rate Limiting**: Protects services from abuse (100 requests per minute per IP)
- ✅ **CORS Support**: Configurable cross-origin resource sharing
- ✅ **Request Logging**: HTTP request logging with Morgan
- ✅ **Health Monitoring**: Health check endpoint
- ✅ **Authentication Forwarding**: Passes JWT tokens to downstream services
- ✅ **Error Handling**: Proper error forwarding from microservices
- ✅ **Short URL Redirection**: Handles `/:shortCode` catch-all route

## Tech Stack

- **Runtime**: Node.js (v20+)
- **Language**: TypeScript
- **Framework**: Express.js
- **HTTP Client**: Axios
- **Rate Limiting**: express-rate-limit
- **CORS**: cors middleware
- **Logging**: morgan

## Prerequisites

- Node.js v20 or higher
- npm or yarn
- Auth Service running on port 3001
- URL Shortener Service running on port 3002
- Redirect Service running on port 3003
- Analytics Service running on port 3005

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=4000
NODE_ENV=development

# Service URLs
AUTH_SERVICE_URL=http://localhost:3001
URL_SHORTENER_SERVICE_URL=http://localhost:3002
REDIRECT_SERVICE_URL=http://localhost:3003
ANALYTICS_SERVICE_URL=http://localhost:3005

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Run the Service

**Development Mode (with auto-reload):**
```bash
npm run dev
```

**Production Mode:**
```bash
npm run build
npm start
```

The service will start on `http://localhost:4000`

## API Endpoints

### Base URL
```
http://localhost:4000
```

---

### 1. Health Check

Check if the API Gateway is running.

**Endpoint:** `GET /health`

**Request:**
```bash
curl http://localhost:4000/health
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "API Gateway is running!",
  "timestamp": "2025-11-06T10:30:00.000Z"
}
```

---

## Authentication Routes (`/api/auth`)

All authentication routes are proxied to the Auth Service.

### 2. Register User

Register a new user account.

**Endpoint:** `POST /api/auth/register`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Test@1234",
  "fullName": "John Doe"
}
```

**Request Example:**
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Test@1234",
    "fullName": "John Doe"
  }'
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Registration successful. Please login to continue.",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "full_name": "John Doe"
    }
  }
}
```

**Error Responses:**
- `400` - Validation error (missing fields, invalid email, password too short)
- `409` - Email already registered
- `429` - Too many requests (rate limit exceeded)
- `500` - Gateway error

---

### 3. Login User

Login with email and password to receive a JWT token.

**Endpoint:** `POST /api/auth/login`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Test@1234"
}
```

**Request Example:**
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Test@1234"
  }'
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "full_name": "John Doe",
      "is_verified": false
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**
- `400` - Missing email or password
- `401` - Invalid credentials
- `403` - Account deactivated
- `429` - Too many requests (rate limit exceeded)
- `500` - Gateway error

---

### 4. Logout User

Logout user and blacklist their JWT token.

**Endpoint:** `POST /api/auth/logout`

**Headers:**
```
Authorization: Bearer <your_token_here>
```

**Request Example:**
```bash
curl -X POST http://localhost:4000/api/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

**Error Responses:**
- `401` - No token provided or invalid token
- `429` - Too many requests (rate limit exceeded)
- `500` - Gateway error

---

## URL Shortening Routes (`/api/urls`)

All URL routes are proxied to the URL Shortener Service. **Requires Authentication.**

### 5. Create Short URL

Create a new shortened URL.

**Endpoint:** `POST /api/urls`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <your_token_here>
```

**Request Body:**
```json
{
  "originalUrl": "https://www.example.com/very/long/url",
  "customAlias": "my-link",
  "expiresAt": "2025-12-31T23:59:59Z"
}
```

**Fields:**
- `originalUrl` (required): The long URL to shorten
- `customAlias` (optional): Custom short code (must be unique)
- `expiresAt` (optional): Expiration date/time

**Request Example:**
```bash
# Get token first
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Test@1234"}' \
  | jq -r '.data.token')

# Create short URL
curl -X POST http://localhost:4000/api/urls \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "originalUrl": "https://www.example.com/very/long/url",
    "customAlias": "my-link"
  }'
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "URL shortened successfully",
  "data": {
    "id": 1,
    "short_code": "my-link",
    "original_url": "https://www.example.com/very/long/url",
    "short_url": "http://localhost:4000/my-link",
    "click_count": 0,
    "expires_at": null,
    "created_at": "2025-11-06T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Invalid URL or validation error
- `401` - No token provided or invalid token
- `409` - Custom alias already taken
- `429` - Too many requests (rate limit exceeded)
- `500` - Gateway error

---

### 6. Get User's URLs

Get all URLs created by the authenticated user with pagination.

**Endpoint:** `GET /api/urls`

**Headers:**
```
Authorization: Bearer <your_token_here>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)

**Request Example:**
```bash
curl -X GET "http://localhost:4000/api/urls?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "URLs retrieved successfully",
  "data": {
    "urls": [
      {
        "id": 1,
        "short_code": "my-link",
        "original_url": "https://www.example.com/very/long/url",
        "short_url": "http://localhost:4000/my-link",
        "click_count": 42,
        "expires_at": null,
        "created_at": "2025-11-06T10:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalUrls": 1,
      "limit": 10
    }
  }
}
```

**Error Responses:**
- `401` - No token provided or invalid token
- `429` - Too many requests (rate limit exceeded)
- `500` - Gateway error

---

### 7. Delete URL

Delete a shortened URL (soft delete - marks as inactive).

**Endpoint:** `DELETE /api/urls/:shortCode`

**Headers:**
```
Authorization: Bearer <your_token_here>
```

**Path Parameters:**
- `shortCode`: The short code or custom alias of the URL to delete

**Request Example:**
```bash
curl -X DELETE http://localhost:4000/api/urls/my-link \
  -H "Authorization: Bearer $TOKEN"
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "URL deleted successfully"
}
```

**Error Responses:**
- `400` - Short code is required
- `401` - No token provided or invalid token
- `404` - URL not found or you don't have permission
- `429` - Too many requests (rate limit exceeded)
- `500` - Gateway error

---

## Analytics Routes (`/api/analytics`)

All analytics routes are proxied to the Analytics Service. **Requires Authentication.**

### 8. Get URL Analytics

Get detailed analytics for a specific short URL.

**Endpoint:** `GET /api/analytics/:shortCode`

**Headers:**
```
Authorization: Bearer <your_token_here>
```

**Request Example:**
```bash
curl -X GET http://localhost:4000/api/analytics/my-link \
  -H "Authorization: Bearer $TOKEN"
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Analytics retrieved successfully",
  "data": {
    "shortCode": "my-link",
    "totalClicks": 142,
    "clicksByDay": [
      { "date": "2025-11-06", "count": 45 },
      { "date": "2025-11-05", "count": 67 },
      { "date": "2025-11-04", "count": 30 }
    ],
    "topReferers": [
      { "referer": "https://twitter.com", "count": 52 },
      { "referer": "https://facebook.com", "count": 38 },
      { "referer": "Direct", "count": 52 }
    ]
  }
}
```

**Authorization Rules:**
- Only the URL owner can view analytics
- JWT token must be valid and not expired
- User ID from token must match URL's user_id

**Error Responses:**
- `401` - No token provided or invalid token
- `403` - Not the URL owner
- `404` - Short code not found
- `429` - Too many requests (rate limit exceeded)
- `500` - Gateway error

---

## Redirect Route

### 8. Redirect Short URL

Redirects short code to original URL. This is a catch-all route that must be defined last.

**Endpoint:** `GET /:shortCode`

**Request Example:**
```bash
curl -L http://localhost:4000/my-link
```

**Response (302 Found):**
- Redirects to the original URL
- Click event is published to Kafka for analytics

**Error Responses:**
- `404` - Short code not found
- `410` - URL has expired
- `429` - Too many requests (rate limit exceeded)
- `500` - Gateway error

**How It Works:**
1. Gateway forwards request to Redirect Service
2. Redirect Service looks up original URL in cache/database
3. Redirect Service publishes click event to Kafka
4. Gateway receives redirect response and forwards to client
5. Client is redirected to original URL

---

## Rate Limiting

The API Gateway implements rate limiting to prevent abuse:

**Configuration:**
- **Window**: 60 seconds (configurable via `RATE_LIMIT_WINDOW_MS`)
- **Max Requests**: 100 per window (configurable via `RATE_LIMIT_MAX_REQUESTS`)
- **Scope**: Per IP address
- **Applied to**: All routes (global middleware)

**Rate Limit Response (429 Too Many Requests):**
```json
{
  "success": false,
  "message": "Too many requests, please try again later."
}
```

**Response Headers:**
- `RateLimit-Limit`: Maximum requests allowed
- `RateLimit-Remaining`: Requests remaining in current window
- `RateLimit-Reset`: Time when the rate limit resets

**Example:**
```
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 1699876800
```

---

## Request Flow

### Authentication Flow
```
1. User sends request → API Gateway
   ↓
2. Rate limiting check
   ↓
3. CORS headers applied
   ↓
4. Request logged (morgan)
   ↓
5. Route matched (/api/auth/*)
   ↓
6. Forward to Auth Service (with body/headers)
   ↓
7. Auth Service processes request
   ↓
8. Response forwarded back to client
```

### URL Creation Flow
```
1. User sends POST /api/urls with JWT token → API Gateway
   ↓
2. Rate limiting check
   ↓
3. Gateway extracts Authorization header
   ↓
4. Forward to URL Shortener Service (with token)
   ↓
5. URL Shortener validates token
   ↓
6. URL created and stored in database
   ↓
7. Response with short URL forwarded to client
```

### Redirect Flow
```
1. User visits http://localhost:4000/abc123X → API Gateway
   ↓
2. Rate limiting check
   ↓
3. Gateway forwards to Redirect Service
   ↓
4. Redirect Service looks up URL in Redis/PostgreSQL
   ↓
5. Redirect Service publishes click event to Kafka
   ↓
6. Redirect Service returns 302 with Location header
   ↓
7. Gateway forwards redirect to client
   ↓
8. Client browser redirects to original URL
```

---

## Project Structure

```
api-gateway/
├── src/
│   ├── routes/
│   │   ├── auth.routes.ts         # Auth route handlers (register, login, logout)
│   │   ├── url.routes.ts          # URL route handlers (create, list)
│   │   └── analytics.routes.ts    # Analytics route handlers (get analytics)
│   └── server.ts                   # Express server + middleware setup
├── .env                            # Environment variables (not in git)
├── .env.example                    # Environment template
├── .gitignore                      # Git ignore rules
├── package.json                    # Dependencies and scripts
├── tsconfig.json                   # TypeScript configuration
└── README.md                       # This file
```

---

## Error Handling

All errors from downstream services are properly forwarded with appropriate status codes and response bodies.

**Gateway-Specific Errors:**

When the gateway itself encounters an error (e.g., downstream service is unreachable), it returns:

```json
{
  "success": false,
  "message": "Gateway error"
}
```

**Downstream Service Errors:**

Errors from downstream services are forwarded as-is, maintaining the original status code and response body.

**Error Handling Logic:**
```typescript
try {
  const response = await axios.post(SERVICE_URL, req.body);
  res.status(response.status).json(response.data);
} catch (error: any) {
  if (error.response) {
    // Forward error from service
    res.status(error.response.status).json(error.response.data);
  } else {
    // Gateway error (service unreachable, network error, etc.)
    res.status(500).json({ success: false, message: 'Gateway error' });
  }
}
```

---

## CORS Configuration

CORS is enabled for origins specified in `CORS_ORIGIN` environment variable (comma-separated list).

**Configuration:**
```typescript
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true,  // Allow cookies and authorization headers
}));
```

**Example:**
```env
CORS_ORIGIN=http://localhost:3000,http://localhost:3001,https://myapp.com
```

**Response Headers:**
```
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Credentials: true
```

---

## Request Logging

HTTP request logging is enabled via Morgan middleware in development mode.

**Log Format:**
```
GET /api/urls 200 45ms - 512 bytes
POST /api/auth/login 401 12ms - 58 bytes
GET /abc123X 302 8ms - 0 bytes
```

**Includes:**
- HTTP method
- Request path
- Status code
- Response time
- Response size

---

## Testing

### End-to-End Testing

**1. Test Health Check:**
```bash
curl http://localhost:4000/health
```

**2. Test Complete Flow:**
```bash
# Register user
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test@1234","fullName":"Test User"}'

# Login
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test@1234"}' \
  | jq -r '.data.token')

# Create short URL
curl -X POST http://localhost:4000/api/urls \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"originalUrl":"https://www.example.com"}'

# Get user's URLs
curl http://localhost:4000/api/urls \
  -H "Authorization: Bearer $TOKEN"

# Visit short URL (replace abc123X with your short code)
curl -L http://localhost:4000/abc123X

# Get analytics
curl http://localhost:4000/api/analytics/abc123X \
  -H "Authorization: Bearer $TOKEN"

# Logout
curl -X POST http://localhost:4000/api/auth/logout \
  -H "Authorization: Bearer $TOKEN"
```

**3. Test Rate Limiting:**
```bash
# Send 101 requests quickly
for i in {1..101}; do
  curl http://localhost:4000/health
done
# Should get rate limit error on request 101
```

**4. Test Error Handling:**
```bash
# Test missing token
curl -X POST http://localhost:4000/api/urls \
  -H "Content-Type: application/json" \
  -d '{"originalUrl":"https://www.example.com"}'
# Expected: 401 Unauthorized

# Test invalid short code
curl -L http://localhost:4000/invalid-code
# Expected: 404 Not Found
```

---

## Environment Variables Reference

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `PORT` | Gateway port | `4000` | Yes |
| `NODE_ENV` | Environment | `development` | Yes |
| `AUTH_SERVICE_URL` | Auth service URL | `http://localhost:3001` | Yes |
| `URL_SHORTENER_SERVICE_URL` | URL shortener service URL | `http://localhost:3002` | Yes |
| `REDIRECT_SERVICE_URL` | Redirect service URL | `http://localhost:3003` | Yes |
| `ANALYTICS_SERVICE_URL` | Analytics service URL | `http://localhost:3005` | Yes |
| `CORS_ORIGIN` | Allowed origins (comma-separated) | `http://localhost:3000` | Yes |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window in ms | `60000` | Yes |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` | Yes |

---

## NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with auto-reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Run compiled production code |

---

## Dependencies

### Production Dependencies
- `express` - Web framework
- `axios` - HTTP client for service communication
- `cors` - CORS middleware
- `morgan` - HTTP request logger
- `express-rate-limit` - Rate limiting middleware
- `dotenv` - Environment variables

### Development Dependencies
- `typescript` - TypeScript compiler
- `ts-node` - TypeScript execution
- `nodemon` - Auto-reload on file changes
- `@types/*` - TypeScript type definitions

---

## Common Issues & Solutions

### Issue: "Gateway error" responses
**Solution:**
1. Ensure all downstream services are running (Auth, URL Shortener, Redirect, Analytics)
2. Check service URLs in `.env` file
3. Verify services are accessible: `curl http://localhost:3001/health`

### Issue: Rate limit hit too quickly
**Solution:** Increase `RATE_LIMIT_MAX_REQUESTS` in `.env` or adjust `RATE_LIMIT_WINDOW_MS`

### Issue: CORS errors in browser
**Solution:** Add your frontend origin to `CORS_ORIGIN` in `.env` file

### Issue: Redirect not working
**Solution:**
1. Check if Redirect Service is running on port 3003
2. Verify short code exists: `curl http://localhost:4000/api/urls -H "Authorization: Bearer $TOKEN"`
3. Check redirect service logs

### Issue: Token not forwarded to services
**Solution:** Ensure you're sending `Authorization: Bearer <token>` header with requests

---

## Performance Considerations

### Request Forwarding
- Uses Axios for efficient HTTP communication
- Minimal processing overhead (just forwarding)
- Async/await for non-blocking I/O

### Rate Limiting
- In-memory rate limiting (no Redis required)
- Per-IP tracking
- Configurable window and max requests

### Scalability
- Stateless design (no session storage)
- Horizontally scalable (multiple instances)
- Load balancer can distribute traffic across multiple gateway instances

---

## Security Features

- **Rate Limiting**: Prevents DoS and brute force attacks
- **JWT Validation**: Tokens validated by downstream services
- **CORS**: Restricts access to allowed origins only
- **Token Forwarding**: Secure authentication propagation
- **Error Sanitization**: Gateway errors don't expose internal details

---

## Future Enhancements

- [ ] Request/response caching for GET requests
- [ ] Circuit breaker pattern for fault tolerance
- [ ] Request retry logic for failed service calls
- [ ] API versioning support (/v1/api/urls)
- [ ] Request/response transformation
- [ ] Distributed tracing (OpenTelemetry)
- [ ] Metrics and monitoring (Prometheus)
- [ ] API documentation endpoint (Swagger/OpenAPI)
- [ ] WebSocket support for real-time features
- [ ] Request batching for efficiency

---

## Contributing

1. Follow the existing code structure
2. Write clear commit messages
3. Test all routes before committing
4. Update README if adding new routes
5. Ensure error handling is consistent

---

## License

ISC

---

## Support

For issues or questions, please contact the development team.

---

**Built with ❤️ for URL Shortener Platform**
