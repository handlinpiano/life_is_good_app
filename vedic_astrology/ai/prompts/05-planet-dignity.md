# Task: Add Planetary Dignity Calculations

## Difficulty: Easy | Time: 20-25 minutes

## File to Edit
`backend/calculator.py`

## Add This Data
```python
PLANET_DIGNITIES = {
    'Sun': {
        'own': ['Leo'],
        'exalted': 'Aries',
        'exalted_degree': 10,
        'debilitated': 'Libra',
        'mooltrikona': {'sign': 'Leo', 'start': 0, 'end': 20},
    },
    'Moon': {
        'own': ['Cancer'],
        'exalted': 'Taurus',
        'exalted_degree': 3,
        'debilitated': 'Scorpio',
    },
    # ... Mars, Mercury, Jupiter, Venus, Saturn
}
```

## Dignity Levels
| Dignity | Strength |
|---------|----------|
| Exalted | +5 |
| Mooltrikona | +4 |
| Own Sign | +3 |
| Friend's Sign | +2 |
| Neutral | +1 |
| Enemy's Sign | -1 |
| Debilitated | -3 |

## Function to Add
```python
def calculate_dignity(planet_name: str, sign: str, degree: float) -> dict:
    """Returns {'dignity': str, 'strength': int, 'description': str}"""
```

Include dignity in each planet's data in `calculate_chart()`.
