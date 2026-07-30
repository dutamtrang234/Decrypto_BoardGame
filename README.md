# Decrypto - Online Multiplayer Board Game

A real-time multiplayer implementation of the board game **Decrypto**, built with React, Socket.IO, Express, and PostgreSQL.

Players create encrypted clues for their teammates while the opposing team tries to intercept and decode them. Two teams compete in a battle of wits and wordplay.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, TailwindCSS |
| Backend | Node.js, Express, Socket.IO |
| Database | PostgreSQL 16, Prisma ORM |
| Realtime | Socket.IO (WebSocket) |
| Containerization | Docker, Docker Compose |

## Architecture

```
decrypto/
├── backend/           # Express + Socket.IO server
│   ├── src/
│   │   ├── game/      # Game engine (pure logic)
│   │   ├── socket/    # Socket.IO event handlers
│   │   └── routes/    # REST endpoints (health)
│   └── prisma/        # Database schema + migrations
├── frontend/          # React SPA
│   └── src/
│       ├── components/ # UI components
│       ├── context/    # Socket context provider
│       ├── hooks/      # React hooks
│       ├── pages/      # Route pages
│       └── types/      # Shared TypeScript types
└── docker-compose.yml  # One-command startup
```

### Data Flow

```
Client Action → Socket Event → Server Validation → Game Engine → State Update → Broadcast → All Clients Render
```

The server is the single source of truth. Clients never modify state locally.

## Quick Start

### Prerequisites

- Docker and Docker Compose (v2+)
- Node.js 20+ (for local development)

### One-Command Start

```bash
docker compose up --build
```

This starts:
- PostgreSQL on port 5432
- Backend (Express + Socket.IO) on port 4000
- Frontend (Vite dev server) on port 5173

Open **http://localhost:5173** in your browser.

### Local Development (without Docker)

**1. Start PostgreSQL**

```bash
docker run -d --name decrypto-db \
  -e POSTGRES_USER=decrypto \
  -e POSTGRES_PASSWORD=decrypto \
  -e POSTGRES_DB=decrypto \
  -p 5432:5432 \
  postgres:16-alpine
```

**2. Backend**

```bash
cd backend
cp .env.example .env
npm install
npx prisma generate
npx prisma db push
npm run dev
```

**3. Frontend**

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://decrypto:decrypto@localhost:5432/decrypto` | PostgreSQL connection string |
| `PORT` | `4000` | Server port |
| `FRONTEND_URL` | `http://localhost:5173` | CORS origin |
| `NODE_ENV` | `development` | Environment mode |

### Frontend (`frontend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:4000` | Backend API URL |
| `VITE_SOCKET_URL` | `http://localhost:4000` | WebSocket URL |

## Game Rules

### Overview
Decrypto is a team game where each team has 4 secret words. Each round, one player from each team (the Code Master) gives a clue that relates to 3 of their 4 secret words. Their teammates must guess which words the clue refers to, while the opposing team tries to intercept.

### Setup
- Two teams: **Blue** and **Red**
- 2-4 players per team (4-8 total)
- Each team gets 4 secret keyword cards
- One player per team is the Code Master each round

### Round Phases

1. **Clue Phase** (120s)
   - Both Code Masters secretly enter a clue relating to 3 of their 4 words
   - Clue can be text, numbers, emoji, etc. (any language)

2. **Guess Phase** (90s)
   - Each team discusses and guesses which 3 words their Code Master intended

3. **Interception Phase** (90s)
   - Each team tries to guess which 3 words the opposing Code Master intended

4. **Resolution**
   - All clues and guesses are revealed
   - Scoring is calculated

### Scoring

| Event | Result |
|-------|--------|
| Team guesses correctly | No penalty |
| Team guesses incorrectly | +1 miscommunication token |
| Opponent intercepts correctly | -1 interception token |
| Opponent intercepts incorrectly | No penalty |

### Winning

A team loses if:
- They accumulate **2 miscommunication tokens** (their team failed to guess twice)
- They lose all **4 interception tokens** (opponents intercepted successfully)

