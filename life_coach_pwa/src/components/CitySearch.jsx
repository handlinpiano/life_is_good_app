import { useState, useMemo, useRef, useEffect } from 'react'
import { City, Country } from 'country-state-city'

// Get all cities once on load
const allCities = City.getAllCities()

export default function CitySearch({ onSelect, value }) {
  const [query, setQuery] = useState(value || '')
  const [isOpen, setIsOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  // Filter cities based on query
  const filteredCities = useMemo(() => {
    if (!query || query.length < 2) return []

    const lowerQuery = query.toLowerCase()
    return allCities
      .filter(city =>
        city.name.toLowerCase().startsWith(lowerQuery) ||
        city.name.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 15) // Limit results
      .map(city => {
        const country = Country.getCountryByCode(city.countryCode)
        return {
          ...city,
          countryName: country?.name || city.countryCode,
        }
      })
  }, [query])

  // Reset highlight when results change
  useEffect(() => {
    setHighlighted(0)
  }, [filteredCities])

  const handleKeyDown = (e) => {
    if (!isOpen) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlighted(prev => Math.min(prev + 1, filteredCities.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlighted(prev => Math.max(prev - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (filteredCities[highlighted]) {
          selectCity(filteredCities[highlighted])
        }
        break
      case 'Escape':
        setIsOpen(false)
        break
    }
  }

  const selectCity = (city) => {
    const displayName = `${city.name}, ${city.countryName}`
    setQuery(displayName)
    setIsOpen(false)
    onSelect({
      name: displayName,
      latitude: parseFloat(city.latitude),
      longitude: parseFloat(city.longitude),
    })
  }

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-amber-800 mb-1">
        Birth Place
      </label>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setIsOpen(true)
          setHighlighted(0)
        }}
        onFocus={() => query.length >= 2 && setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
        onKeyDown={handleKeyDown}
        placeholder="Search for a city..."
        className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-amber-50"
      />

      {/* Dropdown */}
      {isOpen && filteredCities.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-50 w-full mt-1 bg-white border border-amber-200 rounded-lg shadow-lg max-h-60 overflow-auto"
        >
          {filteredCities.map((city, idx) => (
            <li
              key={`${city.name}-${city.stateCode}-${city.countryCode}`}
              className={`px-3 py-2 cursor-pointer flex justify-between ${
                idx === highlighted
                  ? 'bg-amber-100 text-amber-900'
                  : 'hover:bg-amber-50'
              }`}
              onMouseEnter={() => setHighlighted(idx)}
              onMouseDown={() => selectCity(city)}
            >
              <span>
                <span className="font-medium">{city.name}</span>
                {city.stateCode && (
                  <span className="text-amber-600 text-sm ml-1">
                    {city.stateCode}
                  </span>
                )}
              </span>
              <span className="text-amber-500 text-sm">
                {city.countryName}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* No results message */}
      {isOpen && query.length >= 2 && filteredCities.length === 0 && (
        <div className="absolute z-50 w-full mt-1 p-3 bg-white border border-amber-200 rounded-lg shadow-lg text-amber-600 text-sm">
          No cities found. Enter coordinates manually below.
        </div>
      )}
    </div>
  )
}
