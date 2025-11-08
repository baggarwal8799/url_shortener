# Auth Service

Authentication microservice for URL Shortener application.

## Overview

The Auth Service handles user authentication and authorization for the URL Shortener platform. It provides secure user registration, login, and logout functionality with JWT-based authentication and Redis-backed token management.

## Features

- ✅ User Registration (email + password)
- ✅ User Login (JWT token generation)
- ✅ User Logout (token blacklisting)
- ✅ Password Hashing (bcrypt)
- ✅ JWT Token Authentication
- ✅ Token Blacklisting (Redis)
- ✅ Protected Routes (middleware)
- ✅ Input Validation
- ✅ Error Handling

## Tech Stack

- **Runtime**: Node.js (v20+)
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Cache**: Redis
- **Password Hashing**: bcrypt
- **Authentication**: JWT (jsonwebtoken)
- **Redis Client**: ioredis

## Prerequisites

- Node.js v20 or higher
- PostgreSQL running on port 5450
- Redis running on port 6380
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
PORT=3001
NODE_ENV=development

# Database Configuration
DATABASE_URL=postgresql://admin:admin123@localhost:5450/urlshortener

# Redis Configuration
REDIS_URL=redis://localhost:6380

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Bcrypt Configuration
BCRYPT_ROUNDS=10
```

### 3. Database Setup

Ensure the PostgreSQL database has the `users` table:

```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
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

The service will start on `http://localhost:3001`

## API Endpoints

### Base URL
```
http://localhost:3001
```

---

### 1. Health Check

Check if the service is running and connected to dependencies.

**Endpoint:** `GET /health`

**Request:**
```bash
curl http://localhost:3001/health
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Auth service is running!",
  "database": "Connected",
  "timestamp": "2025-11-04T08:52:44.828Z"
}
```

---

### 2. Register

Register a new user account.

**Endpoint:** `POST /auth/register`

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
curl -X POST http://localhost:3001/auth/register \
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

**Validation Rules:**
- Email must be valid format
- Password must be at least 8 characters
- Full name is required

**Error Responses:**

**400 Bad Request** - Invalid input:
```json
{
  "success": false,
  "message": "Password must be at least 8 characters long"
}
```

**409 Conflict** - Email already exists:
```json
{
  "success": false,
  "message": "Email already registered"
}
```

---

### 3. Login

Login with email and password to receive a JWT token.

**Endpoint:** `POST /auth/login`

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
curl -X POST http://localhost:3001/auth/login \
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
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSIsImlhdCI6MTYyMzQ1Njc4OSwiZXhwIjoxNjI0MDYxNTg5fQ.abc123xyz"
  }
}
```

**Token Details:**
- Valid for 7 days
- Contains `userId` and `email` in payload
- Must be sent in `Authorization` header for protected routes

**Error Responses:**

**400 Bad Request** - Missing fields:
```json
{
  "success": false,
  "message": "Email and password are required"
}
```

**401 Unauthorized** - Invalid credentials:
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

**403 Forbidden** - Account deactivated:
```json
{
  "success": false,
  "message": "Account is deactivated"
}
```

---

### 4. Logout

Logout by blacklisting the current JWT token. **Requires Authentication.**

**Endpoint:** `POST /auth/logout`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <your_token_here>
```

**Request Example:**
```bash
curl -X POST http://localhost:3001/auth/logout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

**How It Works:**
1. Token is extracted from Authorization header
2. Token is added to Redis blacklist with TTL matching token expiry
3. Subsequent requests with this token will be rejected

**Error Responses:**

**401 Unauthorized** - No token provided:
```json
{
  "success": false,
  "message": "No token provided"
}
```

**401 Unauthorized** - Token already blacklisted:
```json
{
  "success": false,
  "message": "Token has been revoked"
}
```

**401 Unauthorized** - Invalid or expired token:
```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

---

## Authentication Flow

### Registration & Login Flow
```
1. User registers → POST /auth/register
   ↓
2. User receives success message (no token)
   ↓
3. User logs in → POST /auth/login
   ↓
4. User receives JWT token
   ↓
5. Frontend stores token (localStorage/cookies)
   ↓
6. User makes authenticated requests with token in Authorization header
```

### Logout Flow
```
1. User clicks logout → POST /auth/logout (with token)
   ↓
2. Backend adds token to Redis blacklist
   ↓
3. Token is invalid for future requests
   ↓
4. Frontend removes token from storage
```

