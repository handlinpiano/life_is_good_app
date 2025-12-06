import { PLANET_ABBREV } from '../utils/constants'

/**
 * North Indian Style Vedic Chart (Diamond Layout)
 *
 * House layout (numbers are house positions, Ascendant is always House 1 in center-top):
 *
 *     ┌─────────┬─────────┬─────────┬─────────┐
 *     │   12    │    1    │    2    │    3    │
 *     ├─────────┼─────────┴─────────┼─────────┤
 *     │   11    │                   │    4    │
 *     ├─────────┤       Center      ├─────────┤
 *     │   10    │                   │    5    │
 *     ├─────────┼─────────┬─────────┼─────────┤
 *     │    9    │    8    │    7    │    6    │
 *     └─────────┴─────────┴─────────┴─────────┘
 */

export default function NorthIndianChart({ chart, mini = false, vargaPlanets = null, title = null }) {
  const { houses, ascendant } = chart

  // House positions for North Indian layout (x, y coordinates for text placement)
  const housePositions = {
    1: { x: 200, y: 70 },   // Top center
    2: { x: 300, y: 70 },   // Top right
    3: { x: 370, y: 120 },  // Right top
    4: { x: 370, y: 200 },  // Right middle
    5: { x: 370, y: 280 },  // Right bottom
    6: { x: 300, y: 330 },  // Bottom right
    7: { x: 200, y: 330 },  // Bottom center
    8: { x: 100, y: 330 },  // Bottom left
    9: { x: 30, y: 280 },   // Left bottom
    10: { x: 30, y: 200 },  // Left middle
    11: { x: 30, y: 120 },  // Left top
    12: { x: 100, y: 70 },  // Top left
  }

  // For varga charts, group planets by their varga sign and map to houses
  const getVargaPlanetsByHouse = () => {
    if (!vargaPlanets) return null
    const byHouse = {}
    Object.entries(vargaPlanets).forEach(([planetName, data]) => {
      // Map sign_num to house based on ascendant
      const house = ((data.sign_num - ascendant.sign_num + 12) % 12) + 1
      if (!byHouse[house]) byHouse[house] = []
      byHouse[house].push(PLANET_ABBREV[planetName] || planetName)
    })
    return byHouse
  }

  const vargaHouses = getVargaPlanetsByHouse()

  // Get planets in each house as abbreviated string
  const getPlanetsInHouse = (houseNum) => {
    if (vargaHouses) {
      return (vargaHouses[houseNum] || []).join(' ')
    }
    const planets = houses[houseNum.toString()] || []
    return planets.map((p) => PLANET_ABBREV[p] || p).join(' ')
  }

  // Get sign number for each house (based on ascendant)
  const getHouseSign = (houseNum) => {
    return ((ascendant.sign_num - 1 + houseNum - 1) % 12) + 1
  }

  return (
    <div className={mini ? 'w-full' : 'w-full'}>
      <svg viewBox="0 0 400 400" className={mini ? 'w-48 mx-auto' : 'w-full max-w-md mx-auto'}>
        {/* Background */}
        <rect x="0" y="0" width="400" height="400" className="fill-amber-50" />

        {/* Outer border */}
        <rect
          x="5"
          y="5"
          width="390"
          height="390"
          className="fill-none stroke-amber-800 stroke-2"
        />

        {/* Main grid lines */}
        <line x1="100" y1="5" x2="100" y2="395" className="stroke-amber-800 stroke-1" />
        <line x1="200" y1="5" x2="200" y2="395" className="stroke-amber-800 stroke-1" />
        <line x1="300" y1="5" x2="300" y2="395" className="stroke-amber-800 stroke-1" />
        <line x1="5" y1="100" x2="395" y2="100" className="stroke-amber-800 stroke-1" />
        <line x1="5" y1="200" x2="395" y2="200" className="stroke-amber-800 stroke-1" />
        <line x1="5" y1="300" x2="395" y2="300" className="stroke-amber-800 stroke-1" />

        {/* Diamond lines for center */}
        <line x1="100" y1="100" x2="200" y2="200" className="stroke-amber-800 stroke-1" />
        <line x1="300" y1="100" x2="200" y2="200" className="stroke-amber-800 stroke-1" />
        <line x1="100" y1="300" x2="200" y2="200" className="stroke-amber-800 stroke-1" />
        <line x1="300" y1="300" x2="200" y2="200" className="stroke-amber-800 stroke-1" />

        {/* House numbers and planets */}
        {Object.entries(housePositions).map(([houseNum, pos]) => {
          const planets = getPlanetsInHouse(parseInt(houseNum))
          const signNum = getHouseSign(parseInt(houseNum))

          return (
            <g key={houseNum}>
              {/* Sign number (small, top-left of house) */}
              <text
                x={pos.x - 30}
                y={pos.y - 15}
                className="fill-amber-500 text-xs"
                fontSize="10"
              >
                {signNum}
              </text>

              {/* Planets */}
              <text
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                className="fill-amber-900 font-medium"
                fontSize="12"
              >
                {planets}
              </text>

              {/* House 1 (Ascendant) marker */}
              {houseNum === '1' && (
                <text
                  x={pos.x}
                  y={pos.y + 20}
                  textAnchor="middle"
                  className="fill-amber-600 text-xs"
                  fontSize="9"
                >
                  Asc
                </text>
              )}
            </g>
          )
        })}

        {/* Center label */}
        <text
          x="200"
          y="200"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-amber-400"
          fontSize={mini ? '14' : '10'}
        >
          {title || ascendant.sign}
        </text>
      </svg>

      {/* Legend - only show for full size */}
      {!mini && (
        <div className="mt-4 text-center text-sm text-amber-700">
          <span className="font-medium">Ascendant:</span> {ascendant.sign} {ascendant.degree.toFixed(1)}°
        </div>
      )}
    </div>
  )
}
