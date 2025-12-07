# Vedicas - AI Agent Guide

## Quick Overview

**Vedicas** is a Vedic astrology life coaching PWA that provides personalized spiritual guidance through a unified AI "Guide". Users input their birth data, get their Vedic birth chart calculated, and receive daily guidance aligned with Panchang (Vedic almanac).

**Live URL**: https://www.vedicas.com

## Architecture

```
life_is_good_app/
├── life_coach_pwa/          # React frontend (Vercel)
│   ├── src/
│   │   ├── pages/           # Route pages
│   │   ├── components/      # UI components
│   │   ├── contexts/        # AuthContext (Clerk + Convex)
│   │   ├── utils/           # API (Python backend)
│   │   └── store.js         # Zustand (local/offline state)
│   ├── convex/              # Convex backend (serverless)
│   │   ├── schema.ts        # Database schema
│   │   ├── profiles.ts      # User profile mutations
│   │   ├── seeds.ts         # Habit tracking mutations
│   │   ├── wisdom.ts        # Wisdom notes mutations
│   │   ├── messages.ts      # Chat history mutations
│   │   └── checkins.ts      # Daily check-in mutations
│   └── package.json
│
└── vedic_astrology/
    └── backend/             # FastAPI backend (Railway)
        ├── main.py          # API endpoints for heavy calc/AI
        ├── calculator.py    # Swiss Ephemeris calculations
        ├── interpreter.py   # DeepSeek AI interpretations
        └── models.py        # Pydantic schemas
```

## Tech Stack

### Frontend
- **React 19** with Vite
- **Clerk** for authentication (hosted UI)
- **Convex** for realtime database + backend functions
- **Zustand** for local/offline state (persisted to localStorage)
- **Tailwind CSS** + **Framer Motion**
- **Axios** for Python Backend API calls
- Deployed on **Vercel**

### Backend Services
1. **Convex (Cloud)** - The "Memory"
   - Realtime database with automatic sync
   - TypeScript serverless functions (mutations/queries)
   - Integrated with Clerk for auth
   - *No manual sync code needed - data updates automatically*

2. **Python API (Railway)** - The "Brain"
   - **FastAPI** (Python 3.11)
   - **PySwissEph** for Vedic astrology calculations
   - **DeepSeek API** for AI interpretations
   - *Stateless computations only*

## Key Concepts

### Convex Data Flow (The Special Method)

Convex eliminates traditional sync code. Components use hooks directly:

```jsx
// Reading data - auto-updates when data changes!
const seeds = useQuery(api.seeds.list);

// Writing data - no sync needed, persists immediately
const upsertSeed = useMutation(api.seeds.upsert);
await upsertSeed({ localId: "123", title: "Meditate", ... });
```

**Key patterns:**
- `useQuery()` - Reactive reads, auto-updates UI when data changes
- `useMutation()` - Writes to database, triggers query updates
- `"skip"` - Conditionally skip queries when not authenticated:
  ```jsx
  const seeds = useQuery(api.seeds.list, isAuthenticated ? {} : "skip");
  ```

### The Guide
A single AI companion that interprets your chart and offers guidance across all life areas (Health, Career, Spirituality, Relationships).

### The Garden (Habit Tracking)
- **Seeds**: Habits/practices recommended by the Guide
- **Watering**: Completing a seed for the day
- **Check-ins**: Daily Panchang-aligned check-ins with streak tracking

### Vedic Astrology Data

**Birth Chart (D1)**: Main Rashi chart with:
- Planetary positions (Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu)
- Nakshatras (27 lunar mansions) with pada
- Houses (1-12) based on Ascendant
- Sidereal zodiac (Lahiri ayanamsa)

**Divisional Charts (Vargas)**: D2 through D60 for specific life areas

**Dasha System**: Vimshottari dasha periods showing planetary rulerships over time

**Panchang**: Daily cosmic weather (Tithi, Nakshatra, Yoga, Karana)

