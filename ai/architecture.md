# Vedicas Architecture Deep Dive

## System Flow

```
User (Browser)
     │
     ▼
┌─────────────────────────────────────┐
│        Vercel (Frontend)            │
│  life_coach_pwa/                    │
│  - React 19 + Vite                  │
│  - Clerk (Auth UI)                  │
│  - Convex React Hooks               │
│  - Tailwind + Framer Motion         │
└─────────────────────────────────────┘
     │                    │
     │ REST API           │ WebSocket (Realtime)
     ▼                    ▼
┌─────────────────┐  ┌───────────────────────┐
│ Railway (Calc)  │  │ Convex (Data)         │
│ vedic_astrology/│  │ - Realtime DB         │
│ - FastAPI       │  │ - Auth via Clerk JWT  │
│ - PySwissEph    │  │ - TypeScript Backend  │
│ - DeepSeek AI   │  │ - Auto-sync           │
└─────────────────┘  └───────────────────────┘
                              │
                              ▼
                     ┌───────────────────────┐
                     │ Clerk (Auth)          │
                     │ - Hosted UI           │
                     │ - JWT Tokens          │
                     │ - User Management     │
                     └───────────────────────┘
```

## Frontend Structure

### Pages

**LandingPage.jsx** (`/`)
- Public showcase
- CTA to start decoding life map
- "Sign in" access

**AuthPage.jsx** (`/auth`)
- Clerk's `<SignIn />` and `<SignUp />` components
- Redirects to Dashboard on success

**IntakePage.jsx** (`/birth-chart`)
- Protected route (requires auth)
- Birth data form with CitySearch
- Submits to Python API for calculation upon completion
- Saves profile to Convex

**DashboardPage.jsx** (`/dashboard`)
- Main application hub
- Single "Chat with Guide" entry point
- Birth chart visualization (North Indian style)
- Daily Alignment modal (Panchang)
- Collapsible chart details (Cosmic Blueprint)

**ChatPage.jsx** (`/chat`)
- Unified AI Guide interface
- Context-aware chat (Birth chart + Dasha + Panchang injected)
- Persists messages to Convex

**GardenPage.jsx** (`/garden`)
- Habit/seed management
- Uses Convex `useQuery` and `useMutation` directly

**WisdomPage.jsx** (`/wisdom`)
- User's saved notes and insights
- Convex-backed persistence

### Key Components

**NorthIndianChart.jsx**
- Diamond-style Vedic chart rendering
- Shows planets in houses
- SVG-based visualization

**DailyAlignmentModal.jsx**
- Fetches current Panchang from Python API
- Records check-in with streak to Convex

**Navbar.jsx**
- Navigation tabs (Home, Garden, Wisdom, Chat)
- Clerk's `<UserButton />` for account menu

### Data Flow: Hybrid Approach

We use two patterns depending on the data type:

**Pattern 1: Direct Convex (Seeds, Wisdom, Messages, Check-ins)**
```
User Action → useMutation() → Convex DB
                                  ↓
                            useQuery() ← Auto-updates UI
```
Components call Convex hooks directly. No manual sync code needed.

**Pattern 2: Zustand + Convex Sync (Profile, Chart, Dasha)**
```
Login → AuthContext loads from Convex → Zustand Store
                                              ↓
                                     Components read from store
                                              ↓
IntakePage → Zustand → syncToCloud() → Convex
```

**Why the hybrid?**
- **Profile/Chart** is write-once (at intake), read-many. Zustand provides instant access.
- **Chart data is large** - complex nested objects. Caching in Zustand avoids repeated queries.
- **ChatPage** needs chart context for every AI message - Zustand is faster than a query.
- **Seeds/Wisdom/Messages** change frequently - direct Convex ensures real-time sync.

**Which pattern to use:**
| Data Type | Pattern | Why |
|-----------|---------|-----|
| Seeds | Direct Convex | Frequent updates, needs real-time |
| Wisdom | Direct Convex | Frequent updates, needs real-time |
| Messages | Direct Convex | Frequent updates, needs real-time |
| Check-ins | Direct Convex | Frequent updates, needs real-time |
| Profile | Zustand + Sync | Write-once, read-many |
| Chart | Zustand + Sync | Large data, read-many |
| Dasha | Zustand + Sync | Large data, read-many |

