import { Metadata } from 'next'
import Link from 'next/link'
import { Calendar, Clock, Filter, Plane } from 'lucide-react'
import { MAJOR_AIRPORTS, generateAirportSlug } from '@/lib/airports'
import { AdBanner } from '@/components/ads/AdBanner'
import { Breadcrumbs } from '@/components/seo/Breadcrumbs'
import { StructuredData, generateBreadcrumbSchema } from '@/components/seo/StructuredData'

export const metadata: Metadata = {
  title: 'Program Zboruri România - Calendar Interactiv Toate Aeroporturile',
  description: 'Program complet de zboruri pentru toate aeroporturile din România și Moldova. Calendar interactiv cu filtre avansate pentru dată, companie aeriană, destinație și status. Planifică călătoriile cu informații actualizate pentru OTP, CLJ, TSR, IAS, RMO.',
  keywords: [
    'program zboruri romania',
    'calendar zboruri',
    'program aeroporturi romania',
    'zboruri otopeni program',
    'zboruri cluj program',
    'program zboruri timisoara',
    'program zboruri iasi',
    'program zboruri chisinau',
    'calendar interactiv zboruri',
    'filtre zboruri romania'
  ],
  openGraph: {
    title: 'Program Zboruri România - Calendar Interactiv Toate Aeroporturile',
    description: 'Program complet de zboruri cu calendar interactiv și filtre avansate pentru toate aeroporturile din România și Moldova.',
    type: 'website',
    url: 'https://anyway.ro/program-zboruri'
  },
  alternates: {
    canonical: '/program-zboruri',
  },
}

export default function ProgramZboruriPage() {
  const romanianAirports = MAJOR_AIRPORTS.filter(a => a.country === 'România')
  const moldovanAirports = MAJOR_AIRPORTS.filter(a => a.country === 'Moldova')

  const breadcrumbItems = [
    { name: 'Analize', href: '/analize' },
    { name: 'Program Zboruri' }
  ]

  const scheduleSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Program Zboruri România',
    description: 'Program complet de zboruri cu calendar interactiv pentru toate aeroporturile din România și Moldova',
    url: 'https://anyway.ro/program-zboruri',
    mainEntity: {
      '@type': 'Service',
      name: 'Program Zboruri Interactiv',
      description: 'Calendar interactiv cu filtre avansate pentru programul zborurilor din aeroporturile românești',
      provider: {
        '@type': 'Organization',
        name: 'Orarul Zborurilor România'
      }
    }
  }

  return (
    <>
      <StructuredData data={scheduleSchema} />
      <StructuredData data={generateBreadcrumbSchema([
        { name: 'Acasă', url: 'https://anyway.ro' },
        { name: 'Analize', url: 'https://anyway.ro/analize' },
        { name: 'Program Zboruri', url: 'https://anyway.ro/program-zboruri' }
      ])} />
      
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
                  <Calendar className="h-12 w-12" />
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Program Zboruri România
              </h1>
              <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
                Calendar interactiv cu programul complet de zboruri pentru toate aeroporturile din România și Moldova. 
                Filtrează după dată, companie aeriană, destinație și status.
              </p>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Breadcrumbs */}
          <Breadcrumbs items={breadcrumbItems} className="mb-8" />
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-12">
              {/* Features Overview */}
              <section>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                  Funcționalități Program Zboruri
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-700 p-6">
                    <div className="flex items-start space-x-4">
                      <div className="p-3 bg-blue-600 rounded-lg">
                        <Calendar className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-blue-800 dark:text-blue-200 mb-2">
                          Calendar Interactiv
                        </h3>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                          Navighează prin zile, săptămâni și luni pentru a vedea programul complet de zboruri
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border border-green-200 dark:border-green-700 p-6">
                    <div className="flex items-start space-x-4">
                      <div className="p-3 bg-green-600 rounded-lg">
                        <Filter className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-green-800 dark:text-green-200 mb-2">
                          Filtre Avansate
                        </h3>
                        <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                          Filtrează după companie aeriană, destinație, tip zbor și interval orar
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg border border-purple-200 dark:border-purple-700 p-6">
                    <div className="flex items-start space-x-4">
                      <div className="p-3 bg-purple-600 rounded-lg">
                        <Clock className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-purple-800 dark:text-purple-200 mb-2">
                          Informații Detaliate
                        </h3>
                        <p className="text-sm text-purple-700 dark:text-purple-300 mb-3">
                          Orare programate, estimate, terminale, porți și statusuri actualizate
                        </p>
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
                          Export și Partajare
                        </h3>
                        <p className="text-sm text-orange-700 dark:text-orange-300 mb-3">
                          Exportă programul în calendar personal sau partajează link-uri specifice
                        </p>
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
                  Program Zboruri - Aeroporturi România
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {romanianAirports.map((airport) => (
                    <Link
                      key={airport.code}
                      href={`/aeroport/${generateAirportSlug(airport)}/program-zboruri`}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-200 hover:scale-105"
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
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-center space-x-2 text-sm">
                          <Calendar className="h-4 w-4 text-blue-500" />
                          <span className="text-gray-600 dark:text-gray-400">Calendar Interactiv</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2 text-sm">
                          <Filter className="h-4 w-4 text-green-500" />
                          <span className="text-gray-600 dark:text-gray-400">Filtre Avansate</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2 text-sm">
                          <Clock className="h-4 w-4 text-purple-500" />
                          <span className="text-gray-600 dark:text-gray-400">Timp Real</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>

              {/* Moldovan Airports */}
              <section>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                  Program Zboruri - Aeroporturi Moldova
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {moldovanAirports.map((airport) => (
                    <Link
                      key={airport.code}
                      href={`/aeroport/${generateAirportSlug(airport)}/program-zboruri`}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-200 hover:scale-105"
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
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-center space-x-2 text-sm">
                          <Calendar className="h-4 w-4 text-blue-500" />
                          <span className="text-gray-600 dark:text-gray-400">Calendar Interactiv</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2 text-sm">
                          <Filter className="h-4 w-4 text-green-500" />
                          <span className="text-gray-600 dark:text-gray-400">Filtre Avansate</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2 text-sm">
                          <Clock className="h-4 w-4 text-purple-500" />
                          <span className="text-gray-600 dark:text-gray-400">Timp Real</span>
                        </div>
                      </div>
                    </Link>
                  ))}
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
              
              {/* Quick Access */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Acces Rapid
                </h3>
                <div className="space-y-3">
                  <Link
                    href="/aeroport/bucuresti-henri-coanda/program-zboruri"
                    className="block p-3 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-sm"
                  >
                    <div className="font-medium">OTP - București</div>
                    <div className="text-xs text-gray-500">Henri Coandă</div>
                  </Link>
                  <Link
                    href="/aeroport/cluj-napoca/program-zboruri"
                    className="block p-3 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-sm"
                  >
                    <div className="font-medium">CLJ - Cluj-Napoca</div>
                    <div className="text-xs text-gray-500">Avram Iancu</div>
                  </Link>
                  <Link
                    href="/aeroport/timisoara-traian-vuia/program-zboruri"
                    className="block p-3 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-sm"
                  >
                    <div className="font-medium">TSR - Timișoara</div>
                    <div className="text-xs text-gray-500">Traian Vuia</div>
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
    </>
  )
}