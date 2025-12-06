import { PLANET_SYMBOLS } from '../utils/constants'

export default function DashaTable({ dasha }) {
  if (!dasha) return null

  const { maha_dashas, current_maha_dasha, current_antar_dasha, current_antar_dashas, moon_nakshatra } = dasha

  const formatDate = (isoString) => {
    const date = new Date(isoString)
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const isCurrentPeriod = (period) => {
    const now = new Date()
    const start = new Date(period.start)
    const end = new Date(period.end)
    return start <= now && now <= end
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-purple-500 to-indigo-500">
        <h3 className="text-lg font-semibold text-white">Vimshottari Dasha</h3>
        <p className="text-purple-100 text-sm">
          Moon in {moon_nakshatra?.name} ({moon_nakshatra?.lord} ruled)
        </p>
      </div>

      {/* Current Period Highlight */}
      {current_maha_dasha && (
        <div className="p-4 bg-purple-50 border-b border-purple-100">
          <div className="text-sm text-purple-600 font-medium mb-2">Currently Running</div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="text-lg font-semibold text-purple-900">
                {PLANET_SYMBOLS[current_maha_dasha.planet]} {current_maha_dasha.planet} Maha Dasha
              </div>
              <div className="text-sm text-purple-600">
                {formatDate(current_maha_dasha.start)} - {formatDate(current_maha_dasha.end)}
              </div>
            </div>
            {current_antar_dasha && (
              <div className="text-right">
                <div className="text-sm text-purple-600">Antar Dasha</div>
                <div className="font-semibold text-purple-900">
                  {PLANET_SYMBOLS[current_antar_dasha.planet]} {current_antar_dasha.planet}
                </div>
                <div className="text-xs text-purple-500">
                  until {formatDate(current_antar_dasha.end)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Antar Dasha Timeline (for current Maha Dasha) */}
      {current_antar_dashas && current_antar_dashas.length > 0 && (
        <div className="p-4 border-b border-purple-100">
          <div className="text-sm font-medium text-purple-800 mb-3">
            Sub-periods in {current_maha_dasha?.planet} Maha Dasha
          </div>
          <div className="grid grid-cols-3 gap-2">
            {current_antar_dashas.map((antar, idx) => {
              const isCurrent = isCurrentPeriod(antar)
              return (
                <div
                  key={idx}
                  className={`p-2 rounded text-center text-sm ${
                    isCurrent
                      ? 'bg-purple-500 text-white font-medium'
                      : 'bg-purple-50 text-purple-700'
                  }`}
                >
                  <div>{PLANET_SYMBOLS[antar.planet]} {antar.planet}</div>
                  <div className={`text-xs ${isCurrent ? 'text-purple-200' : 'text-purple-500'}`}>
                    {formatDate(antar.start).split(',')[0]}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Full Maha Dasha Timeline */}
      <div className="p-4">
        <div className="text-sm font-medium text-purple-800 mb-3">Maha Dasha Timeline</div>
        <div className="space-y-2">
          {maha_dashas?.map((period, idx) => {
            const isCurrent = isCurrentPeriod(period)
            const isPast = new Date(period.end) < new Date()

            return (
              <div
                key={idx}
                className={`flex items-center p-3 rounded-lg ${
                  isCurrent
                    ? 'bg-purple-100 border-2 border-purple-400'
                    : isPast
                    ? 'bg-gray-50 opacity-60'
                    : 'bg-gray-50'
                }`}
              >
                <div className="w-10 text-xl text-center">
                  {PLANET_SYMBOLS[period.planet]}
                </div>
                <div className="flex-1">
                  <div className={`font-medium ${isCurrent ? 'text-purple-900' : 'text-gray-700'}`}>
                    {period.planet}
                    {period.is_balance && (
                      <span className="ml-2 text-xs text-purple-500">(balance at birth)</span>
                    )}
                  </div>
                  <div className={`text-sm ${isCurrent ? 'text-purple-600' : 'text-gray-500'}`}>
                    {formatDate(period.start)} - {formatDate(period.end)}
                  </div>
                </div>
                <div className={`text-right ${isCurrent ? 'text-purple-700' : 'text-gray-500'}`}>
                  <div className="font-medium">{period.years} yrs</div>
                  {isCurrent && (
                    <div className="text-xs text-purple-500">Current</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
