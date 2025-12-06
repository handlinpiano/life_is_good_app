# Task: Vimshottari Dasha Calculation

## Difficulty: Medium | Time: 45-60 minutes

## File to Edit
`backend/calculator.py`

## Background
Vimshottari Dasha is a 120-year planetary period system based on Moon's nakshatra.

## Dasha Years
```python
DASHA_YEARS = {
    'Ketu': 7, 'Venus': 20, 'Sun': 6, 'Moon': 10,
    'Mars': 7, 'Rahu': 18, 'Jupiter': 16, 'Saturn': 19, 'Mercury': 17
}
DASHA_SEQUENCE = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury']
```

## Functions to Add

### 1. Calculate Balance at Birth
```python
def calculate_dasha_balance(moon_longitude: float) -> tuple[str, float]:
    """Returns (starting_lord, years_remaining)"""
    nakshatra_idx = int(moon_longitude / (360/27))
    pos_in_nakshatra = (moon_longitude % (360/27)) / (360/27)
    # ... calculate remaining portion
```

### 2. Generate Maha Dasha Periods
```python
def calculate_maha_dasha(birth_date: datetime, moon_longitude: float) -> list[dict]:
    """Returns list of {planet, start, end, years}"""
```

### 3. API Endpoint
```python
@app.post("/api/dasha")
def get_dasha_periods(data: BirthData):
    # Return maha dashas + current period
```
