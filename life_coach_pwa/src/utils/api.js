import axios from 'axios'

// API base URL - read from environment variable
// For local dev: VITE_API_URL=http://127.0.0.1:8000/api in .env
// For production: Set VITE_API_URL in build environment
const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'

console.log('[API] Using base URL:', API_BASE)

/**
 * Convert stored birthData format to API format
 * Stored: { date: "1990-05-15", time: "10:30", latitude, longitude }
 * API expects: { year, month, day, hour, minute, latitude, longitude }
 */
export function normalizeBirthData(birthData) {
  if (!birthData) {
    console.error('normalizeBirthData: birthData is null/undefined')
    throw new Error('Birth data is required')
  }

  // If already in API format (has year field), return as-is
  if (birthData.year !== undefined) {
    return birthData
  }

  // Check for required fields in stored format
  if (!birthData.date || !birthData.time) {
    console.error('normalizeBirthData: missing date or time', birthData)
    throw new Error('Birth data is missing date or time')
  }

  // Convert from stored format
  const [year, month, day] = birthData.date.split('-').map(Number)
  const [hour, minute] = birthData.time.split(':').map(Number)

  return {
    year,
    month,
    day,
    hour,
    minute,
    latitude: birthData.latitude,
    longitude: birthData.longitude
  }
}

export async function calculateChart(birthData) {
  const response = await axios.post(`${API_BASE}/chart`, birthData)
  return response.data
}

export async function calculateBasicChart(birthData) {
  const response = await axios.post(`${API_BASE}/chart/basic`, birthData)
  return response.data
}

export async function calculateDasha(birthData) {
  const response = await axios.post(`${API_BASE}/dasha`, birthData)
  return response.data
}

export async function interpretChart(birthData, structured = true) {
  const response = await axios.post(`${API_BASE}/interpret?structured=${structured}`, birthData)
  return response.data
}

/**
 * Simple chat - all context is in the history
 * @param {string} message - The user's new message
 * @param {Array} history - Full conversation history (system prompt is first message)
 */
export async function chat(message, history) {
  const response = await axios.post(`${API_BASE}/chat/v2`, {
    message,
    history
  })
  return response.data
}

/**
 * Format chart data as text for system prompt
 * @param {Object} chart - Chart data from store
 * @param {Object} dasha - Dasha data from store
 */
export function formatChartAsText(chart, dasha) {
  if (!chart) return ''

  const lines = ['## Birth Chart Data\n']

  // Ascendant - check both D1.ascendant and direct ascendant
  const asc = chart.D1?.ascendant || chart.ascendant
  if (asc) {
    lines.push(`**Ascendant (Lagna)**: ${asc.sign} at ${asc.degree?.toFixed(2) || 0}°`)
    if (asc.nakshatra) {
      lines.push(`  - Nakshatra: ${asc.nakshatra.name} (Pada ${asc.nakshatra.pada || 1})`)
    }
  }

  lines.push('\n### Planetary Positions\n')

  // Planets - check both D1.planets and direct planets
  const planets = chart.D1?.planets || chart.planets
  if (planets) {
    for (const [name, data] of Object.entries(planets)) {
      const retro = data.retrograde ? ' (R)' : ''
      const dignity = data.dignity && data.dignity !== 'neutral' ? ` [${data.dignity}]` : ''
      lines.push(`**${name}**: ${data.sign} at ${data.degree?.toFixed(2) || 0}°${retro} - House ${data.house}${dignity}`)
      if (data.nakshatra) {
        lines.push(`  - Nakshatra: ${data.nakshatra.name} (Lord: ${data.nakshatra.lord || 'Unknown'})`)
      }
    }
  }

  // Houses
  const houses = chart.D1?.houses || chart.houses
  if (houses) {
    lines.push('\n### House Occupancy\n')
    for (const [num, occupants] of Object.entries(houses)) {
      lines.push(`House ${num}: ${occupants.length ? occupants.join(', ') : 'Empty'}`)
    }
  }

  // Dasha
  if (dasha) {
    lines.push('\n### Vimshottari Dasha\n')
    if (dasha.moon_nakshatra) {
      lines.push(`Birth Nakshatra: ${dasha.moon_nakshatra.name} (Lord: ${dasha.moon_nakshatra.lord || 'Unknown'})`)
    }
    if (dasha.current_maha_dasha) {
      lines.push(`\n**Current Maha Dasha**: ${dasha.current_maha_dasha.planet}`)
      lines.push(`  - Period: ${dasha.current_maha_dasha.start} to ${dasha.current_maha_dasha.end}`)
    }
    if (dasha.current_antar_dasha) {
      lines.push(`\n**Current Antar Dasha**: ${dasha.current_antar_dasha.planet}`)
      lines.push(`  - Until: ${dasha.current_antar_dasha.end}`)
    }
  }

  return lines.join('\n')
}

/**
 * Calculate synastry (relationship compatibility) between 2-4 people
 * @param {Array} people - Array of {label: string, birth_data: BirthData}
 * @returns {Object} Synastry data with aspects, overlays, and AI interpretation
 */
export async function calculateSynastry(people) {
  const response = await axios.post(`${API_BASE}/synastry`, { people })
  return response.data
}

export async function getAlignment(latitude, longitude) {
  const now = new Date();
  const data = {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
    hour: now.getHours(),
    minute: now.getMinutes(),
    latitude,
    longitude
  };
  const response = await axios.post(`${API_BASE}/alignment`, data);
  return response.data;
}
