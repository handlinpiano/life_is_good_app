import { useState } from 'react'
import CitySearch from './CitySearch'

export default function BirthForm({ onSubmit, loading }) {
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    latitude: '',
    longitude: '',
  })
  const [cityName, setCityName] = useState('')
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  const validateDate = (dateStr) => {
    if (!dateStr) return 'Date is required'

    const date = new Date(dateStr)
    const now = new Date()

    if (date > now) return 'Birth date cannot be in the future'
    if (date.getFullYear() < 1900) return 'Birth date must be after 1900'
    if (date.getFullYear() > 2100) return 'Birth date must be before 2100'

    return null
  }

  const validateTime = (timeStr) => {
    if (!timeStr) return 'Time is required'
    return null
  }

  const validateLatitude = (latStr) => {
    if (!latStr) return 'Latitude is required'

    const lat = parseFloat(latStr)
    if (isNaN(lat)) return 'Latitude must be a valid number'
    if (lat < -90 || lat > 90) return 'Latitude must be between -90 and 90'

    return null
  }

  const validateLongitude = (lngStr) => {
    if (!lngStr) return 'Longitude is required'

    const lng = parseFloat(lngStr)
    if (isNaN(lng)) return 'Longitude must be a valid number'
    if (lng < -180 || lng > 180) return 'Longitude must be between -180 and 180'

    return null
  }

  const validateField = (name, value) => {
    let error = null

    switch (name) {
      case 'date':
        error = validateDate(value)
        break
      case 'time':
        error = validateTime(value)
        break
      case 'latitude':
        error = validateLatitude(value)
        break
      case 'longitude':
        error = validateLongitude(value)
        break
      default:
        break
    }

    setErrors((prev) => ({ ...prev, [name]: error }))
    return error
  }

  const handleCitySelect = (city) => {
    setCityName(city.name)
    const newLat = city.latitude.toString()
    const newLng = city.longitude.toString()

    setFormData((prev) => ({
      ...prev,
      latitude: newLat,
      longitude: newLng,
    }))

    // Validate the new coordinates
    validateField('latitude', newLat)
    validateField('longitude', newLng)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Validate the field
    validateField(name, value)

    // Clear city selection if coordinates are manually changed
    if (name === 'latitude' || name === 'longitude') {
      setCityName('')
    }
  }

  const handleBlur = (e) => {
    const { name } = e.target
    setTouched((prev) => ({ ...prev, [name]: true }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const [year, month, day] = formData.date.split('-').map(Number)
    const [hour, minute] = formData.time.split(':').map(Number)

    onSubmit({
      year,
      month,
      day,
      hour,
      minute,
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
    })
  }

  const hasErrors = Object.values(errors).some((error) => error !== null)
  const isValid =
    formData.date &&
    formData.time &&
    formData.latitude &&
    formData.longitude &&
    !hasErrors

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl shadow-lg p-6 space-y-5"
    >
      <h2 className="text-xl font-semibold text-amber-900 border-b border-amber-200 pb-3">
        Birth Details
      </h2>

      {/* Date & Time Row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-amber-800 mb-1">
            Birth Date
          </label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 bg-amber-50 ${
              touched.date && errors.date
                ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                : touched.date && !errors.date && formData.date
                ? 'border-green-500 focus:ring-green-500 focus:border-green-500'
                : 'border-amber-300 focus:ring-amber-500 focus:border-amber-500'
            }`}
          />
          {touched.date && errors.date && (
            <p className="text-red-600 text-sm mt-1">{errors.date}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-amber-800 mb-1">
            Birth Time
          </label>
          <input
            type="time"
            name="time"
            value={formData.time}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 bg-amber-50 ${
              touched.time && errors.time
                ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                : touched.time && !errors.time && formData.time
                ? 'border-green-500 focus:ring-green-500 focus:border-green-500'
                : 'border-amber-300 focus:ring-amber-500 focus:border-amber-500'
            }`}
          />
          {touched.time && errors.time && (
            <p className="text-red-600 text-sm mt-1">{errors.time}</p>
          )}
        </div>
      </div>

      {/* City Search */}
      <CitySearch onSelect={handleCitySelect} value={cityName} />

      {/* Coordinates Row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-amber-800 mb-1">
            Latitude
          </label>
          <input
            type="number"
            name="latitude"
            value={formData.latitude}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="e.g., 28.6139"
            step="any"
            min="-90"
            max="90"
            required
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 bg-amber-50 ${
              touched.latitude && errors.latitude
                ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                : touched.latitude && !errors.latitude && formData.latitude
                ? 'border-green-500 focus:ring-green-500 focus:border-green-500'
                : 'border-amber-300 focus:ring-amber-500 focus:border-amber-500'
            }`}
          />
          {touched.latitude && errors.latitude && (
            <p className="text-red-600 text-sm mt-1">{errors.latitude}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-amber-800 mb-1">
            Longitude
          </label>
          <input
            type="number"
            name="longitude"
            value={formData.longitude}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="e.g., 77.2090"
            step="any"
            min="-180"
            max="180"
            required
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 bg-amber-50 ${
              touched.longitude && errors.longitude
                ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                : touched.longitude && !errors.longitude && formData.longitude
                ? 'border-green-500 focus:ring-green-500 focus:border-green-500'
                : 'border-amber-300 focus:ring-amber-500 focus:border-amber-500'
            }`}
          />
          {touched.longitude && errors.longitude && (
            <p className="text-red-600 text-sm mt-1">{errors.longitude}</p>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!isValid || loading}
        className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-lg hover:from-amber-600 hover:to-orange-600 focus:ring-4 focus:ring-amber-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Calculating...
          </span>
        ) : (
          'Calculate Birth Chart'
        )}
      </button>
    </form>
  )
}
