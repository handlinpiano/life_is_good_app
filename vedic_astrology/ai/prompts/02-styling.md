# Task: Styling Improvements & Dark Mode

## Difficulty: Easy | Time: 20-30 minutes

## Files to Edit
1. `frontend/tailwind.config.js`
2. `frontend/src/index.css`
3. `frontend/src/App.jsx`

## Tasks

### 1. Enable Dark Mode
```javascript
// tailwind.config.js
export default {
  darkMode: 'class',
}
```

### 2. Add Zodiac Element Colors
```javascript
zodiac: {
  fire: '#dc2626',
  earth: '#65a30d',
  air: '#0ea5e9',
  water: '#8b5cf6',
}
```

### 3. Dark Mode Toggle
Add a toggle button in App.jsx header with localStorage persistence.

### 4. Dark Mode CSS
```css
.dark body {
  @apply bg-gradient-to-br from-slate-900 to-indigo-950;
}
```
