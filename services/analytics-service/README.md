# Analytics Service

Real-time analytics microservice for URL Shortener application. Consumes click events from Kafka and provides analytics APIs.

## Overview

The Analytics Service is responsible for consuming click events from Kafka, storing them in the database, and providing analytics APIs for URL owners to view click statistics, trends, and user behavior.

## Features

- ✅ **Kafka Consumer**: Consumes click events from `click.events` topic
- ✅ **Batch Processing**: Efficiently inserts clicks in batches (100 clicks or 5 seconds)
- ✅ **Analytics API**: Provides detailed analytics for short URLs
- ✅ **Authorization**: Only URL owners can view analytics
- ✅ **Click Tracking**: Tracks IP, user-agent, referer for each click
- ✅ **Time-based Analytics**: Clicks grouped by day (last 30 days)
- ✅ **Referer Analytics**: Top referring websites/sources
- ✅ **Real-time Updates**: Click counts updated immediately after batch insert

## Tech Stack

- **Runtime**: Node.js (v20+)
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Message Queue**: Kafka (KafkaJS)
- **Authentication**: JWT (jsonwebtoken)

## Prerequisites

- Node.js v20 or higher
- PostgreSQL running on port 5450
- Kafka broker running on port 9092
- npm or yarn

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3005
NODE_ENV=development

# Database Configuration
DATABASE_URL=postgresql://admin:admin123@localhost:5450/urlshortener

# Kafka Configuration
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=analytics-service
KAFKA_GROUP_ID=analytics-group
KAFKA_TOPIC_CLICKS=click.events

# Batch Configuration
BATCH_SIZE=100
BATCH_TIMEOUT_MS=5000

