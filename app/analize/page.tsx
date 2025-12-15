import { Metadata } from 'next'
import Link from 'next/link'
import { BarChart3, Clock, TrendingUp, Plane, MapPin, Building } from 'lucide-react'
import { MAJOR_AIRPORTS, generateAirportSlug } from '@/lib/airports'
import { AdBanner } from '@/components/ads/AdBanner'

export const metadata: Metadata = {
  title: 'Analize și Statistici Zboruri România - Toate Aeroporturile',
  description: 'Analize complete și statistici detaliate pentru toate aeroporturile din România și Moldova. Statistici performanță, program zboruri, analize istorice și catalog aeronave.',
  keywords: [
    'analize zboruri romania',
    'statistici aeroporturi romania',
    'performanta zboruri',
    'program zboruri romania',
    'analize aviatie',
    'statistici punctualitate'
  ],
  openGraph: {
    title: 'Analize și Statistici Zboruri România - Toate Aeroporturile',
    description: 'Analize complete și statistici detaliate pentru toate aeroporturile din România și Moldova.',
    type: 'website',
  },
  alternates: {
    canonical: '/analize',
  },
}

export default function AnalyzePage() {
  const romanianAirports = MAJOR_AIRPORTS.filter(a => a.country === 'România')
  const moldovanAirports = MAJOR_AIRPORTS.filter(a => a.country === 'Moldova')

  return (
    <div className="min-h-screen">
      {/* Header Banner Ad */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <AdBanner 
          slot="header-banner"
          size="728x90"
          className="max-w-7xl mx-auto py-4"
        />
      </div>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-white/10 rounded-full">
                <BarChart3 className="h-12 w-12" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Analize și Statistici Zboruri
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Explorează analize detaliate și statistici complete pentru toate aeroporturile din România și Moldova. 
              Alege aeroportul care te interesează pentru a vedea date specifice.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-12">
            {/* Analytics Categories */}
            <section>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                Tipuri de Analize Disponibile
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border border-green-200 dark:border-green-700 p-6">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-green-600 rounded-lg">
                      <Building className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-green-800 dark:text-green-200 mb-2">
                        Statistici Aeroporturi
                      </h3>
                      <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                        Indice întârzieri, performanță la timp, ore de vârf și distribuția statusurilor pentru fiecare aeroport
                      </p>
                      <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                        Disponibil pentru toate aeroporturile →
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-700 p-6">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-blue-600 rounded-lg">
                      <Clock className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-blue-800 dark:text-blue-200 mb-2">
                        Program Zboruri
                      </h3>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                        Calendar interactiv cu filtre pentru zboruri: dată, companie aeriană, destinație și status
                      </p>
                      <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                        Filtrare avansată disponibilă →
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg border border-purple-200 dark:border-purple-700 p-6">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-purple-600 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-purple-800 dark:text-purple-200 mb-2">
                        Analize Istorice
                      </h3>
                      <p className="text-sm text-purple-700 dark:text-purple-300 mb-3">
                        Tendințe și evoluție în timp: volum trafic, întârzieri medii și performanță pe perioade
                      </p>
                      <div className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                        Până la 365 de zile istoric →
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg border border-orange-200 dark:border-orange-700 p-6">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-orange-600 rounded-lg">
                      <Plane className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-orange-800 dark:text-orange-200 mb-2">
                        Analize Rute
                      </h3>
                      <p className="text-sm text-orange-700 dark:text-orange-300 mb-3">
                        Rute frecvente, companii aeriene, punctualitate pe destinații și analize comparative
                      </p>
                      <div className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                        Top destinații și companii →
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Inline Banner Ad */}
            <div className="py-8">
              <AdBanner 
                slot="inline-banner"
                size="728x90"
                className="mx-auto"
              />
            </div>

            {/* Romanian Airports */}
            <section>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                Aeroporturi din România
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {romanianAirports.map((airport) => (
                  <div
                    key={airport.code}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="text-center mb-4">
                      <div className="text-lg font-bold text-primary-600 dark:text-primary-400 mb-2">
                        {airport.city}
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {airport.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Cod: {airport.code}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Link
                        href={`/aeroport/${generateAirportSlug(airport)}/statistici`}
                        className="block w-full text-center px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors text-sm"
                      >
                        Statistici
                      </Link>
                      <Link
                        href={`/aeroport/${generateAirportSlug(airport)}/program-zboruri`}
                        className="block w-full text-center px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-sm"
                      >
                        Program Zboruri
                      </Link>
                      <Link
                        href={`/aeroport/${generateAirportSlug(airport)}/istoric-zboruri`}
                        className="block w-full text-center px-3 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors text-sm"
                      >
                        Istoric
                      </Link>
                      <Link
                        href={`/aeroport/${generateAirportSlug(airport)}/analize-zboruri`}
                        className="block w-full text-center px-3 py-2 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors text-sm"
                      >
                        Analize Rute
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Moldovan Airports */}
            <section>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                Aeroporturi din Moldova
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {moldovanAirports.map((airport) => (
                  <div
                    key={airport.code}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="text-center mb-4">
                      <div className="text-lg font-bold text-primary-600 dark:text-primary-400 mb-2">
                        {airport.city}
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {airport.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Cod: {airport.code}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Link
                        href={`/aeroport/${generateAirportSlug(airport)}/statistici`}
                        className="block w-full text-center px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors text-sm"
                      >
                        Statistici
                      </Link>
                      <Link
                        href={`/aeroport/${generateAirportSlug(airport)}/program-zboruri`}
                        className="block w-full text-center px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-sm"
                      >
                        Program Zboruri
                      </Link>
                      <Link
                        href={`/aeroport/${generateAirportSlug(airport)}/istoric-zboruri`}
                        className="block w-full text-center px-3 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors text-sm"
                      >
                        Istoric
                      </Link>
                      <Link
                        href={`/aeroport/${generateAirportSlug(airport)}/analize-zboruri`}
                        className="block w-full text-center px-3 py-2 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors text-sm"
                      >
                        Analize Rute
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Aircraft Catalog Section */}
            <section>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                Catalog Aeronave
              </h2>
              <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20 rounded-lg border border-cyan-200 dark:border-cyan-700 p-8">
                <div className="flex items-start space-x-6">
                  <div className="p-4 bg-cyan-600 rounded-lg">
                    <Plane className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-cyan-800 dark:text-cyan-200 mb-4">
                      Explorează Catalogul de Aeronave
                    </h3>
                    <p className="text-cyan-700 dark:text-cyan-300 mb-6">
                      Căutare aeronave după ICAO24 sau înmatriculare, istoric zboruri, statistici de performanță 
                      și informații detaliate despre fiecare aeronavă.
                    </p>
                    <Link
                      href="/aeronave"
                      className="inline-flex items-center px-6 py-3 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-700 transition-colors"
                    >
                      <Plane className="h-5 w-5 mr-2" />
                      Accesează Catalogul
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-8">
            {/* Sidebar Ad */}
            <AdBanner 
              slot="sidebar-right"
              size="300x600"
            />
            
            {/* Quick Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Statistici Platformă
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Aeroporturi Analizate</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{MAJOR_AIRPORTS.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Țări Acoperite</span>
                  <span className="font-semibold text-gray-900 dark:text-white">2</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Tipuri Analize</span>
                  <span className="font-semibold text-gray-900 dark:text-white">4</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Catalog Aeronave</span>
                  <span className="font-semibold text-gray-900 dark:text-white">Da</span>
                </div>
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