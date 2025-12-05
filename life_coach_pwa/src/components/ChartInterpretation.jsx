import { useState, useEffect, useRef } from 'react'
import { interpretChart, chatWithChart } from '../utils/api'

// Suggested questions for the chat
const SUGGESTED_QUESTIONS = [
  "Analyze my D9 Navamsa chart for marriage prospects",
  "What does my D10 Dasamsa reveal about my career?",
  "Explain my D20 Vimsamsa for spiritual growth",
  "What past life karma does my D60 Shashtiamsa show?",
  "What specific mantras should I chant daily?",
  "What gemstones would benefit me?",
  "When is the best time for starting new ventures?",
  "How can I balance my doshas based on my chart?"
]

const SECTION_ICONS = {
  personality: '👤',
  strengths: '✨',
  challenges: '🔥',
  career: '💼',
  current_period: '🌙',
  spirituality: '🙏',
  diet: '🍃',
  sadhana: '🕉️',
  advice: '✨',
}

function InterpretationSection({ section, icon }) {
  const [expanded, setExpanded] = useState(true)

  if (!section) return null

  return (
    <div className="border-b border-indigo-100 dark:border-indigo-900 last:border-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
      >
        <span className="text-xl">{icon}</span>
        <span className="font-medium text-indigo-900 dark:text-indigo-100 flex-1">
          {section.title}
        </span>
        <span className="text-indigo-400 dark:text-indigo-500">
          {expanded ? '▼' : '▶'}
        </span>
      </button>
      {expanded && (
        <div className="px-4 pb-4 pl-12 text-gray-700 dark:text-gray-300 leading-relaxed">
          {section.content}
        </div>
      )}
    </div>
  )
}

