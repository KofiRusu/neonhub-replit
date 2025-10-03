# NeonHub - Setup Guide

## Prerequisites

- **Node.js 20+** (with npm/pnpm)
- **Docker** (for PostgreSQL)
- **Git**

## Quick Start

### 1. Database Setup

Start PostgreSQL using Docker:

```bash
# From project root
docker-compose up -d postgres

# Wait for database to be healthy (about 10 seconds)
docker-compose ps
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies (if not already done)
npm install

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed database with demo data
npm run seed

# Start development server
npm run dev
```

The backend API will be available at `http://localhost:3001`

### 3. Frontend Setup

```bash
cd Neon-v2.4.0/ui

# Install dependencies
npm install

# Start development server
npm run dev
```

The UI will be available at `http://127.0.0.1:3000`

## Environment Variables

### Backend (`backend/.env`)

```env
# Database
DATABASE_URL=postgresql://neonhub:neonhub@localhost:5432/neonhub

# Server
PORT=3001
NODE_ENV=development

# OpenAI (optional for Phase 1, required for Phase 2)
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4

# NextAuth (for Phase 1D)
NEXTAUTH_URL=http://127.0.0.1:3000
NEXTAUTH_SECRET=your-secret-here

# OAuth (optional, for Phase 1D)
GITHUB_ID=your-github-client-id
GITHUB_SECRET=your-github-client-secret

# Sentry (optional, for Phase 4)
SENTRY_DSN=https://your-sentry-dsn
```

### Frontend (`Neon-v2.4.0/ui/.env.local`)

```env
# API URL
NEXT_PUBLIC_API_URL=http://localhost:3001

# NextAuth (Phase 1D)
NEXTAUTH_URL=http://127.0.0.1:3000
NEXTAUTH_SECRET=your-secret-here

# OAuth providers (Phase 1D)
GITHUB_ID=your-github-client-id
GITHUB_SECRET=your-github-client-secret
```

## Available Endpoints

### Backend API

- `GET /health` - Health check (DB + WebSocket status)
- `POST /content/generate` - Generate content (mock in Phase 1, real AI in Phase 2)
- `GET /content/drafts` - List all content drafts (paginated)
- `GET /content/drafts/:id` - Get single draft
- `POST /metrics/events` - Track an event
- `GET /metrics/summary` - Get analytics summary
- `GET /auth/session` - Check session (mock in Phase 1)
- `GET /auth/me` - Get current user

### Test the API

```bash
# Health check
curl http://localhost:3001/health

# Get drafts (requires seed data)
curl http://localhost:3001/content/drafts

# Get metrics summary
curl http://localhost:3001/metrics/summary?range=7d

# Generate content
curl -X POST http://localhost:3001/content/generate \
  -H "Content-Type: application/json" \
  -d '{"topic":"AI Marketing","tone":"professional","audience":"Marketing professionals"}'
```

## Development Workflow

### Running Tests

```bash
cd backend
npm test
```

### Database Commands

```bash
# Create a new migration
npx prisma migrate dev --name your_migration_name

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Open Prisma Studio (database GUI)
npx prisma studio
```

### Building for Production

```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd Neon-v2.4.0/ui
npm run build
npm start
```

## Docker Compose (Full Stack)

To run the entire stack with Docker:

```bash
# Build and start all services
docker-compose up --build

# Services will be available at:
# - Frontend: http://localhost:3000
# - Backend: http://localhost:3001
# - PostgreSQL: localhost:5432
```

## Troubleshooting

### "Cannot connect to Docker daemon"
- Make sure Docker Desktop is running
- On macOS/Windows: Start Docker Desktop application
- On Linux: `sudo systemctl start docker`

### "Error: P1001: Can't reach database server"
- Ensure PostgreSQL is running: `docker-compose ps`
- Check DATABASE_URL is correct in `.env`
- Wait a few seconds for PostgreSQL to fully start

### Port already in use
- Backend (3001): `lsof -ti:3001 | xargs kill -9`
- Frontend (3000): `lsof -ti:3000 | xargs kill -9`
- PostgreSQL (5432): Stop other PostgreSQL instances or change port in docker-compose.yml

### Prisma Client not generated
```bash
cd backend
npx prisma generate
```

## Next Steps

- **Phase 1D**: Integrate NextAuth.js for authentication
- **Phase 2**: Add OpenAI integration and build ContentAgent
- **Phase 3**: Implement real-time metrics with WebSocket
- **Phase 4**: Add Sentry, rate limiting, and production hardening

## Useful Commands

```bash
# View backend logs
docker-compose logs -f backend

# View all logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes (deletes database data)
docker-compose down -v

# Rebuild containers
docker-compose up --build
```
