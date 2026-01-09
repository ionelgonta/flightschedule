import { NextRequest, NextResponse } from 'next/server'
import { fixedCacheManager as cacheManager } from '@/lib/cacheManagerFixed'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const city = searchParams.get('city')

    // Initialize cache manager
    await cacheManager.initialize()

    // Get weather data from cache
    const weatherData = cacheManager.getCachedData<{ [cityName: string]: any }>('current_weather')

    console.log('[Weather API] Cache lookup result:', {
      hasWeatherData: !!weatherData,
      weatherDataKeys: weatherData ? Object.keys(weatherData) : [],
      requestedCity: city
    })

    if (!weatherData || Object.keys(weatherData).length === 0) {
      console.log('[Weather API] No weather data in cache, triggering manual refresh...')
      
      // Try to trigger a manual weather refresh
      try {
        await cacheManager.manualRefresh('weather')
        
        // Try to get data again after refresh
        const refreshedWeatherData = cacheManager.getCachedData<{ [cityName: string]: any }>('current_weather')
        
        if (refreshedWeatherData && Object.keys(refreshedWeatherData).length > 0) {
          console.log('[Weather API] Successfully refreshed weather data')
          
          // If specific city requested, return only that city's data
          if (city) {
            const cityData = Object.entries(refreshedWeatherData).find(([cityName]) => 
              cityName.toLowerCase() === city.toLowerCase() ||
              cityName.toLowerCase().includes(city.toLowerCase()) ||
              city.toLowerCase().includes(cityName.toLowerCase())
            )

            if (!cityData) {
              return NextResponse.json({
                success: false,
                error: `Date meteo pentru ${city} nu sunt disponibile`,
                data: null
              })
            }

            return NextResponse.json({
              success: true,
              data: cityData[1],
              city: cityData[0]
            })
          }

          // Return all weather data
          return NextResponse.json({
            success: true,
            data: refreshedWeatherData,
            count: Object.keys(refreshedWeatherData).length,
            lastUpdated: Object.values(refreshedWeatherData)[0]?.lastUpdated || null
          })
        }
      } catch (refreshError) {
        console.error('[Weather API] Failed to refresh weather data:', refreshError)
      }
      
      return NextResponse.json({
        success: false,
        error: 'Date meteo nu sunt disponibile momentan.',
        data: null
      })
    }

    // If specific city requested, return only that city's data
    if (city) {
      const cityData = Object.entries(weatherData).find(([cityName]) => 
        cityName.toLowerCase() === city.toLowerCase() ||
        cityName.toLowerCase().includes(city.toLowerCase()) ||
        city.toLowerCase().includes(cityName.toLowerCase())
      )

      if (!cityData) {
        return NextResponse.json({
          success: false,
          error: `Date meteo pentru ${city} nu sunt disponibile`,
          data: null
        })
      }

      return NextResponse.json({
        success: true,
        data: cityData[1],
        city: cityData[0]
      })
    }

    // Return all weather data
    return NextResponse.json({
      success: true,
      data: weatherData,
      count: Object.keys(weatherData).length,
      lastUpdated: Object.values(weatherData)[0]?.lastUpdated || null
    })

  } catch (error) {
    console.error('Error in weather API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Eroare internă de server',
        data: null
      },
      { status: 500 }
    )
  }
}

// POST endpoint removed to prevent manual weather refresh
// Weather data updates automatically every 30 minutes via cron job
// Manual refresh would consume API tokens unnecessarily