export default function ChartInterpretation({ birthData, chart }) {
  const [interpretation, setInterpretation] = useState(null)
  const [reasoning, setReasoning] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showReasoning, setShowReasoning] = useState(false)
  const prevBirthDataRef = useRef(null)

  // Chat state
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatError, setChatError] = useState(null)
  const [showChat, setShowChat] = useState(false)
  const chatEndRef = useRef(null)

  // Reset interpretation when birth data changes
  useEffect(() => {
    if (birthData && prevBirthDataRef.current) {
      // Check if birth data actually changed
      const prev = prevBirthDataRef.current
      const changed =
        prev.year !== birthData.year ||
        prev.month !== birthData.month ||
        prev.day !== birthData.day ||
        prev.hour !== birthData.hour ||
        prev.minute !== birthData.minute ||
        prev.latitude !== birthData.latitude ||
        prev.longitude !== birthData.longitude

      if (changed) {
        setInterpretation(null)
        setReasoning(null)
        setError(null)
        setShowReasoning(false)
        // Reset chat when birth data changes
        setChatMessages([])
        setChatInput('')
        setChatError(null)
        setShowChat(false)
      }
    }
    prevBirthDataRef.current = birthData
  }, [birthData])

  // Scroll to bottom of chat when new messages arrive
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatMessages])

  const handleInterpret = async () => {
    if (!birthData) return

    setLoading(true)
    setError(null)

    try {
      const result = await interpretChart(birthData, true)
      setInterpretation(result.interpretation)
      setReasoning(result.reasoning)
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to get interpretation')
    } finally {
      setLoading(false)
    }
  }

  const handleChatSubmit = async (question = null) => {
    const questionToSend = question || chatInput.trim()
    if (!questionToSend || !birthData) return

    setChatLoading(true)
    setChatError(null)
    setChatInput('')

    // Add user message to chat immediately
    const userMessage = { role: 'user', content: questionToSend }
    setChatMessages((prev) => [...prev, userMessage])

    try {
      // Build conversation history for context (exclude the message we just added)
      const history = chatMessages.length > 0 ? chatMessages : null

      const result = await chatWithChart(birthData, questionToSend, history)

      // Add assistant response
      const assistantMessage = { role: 'assistant', content: result.response }
      setChatMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      setChatError(err.response?.data?.detail || err.message || 'Failed to get response')
      // Remove the user message if there was an error
      setChatMessages((prev) => prev.slice(0, -1))
    } finally {
      setChatLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleChatSubmit()
    }
  }

  if (!chart) return null

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-500">
        <h3 className="text-lg font-semibold text-white">AI Chart Interpretation</h3>
        <p className="text-indigo-100 text-sm">Powered by DeepSeek Reasoner</p>
      </div>

      <div className="p-4">
        {!interpretation && !loading && (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">🔮</div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Get personalized insights about your birth chart using AI analysis
            </p>
            <button
              onClick={handleInterpret}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg font-medium hover:from-indigo-600 hover:to-purple-600 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
            >
              Generate Interpretation
            </button>
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin text-4xl mb-4">🌀</div>
            <p className="text-gray-600 dark:text-gray-400">
              Analyzing your chart with deep reasoning...
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              This may take 30-60 seconds
            </p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
            <button
              onClick={handleInterpret}
              className="mt-3 text-sm underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        )}

        {interpretation && !loading && (
          <div className="space-y-4">
            {/* Summary */}
            {interpretation.summary && (
              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                <p className="text-indigo-900 dark:text-indigo-100 font-medium leading-relaxed">
                  {interpretation.summary}
                </p>
              </div>
            )}

            {/* Structured sections */}
            <div className="border border-indigo-100 dark:border-indigo-900 rounded-lg overflow-hidden">
              <InterpretationSection
                section={interpretation.personality}
                icon={SECTION_ICONS.personality}
              />
              <InterpretationSection
                section={interpretation.strengths}
                icon={SECTION_ICONS.strengths}
              />
              <InterpretationSection
                section={interpretation.challenges}
                icon={SECTION_ICONS.challenges}
              />
              <InterpretationSection
                section={interpretation.career}
                icon={SECTION_ICONS.career}
              />
              <InterpretationSection
                section={interpretation.current_period}
                icon={SECTION_ICONS.current_period}
              />
              <InterpretationSection
                section={interpretation.spirituality}
                icon={SECTION_ICONS.spirituality}
              />
              <InterpretationSection
                section={interpretation.diet}
                icon={SECTION_ICONS.diet}
              />
              <InterpretationSection
                section={interpretation.sadhana}
                icon={SECTION_ICONS.sadhana}
              />
              <InterpretationSection
                section={interpretation.advice}
                icon={SECTION_ICONS.advice}
              />
            </div>

            {/* Raw content fallback */}
            {interpretation.raw && (
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {interpretation.raw}
                </p>
              </div>
            )}

            {/* Show reasoning toggle */}
            {reasoning && (
              <div className="mt-4">
                <button
                  onClick={() => setShowReasoning(!showReasoning)}
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-2"
                >
                  <span>{showReasoning ? '▼' : '▶'}</span>
                  {showReasoning ? 'Hide' : 'Show'} AI Reasoning Process
                </button>
                {showReasoning && (
                  <div className="mt-3 p-4 bg-gray-100 dark:bg-gray-900 rounded-lg text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap max-h-96 overflow-y-auto">
                    {reasoning}
                  </div>
                )}
              </div>
            )}

            {/* Regenerate button */}
            <div className="text-center pt-4">
              <button
                onClick={handleInterpret}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                ↻ Generate New Interpretation
              </button>
            </div>

            {/* Follow-up Chat Section */}
            <div className="mt-6 border-t border-indigo-100 dark:border-indigo-900 pt-4">
              <button
                onClick={() => setShowChat(!showChat)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-all"
              >
                <span className="flex items-center gap-2">
                  <span className="text-xl">💬</span>
                  <span className="font-medium">Ask Follow-up Questions</span>
                </span>
                <span>{showChat ? '▼' : '▶'}</span>
              </button>

              {showChat && (
                <div className="mt-4 space-y-4">
                  {/* Suggested Questions */}
                  {chatMessages.length === 0 && (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Suggested questions:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {SUGGESTED_QUESTIONS.map((q, i) => (
                          <button
                            key={i}
                            onClick={() => handleChatSubmit(q)}
                            disabled={chatLoading}
                            className="text-xs px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors disabled:opacity-50"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Chat Messages */}
                  {chatMessages.length > 0 && (
                    <div className="max-h-96 overflow-y-auto space-y-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      {chatMessages.map((msg, i) => (
                        <div
                          key={i}
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-lg px-4 py-2 ${
                              msg.role === 'user'
                                ? 'bg-indigo-500 text-white'
                                : 'bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 shadow'
                            }`}
                          >
                            <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                          </div>
                        </div>
                      ))}
                      {chatLoading && (
                        <div className="flex justify-start">
                          <div className="bg-white dark:bg-slate-700 rounded-lg px-4 py-2 shadow">
                            <span className="inline-block animate-pulse">Thinking...</span>
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                  )}

                  {/* Chat Error */}
                  {chatError && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
                      {chatError}
                    </div>
                  )}

                  {/* Chat Input */}
                  <div className="flex gap-2">
                    <textarea
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask about your chart, specific divisional charts, remedies..."
                      disabled={chatLoading}
                      rows={2}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white resize-none disabled:opacity-50"
                    />
                    <button
                      onClick={() => handleChatSubmit()}
                      disabled={chatLoading || !chatInput.trim()}
                      className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {chatLoading ? '...' : 'Send'}
                    </button>
                  </div>

                  {/* Clear chat button */}
                  {chatMessages.length > 0 && (
                    <button
                      onClick={() => {
                        setChatMessages([])
                        setChatError(null)
                      }}
                      className="text-xs text-gray-500 dark:text-gray-400 hover:underline"
                    >
                      Clear conversation
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
