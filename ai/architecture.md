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
│  - Zustand (localStorage persist)   │
│  - Dexie (IndexedDB)                │
└─────────────────────────────────────┘
     │
     │ HTTPS API calls
     ▼
┌─────────────────────────────────────┐
│        Railway (Backend)            │
│  vedic_astrology/backend/           │
│  - FastAPI + Uvicorn                │
│  - PySwissEph (astronomy)           │
│  - DeepSeek API (AI)                │
└─────────────────────────────────────┘
```

## Frontend Structure

### Pages

**IntakePage.jsx** (`/`)
- First-time user flow
- Collects: name, gender, relationship status, profession
- Birth data form with city search
- Calculates chart on submit, redirects to dashboard

**DashboardPage.jsx** (`/dashboard`)
- Main application hub
- Guru cards with selection state
- Birth chart visualization (North Indian style)
- Daily Alignment modal (Panchang)
- Partner synastry modal
- Collapsible chart details

**GardenPage.jsx** (`/garden`)
- Habit/seed management
- Daily watering interface
- Streak tracking
- Add/delete seeds

**GuruIntakePage.jsx** (`/intake/:guruId`)
- Guru-specific onboarding
- Dynamic questions based on guru type
- Seeds planted based on answers

### Key Components

**BirthForm.jsx**
- Date/time pickers
- CitySearch integration
- Validation and submission

**CitySearch.jsx**
- Uses `country-state-city` package
- Returns lat/lng for selected city

**NorthIndianChart.jsx**
- Diamond-style Vedic chart rendering
- Shows planets in houses
- SVG-based visualization

**DailyAlignmentModal.jsx**
- Fetches current Panchang
- Displays Tithi, Nakshatra, Yoga
- Records check-in with streak

**GuruDailyGuidance.jsx**
- AI-generated daily advice
- Based on user's chart + current Panchang

### State Flow

```
User Input → Zustand Store → API Call → Store Update → UI Re-render
                  ↓
            localStorage
            (persistence)

Seeds/Logs → Dexie (IndexedDB) → useLiveQuery → UI
```

## Backend Structure

### main.py - API Routes

```python
@app.post("/api/chart")      # Full chart + all vargas
@app.post("/api/chart/basic") # Just D1
@app.post("/api/dasha")       # Vimshottari periods
@app.post("/api/interpret")   # AI interpretation
@app.post("/api/chat")        # Follow-up conversation
@app.post("/api/synastry")    # Relationship comparison
@app.post("/api/alignment")   # Current Panchang
```

### calculator.py - Astronomical Calculations

Uses Swiss Ephemeris (pyswisseph) for:
- Sidereal planetary positions
- House cusps (Placidus)
- Nakshatra calculations
- Divisional chart (Varga) derivation
- Vimshottari Dasha periods

Key functions:
```python
calculate_chart(year, month, day, hour, minute, lat, lng)
calculate_all_vargas(chart)
calculate_dasha(...)
calculate_synastry(charts, labels)
calculate_current_alignment(...)  # Panchang
```

### interpreter.py - AI Integration

Uses DeepSeek API (OpenAI-compatible) for:
- Structured chart interpretations
- Conversational follow-ups
- Synastry analysis

Key functions:
```python
interpret_chart(chart, dasha)
interpret_chart_structured(chart, dasha)
chat_about_chart(chart, dasha, question, history)
interpret_synastry(synastry_data, charts, labels)
```

### models.py - Pydantic Schemas

Request models:
- `BirthData` - Birth information
- `ChatRequest` - Follow-up question
- `SynastryRequest` - Multiple people for comparison
- `AlignmentRequest` - Current date/location

Response models:
- `ChartResponse` - Full chart with vargas
- `PlanetPosition` - Individual planet data
- `NakshatraInfo` - Nakshatra details

## Data Persistence Strategy

### What's Stored Where

| Data | Storage | Why |
|------|---------|-----|
| User profile | Zustand → localStorage | Quick access, survives refresh |
| Birth chart | Zustand → localStorage | Expensive to recalculate |
| Guru selections | Zustand → localStorage | User preferences |
| Seeds (habits) | Dexie → IndexedDB | Structured, queryable |
| Daily logs | Dexie → IndexedDB | Growing dataset |
| Check-ins | Dexie → IndexedDB | Streak calculations |
| Messages | Dexie → IndexedDB | Guru conversation history |

### Why Two Storage Systems?

- **Zustand/localStorage**: Simple key-value, good for app state
- **Dexie/IndexedDB**: Structured queries, handles larger datasets

## Astrological Calculations

### Lahiri Ayanamsa
The app uses Lahiri ayanamsa (most common in India) to convert tropical to sidereal positions.

### Nakshatra System
27 nakshatras, each 13°20' of the zodiac:
- Pada (quarter) = 3°20'
- Each nakshatra has a ruling planet (for Dasha)

### Vimshottari Dasha
120-year cycle based on Moon's nakshatra at birth:
- Maha Dasha (major period): 6-20 years each
- Antar Dasha (sub-period): months to years
- Pratyantar Dasha (sub-sub): weeks to months

### Divisional Charts (Vargas)
- D1: Main chart (Rashi)
- D9: Navamsa (marriage, dharma)
- D10: Dasamsa (career)
- D2-D60: Various life areas

## CORS Configuration

Backend allows:
```python
allow_origins=[
    "http://localhost:5173",     # Vite dev
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "https://www.vedicas.com",   # Production
    "https://vedicas.com",
    "https://lifecoach-*.vercel.app",  # Vercel previews
]
```

## Error Handling

### Frontend
- API errors caught in store actions
- `error` state displayed in UI
- Loading states prevent double-submission

### Backend
- Pydantic validation on all inputs
- HTTPException for known errors
- Generic 500 for unexpected failures
