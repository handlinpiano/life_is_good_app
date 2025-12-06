# Task: Enhanced Form Validation

## Difficulty: Easy | Time: 15-20 minutes

## File to Edit
`frontend/src/components/BirthForm.jsx`

## Validations to Add

### Date
- Not in the future
- After 1900, before 2100

### Coordinates
- Latitude: -90 to 90
- Longitude: -180 to 180

## Implementation
```javascript
const [errors, setErrors] = useState({})
const [touched, setTouched] = useState({})

const validateDate = (dateStr) => {
  const date = new Date(dateStr)
  if (date > new Date()) return 'Cannot be in future'
  if (date.getFullYear() < 1900) return 'Must be after 1900'
  return null
}
```

## Error Display
```jsx
{touched.date && errors.date && (
  <p className="text-red-600 text-sm">{errors.date}</p>
)}
```

## Styling
- Red border on invalid
- Green border on valid
- Block submit until valid
