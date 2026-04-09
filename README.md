# Real-Time Sport Broadcast

A secure, real-time sport broadcast system built with Express.js, TypeScript, and Drizzle ORM for PostgreSQL. Features JWT authentication, WebSocket real-time updates, and comprehensive security testing.

## 🚀 Features

- **🔐 JWT Authentication** - Secure token-based authentication for API and WebSocket connections
- **🌐 Real-Time WebSocket** - Live match updates with authenticated connections
- **🛡️ Security First** - Protected endpoints, input validation, and comprehensive security tests
- **📊 RESTful API** - Full CRUD operations for matches with proper authorization
- **🗄️ PostgreSQL Database** - Robust data storage with Drizzle ORM
- **🔍 TypeScript** - Full type safety throughout the application
- **🧪 Comprehensive Testing** - 63+ security and functionality tests
- **📱 Real-Time Broadcasting** - Live match commentary and score updates

## 🛠️ Tech Stack

- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT (jsonwebtoken)
- **Real-Time**: WebSocket (ws)
- **Validation**: Zod for input validation
- **Security**: Helmet for HTTP headers, CORS protection
- **Testing**: Jest with Supertest
- **Migration**: Drizzle Kit

## 📁 Project Structure

```
src/
├── db/
│   ├── schema.ts          # Database schema definitions
│   └── db.ts              # Database connection
├── middleware/
│   ├── auth.ts            # JWT authentication middleware
│   ├── auth.test.ts       # Auth middleware tests
│   ├── rate-limit.ts      # Rate limiting middleware
│   └── rate-limit.test.ts # Rate limiting tests
├── routes/
│   ├── auth.ts            # Authentication endpoints (/auth)
│   ├── auth.test.ts       # Auth route tests
│   ├── matches.ts         # Match CRUD endpoints (/matches)
│   └── matches.test.ts    # Match endpoint tests
├── utils/
│   ├── jwt.ts             # JWT token utilities
│   ├── jwt.test.ts        # JWT utility tests
│   └── match-utils.ts     # Match status utilities
├── validation/
│   └── matches.ts         # Zod validation schemas
├── ws/
│   ├── server.ts          # WebSocket server with auth
│   └── server.test.ts     # WebSocket security tests
├── index.ts               # Express server setup
└── arcjet.ts              # Security configuration (placeholder)
```

## 🗄️ Database Schema

### Matches Table
Stores information about sport matches:

- `id`: Primary key (auto-increment)
- `sport`: Type of sport (e.g., "football", "basketball")
- `homeTeam`: Name of the home team
- `awayTeam`: Name of the away team
- `status`: Match status enum ("scheduled", "live", "finished")
- `startTime`: When the match begins
- `endTime`: When the match ends (nullable)
- `homeScore`: Current score for home team
- `awayScore`: Current score for away team
- `createdAt`: Timestamp when record was created

### Commentary Table
Stores live commentary and events during matches:

- `id`: Primary key (auto-increment)
- `matchId`: Foreign key referencing matches.id
- `minutes`: Minute of the match when event occurred
- `sequence`: Sequence number for ordering events within the same minute
- `period`: Period/half of the match (e.g., 1st half, 2nd half)
- `eventType`: Type of event (e.g., "goal", "foul", "substitution")
- `actor`: Player or entity involved in the event
- `team`: Team involved ("home" or "away")
- `message`: Human-readable commentary message
- `metadata`: JSON field for additional event data
- `tags`: Array of tags for categorization
- `createdAt`: Timestamp when commentary was created

## 🔐 Security Features

### JWT Authentication
- **Token Generation**: Secure JWT tokens with configurable expiration
- **Token Verification**: Validates token integrity and expiration
- **Protected Routes**: POST/PUT/DELETE endpoints require authentication
- **WebSocket Auth**: Real-time connections require valid JWT tokens

### Security Middleware
- **Helmet.js**: Security headers for HTTP protection
- **CORS**: Configurable cross-origin resource sharing
  - Development: Allows all origins
  - Production: Restricts to allowed origins via `ALLOWED_ORIGINS` env var
- **Rate Limiting**: Multi-tier rate limiting with different limits per endpoint type
- **Input Validation**: Zod schemas for all API inputs

### Rate Limiting
- **General API**: 100 requests per 15 minutes
- **Authentication**: 5 login attempts per 15 minutes (strict)
- **Create Operations**: 30 create/modify operations per 10 minutes
- **WebSocket**: 10 connection attempts per minute
- **Rate Limit Headers**: RFC 6585 compliant headers included in responses

### WebSocket Security
- **Connection Authentication**: JWT validation before WebSocket handshake
- **Token Sources**: Support for query parameters and Authorization headers
- **Connection Rejection**: Invalid tokens result in immediate disconnection
- **User Context**: Authenticated user info attached to WebSocket connections

## 🧪 Testing

Comprehensive test suite covering all security and functionality:

- **JWT Utilities** (16 tests): Token generation, verification, extraction
- **Auth Middleware** (14 tests): Request authentication, user attachment
- **Auth Routes** (18 tests): Login, token verification endpoints
- **WebSocket Server** (8 tests): Connection authentication, rejection
- **Rate Limiting** (15 tests): Rate limit middleware, headers, configuration
- **Match Endpoints** (7 tests): CRUD operations with authentication

