# Quick Start for Agents

## TL;DR

Vedicas is a Vedic astrology life coaching app.
- **Frontend**: React + Convex + Clerk (Vercel)
- **Backend**: FastAPI + PySwissEph (Railway) - *Calculation only*
- **Database**: Convex (realtime, auto-sync)
- **Auth**: Clerk (hosted UI)

## First Steps

1. Read [agents.md](./agents.md) for full overview
2. Check [architecture.md](./architecture.md) for deep dive

## Key Files to Know

### Frontend (life_coach_pwa/src/)
- `App.jsx` - Provider setup (Clerk → Convex → Router)
- `contexts/AuthContext.jsx` - Auth state wrapper
- `utils/api.js` - Calls to Python backend (Chart calculation)
- `pages/DashboardPage.jsx` - Main hub
- `pages/GardenPage.jsx` - Uses Convex directly
- `pages/ChatPage.jsx` - AI Guide interface

### Convex Backend (life_coach_pwa/convex/)
- `schema.ts` - Database schema
- `seeds.ts` - Habit tracking queries/mutations
- `profiles.ts` - User profile queries/mutations
- `wisdom.ts` - Wisdom notes
- `messages.ts` - Chat history
- `auth.config.ts` - Clerk integration config

### Python Backend (vedic_astrology/backend/)
- `main.py` - FastAPI routes
- `calculator.py` - Astrology math
- `interpreter.py` - AI prompts
- `models.py` - Request/response schemas

## Running Locally

### 1. Backend (Python)
Since the frontend needs the Python API for calculations, run this first.

```bash
cd vedic_astrology/backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
export DEEPSEEK_API_KEY="your-key"
uvicorn main:app --reload
# Runs on http://localhost:8000
```

### 2. Convex (Database)
Start Convex dev server to sync schema and enable realtime.

```bash
cd life_coach_pwa
npx convex dev
# Connects to your Convex project
# Pushes schema changes automatically
```

### 3. Frontend (React)
In a new terminal:

```bash
cd life_coach_pwa
npm install
npm run dev
# Runs on http://localhost:5173
```

## The Convex Way (Important!)

**DO NOT** write manual sync code. Convex handles persistence automatically.

### Reading Data
```jsx
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

function MyComponent() {
    // Auto-updates when data changes!
    const seeds = useQuery(api.seeds.list);

    // Conditional query (skip when not authenticated)
    const { isAuthenticated } = useConvexAuth();
    const profile = useQuery(api.profiles.get, isAuthenticated ? {} : "skip");
}
```

### Writing Data
```jsx
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

function MyComponent() {
    const upsertSeed = useMutation(api.seeds.upsert);

    const handleSave = async () => {
        await upsertSeed({
            localId: "123",
            title: "Meditate",
            category: "Spiritual",
            streak: 0,
            completedDates: [],
            active: true
        });
        // Data persists immediately, UI auto-updates
    };
}
```

### Creating a New Table

1. **Add to schema** (`convex/schema.ts`):
```typescript
myTable: defineTable({
  clerkId: v.string(),
  localId: v.string(),
  name: v.string(),
}).index("by_clerk_id", ["clerkId"]),
```

2. **Create mutations** (`convex/myTable.ts`):
```typescript
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    return await ctx.db
      .query("myTable")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .collect();
  },
});

export const upsert = mutation({
  args: {
    localId: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // ... upsert logic
  },
});
```

3. **Push schema**: `npx convex dev` auto-pushes changes

4. **Use in component**:
```jsx
const items = useQuery(api.myTable.list);
const upsert = useMutation(api.myTable.upsert);
```

## Common Modifications

### Add a new Python API endpoint
1. Add Pydantic model in `models.py`
2. Add route in `main.py`
3. Add function in `utils/api.js`
4. Call from component

### Change chart appearance
- North Indian style: `NorthIndianChart.jsx`
- South Indian style: `SouthIndianChart.jsx`

### Modify habit tracking
- Schema: `convex/schema.ts`
- Mutations: `convex/seeds.ts`
- UI: `GardenPage.jsx`

## Gotchas

1. **Data not persisting?** Make sure you're using `useMutation` from Convex, not Zustand actions
2. **Auth issues?** Check `CLERK_ISSUER_URL` is set in Convex dashboard
3. **CORS errors?** Update `main.py` `allow_origins` when adding new domains
4. **Railway port?** Must be 8080 in production
5. **`useQuery` returning undefined?** It loads async - use `|| []` default or loading state

## Environment Variables

### Convex Dashboard
- `CLERK_ISSUER_URL` - Your Clerk issuer URL (e.g., `https://clerk.your-app.com`)

### Frontend (.env.local)
```
VITE_CONVEX_URL=https://your-project.convex.cloud
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

### Backend (Railway)
```
DEEPSEEK_API_KEY=your-key
```

## Deployment

### Push to `master` branch:
- Vercel auto-deploys frontend
- Railway auto-deploys Python backend

### Deploy Convex:
```bash
cd life_coach_pwa
npx convex deploy
```

### Variables Required:
- **Vercel**: `VITE_CONVEX_URL`, `VITE_CLERK_PUBLISHABLE_KEY`
- **Convex**: `CLERK_ISSUER_URL` (in dashboard)
- **Railway**: `DEEPSEEK_API_KEY`
