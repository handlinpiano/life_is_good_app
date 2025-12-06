import { PLANET_SYMBOLS } from '../utils/constants'

export default function PlanetTable({ chart }) {
  const { planets, navamsa } = chart

  const planetOrder = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu']

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-500">
        <h3 className="text-lg font-semibold text-white">Planetary Positions</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-amber-50">
            <tr>
              <th className="px-4 py-3 text-left text-amber-800 font-semibold">Planet</th>
              <th className="px-4 py-3 text-left text-amber-800 font-semibold">Sign</th>
              <th className="px-4 py-3 text-left text-amber-800 font-semibold">Degree</th>
              <th className="px-4 py-3 text-left text-amber-800 font-semibold">Nakshatra</th>
              <th className="px-4 py-3 text-left text-amber-800 font-semibold">Pada</th>
              <th className="px-4 py-3 text-left text-amber-800 font-semibold">House</th>
              {navamsa && (
                <th className="px-4 py-3 text-left text-amber-800 font-semibold">Navamsa</th>
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
                  className={`border-t border-amber-100 ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-amber-50/50'
                  } hover:bg-amber-100/50 transition-colors`}
                >
                  <td className="px-4 py-3 font-medium text-amber-900">
                    <span className="mr-2">{PLANET_SYMBOLS[planetName]}</span>
                    {planetName}
                    {planet.retrograde && (
                      <span className="ml-1 text-red-500 text-xs">(R)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-amber-700">{planet.sign}</td>
                  <td className="px-4 py-3 text-amber-700">
                    {planet.degree.toFixed(2)}°
                  </td>
                  <td className="px-4 py-3 text-amber-700">
                    {planet.nakshatra.name}
                  </td>
                  <td className="px-4 py-3 text-amber-700">
                    {planet.nakshatra.pada}
                  </td>
                  <td className="px-4 py-3 text-amber-700">{planet.house}</td>
                  {navamsa && (
                    <td className="px-4 py-3 text-amber-700">
                      {navamsa[planetName]?.sign || '-'}
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Ayanamsa info */}
      <div className="px-6 py-3 bg-amber-50 border-t border-amber-100 text-sm text-amber-600">
        Ayanamsa: {chart.ayanamsa_type} ({chart.ayanamsa.toFixed(4)}°)
      </div>
    </div>
  )
}