## API Endpoints (Python Backend)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/chart` | POST | Calculate full birth chart with vargas |
| `/api/chart/basic` | POST | Lightweight chart (no vargas) |
| `/api/dasha` | POST | Vimshottari dasha periods |
| `/api/interpret` | POST | AI interpretation of chart |
| `/api/chat` | POST | Follow-up conversation about chart |
| `/api/synastry` | POST | Relationship compatibility (2-4 people) |
| `/api/alignment` | POST | Current Panchang for location |

### Request Format (BirthData)
```json
{
  "year": 1990,
  "month": 5,
  "day": 15,
  "hour": 10,
  "minute": 30,
  "latitude": 28.6139,
  "longitude": 77.2090
}
```

## Convex Schema

```typescript
// convex/schema.ts
profiles: defineTable({
  clerkId: v.string(),
  name: v.optional(v.string()),
  gender: v.optional(v.string()),
  profession: v.optional(v.string()),
  relationshipStatus: v.optional(v.string()),
  birthPlace: v.optional(v.string()),
  birthData: v.optional(v.object({ ... })),
  chartData: v.optional(v.any()),
  dashaData: v.optional(v.any()),
}).index("by_clerk_id", ["clerkId"]),

seeds: defineTable({
  clerkId: v.string(),
  localId: v.string(),
  title: v.string(),
  category: v.optional(v.string()),
  streak: v.number(),
  completedDates: v.array(v.string()),
  active: v.boolean(),
}).index("by_clerk_id", ["clerkId"]),

wisdom: defineTable({ ... }).index("by_clerk_id", ["clerkId"]),
messages: defineTable({ ... }).index("by_clerk_id", ["clerkId"]),
checkins: defineTable({ ... }).index("by_clerk_id", ["clerkId"]),
```

## Routes

| Path | Component | Purpose |
|------|-----------|---------|
| `/` | LandingPage | Public landing |
| `/auth` | AuthPage | Login/Signup via Clerk |
| `/birth-chart` | IntakePage | Birth data entry (requires auth) |
| `/dashboard` | DashboardPage | Main hub, chart view (requires chart) |
| `/garden` | GardenPage | Habit tracking |
| `/wisdom` | WisdomPage | Saved insights |
| `/chat` | ChatPage | AI Guide conversation |

## Environment Variables

### Convex
- `CLERK_ISSUER_URL` - Set in Convex dashboard for auth integration

### Frontend (Vercel/Local)
- `VITE_CONVEX_URL` - Your Convex deployment URL
- `VITE_CLERK_PUBLISHABLE_KEY` - Clerk frontend key

### Backend (Railway)
- `DEEPSEEK_API_KEY` - Required for AI interpretations

## Common Tasks

### Adding a New Convex Table
1. Add table definition in `convex/schema.ts`
2. Create mutations/queries in `convex/tablename.ts`
3. Run `npx convex dev` to push schema
4. Use `useQuery`/`useMutation` in components

### Adding a New API Endpoint (Python)
1. Add Pydantic model in `models.py`
2. Add route in `main.py`
3. Add frontend function in `utils/api.js`

### Modifying the Garden
1. Update schema in `convex/schema.ts`
2. Update mutations in `convex/seeds.ts`
3. UI changes in `GardenPage.jsx` (uses `useQuery`/`useMutation` directly)

## Deployment

### Frontend (Vercel)
- Auto-deploys from `master` branch
- Root: `life_coach_pwa`
- Requires Clerk + Convex env vars

### Convex
- Run `npx convex deploy` to push to production
- Dashboard: https://dashboard.convex.dev

### Backend (Railway)
- Auto-deploys from `master` branch
- Root: `vedic_astrology/backend`
- Requires `DEEPSEEK_API_KEY`

## Debugging Tips

1. **CORS errors**: Check `allow_origins` in `main.py`
2. **Convex auth issues**: Verify `CLERK_ISSUER_URL` in Convex dashboard
3. **Data not persisting**: Make sure you're using `useMutation` not Zustand for writes
4. **Chart not calculating**: Check browser console for API errors to Python backend
5. **Clerk login issues**: Check `VITE_CLERK_PUBLISHABLE_KEY` is set
