# Redirect Service

Ultra-fast redirect service built with Fastify for handling short URL redirects with Redis caching and Kafka click tracking.

## Features

- **Ultra-Fast Redirects**: Built with Fastify for maximum performance
- **Cache-First Strategy**: Checks Redis cache before database (< 10ms redirects)
- **Click Tracking**: Publishes click events to Kafka for analytics
- **Expiration Support**: Handles URL expiration dates
- **404 Handling**: Returns 404 for non-existent short codes
- **410 Handling**: Returns 410 for deactivated or expired URLs

## Prerequisites

- Node.js 16+
- npm or yarn
- PostgreSQL database with `urls` table
- Redis cache
- Kafka broker running

## Installation

```bash
npm install
```

## Environment Variables

Create a `.env` file:

```env
PORT=3003
NODE_ENV=development

# Database Configuration
DATABASE_URL=postgresql://admin:admin123@localhost:5450/urlshortener

# Redis Configuration
REDIS_URL=redis://localhost:6380

# Kafka Configuration
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=redirect-service
KAFKA_TOPIC_CLICKS=click.events

# Cache Configuration
CACHE_TTL=86400
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
  "message": "Redirect Service is running!",
  "database": "connected",
  "redis": "connected",
  "timestamp": "2025-11-04T13:40:03.000Z"
}
```

**Example:**
```bash
curl http://localhost:3003/health
```

---

### Redirect to Original URL

**GET** `/:shortCode`

Redirect to the original URL associated with the short code.

**Parameters:**
- `shortCode` (URL parameter): The short code or custom alias

**Success Response (302 Redirect):**
Redirects browser to the original URL.

**Error Responses:**
- `404` - Short URL not found
- `410` - Short URL has been deactivated or expired
- `500` - Internal server error

**Examples:**

Browser redirect:
```
http://localhost:3003/abc123X
```

With curl (follow redirects):
```bash
curl -L http://localhost:3003/abc123X
```

---

## How It Works

### Redirect Flow

1. **Receive Request**: GET /:shortCode
2. **Cache Check**: Look up short code in Redis
   - **Cache HIT**: Use cached URL (< 5ms)
   - **Cache MISS**: Query database
3. **Database Lookup**: If not in cache
   - Check `short_code` or `custom_alias` columns
   - Verify URL is active
   - Check expiration date
4. **Cache URL**: Store in Redis for future requests (24 hour TTL)
5. **Publish Event**: Send click event to Kafka (async, non-blocking)
6. **Redirect**: Send 302 redirect to original URL

### Cache Strategy

**Redis Cache:**
- **Key format**: `url:{shortCode}`
- **Value**: Original URL string
- **TTL**: 24 hours (86400 seconds)
- **Cache on**: URL creation (by URL Shortener Service) + First cache miss

**Performance:**
- **Cached redirect**: ~2-5ms
- **Database redirect**: ~20-50ms (then cached)
- **99%+ cache hit rate** expected in production

### Click Event Tracking

Each redirect publishes a click event to Kafka:

```json
{
  "shortCode": "abc123X",
  "timestamp": "2025-11-04T13:45:00.000Z",
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "referer": "https://example.com"
}
```

**Kafka Configuration:**
- **Topic**: `click.events`
- **Key**: Short code (for partitioning)
- **Publishing**: Async, non-blocking (doesn't slow down redirect)

**Note**: Analytics Service will consume these events and store them in the database.

## Error Handling

### 404 Not Found
Short code doesn't exist in database:
```json
{
  "success": false,
  "message": "Short URL not found"
}
```

### 410 Gone - Deactivated
URL has been deactivated by user:
```json
{
  "success": false,
  "message": "This short URL has been deactivated"
}
```

### 410 Gone - Expired
URL expiration date has passed:
```json
{
  "success": false,
  "message": "This short URL has expired"
}
```

### 500 Internal Server Error
Service error (database/Redis down):
```json
{
  "success": false,
  "message": "Internal server error"
}
```

## Project Structure

```
redirect-service/
├── src/
│   ├── config/
│   │   ├── database.ts       # PostgreSQL connection
│   │   ├── redis.ts          # Redis connection
│   │   └── kafka.ts          # Kafka producer
│   └── server.ts             # Main Fastify server
├── .env                      # Environment variables
├── .env.example              # Environment template
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## Performance Optimization

### Why Fastify?

Fastify is **2x faster** than Express for simple redirects:
- Low-level HTTP handling
- Optimized for JSON serialization
- Minimal middleware overhead
- Built-in schema validation

### Caching Benefits

Without Redis cache:
- Every redirect queries PostgreSQL
- ~50,000 requests/second max

With Redis cache (99% hit rate):
- Most redirects skip database
- **~200,000+ requests/second** possible
- Lower database load
- Faster response times

## Monitoring

The service uses Pino logger (Fastify's default):

**Log Levels:**
- `info`: Cache hits/misses, Kafka events
- `error`: Database errors, Kafka errors

**Example Logs:**
```
[13:45:00.123] INFO: Cache HIT for abc123X
[13:45:00.124] INFO: Published click event for abc123X
[13:45:01.456] INFO: Cache MISS for xyz789
[13:45:01.478] INFO: Cached xyz789 in Redis
```

## Graceful Shutdown

The service handles SIGINT and SIGTERM for graceful shutdown:

1. Stop accepting new requests
2. Disconnect Kafka producer
3. Close database connection pool
4. Close Redis connection
5. Exit process

## Security

- **No Authentication Required**: Redirects are public (by design)
- **Rate Limiting**: Applied at API Gateway level
- **SQL Injection Prevention**: Uses parameterized queries
- **URL Validation**: Original URLs validated before storage (by URL Shortener Service)

## Dependencies

**Production:**
- `fastify` - Web framework (ultra-fast)
- `pg` - PostgreSQL client
- `ioredis` - Redis client
- `kafkajs` - Kafka client
- `dotenv` - Environment variables

**Development:**
- `typescript` - Type safety
- `ts-node` - TypeScript execution
- `nodemon` - Auto-restart on changes

## Future Enhancements

- Bot detection (filter analytics from bots)
- GeoIP lookup for location analytics
- A/B testing support (multiple URLs per short code)
- Custom redirect rules (time-based, geo-based)
- Redirect preview page (optional safety check)
