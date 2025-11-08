# URL Shortener Service

Core service for creating and managing shortened URLs with custom aliases, caching, and analytics support.

## Features

- **URL Shortening**: Generate short codes using Base62 encoding
- **Custom Aliases**: Support for user-defined custom short codes
- **URL Validation**: Validates URLs before shortening
- **Redis Caching**: Caches URLs for fast lookups (24 hour TTL)
- **Authentication**: JWT-based user authentication
- **Pagination**: Paginated listing of user's URLs
- **Expiration Support**: Optional URL expiration dates

## Prerequisites

- Node.js 16+
- npm or yarn
- PostgreSQL database with `urls` table
- Redis cache
- Auth Service running on port 3001 (for JWT validation)

## Installation

```bash
npm install
```

## Environment Variables

Create a `.env` file:

```env
PORT=3002
NODE_ENV=development

# Database Configuration
DATABASE_URL=postgresql://admin:admin123@localhost:5450/urlshortener

# Redis Configuration
REDIS_URL=redis://localhost:6380

# JWT Configuration
JWT_SECRET=dev-secret-key-change-in-production

# URL Configuration
BASE_URL=http://localhost:4000
SHORT_CODE_LENGTH=7
```

## Running the Service

**Development mode:**
```bash
npm run dev
```

**Production build:**
```bash
npm run build
npm start
```

## API Endpoints

### Health Check

**GET** `/health`

Check service health and connectivity.

**Response:**
```json
{
  "success": true,
  "message": "URL Shortener Service is running!",
  "database": "connected",
  "redis": "connected",
  "timestamp": "2025-11-04T10:30:00.000Z"
}
```

**Example:**
```bash
curl http://localhost:3002/health
```

---

### Create Shortened URL

**POST** `/urls`

Create a new shortened URL.

**Authentication:** Required (JWT token)

**Request Body:**
```json
{
  "originalUrl": "https://www.example.com",
  "customAlias": "my-link",
  "expiresAt": "2025-12-31T23:59:59Z"
}
```

**Fields:**
- `originalUrl` (required): The long URL to shorten
- `customAlias` (optional): Custom alias (3-50 alphanumeric characters, hyphens, underscores)
- `expiresAt` (optional): ISO 8601 timestamp when URL expires

**Success Response (201):**
```json
{
  "success": true,
  "message": "URL shortened successfully",
  "data": {
    "id": 1,
    "userId": 1,
    "originalUrl": "https://www.example.com",
    "shortCode": "abc123X",
    "customAlias": "my-link",
    "shortUrl": "http://localhost:4000/abc123X",
    "clickCount": 0,
    "isActive": true,
    "expiresAt": "2025-12-31T23:59:59.000Z",
    "createdAt": "2025-11-04T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Invalid URL format or custom alias format
- `401` - Missing or invalid authentication token
- `409` - Custom alias already taken
- `500` - Server error

**Examples:**

Basic URL shortening:
```bash
curl -X POST http://localhost:3002/urls \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"originalUrl":"https://www.google.com"}'
```

With custom alias:
```bash
curl -X POST http://localhost:3002/urls \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"originalUrl":"https://www.github.com","customAlias":"my-github"}'
```

With expiration:
```bash
curl -X POST http://localhost:3002/urls \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"originalUrl":"https://www.example.com","expiresAt":"2025-12-31T23:59:59Z"}'
```

---

### Get User's URLs

**GET** `/urls`

Get all shortened URLs for the authenticated user with pagination.

**Authentication:** Required (JWT token)

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)

**Success Response (200):**
```json
{
  "success": true,
  "message": "URLs retrieved successfully",
  "data": {
    "urls": [
      {
        "id": 1,
        "userId": 1,
        "originalUrl": "https://www.example.com",
        "shortCode": "abc123X",
        "customAlias": "my-link",
        "shortUrl": "http://localhost:4000/abc123X",
        "clickCount": 42,
        "isActive": true,
        "expiresAt": null,
        "createdAt": "2025-11-04T10:30:00.000Z"
      }
    ],
    "total": 15,
    "page": 1,
    "limit": 10
  }
}
```

**Error Responses:**
- `400` - Invalid pagination parameters
- `401` - Missing or invalid authentication token
- `500` - Server error

**Examples:**

Get first page:
```bash
curl -X GET http://localhost:3002/urls \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Get specific page with limit:
```bash
curl -X GET "http://localhost:3002/urls?page=2&limit=5" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### Delete URL

**DELETE** `/urls/:shortCode`

Delete (soft delete - mark as inactive) a shortened URL.

**Authentication:** Required (JWT token)

**Path Parameters:**
- `shortCode`: The short code or custom alias of the URL to delete

**Success Response (200):**
```json
{
  "success": true,
  "message": "URL deleted successfully"
}
```

**Error Responses:**
- `400` - Short code is required
- `401` - Missing or invalid authentication token
- `404` - URL not found or you don't have permission
- `500` - Server error

**Example:**
```bash
curl -X DELETE http://localhost:3002/urls/abc123X \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Delete by custom alias:
```bash
curl -X DELETE http://localhost:3002/urls/my-github \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Project Structure

```
url-shortener-service/
├── src/
│   ├── config/
│   │   ├── database.ts          # PostgreSQL connection
│   │   └── redis.ts             # Redis connection
│   ├── controllers/
│   │   └── url.controller.ts    # Request handlers
│   ├── middlewares/
│   │   └── auth.middleware.ts   # JWT authentication
│   ├── routes/
│   │   └── url.routes.ts        # Route definitions
│   ├── services/
│   │   ├── shortcode.service.ts # Base62 encoding
│   │   └── url.service.ts       # Business logic
│   └── server.ts                # Main server file
├── .env                          # Environment variables
├── .env.example                  # Environment template
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## Base62 Encoding