**Total: 78 tests** - All passing ✅

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test suite
npm test jwt.test.ts
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd real-time-sport-broadcast
   npm install
   ```

2. **Environment Setup**
   ```bash
   # Copy environment file
   cp .env.example .env

   # Edit .env with your configuration
   nano .env
   ```

   Required environment variables:
   ```env
   # Database
   DATABASE_URL=postgresql://username:password@localhost:5432/database_name

   # JWT Security (generate a secure secret)
   JWT_SECRET=your-super-secure-secret-key-here

   # Server
   PORT=8000
   HOST=0.0.0.0

   # CORS (Production only - comma-separated list of allowed origins)
   # ALLOWED_ORIGINS=https://your-frontend.com,https://admin.your-frontend.com
   ```

3. **Database Setup**
   ```bash
   # Generate and run migrations
   npm run db:generate
   npm run db:migrate

   # (Optional) Open Drizzle Studio
   npm run db:studio
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

   Server will be available at: `http://localhost:8000`

## 📡 API Usage

### Authentication

1. **Login to get JWT token**
   ```bash
   curl -X POST http://localhost:8000/auth/login \
     -H "Content-Type: application/json" \
     -d '{"userId":"user123","email":"user@example.com"}'
   ```

   Response:
   ```json
   {
     "token": "eyJhbGciOiJIUzI1NiIs...",
     "userId": "user123",
     "email": "user@example.com"
   }
   ```

2. **Use token for authenticated requests**
   ```bash
   # Create a match (requires authentication)
   curl -X POST http://localhost:8000/matches \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "sport":"football",
       "homeTeam":"Manchester United",
       "awayTeam":"Liverpool",
       "startTime":"2026-04-10T15:00:00Z",
       "endTime":"2026-04-10T17:00:00Z"
     }'
   ```

### WebSocket Real-Time Updates

1. **Connect with authentication**
   ```javascript
   const token = "YOUR_JWT_TOKEN";
   const ws = new WebSocket(`ws://localhost:8000/ws?token=${token}`);

   ws.onmessage = (event) => {
     const data = JSON.parse(event.data);
     console.log('Live update:', data);
   };
   ```

2. **Alternative: Use Authorization header**
   ```javascript
   const ws = new WebSocket('ws://localhost:8000/ws', {
     headers: {
       'Authorization': `Bearer ${token}`
     }
   });
   ```

### Rate Limiting

The API implements multi-tier rate limiting to prevent abuse:

| Endpoint Type | Limit | Window | Headers |
|---------------|-------|--------|---------|
| **General API** | 100 requests | 15 minutes | `RateLimit-*` |
| **Authentication** | 5 attempts | 15 minutes | `RateLimit-*` |
| **Create Operations** | 30 operations | 10 minutes | `RateLimit-*` |
| **WebSocket** | 10 connections | 1 minute | `RateLimit-*` |

**Rate Limit Headers:**
```http
RateLimit-Limit: 100
RateLimit-Remaining: 99
RateLimit-Reset: 1640995200
```

**Rate Limited Response:**
```json
{
  "error": "Too many requests from this IP, please try again later.",
  "retryAfter": "15 minutes"
}
```

**Note:** Authentication endpoints have stricter limits to prevent brute force attacks. Successful login attempts don't count against the limit.

## 📋 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Compile TypeScript to JavaScript |
| `npm run dev` | Run development server with hot reload |
| `npm start` | Run production server |
| `npm test` | Run all tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run db:generate` | Generate database migrations |
| `npm run db:migrate` | Apply database migrations |
| `npm run db:studio` | Open Drizzle Studio for database management |

## 🐛 Troubleshooting

### CORS Issues
If you're experiencing CORS errors when connecting from a frontend application:

**Development:**
- CORS is automatically configured to allow all origins in development mode
- Make sure your frontend is running on a different port than the API server

**Production:**
- Set the `ALLOWED_ORIGINS` environment variable with comma-separated URLs
- Example: `ALLOWED_ORIGINS=https://your-frontend.com,https://admin.your-frontend.com`
- Restart the server after changing environment variables

**Common CORS Errors:**
- `Access-Control-Allow-Origin header missing` - CORS middleware not configured
- `CORS policy blocked` - Origin not in allowed list (production)
- WebSocket CORS issues - Usually resolved by the HTTP CORS configuration

### Database Connection Issues
- Verify `DATABASE_URL` is correctly set in `.env`
- Ensure PostgreSQL server is running and accessible
- Check database credentials and SSL requirements

### JWT Authentication Issues
- Verify `JWT_SECRET` is set and matches between token generation/verification
- Check token expiration (currently: 1 hour)
- Ensure tokens are sent in `Authorization: Bearer <token>` header

### WebSocket Connection Issues
- WebSocket endpoint: `ws://localhost:8000/ws` (or your server URL)
- Include JWT token as query parameter: `?token=<jwt_token>`
- Or in Authorization header during initial HTTP upgrade request

**Built with ❤️ for learning and development**