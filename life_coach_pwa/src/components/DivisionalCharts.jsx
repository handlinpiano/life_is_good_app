import { useState } from 'react'
import NorthIndianChart from './NorthIndianChart'
import SouthIndianChart from './SouthIndianChart'

// Varga order for display (most commonly used first)
const VARGA_ORDER = [
  'D1', 'D9', 'D10', 'D2', 'D3', 'D4', 'D7', 'D12',
  'D16', 'D20', 'D24', 'D27', 'D30', 'D40', 'D45', 'D60'
]

function VargaPlanetTable({ planets, ascendant }) {
  return (
    <div className="mt-3 overflow-x-auto">
      {ascendant && (
        <div className="mb-2 text-sm text-amber-600 dark:text-amber-400">
          <span className="font-medium">Ascendant:</span> {ascendant.sign}
        </div>
      )}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-amber-200 dark:border-amber-800">
            <th className="py-1 px-2 text-left text-amber-700 dark:text-amber-300">Planet</th>
            <th className="py-1 px-2 text-left text-amber-700 dark:text-amber-300">Sign</th>
            <th className="py-1 px-2 text-left text-amber-700 dark:text-amber-300">House</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(planets).map(([planet, data]) => (
            <tr key={planet} className="border-b border-amber-100 dark:border-amber-900">
              <td className="py-1 px-2 text-amber-900 dark:text-amber-100">{planet}</td>
              <td className="py-1 px-2 text-amber-700 dark:text-amber-300">{data.sign}</td>
              <td className="py-1 px-2 text-amber-600 dark:text-amber-400 font-medium">
                {data.house || '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function DivisionalCharts({ chart, chartStyle }) {
  const [allExpanded, setAllExpanded] = useState(false)

  // Chart is now the full API response which has D1, D9 etc as root keys
  // or it might be the old structure. Let's handle both.

  // If chart.D1 exists, it's the new structure where chart IS the response
  // If chart.vargas exists, it's the old structure

  const vargas = chart.D1 ? chart : (chart.vargas || {});

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden mt-8">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Divisional Charts (Vargas)</h3>
          <p className="text-amber-100 text-sm">16 divisional charts for detailed analysis</p>
        </div>
        <button
          onClick={() => setAllExpanded(!allExpanded)}
          className="px-3 py-1 text-sm bg-white/20 hover:bg-white/30 text-white rounded transition-colors"
        >
          {allExpanded ? 'Collapse All' : 'Expand All'}
        </button>
      </div>

      {/* Varga List */}
      <div className="divide-y divide-amber-100 dark:divide-amber-800">
        {VARGA_ORDER.map((vargaKey) => {
          const varga = vargas[vargaKey]
          if (!varga) return null

          return (
            <VargaAccordionControlled
              key={vargaKey}
              vargaKey={vargaKey}
              varga={varga}
              chart={chart.D1 || chart} // Pass main chart for ascendant context if needed, though varga has its own planets
              chartStyle={chartStyle}
              forceExpanded={allExpanded}
            />
          )
        })}
      </div>
    </div>
  )
}

// Controlled version that responds to "Expand All"
function VargaAccordionControlled({ vargaKey, varga, chart, chartStyle, forceExpanded }) {
  const [localExpanded, setLocalExpanded] = useState(false)
  const expanded = forceExpanded || localExpanded

  // Varga metadata
  const VARGA_INFO = {
    'D1': { 'name': 'Rasi', 'description': 'Main birth chart - overall life' },
    'D2': { 'name': 'Hora', 'description': 'Wealth and finances' },
    'D3': { 'name': 'Drekkana', 'description': 'Siblings and courage' },
    'D4': { 'name': 'Chaturthamsa', 'description': 'Fortune and property' },
    'D7': { 'name': 'Saptamsa', 'description': 'Children and progeny' },
    'D9': { 'name': 'Navamsa', 'description': 'Marriage and dharma' },
    'D10': { 'name': 'Dasamsa', 'description': 'Career and profession' },
    'D12': { 'name': 'Dwadasamsa', 'description': 'Parents and ancestry' },
    'D16': { 'name': 'Shodasamsa', 'description': 'Vehicles and comforts' },
    'D20': { 'name': 'Vimsamsa', 'description': 'Spiritual progress' },
    'D24': { 'name': 'Chaturvimsamsa', 'description': 'Learning and education' },
    'D27': { 'name': 'Saptavimsamsa', 'description': 'Strengths and weaknesses' },
    'D30': { 'name': 'Trimsamsa', 'description': 'Evils and misfortunes' },
    'D40': { 'name': 'Khavedamsa', 'description': 'Auspicious effects' },
    'D45': { 'name': 'Akshavedamsa', 'description': 'General indications' },
    'D60': { 'name': 'Shashtiamsa', 'description': 'Past life karma' },
  }

  const info = VARGA_INFO[vargaKey] || { name: vargaKey, description: '' }

  // Don't render D1 as it's the main chart shown above
  if (vargaKey === 'D1') return null

  return (
    <div className="border-b border-amber-100 dark:border-amber-800 last:border-0">
      <button
        onClick={() => setLocalExpanded(!localExpanded)}
        className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors"
      >
        <span className="font-mono text-amber-600 dark:text-amber-400 w-8">{vargaKey}</span>
        <div className="flex-1">
          <span className="font-medium text-amber-900 dark:text-amber-100">
            {info.name}
          </span>
          <span className="ml-2 text-sm text-amber-500 dark:text-amber-400">
            {info.description}
          </span>
        </div>
        <span className="text-amber-400 dark:text-amber-500">
          {expanded ? '▼' : '▶'}
        </span>
      </button>

      {expanded && (
        <div className="px-4 pb-4">
          <div className="flex flex-col md:flex-row gap-4 items-start">
            {/* Mini Chart */}
            <div className="flex-shrink-0 mx-auto md:mx-0">
              {chartStyle === 'north' ? (
                <NorthIndianChart
                  chart={chart}
                  mini={true}
                  vargaPlanets={varga.planets}
                  title={vargaKey}
                />
              ) : (
                <SouthIndianChart
                  chart={chart}
                  mini={true}
                  vargaPlanets={varga.planets}
                  title={vargaKey}
                />
              )}
            </div>

            {/* Planet positions table */}
            <div className="flex-1 min-w-0 w-full">
              <VargaPlanetTable planets={varga.planets} ascendant={varga.ascendant} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
