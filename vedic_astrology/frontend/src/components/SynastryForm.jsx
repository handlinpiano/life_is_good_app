import { useState } from 'react'
import CitySearch from './CitySearch'

const EMPTY_PERSON = {
  label: '',
  year: '',
  month: '',
  day: '',
  hour: '',
  minute: '',
  latitude: '',
  longitude: '',
  cityName: ''
}

function PersonForm({ index, person, onChange, onRemove, canRemove }) {
  const handleChange = (field, value) => {
    onChange(index, { ...person, [field]: value })
  }

  const handleCitySelect = (city) => {
    onChange(index, {
      ...person,
      latitude: city.latitude,
      longitude: city.longitude,
      cityName: city.name
    })
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border-2 border-amber-200 dark:border-amber-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-amber-900 dark:text-amber-100">
          Person {index + 1}
        </h3>
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="text-red-500 hover:text-red-700 text-sm"
          >
            Remove
          </button>
        )}
      </div>

      <div className="space-y-3">
        {/* Name/Label */}
        <div>
          <label className="block text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
            Name / Label
          </label>
          <input
            type="text"
            value={person.label}
            onChange={(e) => handleChange('label', e.target.value)}
            placeholder="e.g., John, Partner A"
            className="w-full px-3 py-2 border border-amber-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-amber-900 dark:text-amber-100 focus:ring-2 focus:ring-amber-500"
            required
          />
        </div>

        {/* Date of Birth */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
              Year
            </label>
            <input
              type="number"
              value={person.year}
              onChange={(e) => handleChange('year', e.target.value)}
              placeholder="1990"
              min="1900"
              max="2100"
              className="w-full px-3 py-2 border border-amber-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-amber-900 dark:text-amber-100"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
              Month
            </label>
            <input
              type="number"
              value={person.month}
              onChange={(e) => handleChange('month', e.target.value)}
              placeholder="6"
              min="1"
              max="12"
              className="w-full px-3 py-2 border border-amber-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-amber-900 dark:text-amber-100"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
              Day
            </label>
            <input
              type="number"
              value={person.day}
              onChange={(e) => handleChange('day', e.target.value)}
              placeholder="15"
              min="1"
              max="31"
              className="w-full px-3 py-2 border border-amber-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-amber-900 dark:text-amber-100"
              required
            />
          </div>
        </div>

        {/* Time of Birth */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
              Hour (0-23)
            </label>
            <input
              type="number"
              value={person.hour}
              onChange={(e) => handleChange('hour', e.target.value)}
              placeholder="10"
              min="0"
              max="23"
              className="w-full px-3 py-2 border border-amber-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-amber-900 dark:text-amber-100"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
              Minute
            </label>
            <input
              type="number"
              value={person.minute}
              onChange={(e) => handleChange('minute', e.target.value)}
              placeholder="30"
              min="0"
              max="59"
              className="w-full px-3 py-2 border border-amber-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-amber-900 dark:text-amber-100"
              required
            />
          </div>
        </div>

        {/* City Search */}
        <div>
          <label className="block text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
            Birth Place
          </label>
          <CitySearch onSelect={handleCitySelect} />
          {person.cityName && (
            <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
              Selected: {person.cityName}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SynastryForm({ onSubmit, loading, onCancel }) {
  const [people, setPeople] = useState([
    { ...EMPTY_PERSON },
    { ...EMPTY_PERSON }
  ])

  const handlePersonChange = (index, updatedPerson) => {
    const newPeople = [...people]
    newPeople[index] = updatedPerson
    setPeople(newPeople)
  }

  const handleAddPerson = () => {
    if (people.length < 4) {
      setPeople([...people, { ...EMPTY_PERSON }])
    }
  }

  const handleRemovePerson = (index) => {
    if (people.length > 2) {
      setPeople(people.filter((_, i) => i !== index))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    // Validate all people have required fields
    const isValid = people.every(p =>
      p.label && p.year && p.month && p.day &&
      p.hour !== '' && p.minute !== '' &&
      p.latitude && p.longitude
    )

    if (!isValid) {
      alert('Please fill in all fields for each person')
      return
    }

    // Format data for API
    const formattedPeople = people.map(p => ({
      label: p.label,
      birth_data: {
        year: parseInt(p.year),
        month: parseInt(p.month),
        day: parseInt(p.day),
        hour: parseInt(p.hour),
        minute: parseInt(p.minute),
        latitude: parseFloat(p.latitude),
        longitude: parseFloat(p.longitude)
      }
    }))

    onSubmit(formattedPeople)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-amber-900 dark:text-amber-100">
          Synastry Comparison
        </h2>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-amber-600 hover:text-amber-800 dark:text-amber-400"
          >
            Back to Single Chart
          </button>
        )}
      </div>

      <p className="text-sm text-amber-700 dark:text-amber-300">
        Compare birth charts of 2-4 people to analyze relationship compatibility.
      </p>

      <div className="space-y-4">
        {people.map((person, index) => (
          <PersonForm
            key={index}
            index={index}
            person={person}
            onChange={handlePersonChange}
            onRemove={handleRemovePerson}
            canRemove={people.length > 2}
          />
        ))}
      </div>

      <div className="flex gap-3">
        {people.length < 4 && (
          <button
            type="button"
            onClick={handleAddPerson}
            className="flex-1 py-2 px-4 border-2 border-dashed border-amber-400 dark:border-amber-600 text-amber-700 dark:text-amber-300 rounded-lg hover:bg-amber-50 dark:hover:bg-slate-700 transition-colors"
          >
            + Add Person ({people.length}/4)
          </button>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-3 px-6 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-semibold rounded-lg shadow-md transition-colors"
        >
          {loading ? 'Calculating...' : 'Calculate Synastry'}
        </button>
      </div>
    </form>
  )
}
