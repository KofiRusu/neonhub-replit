# NeonHub - Developer Quick Start

## 🚀 Get Running in 5 Minutes

### 1. Start Database
```bash
docker-compose up -d postgres
```

### 2. Setup Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run seed
npm run dev  # API on :3001
```

### 3. Start Frontend
```bash
cd Neon-v2.4.0/ui
npm run dev  # UI on :3000
```

## ✅ Verify It Works

```bash
# Health check (should return {"status":"ok"})
curl http://localhost:3001/health

# List content drafts
curl http://localhost:3001/content/drafts

# Open browser
open http://127.0.0.1:3000
```

## 📁 Project Structure

```
NeonHub/
├── backend/                  # Express + TypeScript API
│   ├── src/
│   │   ├── server.ts        # Main app entry
│   │   ├── routes/          # API endpoints
│   │   ├── db/              # Prisma client
│   │   ├── ws/              # WebSocket (Socket.IO)
│   │   └── types/           # Zod schemas
│   └── prisma/
│       ├── schema.prisma    # Database schema
│       └── seed.ts          # Demo data
│
├── Neon-v2.4.0/ui/          # Next.js 15 frontend
│   └── src/
│       ├── app/             # Pages (App Router)
│       ├── components/      # React components
│       └── lib/             # API client
│
├── docker-compose.yml       # Full stack orchestration
└── SETUP.md                 # Detailed setup guide
```

## 🔑 Environment Files

### backend/.env
```bash
DATABASE_URL=postgresql://neonhub:neonhub@localhost:5432/neonhub
PORT=3001
NODE_ENV=development
NEXTAUTH_URL=http://127.0.0.1:3000
```

### Neon-v2.4.0/ui/.env.local
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXTAUTH_URL=http://127.0.0.1:3000
```

## 🧪 Development Commands

```bash
# Backend
cd backend
npm run dev          # Start dev server
npm run build        # Compile TypeScript
npm test             # Run Jest tests
npm run seed         # Reset & seed DB
npx prisma studio    # Open DB GUI

# Frontend
cd Neon-v2.4.0/ui
npm run dev          # Start Next.js dev
npm run build        # Build for production
npm run lint         # Run ESLint
```

## 🐛 Troubleshooting

**"Can't connect to database"**
```bash
docker-compose ps  # Check if postgres is running
docker-compose up -d postgres
```

**"Prisma Client not generated"**
```bash
cd backend && npx prisma generate
```

**"Port 3001 already in use"**
```bash
lsof -ti:3001 | xargs kill -9
```

## 🎯 Current Phase: Foundation Complete ✅

**What works:**
- ✅ Database with migrations
- ✅ REST API with 9 endpoints
- ✅ WebSocket real-time support
- ✅ Health monitoring
- ✅ Content draft management
- ✅ Analytics tracking
- ✅ Mock content generation

**Next to build:**
- [ ] NextAuth authentication (Phase 1D)
- [ ] OpenAI integration (Phase 2)
- [ ] Real AI agents (Phase 2)
- [ ] Live metrics dashboard (Phase 3)
- [ ] Production deployment (Phase 4)

## 📚 Key Files to Read

1. `backend/src/server.ts` - API entry point
2. `backend/prisma/schema.prisma` - Database schema
3. `backend/src/routes/content.ts` - Content API
4. `Neon-v2.4.0/ui/src/app/dashboard/page.tsx` - Dashboard UI

## 🔗 Useful Links

- API Health: http://localhost:3001/health
- API Docs: See `SETUP.md` for endpoint list
- Prisma Studio: Run `npx prisma studio` in backend/
- Frontend: http://127.0.0.1:3000

## 💡 Pro Tips

1. **Use Prisma Studio** to inspect database while developing
2. **Check backend logs** in terminal for API debugging
3. **Hot reload works** on both frontend and backend
4. **Seed often** with `npm run seed` to reset test data
5. **Health check first** before debugging other issues

## 🆘 Need Help?

1. Check `SETUP.md` for detailed instructions
2. Check `PHASE1_COMPLETE.md` for architecture details
3. Check `STATUS.md` for current progress
4. Open issue on GitHub

---

**Happy Coding! 🎉**
