import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getAirportByCodeOrSlug, generateAirportSlug } from '@/lib/airports'
import { AdBanner } from '@/components/ads/AdBanner'
import WeatherWidget from '@/components/weather/WeatherWidget'
import WeatherAlert from '@/components/weather/WeatherAlert'
import { getWeatherCityForAirport } from '@/lib/weatherUtils'
import { ArrowLeft, Plane } from 'lucide-react'
import ClientOnlyFlightList from '@/components/flights/ClientOnlyFlightList'

interface ArrivalsPageProps {
  params: {
    code: string
  }
}

export default function ArrivalsPage({ params }: ArrivalsPageProps) {
  const airport = getAirportByCodeOrSlug(params.code)

  if (!airport) {
    notFound()
  }

  const weatherCity = getWeatherCityForAirport(airport.code)

  return (
    <div className="min-h-screen">
      {/* Header Banner Ad */}
      <div className="bg-white border-b border-gray-200">
        <AdBanner 
          slot="header-banner"
          size="728x90"
          className="max-w-7xl mx-auto py-2"
        />
      </div>

      {/* Page Header - Compact */}
      <section className="bg-green-600 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3 mb-4">
            <Link
              href={`/aeroport/${generateAirportSlug(airport)}`}
              className="flex items-center space-x-2 text-green-100 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Înapoi la {airport.city}</span>
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-bold mb-2">
                Sosiri - {airport.city}
              </h1>
              <p className="text-green-100 text-sm">
                {airport.city} - {airport.name}, {airport.country}
              </p>
            </div>
          </div>
          
          {/* Quick Navigation - Added higher up */}
          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <Link
              href={`/aeroport/${generateAirportSlug(airport)}/plecari`}
              className="bg-white text-green-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center justify-center space-x-1 text-sm"
            >
              <Plane className="h-3 w-3" />
              <span>Vezi Plecări</span>
            </Link>
            <Link
              href={`/aeroport/${generateAirportSlug(airport)}`}
              className="border border-white text-white px-4 py-2 rounded-lg font-medium hover:bg-white/10 transition-colors flex items-center justify-center space-x-1 text-sm"
            >
              <span>Prezentare Aeroport</span>
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Weather Alert - Show at the top if weather impacts flights */}
        <WeatherAlert airportCode={airport.code} className="mb-6" />
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Client-side flight list */}
            <ClientOnlyFlightList
              airportCode={airport.code}
              type="arrivals"
              viewMode="list"
            />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Weather Widget */}
            <WeatherWidget city={weatherCity} />
            
            {/* Sidebar Ad */}
            <AdBanner 
              slot="sidebar-right"
              size="300x600"
            />
            
            {/* Quick Links - Compact */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Linkuri Rapide
              </h3>
              <div className="space-y-2">
                <Link
                  href={`/aeroport/${generateAirportSlug(airport)}/plecari`}
                  className="block w-full text-left px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-xs"
                >
                  Vezi Plecări
                </Link>
                <Link
                  href={`/aeroport/${generateAirportSlug(airport)}`}
                  className="block w-full text-left px-3 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors text-xs"
                >
                  Prezentare Aeroport
                </Link>
              </div>
            </div>

            {/* Sidebar Square Ad */}
            <AdBanner 
              slot="sidebar-square"
              size="300x250"
            />
          </div>
        </div>
      </div>
    </div>
  )
}