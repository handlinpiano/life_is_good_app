# Quick Start for Agents

## TL;DR

Vedicas is a Vedic astrology life coaching app. React frontend on Vercel, FastAPI backend on Railway.

## First Steps

1. Read [agents.md](./agents.md) for full overview
2. Check [architecture.md](./architecture.md) for deep dive

## Key Files to Know

### Frontend (life_coach_pwa/src/)
- `store.js` - All app state (Zustand)
- `utils/api.js` - Backend API calls
- `utils/db.js` - Local database (Dexie)
- `pages/DashboardPage.jsx` - Main app screen
- `pages/IntakePage.jsx` - Onboarding flow

### Backend (vedic_astrology/backend/)
- `main.py` - FastAPI routes
- `calculator.py` - Astrology math
- `interpreter.py` - AI prompts
- `models.py` - Request/response schemas

## Running Locally

### Frontend
```bash
cd life_coach_pwa
npm install
npm run dev
# Runs on http://localhost:5173
```

### Backend
```bash
cd vedic_astrology/backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
export DEEPSEEK_API_KEY="your-key"
uvicorn main:app --reload
# Runs on http://localhost:8000
```

## Common Modifications

### Add a new Guru
1. Add to `GURUS` array in `DashboardPage.jsx`
2. Handle in `GuruIntakePage.jsx` switch statement
3. Update prompts in `interpreter.py`

### Add a new API endpoint
1. Add Pydantic model in `models.py`
2. Add route in `main.py`
3. Add function in `utils/api.js`
4. Call from component

### Change chart appearance
- North Indian style: `NorthIndianChart.jsx`
- South Indian style: `SouthIndianChart.jsx`

### Modify habit tracking
- Schema: `utils/db.js`
- UI: `GardenPage.jsx`

## Gotchas

1. **framer-motion** - Must import `motion` if using `motion.div`
2. **CORS** - Update `main.py` when adding new domains
3. **Railway port** - Must be 8080 (or match Railway config)
4. **API URLs** - Check `import.meta.env.PROD` switching in `api.js`

## Deployment

Push to `master` branch:
- Vercel auto-deploys frontend
- Railway auto-deploys backend

Make sure Railway has `DEEPSEEK_API_KEY` set in Variables.
