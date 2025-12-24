'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, Cloud, Wind, Eye, Thermometer, X } from 'lucide-react'

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
  flightImpact: {
    severity: 'none' | 'low' | 'moderate' | 'high' | 'severe'
    factors: string[]
    alertMessage?: string
    delayProbability: number
  }
}

interface WeatherAlertProps {
  airportCode: string
  className?: string
  onDismiss?: () => void
}

export default function WeatherAlert({ airportCode, className = '', onDismiss }: WeatherAlertProps) {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(false)

  // Airport to city mapping for weather lookup
  const getWeatherCity = (code: string): string => {
    const mapping: { [key: string]: string } = {
      'OTP': 'Bucharest',
      'BBU': 'Bucharest',
      'CLJ': 'Cluj-Napoca', 
      'TSR': 'Timisoara',
      'IAS': 'Iasi',
      'CND': 'Constanta',
      'CRA': 'Craiova',
      'SBZ': 'Sibiu',
      'BCM': 'Bacau',
      'BAY': 'Baia Mare',
      'OMR': 'Oradea',
      'SCV': 'Suceava',
      'TGM': 'Targu Mures',
      'ARW': 'Arad',
      'SUJ': 'Satu Mare',
      'RMO': 'Chisinau'
    }
    return mapping[code.toUpperCase()] || code
  }

  const loadWeatherData = async () => {
    try {
      setLoading(true)
      const city = getWeatherCity(airportCode)
      
      const response = await fetch(`/api/weather?city=${encodeURIComponent(city)}`)
      const data = await response.json()

      if (data.success && data.data) {
        setWeatherData(data.data)
      }
    } catch (error) {
      console.error('Error loading weather data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWeatherData()
  }, [airportCode])

  const handleDismiss = () => {
    setDismissed(true)
    onDismiss?.()
  }

  // Don't show if loading, dismissed, no data, or no significant weather impact
  if (loading || dismissed || !weatherData || weatherData.flightImpact.severity === 'none') {
    return null
  }

  const { flightImpact } = weatherData
  
  // Only show alerts for moderate, high, or severe conditions
  if (!['moderate', 'high', 'severe'].includes(flightImpact.severity)) {
    return null
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'severe': return 'bg-red-50 border-red-200 text-red-800'
      case 'high': return 'bg-orange-50 border-orange-200 text-orange-800'
      case 'moderate': return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      default: return 'bg-blue-50 border-blue-200 text-blue-800'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'severe': return <AlertTriangle className="h-5 w-5 text-red-600" />
      case 'high': return <AlertTriangle className="h-5 w-5 text-orange-600" />
      case 'moderate': return <Cloud className="h-5 w-5 text-yellow-600" />
      default: return <Cloud className="h-5 w-5 text-blue-600" />
    }
  }

  const getSeverityTitle = (severity: string) => {
    switch (severity) {
      case 'severe': return 'ALERTĂ METEO SEVERĂ'
      case 'high': return 'Alertă Meteo Importantă'
      case 'moderate': return 'Atenționare Meteo'
      default: return 'Informare Meteo'
    }
  }

  return (
    <div className={`rounded-lg border-2 p-4 mb-4 ${getSeverityColor(flightImpact.severity)} ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          {getSeverityIcon(flightImpact.severity)}
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm">
                {getSeverityTitle(flightImpact.severity)} - {weatherData.city}
              </h3>
              <button
                onClick={handleDismiss}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                title="Închide alerta"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            {flightImpact.alertMessage && (
              <p className="text-sm font-medium mb-3">
                {flightImpact.alertMessage}
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div className="flex items-center space-x-2 text-xs">
                <Thermometer className="h-4 w-4" />
                <span>{weatherData.temperature}°C (simte ca {weatherData.feelsLike}°C)</span>
              </div>
              
              <div className="flex items-center space-x-2 text-xs">
                <Wind className="h-4 w-4" />
                <span>Vânt: {weatherData.windSpeed} km/h</span>
              </div>
              
              <div className="flex items-center space-x-2 text-xs">
                <Eye className="h-4 w-4" />
                <span>Vizibilitate: {weatherData.visibility} km</span>
              </div>
              
              <div className="flex items-center space-x-2 text-xs">
                <Cloud className="h-4 w-4" />
                <span className="capitalize">{weatherData.description}</span>
              </div>
            </div>

            {flightImpact.factors.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium mb-1">Factori de risc:</p>
                <ul className="text-xs space-y-1">
                  {flightImpact.factors.map((factor, index) => (
                    <li key={index} className="flex items-center space-x-1">
                      <span className="w-1 h-1 bg-current rounded-full"></span>
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center justify-between text-xs">
              <span>
                Probabilitate întârzieri: <strong>{flightImpact.delayProbability}%</strong>
              </span>
              <span className="text-gray-600">
                Actualizat: {new Date(weatherData.lastUpdated).toLocaleTimeString('ro-RO', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}