## Socket Events

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `room:create` | `{ nickname }` | Create a new room |
| `room:join` | `{ roomCode, nickname }` | Join an existing room |
| `room:leave` | `{}` | Leave current room |
| `player:reconnect` | `{ userId, roomCode }` | Reconnect to room |
| `player:ready` | `{ isReady }` | Toggle ready state |
| `player:team` | `{ team }` | Change team |
| `player:seat` | `{ seatIndex }` | Change seat |
| `player:rename` | `{ nickname }` | Change nickname |
| `game:start` | `{}` | Start the game (host only) |
| `game:submit-clue` | `{ clue, indices }` | Submit clue (Code Master) |
| `game:submit-guess` | `{ indices }` | Submit guess |
| `game:submit-interception` | `{ indices }` | Submit interception |
| `game:advance` | `{}` | Advance past resolution (host) |
| `chat:message` | `{ content, target }` | Send chat message |
| `chat:typing` | `{ isTyping }` | Typing indicator |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `room:created` | `RoomData` | Room successfully created |
| `room:joined` | `RoomData` | Joined a room |
| `room:updated` | `RoomData` | Room state changed |
| `player:joined` | `{ player, players }` | New player joined |
| `player:left` | `{ playerId, players }` | Player left |
| `player:disconnected` | `{ playerId, players }` | Player disconnected |
| `player:reconnected` | `{ playerId, players }` | Player reconnected |
| `player:moved` | `{ playerId, players }` | Player moved seats |
| `player:team-changed` | `{ playerId, players }` | Player changed team |
| `player:ready-changed` | `{ playerId, isReady, players }` | Ready state changed |
| `host:changed` | `{ newHostId, players }` | Host migrated |
| `game:started` | `GameState` | Game started |
| `game:state-update` | `GameState` | Game state updated |
| `round:finished` | `{ round, record, gameState }` | Round completed |
| `game:finished` | `{ winner, winReason, gameState }` | Game over |
| `chat:message` | `ChatMessage` | New chat message |
| `chat:typing` | `{ playerId, nickname, isTyping }` | Typing indicator |
| `room:deleted` | `{}` | Room was deleted |
| `error` | `{ message }` | Error notification |

## Host Migration

If the host disconnects or leaves:
1. A random remaining player is immediately assigned as the new host
2. `HOST_CHANGED` event is broadcast to all players
3. If all players leave, the room is deleted

## Reconnection

Players who disconnect have **60 seconds** to reconnect:
1. Store `decrypto_userId` in localStorage
2. On reconnect, emit `player:reconnect` with userId and roomCode
3. Server restores seat, team, nickname, and game state
4. After 60 seconds, the player is removed from the room

## Running Tests

### Backend Tests

```bash
cd backend
npm test
```

Tests cover:
- Game engine logic (clue submission, guessing, interception, scoring)
- Room code generation
- Word selection
- Timeout handling
- Win condition detection

## Production Deployment

### Build for Production

```bash
# Build backend
cd backend && npm run build

# Build frontend
cd frontend && npm run build
```

### Docker Production Build

```bash
NODE_ENV=production docker compose up --build
```

The production Dockerfile uses `serve` to serve the built frontend static files.

### Environment Variables for Production

Set the following environment variables in your deployment environment:

```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:5432/decrypto
FRONTEND_URL=https://your-domain.com
PORT=4000
VITE_API_URL=https://your-domain.com
VITE_SOCKET_URL=https://your-domain.com
```

## Project Structure

```
decrypto/
├── docker-compose.yml
├── .env.example
├── .gitignore
├── README.md
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   ├── prisma/
│   │   └── schema.prisma
│   └── src/
│       ├── index.ts              # Entry point
│       ├── config.ts             # Configuration
│       ├── db.ts                 # Prisma client
│       ├── game/
│       │   ├── types.ts          # Type definitions
│       │   ├── GameEngine.ts     # Game logic
│       │   └── words.ts          # Word list + utilities
│       ├── socket/
│       │   ├── index.ts          # Socket.IO server setup
│       │   ├── middleware.ts      # Socket middleware
│       │   └── handlers/
│       │       ├── roomHandlers.ts
│       │       ├── gameHandlers.ts
│       │       ├── chatHandlers.ts
│       │       └── connectionHandlers.ts
│       └── routes/
│           └── health.ts
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── index.css
│       ├── types/
│       ├── context/
│       │   └── SocketContext.tsx
│       ├── hooks/
│       │   ├── useSocket.ts
│       │   ├── useRoom.ts
│       │   └── useGame.ts
│       ├── lib/
│       │   └── api.ts
│       ├── pages/
│       │   ├── Home.tsx
│       │   └── Room.tsx
│       └── components/
│           ├── Layout.tsx
│           ├── Layout/
│           ├── Lobby/
│           ├── Game/
│           ├── Chat/
│           └── common/
└── tests/
```

## License

MIT
