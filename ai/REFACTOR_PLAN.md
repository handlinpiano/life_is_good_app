# High-Value Refactor Plan

## Goals

1. **One write path per entity** — stop dual Zustand + Convex sync bugs
2. **Correct check-in persistence** — panchang/streak data actually survives login
3. **Reliable routing** — `requireChart` waits for Convex profile, not a one-shot store hydrate
4. **Smaller surface area** — AuthContext is auth + profile hydrate only

## Out of scope (later)

- Split `calculator.py` / extract prompts
- Delete or package `vedic_astrology/frontend`
- Full TypeScript migration
- Move AI chat into Convex actions

---

## Target data ownership

| Entity | Source of truth | Client access |
|--------|-----------------|---------------|
| seeds | Convex | `useQuery` / `useMutation` |
| wisdom | Convex | `useQuery` / `useMutation` |
| messages | Convex | `useQuery` / `useMutation` |
| check-ins | Convex | `useQuery` / `useMutation` |
| profile + chart + dasha | Convex | query continuously → optional Zustand cache |
| UI drafts / loading | local / Zustand | ephemeral |

---

## P0 — Check-ins

### Problem
Convex schema has `mood/energy/focus/...`. UI records `panchang`, `seeds_watered`, `seeds_total` only in Zustand. Cloud sync drops the real fields.

### Changes
1. Update `convex/schema.ts` checkins table to store:
   - `date`, `localId`
   - `panchang: { tithi, nakshatra, yoga, day_lord }`
   - `seedsWatered`, `seedsTotal`
   - keep legacy mood fields optional for old rows
2. Index `by_clerk_and_date` on `["clerkId", "date"]`
3. Rewrite `convex/checkins.ts`:
   - `upsertByDate` (preferred)
   - drop bulk `syncAll` (or leave unused)
4. `DailyAlignmentModal` uses Convex list + upsert; pure `calculateStreak` helper
5. Chat prompt already expects `latestCheckin.panchang` — works once data is real

---

## P0 — Convex-only for seeds / wisdom / messages

### Problem
Garden/Wisdom/Chat already write Convex, but AuthContext still bulk-loads and `syncAll`s from Zustand on save/sign-out. Race conditions and overwrites.

### Changes
1. Remove seeds/wisdom/messages/checkins from Zustand
2. Remove bulk sync mutations from AuthContext
3. Remove dead store actions (`addSeed`, `waterSeed`, etc.)
4. Leave per-entity Convex mutations as-is (already used by pages)
5. Optionally delete unused `syncAll` mutations later

---

## P1 — Profile / chart hydrate + routing

### Problem
`hasSynced` is one-shot; `ProtectedRoute` checks Zustand `chart` before Convex profile arrives → false redirect to intake.

### Changes
1. AuthContext:
   - Query `profiles.get` only
   - Continuously mirror profile → Zustand when it changes
   - Expose `profileReady` (authenticated implies profile query settled)
   - `saveProfile` = Convex `profiles.upsert` from current store (for intake)
   - Sign-out: clear store, no bulk entity sync
2. Intake: calculate chart → `profiles.upsert` with chart/dasha → navigate
3. ProtectedRoute / Landing / Auth: wait for profile query; use `profile?.chartData` or store chart

---

## P1 — Constants & dead UI

1. Move `SEED_*`, `WISDOM_*` from `store.js` → `utils/constants.js`
2. Add `newLocalId()` (UUID) helper
3. Slim `AuthGuard` SyncStatus (remove broken email/password modal; no manual bulk sync)
4. Update import sites

---

## File checklist

| File | Action |
|------|--------|
| `convex/schema.ts` | Check-in fields + date index |
| `convex/checkins.ts` | Upsert by date, list, drop syncAll |
| `src/store.js` | Profile/chart/dasha only |
| `src/contexts/AuthContext.jsx` | Slim hydrate + saveProfile |
| `src/components/ProtectedRoute.jsx` | Wait for Convex profile |
| `src/components/DailyAlignmentModal.jsx` | Convex check-ins |
| `src/pages/IntakePage.jsx` | Direct profile upsert |
| `src/pages/LandingPage.jsx` | Profile-based redirect |
| `src/pages/AuthPage.jsx` | Profile-based redirect |
| `src/pages/DashboardPage.jsx` | Import constants |
| `src/pages/ChatPage.jsx` | Import constants |
| `src/pages/GardenPage.jsx` | Import constants |
| `src/pages/WisdomPage.jsx` | Import constants |
| `src/utils/constants.js` | Seed/wisdom constants + id helper |
| `src/utils/streak.js` | Pure streak calculator |
| `src/components/AuthGuard.jsx` | Slim status badge |
| `ai/quick-start.md` / `agents.md` | Note new data rules |

---

## Verification

1. Lint / build frontend
2. Manual path: login → intake → dashboard (no bounce)
3. Daily alignment records check-in; reload history still shows panchang
4. Garden/Wisdom still CRUD via Convex
5. Chat still loads messages + seed offers

---

## Rollout notes

- Convex schema change is additive + optional legacy fields → no hard migration required
- Old check-in rows without panchang still list; UI shows blank panchang labels
- localStorage `vedicas-storage` may still hold old seeds keys; partialize only profile/chart so they fade out