**Example - GardenPage:**
```jsx
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

function GardenPage() {
    // Data auto-refreshes when it changes
    const seeds = useQuery(api.seeds.list);

    // Mutation persists immediately
    const upsertSeed = useMutation(api.seeds.upsert);

    const handleWater = async (seed) => {
        await upsertSeed({
            localId: seed.localId,
            title: seed.title,
            streak: seed.streak + 1,
            completedDates: [...seed.completedDates, today],
            // ... other fields
        });
        // No setState needed - useQuery auto-updates!
    };
}
```

**Conditional Queries (Skip Pattern):**
```jsx
const { isAuthenticated } = useConvexAuth();
// Skip query when not logged in
const seeds = useQuery(api.seeds.list, isAuthenticated ? {} : "skip") || [];
```

## Backend Structure

### 1. Convex (Cloud) - The "Memory"
*Stateful user data layer with realtime sync.*

**Schema (`convex/schema.ts`):**
```typescript
profiles: defineTable({
  clerkId: v.string(),
  name: v.optional(v.string()),
  birthData: v.optional(v.object({
    date: v.string(),
    time: v.string(),
    latitude: v.number(),
    longitude: v.number(),
  })),
  chartData: v.optional(v.any()),
  dashaData: v.optional(v.any()),
}).index("by_clerk_id", ["clerkId"]),

seeds: defineTable({
  clerkId: v.string(),
  localId: v.string(),
  title: v.string(),
  category: v.optional(v.string()),
  streak: v.number(),
  lastCompleted: v.optional(v.union(v.string(), v.null())),
  completedDates: v.array(v.string()),
  active: v.boolean(),
}).index("by_clerk_id", ["clerkId"]),
```

**Mutations (`convex/seeds.ts`):**
```typescript
export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    return await ctx.db
      .query("seeds")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .collect();
  },
});

export const upsert = mutation({
  args: { localId: v.string(), title: v.string(), ... },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("seeds")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .filter((q) => q.eq(q.field("localId"), args.localId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, args);
    } else {
      await ctx.db.insert("seeds", { clerkId: identity.subject, ...args });
    }
  },
});
```

### 2. Python API (Railway) - The "Brain"
*Stateless calculation engine.*

**main.py**
- `/api/chart` - Heavy astronomical calc
- `/api/interpret` - AI generation (DeepSeek)
- `/api/alignment` - Panchang calculations

**calculator.py**
- High-precision planetary positions using `pyswisseph`
- Varga charts (D1-D60)
- Vimshottari Dasha timing

**interpreter.py**
- Composes complex prompts for DeepSeek
- Injects astrological context into LLM calls

## Authentication Flow

```
1. User clicks "Sign In"
   ↓
2. Clerk hosted UI handles login
   ↓
3. Clerk issues JWT token
   ↓
4. ConvexProviderWithClerk receives token
   ↓
5. Convex validates JWT via CLERK_ISSUER_URL
   ↓
6. ctx.auth.getUserIdentity() returns user info
   ↓
7. Queries/mutations filter by identity.subject (Clerk user ID)
```

**App.jsx Setup:**
```jsx
<ClerkProvider publishableKey={CLERK_KEY}>
  <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </ConvexProviderWithClerk>
</ClerkProvider>
```

## Astrological Calculations

### Lahiri Ayanamsa
The app uses Lahiri ayanamsa (most common in India) to convert tropical to sidereal positions.

### Divisional Charts (Vargas)
- D1: Main chart (Rashi)
- D9: Navamsa (marriage, dharma)
- D10: Dasamsa (career)
- D2-D60: Various life areas

## CORS Configuration

Backend allows:
- `http://localhost:5173` (Local Dev)
- `https://www.vedicas.com` (Production)
- `https://lifecoach-*.vercel.app` (Vercel Previews)

## Error Handling

### Frontend
- **Auth Errors**: Clerk handles most auth UI/errors
- **Convex Errors**: Mutations throw, catch in components
- **Calc Errors**: Python API failures handled in `utils/api.js`

### Backend (Python)
- Pydantic validation on all inputs
- HTTPException for known errors
- Generic 500 for unexpected failures

### Backend (Convex)
- TypeScript validation via `v.` validators
- `ctx.auth.getUserIdentity()` returns null if not authed
- Throw errors for unauthorized access
