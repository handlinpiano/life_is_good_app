# Task: Add Nakshatra Descriptions

## Difficulty: Easy | Time: 30-40 minutes

## File to Create
`frontend/src/utils/nakshatraData.js`

## Structure
```javascript
export const NAKSHATRA_DATA = {
  Ashwini: {
    number: 1,
    sanskrit: 'अश्विनी',
    span: { start: 0, end: 13.333 },
    sign: 'Aries',
    ruler: 'Ketu',
    deity: 'Ashwini Kumaras',
    symbol: 'Horse head',
    gana: 'Deva',
    sounds: ['Chu', 'Che', 'Cho', 'La'],
    description: '...',
  },
  // ... all 27 nakshatras
}

export const NAKSHATRA_ORDER = [
  'Ashwini', 'Bharani', 'Krittika', ...
]
```

## All 27 Nakshatras with Rulers
1. Ashwini - Ketu
2. Bharani - Venus
3. Krittika - Sun
4. Rohini - Moon
5. Mrigashira - Mars
6. Ardra - Rahu
7. Punarvasu - Jupiter
8. Pushya - Saturn
9. Ashlesha - Mercury
10. Magha - Ketu
11. Purva Phalguni - Venus
12. Uttara Phalguni - Sun
13. Hasta - Moon
14. Chitra - Mars
15. Swati - Rahu
16. Vishakha - Jupiter
17. Anuradha - Saturn
18. Jyeshtha - Mercury
19. Mula - Ketu
20. Purva Ashadha - Venus
21. Uttara Ashadha - Sun
22. Shravana - Moon
23. Dhanishta - Mars
24. Shatabhisha - Rahu
25. Purva Bhadrapada - Jupiter
26. Uttara Bhadrapada - Saturn
27. Revati - Mercury
