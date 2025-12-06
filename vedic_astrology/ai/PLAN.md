# Vedic Astrology App - Implementation Plan

## Overview
A web application for calculating Vedic (Jyotish) birth charts with accurate planetary positions using Swiss Ephemeris.

## Tech Stack
- **Backend**: FastAPI + Python + Swiss Ephemeris (pyswisseph)
- **Frontend**: Vite + React + Tailwind CSS
- **No external APIs required** - all calculations done offline

---

## Current Status: Scaffolded

### Completed
- [x] Project structure created
- [x] Backend: FastAPI app with Swiss Ephemeris calculator
- [x] Frontend: Vite + React + Tailwind setup
- [x] Basic components (BirthForm, Charts, PlanetTable)

---

## Task Breakdown

### EASY TASKS (Good for Grok/ChatGPT)

| Task | File(s) | Prompt File |
|------|---------|-------------|
| Add more cities to dropdown | `frontend/src/utils/constants.js` | `prompts/01-add-cities.md` |
| Style improvements & dark mode | CSS + config files | `prompts/02-styling.md` |
| Add zodiac sign descriptions | `frontend/src/utils/signData.js` | `prompts/03-sign-descriptions.md` |
| Add nakshatra descriptions | `frontend/src/utils/nakshatraData.js` | `prompts/04-nakshatra-data.md` |
| Planet dignity calculations | `backend/calculator.py` | `prompts/05-planet-dignity.md` |
| Input validation | `frontend/src/components/BirthForm.jsx` | `prompts/06-form-validation.md` |

### MEDIUM TASKS

| Task | File(s) | Prompt File |
|------|---------|-------------|
| City search autocomplete | New component | `prompts/07-city-search.md` |
| Vimshottari Dasha | `backend/calculator.py` | `prompts/08-dasha-calc.md` |

### COMPLEX TASKS (Keep for Claude)
- Transit analysis
- Yoga identification
- Compatibility matching

---

## Getting Started

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```