The service uses Base62 encoding for generating short codes:
- **Character set**: 0-9, a-z, A-Z (62 characters)
- **Default length**: 7 characters
- **Possible combinations**: 62^7 = 3.5 trillion unique codes
- **Collision handling**: Automatic retry with new code if collision detected

## Caching Strategy

URLs are cached in Redis for optimal performance:
- **Cache key format**: `url:{shortCode}`
- **TTL**: 24 hours (86400 seconds)
- **Cache on create**: URL is cached immediately after creation
- **Cache hit**: Redirect service reads from cache first
- **Cache miss**: Falls back to database, then caches the result

## Custom Alias Rules

- **Length**: 3-50 characters
- **Allowed characters**: Alphanumeric (a-z, A-Z, 0-9), hyphens (-), underscores (_)
- **Uniqueness**: Must be unique across all URLs
- **Case sensitive**: `MyLink` and `mylink` are different aliases

## Error Handling

All errors return a consistent JSON format:

```json
{
  "success": false,
  "message": "Error description"
}
```

Common error scenarios:
- Invalid URL format
- Custom alias already taken
- Invalid custom alias format
- Missing authentication token
- Invalid or expired JWT token
- Database connection errors

## Database Schema

The service uses the `urls` table:

```sql
CREATE TABLE urls (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    original_url TEXT NOT NULL,
    short_code VARCHAR(10) UNIQUE NOT NULL,
    custom_alias VARCHAR(50) UNIQUE,
    click_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Security

- **JWT Authentication**: All endpoints require valid JWT tokens
- **User Isolation**: Users can only access their own URLs
- **URL Validation**: Validates URLs using the `validator` library
- **SQL Injection Prevention**: Uses parameterized queries
- **Rate Limiting**: Applied at API Gateway level

## Performance Considerations

- **Database Indexes**: Indexes on `short_code`, `user_id`, `custom_alias`
- **Connection Pooling**: PostgreSQL connection pool for efficiency
- **Redis Caching**: Reduces database load for frequently accessed URLs
- **Pagination**: Prevents loading large datasets

## Future Enhancements

- ~~Delete URL endpoint~~ ✅ Complete
- Update URL endpoint
- URL analytics integration
- Bulk URL creation
- QR code generation
- URL expiration cron job
- Click tracking via Kafka events
- Hard delete option for GDPR compliance