# JWT Configuration
JWT_SECRET=dev-secret-key-change-in-production
```

### 3. Database Setup

Ensure the PostgreSQL database has the `clicks` table:

```sql
CREATE TABLE IF NOT EXISTS clicks (
    id SERIAL PRIMARY KEY,
    url_id INTEGER NOT NULL REFERENCES urls(id) ON DELETE CASCADE,
    short_code VARCHAR(50) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    referer TEXT,
    clicked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_clicks_url_id ON clicks(url_id);
CREATE INDEX IF NOT EXISTS idx_clicks_short_code ON clicks(short_code);
CREATE INDEX IF NOT EXISTS idx_clicks_clicked_at ON clicks(clicked_at DESC);
CREATE INDEX IF NOT EXISTS idx_clicks_url_id_clicked_at ON clicks(url_id, clicked_at DESC);
```

### 4. Run the Service

**Development Mode (with auto-reload):**
```bash
npm run dev
```

**Production Mode:**
```bash
npm run build
npm start
```

The service will:
1. Start HTTP server on `http://localhost:3005`
2. Connect to Kafka and start consuming click events
3. Process clicks in batches and store in database

## API Endpoints

### Base URL
```
http://localhost:3005
```

---

### 1. Health Check

Check if the service is running and connected to dependencies.

**Endpoint:** `GET /health`

**Request:**
```bash
curl http://localhost:3005/health
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Analytics Service is running!",
  "database": "connected",
  "timestamp": "2025-11-05T13:45:00.000Z"
}
```

---

### 2. Get Analytics for Short Code

Get detailed analytics for a specific short URL. **Requires Authentication.**

**Endpoint:** `GET /analytics/:shortCode`

**Headers:**
```
Authorization: Bearer <your_token_here>
```

**Request Example:**
```bash
curl -X GET http://localhost:3005/analytics/abc123X \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Analytics retrieved successfully",
  "data": {
    "shortCode": "abc123X",
    "totalClicks": 142,
    "clicksByDay": [
      { "date": "2025-11-05", "count": 45 },
      { "date": "2025-11-04", "count": 67 },
      { "date": "2025-11-03", "count": 30 }
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

**401 Unauthorized** - No token:
```json
{
  "success": false,
  "message": "No token provided"
}
```

**403 Forbidden** - Not the owner:
```json
{
  "success": false,
  "message": "You do not have permission to view analytics for this URL"
}
```

**404 Not Found** - Short code doesn't exist:
```json
{
  "success": false,
  "message": "Short URL not found"
}
```

---

## How It Works

### Kafka Consumer Flow

```
1. Redirect Service publishes click event to Kafka
   ↓
2. Analytics Service consumes event from 'click.events' topic
   ↓
3. Event added to in-memory batch
   ↓
4. When batch reaches 100 events OR 5 seconds elapsed:
   ↓
5. Batch is flushed to database (bulk insert)
   ↓
6. Click counts in 'urls' table are updated
   ↓
7. Batch is cleared, ready for next events
```

### Click Event Format

Events published to Kafka:

```json
{
  "shortCode": "abc123X",
  "timestamp": "2025-11-05T13:45:00.000Z",
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
  "referer": "https://twitter.com/post/12345"
}
```

### Batch Processing

**Why Batch Processing?**
- **Performance**: Single database query for 100 clicks vs 100 individual queries
- **Efficiency**: Reduces database load by ~99%
- **Scalability**: Can handle high-volume traffic

**Batch Configuration:**
- **BATCH_SIZE**: 100 clicks (configurable)
- **BATCH_TIMEOUT_MS**: 5000ms (5 seconds)
- **Logic**: Flush when either threshold is reached

**Example:**
```
Event 1-99  → Waiting in batch
Event 100   → Batch full! Flush to database
Events 1-50 → Waiting (4 seconds elapsed)
5 seconds   → Timeout! Flush to database
```

### Analytics Queries

**Total Clicks:**
- Cached in `urls.click_count` column
- Updated after each batch insert

**Clicks by Day:**
```sql
SELECT DATE(clicked_at) as date, COUNT(*) as count
FROM clicks
WHERE url_id = $1 AND clicked_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(clicked_at)
ORDER BY DATE(clicked_at) DESC
```

**Top Referers:**
```sql
SELECT referer, COUNT(*) as count
FROM clicks
WHERE url_id = $1 AND referer != ''
GROUP BY referer
ORDER BY count DESC
LIMIT 10
```

---

## Project Structure

```
analytics-service/
├── src/
│   ├── config/
│   │   ├── database.ts          # PostgreSQL connection pool
│   │   └── kafka.ts             # Kafka consumer setup
│   ├── consumers/
│   │   └── clicks.consumer.ts   # Click event consumer & batch processor
│   ├── services/
│   │   └── analytics.service.ts # Analytics business logic
│   ├── controllers/
│   │   └── analytics.controller.ts # Request handlers
│   ├── middlewares/
│   │   └── auth.middleware.ts   # JWT authentication
│   ├── routes/
│   │   └── analytics.routes.ts  # API route definitions
│   └── server.ts                # Express + Kafka consumer startup
├── .env                         # Environment variables (not in git)
├── .env.example                 # Environment template
├── .gitignore                   # Git ignore rules
├── package.json                 # Dependencies and scripts
├── tsconfig.json                # TypeScript configuration
└── README.md                    # This file
```

---

## Testing

### 1. Check Service Health

```bash
curl http://localhost:3005/health
```

### 2. Generate Click Events

Visit a short URL multiple times:
```bash
# Using the redirect service or API gateway
curl -L http://localhost:4000/abc123X
curl -L http://localhost:4000/abc123X
curl -L http://localhost:4000/abc123X
```

### 3. Watch Kafka Consumer Logs

You should see in the Analytics Service logs:
```
📊 Received click event for abc123X
📊 Received click event for abc123X
📊 Received click event for abc123X
💾 Flushing batch of 3 clicks to database
✅ Successfully inserted 3 clicks
✅ Updated click counts for 1 URLs
```

### 4. Query Analytics

```bash
# Get your token first
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' \
  | jq -r '.data.token')

# Get analytics
curl -X GET http://localhost:3005/analytics/abc123X \
  -H "Authorization: Bearer $TOKEN"
```

---

## Monitoring

### Console Logs

The service provides detailed console logging:

**Kafka Consumer:**
```
✅ Connected to Kafka (Consumer)
🎧 Subscribed to Kafka topic: click.events
🚀 Clicks consumer started
```

**Click Processing:**
```
📊 Received click event for abc123X
💾 Flushing batch of 100 clicks to database
✅ Successfully inserted 100 clicks
✅ Updated click counts for 15 URLs
```

**Errors:**
```
⚠️  URL not found for short code: invalidCode
❌ Error flushing batch to database: Connection timeout
```

### Database Monitoring

**Check total clicks:**
```sql
SELECT COUNT(*) FROM clicks;
```

**Check recent clicks:**
```sql
SELECT * FROM clicks ORDER BY clicked_at DESC LIMIT 10;
```

**Check clicks per URL:**
```sql
SELECT short_code, COUNT(*) as click_count
FROM clicks
GROUP BY short_code
ORDER BY click_count DESC;
```

---

## Performance Considerations

### Batch Processing Benefits

**Without Batching:**
- 1,000 clicks = 1,000 database INSERT queries
- High database load
- Slower processing

**With Batching (100/batch):**
- 1,000 clicks = 10 database INSERT queries
- 99% reduction in database queries
- Much faster processing

### Scalability

**Current Setup (Single Instance):**
- Can handle ~10,000-50,000 clicks/second
- Bottleneck: Database write speed

**Scaling Horizontally:**
- Deploy multiple Analytics Service instances
- Kafka automatically distributes events across consumers
- Each instance processes different partition

**Kafka Consumer Group:**
- `KAFKA_GROUP_ID`: analytics-group
- Multiple instances share same group ID
- Kafka ensures each event processed once

---

## Security Features

- **JWT Authentication**: All analytics endpoints require valid JWT tokens
- **Authorization**: Users can only view analytics for their own URLs
- **SQL Injection Prevention**: Parameterized queries throughout
- **Token Validation**: Validates token signature, expiry, and format

---

## Common Issues & Solutions

### Issue: "Kafka connection error"
**Solution:** Ensure Kafka broker is running on port 9092. Check with: `docker ps | grep kafka`

### Issue: "Database connection failed"
**Solution:** Ensure PostgreSQL is running on port 5450 and credentials are correct in `.env`

### Issue: "No click events being consumed"
**Solution:**
1. Check if Redirect Service is publishing events
2. Verify Kafka topic exists: `docker exec -it kafka-container kafka-topics.sh --list --bootstrap-server localhost:9092`
3. Check consumer group status

### Issue: Batch not flushing
**Solution:** Either wait 5 seconds or generate 100 clicks to trigger flush

---

## Environment Variables Reference

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `PORT` | Service port | `3005` | Yes |
| `NODE_ENV` | Environment | `development` | Yes |
| `DATABASE_URL` | PostgreSQL connection | `postgresql://user:pass@host:port/db` | Yes |
| `KAFKA_BROKERS` | Kafka broker addresses | `localhost:9092` | Yes |
| `KAFKA_CLIENT_ID` | Kafka client identifier | `analytics-service` | Yes |
| `KAFKA_GROUP_ID` | Consumer group ID | `analytics-group` | Yes |
| `KAFKA_TOPIC_CLICKS` | Click events topic | `click.events` | Yes |
| `BATCH_SIZE` | Max clicks per batch | `100` | Yes |
| `BATCH_TIMEOUT_MS` | Batch timeout in ms | `5000` | Yes |
| `JWT_SECRET` | JWT signing key | `your-secret-key` | Yes |

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
- `express` - Web framework for API endpoints
- `pg` - PostgreSQL client
- `kafkajs` - Kafka client for event consumption
- `jsonwebtoken` - JWT token verification
- `dotenv` - Environment variables

### Development Dependencies
- `typescript` - TypeScript compiler
- `ts-node` - TypeScript execution
- `nodemon` - Auto-reload on file changes
- `@types/*` - TypeScript type definitions

---

## Graceful Shutdown

The service handles shutdown signals gracefully:

```
1. Receive SIGINT/SIGTERM signal
   ↓
2. Stop accepting new Kafka events
   ↓
3. Flush remaining batch to database
   ↓
4. Disconnect Kafka consumer
   ↓
5. Close database connection pool
   ↓
6. Exit process
```

**Manual Shutdown:**
```bash
# Sends SIGINT
Ctrl+C
```

**Docker Shutdown:**
```bash
docker stop <container-id>
# Sends SIGTERM, allowing graceful shutdown
```

---

## Future Enhancements

- [ ] Real-time analytics via WebSocket
- [ ] Geographic analytics (country/city)
- [ ] Device/browser analytics
- [ ] Click heatmap (time of day)
- [ ] Custom date range filtering
- [ ] Export analytics to CSV/PDF
- [ ] Automated reports via email
- [ ] Bot detection and filtering
- [ ] Anomaly detection (unusual traffic spikes)
- [ ] Analytics dashboard UI

---

## Contributing

1. Follow the existing code structure
2. Write clear commit messages
3. Test Kafka consumer thoroughly before committing
4. Update README if adding new features
5. Ensure batch processing still works correctly

---

## License

ISC

---

## Support

For issues or questions, please contact the development team.

---

**Built with ❤️ for URL Shortener Platform**
