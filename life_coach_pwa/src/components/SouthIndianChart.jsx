import { PLANET_ABBREV, SIGNS } from '../utils/constants'

/**
 * South Indian Style Vedic Chart (Fixed Sign Layout)
 *
 * Signs are fixed in position. Ascendant is marked, planets placed in their signs.
 *
 *     ┌─────────┬─────────┬─────────┬─────────┐
 *     │  Pisces │  Aries  │ Taurus  │ Gemini  │
 *     │   12    │    1    │    2    │    3    │
 *     ├─────────┼─────────┼─────────┼─────────┤
 *     │Aquarius │                   │ Cancer  │
 *     │   11    │                   │    4    │
 *     ├─────────┤                   ├─────────┤
 *     │Capricorn│                   │   Leo   │
 *     │   10    │                   │    5    │
 *     ├─────────┼─────────┼─────────┼─────────┤
 *     │  Sagit  │ Scorpio │  Libra  │  Virgo  │
 *     │    9    │    8    │    7    │    6    │
 *     └─────────┴─────────┴─────────┴─────────┘
 */

export default function SouthIndianChart({ chart, mini = false, vargaPlanets = null, title = null }) {
  const { planets, ascendant } = chart

  // Fixed sign positions in South Indian chart (sign number -> grid position)
  const signPositions = {
    12: { row: 0, col: 0 }, // Pisces
    1: { row: 0, col: 1 },  // Aries
    2: { row: 0, col: 2 },  // Taurus
    3: { row: 0, col: 3 },  // Gemini
    11: { row: 1, col: 0 }, // Aquarius
    4: { row: 1, col: 3 },  // Cancer
    10: { row: 2, col: 0 }, // Capricorn
    5: { row: 2, col: 3 },  // Leo
    9: { row: 3, col: 0 },  // Sagittarius
    8: { row: 3, col: 1 },  // Scorpio
    7: { row: 3, col: 2 },  // Libra
    6: { row: 3, col: 3 },  // Virgo
  }

  const cellSize = 95
  const padding = 10

  // Group planets by sign - use vargaPlanets if provided, otherwise use natal planets
  const planetsBySign = {}
  const planetsToUse = vargaPlanets || planets
  Object.entries(planetsToUse).forEach(([name, data]) => {
    const signNum = data.sign_num
    if (!planetsBySign[signNum]) {
      planetsBySign[signNum] = []
    }
    planetsBySign[signNum].push(PLANET_ABBREV[name] || name)
  })

  const getCellPosition = (signNum) => {
    const pos = signPositions[signNum]
    return {
      x: padding + pos.col * cellSize,
      y: padding + pos.row * cellSize,
    }
  }

  return (
    <div className="w-full">
      <svg viewBox="0 0 400 400" className={mini ? 'w-full max-w-[12rem] mx-auto' : 'w-full h-auto max-w-md mx-auto aspect-square'}>
        {/* Background */}
        <rect x="0" y="0" width="400" height="400" className="fill-amber-50" />

        {/* Grid cells for each sign */}
        {Object.entries(signPositions).map(([signNum, pos]) => {
          const x = padding + pos.col * cellSize
          const y = padding + pos.row * cellSize
          const sign = SIGNS[parseInt(signNum) - 1]
          const planetsInSign = planetsBySign[parseInt(signNum)] || []
          const isAscendant = parseInt(signNum) === ascendant.sign_num

          return (
            <g key={signNum}>
              {/* Cell background */}
              <rect
                x={x}
                y={y}
                width={cellSize}
                height={cellSize}
                className={`stroke-amber-800 stroke-1 ${isAscendant ? 'fill-amber-100' : 'fill-amber-50'
                  }`}
              />

              {/* Diagonal line for ascendant */}
              {isAscendant && (
                <line
                  x1={x}
                  y1={y}
                  x2={x + 20}
                  y2={y + 20}
                  className="stroke-amber-600 stroke-2"
                />
              )}

              {/* Sign name */}
              <text
                x={x + cellSize / 2}
                y={y + 15}
                textAnchor="middle"
                className="fill-amber-500"
                fontSize="10"
              >
                {sign.name.slice(0, 3)}
              </text>

              {/* Planets */}
              <text
                x={x + cellSize / 2}
                y={y + cellSize / 2 + 5}
                textAnchor="middle"
                className="fill-amber-900 font-semibold"
                fontSize="13"
              >
                {planetsInSign.join(' ')}
              </text>
            </g>
          )
        })}

        {/* Center area (empty in South Indian chart) */}
        <rect
          x={padding + cellSize}
          y={padding + cellSize}
          width={cellSize * 2}
          height={cellSize * 2}
          className="fill-amber-100/50 stroke-amber-800 stroke-1"
        />

        {/* Center text */}
        <text
          x="200"
          y="195"
          textAnchor="middle"
          className="fill-amber-600 font-medium"
          fontSize={mini ? '14' : '12'}
        >
          {title || 'Rashi Chart'}
        </text>
        {!title && (
          <text
            x="200"
            y="212"
            textAnchor="middle"
            className="fill-amber-500"
            fontSize="10"
          >
            (D1)
          </text>
        )}
      </svg>

      {/* Legend - only show for full size */}
      {!mini && (
        <div className="mt-4 text-center text-sm text-amber-700">
          <span className="font-medium">Ascendant:</span> {ascendant.sign} {ascendant.degree.toFixed(1)}°
          <span className="ml-2 text-amber-500">(marked with diagonal)</span>
        </div>
      )}
    </div>
  )
}
