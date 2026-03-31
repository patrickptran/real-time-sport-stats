# Real-Time Sport Broadcast

A real-time sport broadcast system built with Express.js, TypeScript, and Drizzle ORM for PostgreSQL.

## Features

- RESTful API server with Express.js
- TypeScript for type safety
- PostgreSQL database with Drizzle ORM
- Real-time match tracking and commentary system
- Database migrations with Drizzle Kit

## Tech Stack

- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Migration Tool**: Drizzle Kit
- **Environment**: dotenv for configuration

## Project Structure

```
src/
├── db/
│   ├── schema.ts    # Database schema definitions
│   └── db.ts        # Database connection
├── drizzle.config.ts # Drizzle configuration
└── index.ts         # Express server setup
```

## Database Schema

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

## Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd real-time-sport-broadcast
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   - Copy `.env` file to project root
   - Set your PostgreSQL database URL:
     ```
     DATABASE_URL=postgresql://username:password@localhost:5432/database_name
     ```

4. **Database Setup**
   ```bash
   # Generate migrations
   npm run db:generate

   # Run migrations
   npm run db:migrate
   ```

5. **Build and Run**
   ```bash
   # Development
   npm run dev

   # Production build
   npm run build
   npm start
   ```

## Available Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run dev` - Run development server with ts-node
- `npm start` - Run production server
- `npm run db:generate` - Generate database migrations
- `npm run db:migrate` - Apply database migrations
- `npm run db:studio` - Open Drizzle Studio for database management

## API Endpoints

### GET /
Returns a welcome message.

**Response:**
```json
{
  "message": "Welcome to the Real-Time Sport Broadcast Server!"
}
```

## Development

The server runs on port 8000 by default. You can access it at `http://localhost:8000`.

For database management, use Drizzle Studio:
```bash
npm run db:studio
```