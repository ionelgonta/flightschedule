/**
 * Weather Service - OpenWeatherMap API integration
 * Fetches weather data for Romanian and Moldovan cities
 * Caches data for 30 minutes to conserve API requests (1000 free requests/day)
 */

export interface WeatherData {
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
  // Smart flight impact analysis
  flightImpact: {
    severity: 'none' | 'low' | 'moderate' | 'high' | 'severe'
    factors: string[]
    alertMessage?: string
    delayProbability: number // 0-100%
  }
}

export interface WeatherResponse {
  success: boolean
  data?: WeatherData
  error?: string
}

// Romanian and Moldovan cities for weather data
const WEATHER_CITIES = [
  { name: 'Bucharest', country: 'RO', lat: 44.4268, lon: 26.1025 },
  { name: 'Cluj-Napoca', country: 'RO', lat: 46.7712, lon: 23.6236 },
  { name: 'Timisoara', country: 'RO', lat: 45.7489, lon: 21.2087 },
  { name: 'Iasi', country: 'RO', lat: 47.1585, lon: 27.6014 },
  { name: 'Constanta', country: 'RO', lat: 44.1598, lon: 28.6348 },
  { name: 'Craiova', country: 'RO', lat: 44.3302, lon: 23.7949 },
  { name: 'Brasov', country: 'RO', lat: 45.6427, lon: 25.5887 },
  { name: 'Galati', country: 'RO', lat: 45.4353, lon: 28.0080 },
  { name: 'Ploiesti', country: 'RO', lat: 44.9414, lon: 26.0063 },
  { name: 'Oradea', country: 'RO', lat: 47.0465, lon: 21.9189 },
  { name: 'Braila', country: 'RO', lat: 45.2692, lon: 27.9574 },
  { name: 'Arad', country: 'RO', lat: 46.1865, lon: 21.3122 },
  { name: 'Pitesti', country: 'RO', lat: 44.8565, lon: 24.8692 },
  { name: 'Sibiu', country: 'RO', lat: 45.7983, lon: 24.1256 },
  { name: 'Bacau', country: 'RO', lat: 46.5670, lon: 26.9146 },
  { name: 'Targu Mures', country: 'RO', lat: 46.5427, lon: 24.5574 },
  { name: 'Baia Mare', country: 'RO', lat: 47.6587, lon: 23.5681 },
  { name: 'Buzau', country: 'RO', lat: 45.1500, lon: 26.8333 },
  { name: 'Satu Mare', country: 'RO', lat: 47.7925, lon: 22.8847 },
  { name: 'Botosani', country: 'RO', lat: 47.7475, lon: 26.6561 },
  { name: 'Chisinau', country: 'MD', lat: 47.0105, lon: 28.8638 }
]

