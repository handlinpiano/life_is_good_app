import axios from 'axios'

// Use Railway backend in production, local proxy in development
const API_BASE = import.meta.env.PROD
  ? 'https://lifeisgoodapp-production.up.railway.app/api'
  : '/api'

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

export async function chatWithChart(birthData, question, conversationHistory = null) {
  const response = await axios.post(`${API_BASE}/chat`, {
    birth_data: birthData,
    question,
    conversation_history: conversationHistory
  })
  return response.data
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
