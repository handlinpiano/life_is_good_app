import { useState, useEffect } from 'react'
import BirthForm from './components/BirthForm'
import NorthIndianChart from './components/NorthIndianChart'
import SouthIndianChart from './components/SouthIndianChart'
import PlanetTable from './components/PlanetTable'
import DashaTable from './components/DashaTable'
import DivisionalCharts from './components/DivisionalCharts'
import ChartInterpretation from './components/ChartInterpretation'
import SynastryForm from './components/SynastryForm'
import SynastryResults from './components/SynastryResults'
import { calculateChart, calculateDasha, calculateSynastry } from './utils/api'

function App() {
  const [chart, setChart] = useState(null)
  const [dasha, setDasha] = useState(null)
  const [birthData, setBirthData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [chartStyle, setChartStyle] = useState('north') // 'north' or 'south'
  const [darkMode, setDarkMode] = useState(false)
  const [mode, setMode] = useState('single') // 'single' or 'synastry'
  const [synastryData, setSynastryData] = useState(null)
  const [synastryInterpretation, setSynastryInterpretation] = useState(null)

  // Initialize dark mode from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true'
    setDarkMode(savedDarkMode)
    if (savedDarkMode) {
      document.documentElement.classList.add('dark')
    }
  }, [])

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)
    localStorage.setItem('darkMode', newDarkMode)
    if (newDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const handleSubmit = async (data) => {
    setLoading(true)
    setError(null)

    try {
      // Fetch chart and dasha in parallel
      const [chartResult, dashaResult] = await Promise.all([
        calculateChart(data),
        calculateDasha(data),
      ])
      setChart(chartResult)
      setDasha(dashaResult)
      setBirthData(data)
    } catch (err) {
      setError(err.message || 'Failed to calculate chart')
    } finally {
      setLoading(false)
    }
  }

  const handleSynastrySubmit = async (people) => {
    setLoading(true)
    setError(null)
    setSynastryData(null)
    setSynastryInterpretation(null)

    try {
      const result = await calculateSynastry(people)
      if (result.success) {
        setSynastryData(result.synastry)
        setSynastryInterpretation(result.interpretation)
      } else {
        setError(result.error || 'Failed to calculate synastry')
      }
    } catch (err) {
      setError(err.message || 'Failed to calculate synastry')
    } finally {
      setLoading(false)
    }
  }

  const switchToSynastry = () => {
    setMode('synastry')
    setChart(null)
    setDasha(null)
    setBirthData(null)
  }

  const switchToSingle = () => {
    setMode('single')
    setSynastryData(null)
    setSynastryInterpretation(null)
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div className="flex-1"></div>
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold text-amber-900 dark:text-amber-100 mb-2">
              {mode === 'single' ? 'Vedic Birth Chart' : 'Synastry Analysis'}
            </h1>
            <p className="text-amber-700 dark:text-amber-300">
              {mode === 'single'
                ? 'Calculate your Kundli with precise planetary positions'
                : 'Compare charts to analyze relationship compatibility'}
            </p>
          </div>
          <div className="flex-1 flex justify-end gap-2">
            <button
              onClick={mode === 'single' ? switchToSynastry : switchToSingle}
              className="px-4 py-2 rounded-lg font-medium transition-colors bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 hover:bg-purple-200 dark:hover:bg-purple-800"
            >
              {mode === 'single' ? '+ Synastry' : 'Single Chart'}
            </button>
            <button
              onClick={toggleDarkMode}
              className="px-4 py-2 rounded-lg font-medium transition-colors bg-amber-100 dark:bg-slate-700 text-amber-800 dark:text-amber-200 hover:bg-amber-200 dark:hover:bg-slate-600"
              aria-label="Toggle dark mode"
            >
              {darkMode ? '☀️ Light' : '🌙 Dark'}
            </button>
          </div>
        </header>

        {mode === 'synastry' ? (
          /* Synastry Mode - Full Width */
          <div className="space-y-6">
            {!synastryData && (
              <div className="bg-white/80 dark:bg-slate-800/80 rounded-xl shadow-lg p-6">
                <SynastryForm
                  onSubmit={handleSynastrySubmit}
                  loading={loading}
                  onCancel={switchToSingle}
                />
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            {synastryData && (
              <div>
                <button
                  onClick={() => { setSynastryData(null); setSynastryInterpretation(null); }}
                  className="mb-4 px-4 py-2 bg-amber-100 dark:bg-slate-700 text-amber-800 dark:text-amber-200 rounded-lg hover:bg-amber-200 dark:hover:bg-slate-600"
                >
                  ← New Comparison
                </button>
                <SynastryResults
                  synastry={synastryData}
                  interpretation={synastryInterpretation}
                />
              </div>
            )}
          </div>
        ) : (
          /* Single Chart Mode - Two Column Layout */
          <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Form */}
          <div>
            <BirthForm onSubmit={handleSubmit} loading={loading} />

            {error && (
              <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                {error}
              </div>
            )}
          </div>

          {/* Right Column - Chart Display */}
          <div>
            {chart && (
              <div className="space-y-6">
                {/* Chart Style Toggle */}
                <div className="flex justify-center gap-2">
                  <button
                    onClick={() => setChartStyle('north')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      chartStyle === 'north'
                        ? 'bg-amber-600 text-white'
                        : 'bg-white text-amber-800 hover:bg-amber-100'
                    }`}
                  >
                    North Indian
                  </button>
                  <button
                    onClick={() => setChartStyle('south')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      chartStyle === 'south'
                        ? 'bg-amber-600 text-white'
                        : 'bg-white text-amber-800 hover:bg-amber-100'
                    }`}
                  >
                    South Indian
                  </button>
                </div>

                {/* Chart */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  {chartStyle === 'north' ? (
                    <NorthIndianChart chart={chart} />
                  ) : (
                    <SouthIndianChart chart={chart} />
                  )}
                </div>

                {/* Planet Table */}
                <PlanetTable chart={chart} />

                {/* Divisional Charts (Vargas) */}
                <DivisionalCharts chart={chart} chartStyle={chartStyle} />

                {/* Dasha Table */}
                {dasha && <DashaTable dasha={dasha} />}

                {/* AI Interpretation */}
                <ChartInterpretation birthData={birthData} chart={chart} />
              </div>
            )}

            {!chart && !loading && (
              <div className="bg-white/50 rounded-xl p-12 text-center text-amber-700">
                <div className="text-6xl mb-4">☉</div>
                <p>Enter your birth details to generate your Vedic birth chart</p>
              </div>
            )}
          </div>
        </div>
        )}
      </div>
    </div>
  )
}

export default App
