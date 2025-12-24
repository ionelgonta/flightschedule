'use client'

import { useState, useEffect } from 'react'
import { Cloud, Droplets, Eye, Wind, Thermometer } from 'lucide-react'

interface WeatherData {
  city: string
  country: string
  temperature: number
  humidity: number
  description: string
  icon: string
  windSpeed: number
  pressure: number
  feelsLike: number
  visibility: number
  lastUpdated: string
}

interface WeatherWidgetProps {
  city?: string
  className?: string
  compact?: boolean
}

export default function WeatherWidget({ city = 'Bucharest', className = '', compact = false }: WeatherWidgetProps) {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)

  const loadWeatherData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/weather?city=${encodeURIComponent(city)}`)
      const data = await response.json()

      if (data.success && data.data) {
        setWeatherData(data.data)
      } else {
        setError(data.error || 'Nu s-au putut încărca datele meteo')
      }
    } catch (err) {
      console.error('Error loading weather data:', err)
      setError('Eroare de rețea la încărcarea datelor meteo')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setIsClient(true)
    loadWeatherData()
    const interval = setInterval(loadWeatherData, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [city])

  // Show loading during SSR
  if (!isClient) {
    return (
      <div className={`bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 p-4 ${className}`}>
        <div className="flex items-center space-x-2">
          <Cloud className="h-4 w-4 text-blue-600 animate-pulse" />
          <span className="text-sm text-blue-700">Se încarcă...</span>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={`bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 p-4 ${className}`}>
        <div className="flex items-center space-x-2">
          <Cloud className="h-4 w-4 text-blue-600 animate-pulse" />
          <span className="text-sm text-blue-700">Se încarcă...</span>
        </div>
      </div>
    )
  }

  if (error || !weatherData) {
    return (
      <div className={`bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 p-4 ${className}`}>
        <div className="flex items-center space-x-2">
          <Cloud className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600">
            {error || 'Meteo indisponibil'}
          </span>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Datele se actualizează automat la 30 min
        </div>
      </div>
    )
  }

  const getIconUrl = (iconCode: string) => {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`
  }

  const formatLastUpdated = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffMinutes < 1) return 'acum'
    if (diffMinutes < 60) return `acum ${diffMinutes} min`
    
    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `acum ${diffHours}h`
    
    return date.toLocaleDateString('ro-RO', { 
      day: 'numeric', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (compact) {
    return (
      <div className={`bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 p-3 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src={getIconUrl(weatherData.icon)} 
              alt={weatherData.description}
              className="w-8 h-8"
            />
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-semibold text-blue-900">
                  {weatherData.temperature}°C
                </span>
                <span className="text-xs text-blue-600 capitalize">
                  {weatherData.description}
                </span>
              </div>
              <div className="text-xs text-blue-700">
                {weatherData.city}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 text-xs text-blue-600">
            <div className="flex items-center space-x-1">
              <Droplets className="h-3 w-3" />
              <span>{weatherData.humidity}%</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Cloud className="h-5 w-5 text-blue-600" />
          <h3 className="text-sm font-medium text-blue-900">
            Meteo {weatherData.city}
          </h3>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <img 
            src={getIconUrl(weatherData.icon)} 
            alt={weatherData.description}
            className="w-12 h-12"
          />
          <div>
            <div className="text-2xl font-bold text-blue-900">
              {weatherData.temperature}°C
            </div>
            <div className="text-sm text-blue-700 capitalize">
              {weatherData.description}
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-sm text-blue-600">
            Simte ca {weatherData.feelsLike}°C
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="flex items-center space-x-2 text-blue-700">
          <Droplets className="h-4 w-4" />
          <span>Umiditate: {weatherData.humidity}%</span>
        </div>
        
        <div className="flex items-center space-x-2 text-blue-700">
          <Wind className="h-4 w-4" />
          <span>Vânt: {weatherData.windSpeed} km/h</span>
        </div>
        
        <div className="flex items-center space-x-2 text-blue-700">
          <Thermometer className="h-4 w-4" />
          <span>Presiune: {weatherData.pressure} hPa</span>
        </div>
        
        <div className="flex items-center space-x-2 text-blue-700">
          <Eye className="h-4 w-4" />
          <span>Vizibilitate: {weatherData.visibility} km</span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-blue-200">
        <div className="text-xs text-blue-600">
          Actualizat: {formatLastUpdated(weatherData.lastUpdated)} • 
          <span className="ml-1">Se actualizează automat la 30 min</span>
        </div>
      </div>
    </div>
  )
}