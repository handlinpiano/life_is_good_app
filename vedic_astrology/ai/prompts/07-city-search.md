# Task: City Search with Autocomplete

## Difficulty: Medium | Time: 45-60 minutes

## Files to Create
1. `frontend/src/components/CitySearch.jsx`
2. `frontend/src/data/cities.json`

## Approach
Use a local JSON database of cities (GeoNames cities15000 dataset).

## Component Features
- Debounced search input
- Keyboard navigation (arrows, enter, escape)
- Population-weighted results
- Limit to 10 results

## Basic Structure
```jsx
export default function CitySearch({ onSelect }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [isOpen, setIsOpen] = useState(false)

  const filteredCities = useMemo(() => {
    if (query.length < 2) return []
    return cities
      .filter(c => c.name.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => b.population - a.population)
      .slice(0, 10)
  }, [query])

  // ... render dropdown
}
```

## Cities JSON Format
```json
[
  {"name": "Mumbai", "country": "India", "lat": 19.076, "lng": 72.877, "population": 12442373}
]
```
