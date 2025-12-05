import { PLANET_SYMBOLS } from '../utils/constants'

export default function PlanetTable({ chart }) {
  const { planets, navamsa } = chart

  const planetOrder = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu']

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-500">
        <h3 className="text-lg font-semibold text-white">Planetary Positions</h3>
      </div>

      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="inline-block min-w-full align-middle">
          <table className="min-w-full text-sm">
            <thead className="bg-amber-50">
              <tr>
                <th className="px-4 py-3 text-left text-amber-800 font-semibold sticky left-0 bg-amber-50 z-10 shadow-sm sm:shadow-none">Planet</th>
                <th className="px-4 py-3 text-left text-amber-800 font-semibold whitespace-nowrap">Sign</th>
                <th className="px-4 py-3 text-left text-amber-800 font-semibold whitespace-nowrap">Degree</th>
                <th className="px-4 py-3 text-left text-amber-800 font-semibold whitespace-nowrap">Nakshatra</th>
                <th className="px-4 py-3 text-left text-amber-800 font-semibold whitespace-nowrap">Pada</th>
                <th className="px-4 py-3 text-left text-amber-800 font-semibold whitespace-nowrap">House</th>
                {navamsa && (
                  <th className="px-4 py-3 text-left text-amber-800 font-semibold whitespace-nowrap">Navamsa</th>
                )}
              </tr>
            </thead>
            <tbody>
              {planetOrder.map((planetName, idx) => {
                const planet = planets[planetName]
                if (!planet) return null

                return (
                  <tr
                    key={planetName}
                    className={`border-t border-amber-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-amber-50/50'
                      } hover:bg-amber-100/50 transition-colors`}
                  >
                    <td className="px-4 py-3 font-medium text-amber-900 sticky left-0 bg-inherit shadow-sm sm:shadow-none z-10">
                      <span className="mr-2">{PLANET_SYMBOLS[planetName]}</span>
                      {planetName}
                      {planet.retrograde && (
                        <span className="ml-1 text-red-500 text-xs">(R)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-amber-700 whitespace-nowrap">{planet.sign}</td>
                    <td className="px-4 py-3 text-amber-700 whitespace-nowrap">
                      {planet.degree.toFixed(2)}°
                    </td>
                    <td className="px-4 py-3 text-amber-700 whitespace-nowrap">
                      {planet.nakshatra.name}
                    </td>
                    <td className="px-4 py-3 text-amber-700 whitespace-nowrap">
                      {planet.nakshatra.pada}
                    </td>
                    <td className="px-4 py-3 text-amber-700 whitespace-nowrap">{planet.house}</td>
                    {navamsa && (
                      <td className="px-4 py-3 text-amber-700 whitespace-nowrap">
                        {navamsa[planetName]?.sign || '-'}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ayanamsa info */}
      <div className="px-6 py-3 bg-amber-50 border-t border-amber-100 text-sm text-amber-600">
        Ayanamsa: {chart.ayanamsa_type} ({chart.ayanamsa.toFixed(4)}°)
      </div>
    </div>
  )
}