### Protected Route Flow
```
1. User makes request with token → Authorization: Bearer <token>
   ↓
2. Middleware extracts token from header
   ↓
3. Check if token is blacklisted in Redis
   ↓
4. Verify JWT signature and expiry
   ↓
5. Attach user info to request object
   ↓
6. Continue to route handler
```

---

## Project Structure

```
auth-service/
├── src/
│   ├── config/
│   │   ├── database.ts          # PostgreSQL connection pool
│   │   └── redis.ts             # Redis client connection
│   ├── services/
│   │   ├── hash.service.ts      # Password hashing (bcrypt)
│   │   ├── jwt.service.ts       # JWT token generation/verification
│   │   └── auth.service.ts      # Auth business logic (register, login, logout)
│   ├── controllers/
│   │   └── auth.controller.ts   # Request handlers (register, login, logout)
│   ├── middlewares/
│   │   └── auth.middleware.ts   # Authentication middleware
│   ├── routes/
│   │   └── auth.routes.ts       # API route definitions
│   └── server.ts                # Express server setup
├── .env                         # Environment variables (not in git)
├── .env.example                 # Environment template
├── .gitignore                   # Git ignore rules
├── package.json                 # Dependencies and scripts
├── tsconfig.json                # TypeScript configuration
└── README.md                    # This file
```

---

## Testing

### Manual Testing with curl

**1. Register a new user:**
```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test@1234","fullName":"Test User"}'
```

**2. Login:**
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test@1234"}'
```

**3. Copy the token from response and logout:**
```bash
curl -X POST http://localhost:3001/auth/logout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**4. Try using the same token again (should fail):**
```bash
curl -X POST http://localhost:3001/auth/logout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Testing Different Scenarios

**Test duplicate email:**
```bash
# Register same email twice
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test@1234","fullName":"Test"}'
# Expected: 409 Conflict
```

**Test wrong password:**
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"WrongPassword"}'
# Expected: 401 Unauthorized
```

**Test short password:**
```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"new@example.com","password":"123","fullName":"Test"}'
# Expected: 400 Bad Request
```

---

## Security Features

- **Password Hashing**: Passwords are hashed using bcrypt with 10 rounds
- **JWT Authentication**: Secure token-based authentication
- **Token Blacklisting**: Logout invalidates tokens immediately
- **Input Validation**: All inputs are validated before processing
- **SQL Injection Prevention**: Parameterized queries
- **Email Lowercase**: Emails stored in lowercase for consistency
- **Account Status**: `is_active` flag for account management

---

## Common Issues & Solutions

### Issue: "Database connection failed"
**Solution:** Ensure PostgreSQL is running on port 5450 and credentials are correct in `.env`

### Issue: "Redis connection error"
**Solution:** Ensure Redis is running on port 6380. Check with: `docker ps | grep redis`

### Issue: "Token has been revoked" immediately after login
**Solution:** Make sure you're using a fresh token from the latest login

### Issue: TypeScript compilation errors
**Solution:** Run `npm install` to ensure all dependencies and types are installed

---

## Environment Variables Reference

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `PORT` | Service port | `3001` | Yes |
| `NODE_ENV` | Environment | `development` | Yes |
| `DATABASE_URL` | PostgreSQL connection | `postgresql://user:pass@host:port/db` | Yes |
| `REDIS_URL` | Redis connection | `redis://localhost:6380` | Yes |
| `JWT_SECRET` | JWT signing key | `your-secret-key` | Yes |
| `JWT_EXPIRES_IN` | Token validity | `7d` | Yes |
| `BCRYPT_ROUNDS` | Bcrypt salt rounds | `10` | Yes |

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
- `pg` - PostgreSQL client
- `ioredis` - Redis client
- `bcrypt` - Password hashing
- `jsonwebtoken` - JWT handling
- `dotenv` - Environment variables

### Development Dependencies
- `typescript` - TypeScript compiler
- `ts-node` - TypeScript execution
- `nodemon` - Auto-reload on file changes
- `@types/*` - TypeScript type definitions

---

## Future Enhancements

- [ ] Email verification with OTP
- [ ] Forgot password flow
- [ ] Refresh token mechanism
- [ ] Rate limiting per user
- [ ] Account lockout after failed attempts
- [ ] Two-factor authentication (2FA)
- [ ] Social login (Google, GitHub)
- [ ] Password strength validation
- [ ] Email notifications

---

## Contributing

1. Follow the existing code structure
2. Write clear commit messages
3. Test all endpoints before committing
4. Update README if adding new features

---

## License

ISC

---

## Support

For issues or questions, please contact the development team.

---

**Built with ❤️ for URL Shortener Platform**
