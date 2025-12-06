# Vedicas - AI Agent Guide

## Quick Overview

**Vedicas** is a Vedic astrology life coaching PWA that provides personalized spiritual guidance through AI-powered "Gurus". Users input their birth data, get their Vedic birth chart calculated, and receive daily guidance aligned with Panchang (Vedic almanac).

**Live URL**: https://www.vedicas.com

## Architecture

```
life_is_good_app/
├── life_coach_pwa/          # React frontend (Vercel)
│   ├── src/
│   │   ├── pages/           # Route pages
│   │   ├── components/      # UI components
│   │   ├── utils/           # API, DB, constants
│   │   └── store.js         # Zustand state management
│   └── package.json
│
└── vedic_astrology/
    └── backend/             # FastAPI backend (Railway)
        ├── main.py          # API endpoints
        ├── calculator.py    # Swiss Ephemeris calculations
        ├── interpreter.py   # DeepSeek AI interpretations
        └── models.py        # Pydantic schemas
```

## Tech Stack

### Frontend
- **React 19** with Vite
- **Zustand** for state (persisted to localStorage)
- **Dexie.js** (IndexedDB) for local data (seeds, logs, check-ins)
- **Tailwind CSS** + **Framer Motion**
- **Axios** for API calls
- Deployed on **Vercel**

### Backend
- **FastAPI** (Python 3.11)
- **PySwissEph** for Vedic astrology calculations
- **DeepSeek API** for AI interpretations
- Deployed on **Railway**

## Key Concepts

### The Guru System
Users select from 6 AI "Gurus", each specializing in different life areas:

| Guru ID | Name | Domain |
|---------|------|--------|
| `health_ayurveda` | Vaidya Jiva | Diet, sleep, Ayurveda |
| `health_yoga` | Yogini Shakti | Yoga, pranayama |
| `spiritual_sadhana` | Swami Prana | Meditation, sadhana |
| `spiritual_wisdom` | Acharya Satya | Philosophy, scriptures |
| `life_romance` | Devi Kama | Relationships, love |
| `life_career` | Raja Dharma | Career, purpose |

### The Garden (Habit Tracking)
- **Seeds**: Habits/practices recommended by Gurus
- **Watering**: Completing a seed for the day
- **Logs**: History of completed seeds
- **Check-ins**: Daily Panchang-aligned check-ins with streak tracking

### Vedic Astrology Data

**Birth Chart (D1)**: Main Rashi chart with:
- Planetary positions (Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu)
- Nakshatras (27 lunar mansions) with pada
- Houses (1-12) based on Ascendant
- Sidereal zodiac (Lahiri ayanamsa)

**Divisional Charts (Vargas)**: D2 through D60 for specific life areas

**Dasha System**: Vimshottari dasha periods showing planetary rulerships over time

**Panchang**: Daily cosmic weather including:
- Tithi (lunar day)
- Nakshatra (Moon's constellation)
- Yoga (Sun-Moon combination)
- Karana (half-tithi)

## API Endpoints

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

## State Management (Zustand)

```javascript
// Key store slices:
user: { name, gender, birthData, ... }
selectedGurus: ['health_ayurveda', 'spiritual_sadhana']
completedIntakes: ['health_ayurveda']
chart: { D1, D9, meta, ... }
dasha: { periods, current_period, ... }
synastry: { aspects, interpretation, ... }
```

Persisted to localStorage under key `vedicas-storage`.

## Local Database (Dexie/IndexedDB)

```javascript
// Tables:
seeds: { id, title, category, difficulty, gurus_id }
logs: { id, seed_id, date, status }
messages: { id, guru_id, role, content, timestamp }
checkins: { id, date, panchang, seeds_watered, seeds_total }
```

## Routes

| Path | Component | Purpose |
|------|-----------|---------|
| `/` | IntakePage | Initial user setup, birth data entry |
| `/dashboard` | DashboardPage | Main hub, guru selection, chart view |
| `/garden` | GardenPage | Habit tracking, seed management |
| `/intake/:guruId` | GuruIntakePage | Guru-specific onboarding questions |

## Environment Variables

### Backend (Railway)
- `DEEPSEEK_API_KEY` - Required for AI interpretations

### Frontend
- Uses `import.meta.env.PROD` to switch API URLs
- Production: `https://lifeisgoodapp-production.up.railway.app/api`
- Development: `/api` (proxied by Vite)

## Common Tasks

### Adding a New Guru
1. Add to `GURUS` array in `DashboardPage.jsx`
2. Create intake questions in `GuruIntakePage.jsx`
3. Update interpreter prompts in `interpreter.py`

### Adding a New API Endpoint
1. Add Pydantic model in `models.py`
2. Add route in `main.py`
3. Add frontend function in `utils/api.js`

### Modifying the Garden
1. Seeds schema in `utils/db.js`
2. UI in `GardenPage.jsx`

## Deployment

### Frontend (Vercel)
- Auto-deploys from `master` branch
- Root: `life_coach_pwa`

### Backend (Railway)
- Auto-deploys from `master` branch
- Root: `vedic_astrology/backend`
- Requires `DEEPSEEK_API_KEY` env var

## Debugging Tips

1. **CORS errors**: Check `allow_origins` in `main.py`
2. **502 errors**: Check Railway logs, verify port matches (8080)
3. **"motion is not defined"**: Ensure `framer-motion` import exists
4. **Chart not calculating**: Check browser console for API errors
5. **State not persisting**: Check localStorage `vedicas-storage`