class WeatherService {
  private apiKey: string
  private baseUrl: string = 'https://api.openweathermap.org/data/2.5'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  /**
   * Fetch weather data for a specific city
   */
  async getWeatherForCity(cityName: string): Promise<WeatherResponse> {
    try {
      const city = WEATHER_CITIES.find(c => 
        c.name.toLowerCase() === cityName.toLowerCase() ||
        c.name.toLowerCase().includes(cityName.toLowerCase()) ||
        cityName.toLowerCase().includes(c.name.toLowerCase())
      )

      if (!city) {
        return {
          success: false,
          error: `City ${cityName} not found in supported cities list`
        }
      }

      const url = `${this.baseUrl}/weather?lat=${city.lat}&lon=${city.lon}&appid=${this.apiKey}&units=metric&lang=ro`
      
      console.log(`[Weather Service] Fetching weather for ${city.name}, ${city.country}`)
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`OpenWeatherMap API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      const weatherData: WeatherData = {
        city: city.name,
        country: city.country,
        temperature: Math.round(data.main.temp),
        humidity: data.main.humidity,
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        windSpeed: Math.round(data.wind?.speed * 3.6) || 0, // Convert m/s to km/h
        pressure: data.main.pressure,
        feelsLike: Math.round(data.main.feels_like),
        visibility: Math.round((data.visibility || 10000) / 1000), // Convert to km
        lastUpdated: new Date().toISOString(),
        flightImpact: this.analyzeFlightImpact(data)
      }

      return {
        success: true,
        data: weatherData
      }

    } catch (error) {
      console.error(`[Weather Service] Error fetching weather for ${cityName}:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Fetch weather data for all Romanian and Moldovan cities
   */
  async getAllWeatherData(): Promise<{ [cityName: string]: WeatherData }> {
    const weatherData: { [cityName: string]: WeatherData } = {}

    // Limit concurrent requests to avoid rate limiting
    const batchSize = 5
    const cities = [...WEATHER_CITIES]

    for (let i = 0; i < cities.length; i += batchSize) {
      const batch = cities.slice(i, i + batchSize)
      
      const batchPromises = batch.map(async (city) => {
        try {
          const result = await this.getWeatherForCity(city.name)
          if (result.success && result.data) {
            weatherData[city.name] = result.data
          }
        } catch (error) {
          console.error(`[Weather Service] Failed to fetch weather for ${city.name}:`, error)
        }
      })

      await Promise.all(batchPromises)
      
      // Small delay between batches to respect rate limits
      if (i + batchSize < cities.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    console.log(`[Weather Service] Successfully fetched weather for ${Object.keys(weatherData).length} cities`)
    return weatherData
  }

  /**
   * Get weather icon URL from OpenWeatherMap
   */
  getIconUrl(iconCode: string, size: '2x' | '4x' = '2x'): string {
    return `https://openweathermap.org/img/wn/${iconCode}@${size}.png`
  }

  /**
   * Get supported cities list
   */
  getSupportedCities(): typeof WEATHER_CITIES {
    return WEATHER_CITIES
  }

  /**
   * Find city by airport code (for integration with flight data)
   */
  getCityByAirportCode(airportCode: string): typeof WEATHER_CITIES[0] | undefined {
    const airportToCityMap: { [key: string]: string } = {
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

    const cityName = airportToCityMap[airportCode.toUpperCase()]
    if (!cityName) return undefined

    return WEATHER_CITIES.find(city => 
      city.name.toLowerCase() === cityName.toLowerCase()
    )
  }

  /**
   * Analyze weather impact on flight operations
   * Returns severity level and specific factors affecting flights
   */
  private analyzeFlightImpact(weatherData: any): WeatherData['flightImpact'] {
    const factors: string[] = []
    let severity: 'none' | 'low' | 'moderate' | 'high' | 'severe' = 'none'
    let delayProbability = 0
    let alertMessage: string | undefined

    // Wind analysis (most critical for flights)
    const windSpeed = Math.round((weatherData.wind?.speed || 0) * 3.6) // km/h
    if (windSpeed >= 70) {
      factors.push(`Vânt extrem de puternic (${windSpeed} km/h)`)
      severity = 'severe'
      delayProbability = Math.max(delayProbability, 85)
    } else if (windSpeed >= 50) {
      factors.push(`Vânt foarte puternic (${windSpeed} km/h)`)
      severity = severity === 'none' ? 'high' : severity
      delayProbability = Math.max(delayProbability, 65)
    } else if (windSpeed >= 35) {
      factors.push(`Vânt puternic (${windSpeed} km/h)`)
      severity = severity === 'none' ? 'moderate' : severity
      delayProbability = Math.max(delayProbability, 35)
    }

    // Visibility analysis (critical for takeoff/landing)
    const visibility = Math.round((weatherData.visibility || 10000) / 1000) // km
    if (visibility <= 0.5) {
      factors.push(`Vizibilitate foarte redusă (${visibility} km)`)
      severity = 'severe'
      delayProbability = Math.max(delayProbability, 90)
    } else if (visibility <= 1) {
      factors.push(`Vizibilitate redusă (${visibility} km)`)
      severity = severity === 'none' ? 'high' : severity
      delayProbability = Math.max(delayProbability, 70)
    } else if (visibility <= 3) {
      factors.push(`Vizibilitate limitată (${visibility} km)`)
      severity = severity === 'none' ? 'moderate' : severity
      delayProbability = Math.max(delayProbability, 40)
    }

    // Weather condition analysis
    const weatherMain = weatherData.weather[0]?.main?.toLowerCase() || ''
    const weatherDesc = weatherData.weather[0]?.description?.toLowerCase() || ''
    
    if (weatherMain === 'thunderstorm' || weatherDesc.includes('furtun')) {
      factors.push('Furtuni cu descărcări electrice')
      severity = 'severe'
      delayProbability = Math.max(delayProbability, 95)
    } else if (weatherMain === 'snow' || weatherDesc.includes('zăpadă')) {
      if (weatherDesc.includes('heavy') || weatherDesc.includes('abundent')) {
        factors.push('Ninsoare abundentă')
        severity = severity === 'none' ? 'high' : severity
        delayProbability = Math.max(delayProbability, 75)
      } else {
        factors.push('Ninsoare')
        severity = severity === 'none' ? 'moderate' : severity
        delayProbability = Math.max(delayProbability, 45)
      }
    } else if (weatherMain === 'rain' || weatherDesc.includes('ploaie')) {
      if (weatherDesc.includes('heavy') || weatherDesc.includes('torențial')) {
        factors.push('Ploaie torențială')
        severity = severity === 'none' ? 'moderate' : severity
        delayProbability = Math.max(delayProbability, 50)
      } else if (weatherDesc.includes('moderate')) {
        factors.push('Ploaie moderată')
        severity = severity === 'none' ? 'low' : severity
        delayProbability = Math.max(delayProbability, 25)
      }
    } else if (weatherMain === 'fog' || weatherMain === 'mist' || weatherDesc.includes('ceață')) {
      factors.push('Ceață densă')
      severity = severity === 'none' ? 'high' : severity
      delayProbability = Math.max(delayProbability, 80)
    }

    // Temperature extremes (affect aircraft performance)
    const temp = weatherData.main?.temp || 0
    if (temp <= -15) {
      factors.push(`Temperatură extremă (${Math.round(temp)}°C)`)
      severity = severity === 'none' ? 'moderate' : severity
      delayProbability = Math.max(delayProbability, 40)
    } else if (temp >= 40) {
      factors.push(`Temperatură extremă (${Math.round(temp)}°C)`)
      severity = severity === 'none' ? 'moderate' : severity
      delayProbability = Math.max(delayProbability, 35)
    }

    // Generate alert message based on severity
    if (severity === 'severe') {
      alertMessage = `Condiții meteo severe în ${weatherData.name || 'zonă'}. Întârzieri și anulări de zboruri foarte probabile.`
    } else if (severity === 'high') {
      alertMessage = `Condiții meteo nefavorabile în ${weatherData.name || 'zonă'}. Pot apărea întârzieri semnificative.`
    } else if (severity === 'moderate') {
      alertMessage = `Condiții meteo dificile în ${weatherData.name || 'zonă'}. Posibile întârzieri minore.`
    }

    return {
      severity,
      factors,
      alertMessage,
      delayProbability: Math.min(100, delayProbability)
    }
  }
}

export default WeatherService