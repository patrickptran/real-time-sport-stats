# Real-Time Sport Broadcast

A real-time sport broadcast system with Express.js, TypeScript, PostgreSQL, JWT authentication, and WebSocket support.

## Tech Stack

- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: JWT
- **Real-Time**: WebSocket
- **Testing**: Jest + Supertest

## Setup

```bash
npm install
npm run dev  # Start server
npm run seed # Seed with test data
```

## Project Structure

```
src/
├── db/        # Schema & database connection
├── routes/    # API endpoints
├── middleware/ # Auth & rate limiting
├── utils/     # JWT & utilities
├── validation/ # Zod schemas
├── ws/        # WebSocket server
└── seed/      # Data seeding
```

## API Endpoints

### Matches
- `GET /matches` - List all matches
- `POST /matches` - Create match (requires auth)
- `GET /matches/:id/commentary` - Get match commentary
- `POST /matches/:id/commentary` - Add commentary (requires auth)

### Auth
- `POST /auth/signup` - Register user
- `POST /auth/login` - Login user

## Database

**Matches**: id, sport, homeTeam, awayTeam, status, startTime, endTime, homeScore, awayScore, createdAt

**Commentary**: id, matchId, minutes, sequence, period, eventType, actor, team, message, metadata, tags, createdAt

## Environment Variables

```env
DATABASE_URL=postgres://...
JWT_SECRET=your-secret-key
API_URL=http://localhost:8000
DELAY_MS=1000          # Seed delay between posts
SEED_FORCE_LIVE=true   # Force live match seeding
```

## Running Tests

```bash
npm test
npm run test:watch
```

## Real-Time Updates

WebSocket connections require a valid JWT token in the Authorization header. Connect to `ws://localhost:8000` with your token to receive live commentary updates.

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

## Testing

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

## Quick Start

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

## API Usage

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

## Available Scripts

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

## Testing Commentary Broadcasting

Test the real-time commentary broadcasting functionality:

### Automated Test
```bash
# Start the server in one terminal
npm run dev

# In another terminal, run the automated test
npm run test:commentary
```

This will automatically:
1. Login and get JWT token
2. Create a test match
3. Connect to WebSocket and subscribe to the match
4. Create commentary via API
5. Verify the commentary is broadcast to WebSocket subscribers

### Manual Testing

**Terminal 1: Start Server**
```bash
npm run dev
```

**Terminal 2: Get JWT Token**
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user","email":"test@example.com"}'
```

**Terminal 3: Connect WebSocket & Subscribe**
```bash
# Install wscat if you haven't: npm install -g wscat
wscat -c "ws://localhost:8000/ws?token=YOUR_JWT_TOKEN"
# Then type and send: {"type":"subscribe","matchId":1}
```

**Terminal 4: Create Commentary**
```bash
curl -X POST http://localhost:8000/matches/1/commentary \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "minutes": 45,
    "message": "Amazing goal!",
    "eventType": "goal",
    "actor": "Player Name",
    "team": "Team A",
    "period": "2nd half"
  }'
```

**Expected Result:** You should see the commentary broadcast in Terminal 3:
```json
{
  "type": "commentary",
  "data": {
    "id": 1,
    "matchId": 1,
    "minutes": 45,
    "message": "Amazing goal!",
    "eventType": "goal",
    "actor": "Player Name",
    "team": "Team A",
    "period": "2nd half",
    "createdAt": "2024-01-01T12:00:00.000Z"
  }
}
```

### Windows Scripts
- `test-commentary.bat` - Batch file with testing commands
- `test-commentary.ps1` - PowerShell script with colored output
- `test-commentary.js` - Node.js script that automates the entire test

## Troubleshooting

### JWT Authentication Issues
- Verify `JWT_SECRET` is set and matches between token generation/verification
- Check token expiration (currently: 1 hour)
- Ensure tokens are sent in `Authorization: Bearer <token>` header

### WebSocket Connection Issues
- WebSocket endpoint: `ws://localhost:8000/ws` (or your server URL)
- Include JWT token as query parameter: `?token=<jwt_token>`
- Or in Authorization header during initial HTTP upgrade request

**Built for learning and development purposes**