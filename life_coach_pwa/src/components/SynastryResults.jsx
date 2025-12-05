import { useState } from 'react'
import ReactMarkdown from 'react-markdown'

function CompatibilityScore({ score }) {
  const getScoreColor = (score) => {
    if (score >= 75) return 'text-green-600 dark:text-green-400'
    if (score >= 50) return 'text-amber-600 dark:text-amber-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent'
    if (score >= 65) return 'Good'
    if (score >= 50) return 'Moderate'
    if (score >= 35) return 'Challenging'
    return 'Difficult'
  }

  return (
    <div className="text-center">
      <div className={`text-4xl font-bold ${getScoreColor(score)}`}>
        {score}%
      </div>
      <div className="text-sm text-amber-700 dark:text-amber-300">
        {getScoreLabel(score)}
      </div>
    </div>
  )
}

function AspectBadge({ nature }) {
  const colors = {
    harmonious: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    challenging: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    powerful: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
  }

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[nature] || colors.powerful}`}>
      {nature}
    </span>
  )
}

function AspectList({ title, aspects, maxShow = 5 }) {
  const [showAll, setShowAll] = useState(false)
  const displayAspects = showAll ? aspects : aspects.slice(0, maxShow)

  if (!aspects || aspects.length === 0) return null

  return (
    <div className="mb-4">
      <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2">
        {title} ({aspects.length})
      </h4>
      <div className="space-y-1">
        {displayAspects.map((asp, i) => (
          <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-amber-100 dark:border-slate-700">
            <span className="text-amber-900 dark:text-amber-100">
              {asp.person1}&apos;s {asp.planet1} {asp.aspect} {asp.person2}&apos;s {asp.planet2}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-amber-600 dark:text-amber-400 text-xs">
                {asp.orb.toFixed(1)}°
              </span>
              <AspectBadge nature={asp.nature} />
            </div>
          </div>
        ))}
      </div>
      {aspects.length > maxShow && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-sm text-amber-600 hover:text-amber-800 dark:text-amber-400 mt-2"
        >
          {showAll ? 'Show less' : `Show ${aspects.length - maxShow} more`}
        </button>
      )}
    </div>
  )
}

function PairAnalysis({ pair }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-amber-50 dark:hover:bg-slate-700 transition-colors"
      >
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100">
            {pair.pair}
          </h3>
          <CompatibilityScore score={pair.compatibility_score} />
        </div>
        <span className="text-2xl text-amber-600">
          {expanded ? '−' : '+'}
        </span>
      </button>

      {expanded && (
        <div className="p-4 border-t border-amber-200 dark:border-slate-600">
          {/* Aspect Summary */}
          <div className="grid grid-cols-4 gap-4 mb-4 text-center">
            <div className="bg-amber-50 dark:bg-slate-700 rounded-lg p-2">
              <div className="text-xl font-bold text-amber-900 dark:text-amber-100">
                {pair.aspect_summary.total}
              </div>
              <div className="text-xs text-amber-600 dark:text-amber-400">Total</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-2">
              <div className="text-xl font-bold text-green-700 dark:text-green-300">
                {pair.aspect_summary.harmonious}
              </div>
              <div className="text-xs text-green-600 dark:text-green-400">Harmonious</div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/30 rounded-lg p-2">
              <div className="text-xl font-bold text-red-700 dark:text-red-300">
                {pair.aspect_summary.challenging}
              </div>
              <div className="text-xs text-red-600 dark:text-red-400">Challenging</div>
            </div>
            <div className="bg-pink-50 dark:bg-pink-900/30 rounded-lg p-2">
              <div className="text-xl font-bold text-pink-700 dark:text-pink-300">
                {pair.aspect_summary.romantic}
              </div>
              <div className="text-xs text-pink-600 dark:text-pink-400">Romantic</div>
            </div>
          </div>

          {/* Aspect Lists */}
          <AspectList title="Romantic Connections" aspects={pair.romantic_aspects} />
          <AspectList title="Harmonious Aspects" aspects={pair.harmonious_aspects} />
          <AspectList title="Challenging Aspects" aspects={pair.challenging_aspects} />
          <AspectList title="Karmic Connections" aspects={pair.karmic_aspects} />
        </div>
      )}
    </div>
  )
}

function InterpretationSection({ section }) {
  if (!section) return null

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100 mb-2">
        {section.title}
      </h3>
      <div className="prose prose-amber dark:prose-invert max-w-none text-amber-800 dark:text-amber-200">
        <ReactMarkdown>{section.content}</ReactMarkdown>
      </div>
    </div>
  )
}

export default function SynastryResults({ synastry, interpretation }) {
  const [showInterpretation, setShowInterpretation] = useState(true)

  if (!synastry) return null

  return (
    <div className="space-y-6">
      {/* People Summary */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-amber-900 dark:text-amber-100 mb-4">
          Chart Comparison
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {synastry.people.map((person, i) => (
            <div key={i} className="bg-amber-50 dark:bg-slate-700 rounded-lg p-3 text-center">
              <div className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                {person.label}
              </div>
              <div className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                <div>Asc: {person.ascendant}</div>
                <div>Sun: {person.sun_sign}</div>
                <div>Moon: {person.moon_sign}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Group Summary */}
        {synastry.group_summary && (
          <div className="mt-4 pt-4 border-t border-amber-200 dark:border-slate-600">
            <div className="flex justify-center items-center gap-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                  {synastry.group_summary.average_compatibility}%
                </div>
                <div className="text-sm text-amber-600 dark:text-amber-400">
                  Avg Compatibility
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {synastry.group_summary.total_harmonious_aspects}
                </div>
                <div className="text-sm text-amber-600 dark:text-amber-400">
                  Harmonious
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {synastry.group_summary.total_challenging_aspects}
                </div>
                <div className="text-sm text-amber-600 dark:text-amber-400">
                  Challenging
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pair Analyses */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-amber-900 dark:text-amber-100">
          Relationship Details
        </h2>
        {synastry.pair_analyses.map((pair, i) => (
          <PairAnalysis key={i} pair={pair} />
        ))}
      </div>

      {/* AI Interpretation */}
      {interpretation && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
          <button
            onClick={() => setShowInterpretation(!showInterpretation)}
            className="w-full p-4 flex justify-between items-center bg-gradient-to-r from-amber-100 to-amber-50 dark:from-slate-700 dark:to-slate-800 hover:from-amber-200 dark:hover:from-slate-600 transition-colors"
          >
            <h2 className="text-xl font-bold text-amber-900 dark:text-amber-100">
              Relationship Reading
            </h2>
            <span className="text-2xl text-amber-600">
              {showInterpretation ? '−' : '+'}
            </span>
          </button>

          {showInterpretation && (
            <div className="p-6">
              {/* Summary */}
              {interpretation.summary && (
                <div className="mb-6 p-4 bg-amber-50 dark:bg-slate-700 rounded-lg">
                  <p className="text-lg text-amber-900 dark:text-amber-100 italic">
                    {interpretation.summary}
                  </p>
                  {interpretation.compatibility_rating && (
                    <p className="mt-2 font-semibold text-amber-700 dark:text-amber-300">
                      Rating: {interpretation.compatibility_rating}
                    </p>
                  )}
                </div>
              )}

              {/* Structured sections */}
              {interpretation.emotional_connection && (
                <InterpretationSection section={interpretation.emotional_connection} />
              )}
              {interpretation.romantic_chemistry && (
                <InterpretationSection section={interpretation.romantic_chemistry} />
              )}
              {interpretation.mental_compatibility && (
                <InterpretationSection section={interpretation.mental_compatibility} />
              )}
              {interpretation.strengths && (
                <InterpretationSection section={interpretation.strengths} />
              )}
              {interpretation.challenges && (
                <InterpretationSection section={interpretation.challenges} />
              )}
              {interpretation.karmic_connection && (
                <InterpretationSection section={interpretation.karmic_connection} />
              )}
              {interpretation.remedies && (
                <InterpretationSection section={interpretation.remedies} />
              )}
              {interpretation.advice && (
                <InterpretationSection section={interpretation.advice} />
              )}

              {/* Group analysis sections */}
              {interpretation.group_dynamic && (
                <InterpretationSection section={interpretation.group_dynamic} />
              )}
              {interpretation.best_combinations && (
                <InterpretationSection section={interpretation.best_combinations} />
              )}
              {interpretation.growth_opportunities && (
                <InterpretationSection section={interpretation.growth_opportunities} />
              )}

              {/* Raw fallback */}
              {interpretation.raw && (
                <div className="prose prose-amber dark:prose-invert max-w-none">
                  <ReactMarkdown>{interpretation.raw}</ReactMarkdown>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
