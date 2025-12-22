import { Metadata } from 'next'
import Link from 'next/link'
import { TrendingUp, Calendar, BarChart3, Clock } from 'lucide-react'
import { MAJOR_AIRPORTS, generateAirportSlug } from '@/lib/airports'
import { AdBanner } from '@/components/ads/AdBanner'
import { Breadcrumbs } from '@/components/seo/Breadcrumbs'
import { StructuredData, generateBreadcrumbSchema } from '@/components/seo/StructuredData'

export const metadata: Metadata = {
  title: 'Analize Istorice Zboruri România - Tendințe și Evoluție Aeroporturi',
  description: 'Analize istorice complete pentru zborurile din România și Moldova. Urmărește tendințele, evoluția traficului aerian, sezonalitatea și performanța pe termen lung pentru OTP, CLJ, TSR, IAS, RMO și toate aeroporturile naționale.',
  keywords: [
    'analize istorice zboruri romania',
    'tendinte trafic aerian romania',
    'evolutie aeroporturi romania',
    'sezonalitate zboruri',
    'istoric performanta aeroporturi',
    'analize temporale zboruri',
    'statistici pe termen lung',
    'crestere trafic aerian romania'
  ],
  openGraph: {
    title: 'Analize Istorice Zboruri România - Tendințe și Evoluție',
    description: 'Analize istorice complete cu tendințe și evoluția traficului aerian pentru toate aeroporturile din România și Moldova.',
    type: 'website',
    url: 'https://anyway.ro/analize-istorice'
  },
  alternates: {
    canonical: '/analize-istorice',
  },
}

export default function AnalizeIstoricePage() {
  const romanianAirports = MAJOR_AIRPORTS.filter(a => a.country === 'România')
  const moldovanAirports = MAJOR_AIRPORTS.filter(a => a.country === 'Moldova')

  const breadcrumbItems = [
    { name: 'Analize', href: '/analize' },
    { name: 'Analize Istorice' }
  ]

  const historicalSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Analize Istorice Zboruri România',
    description: 'Analize istorice complete cu tendințe și evoluția traficului aerian pentru aeroporturile românești',
    url: 'https://anyway.ro/analize-istorice',
    mainEntity: {
      '@type': 'Service',
      name: 'Analize Istorice Trafic Aerian',
      description: 'Urmărirea tendințelor, evoluției și sezonalității traficului aerian din România pe termen lung',
      provider: {
        '@type': 'Organization',
        name: 'Orarul Zborurilor România'
      }
    }
  }

  return (
    <>
      <StructuredData data={historicalSchema} />
      <StructuredData data={generateBreadcrumbSchema([
        { name: 'Acasă', url: 'https://anyway.ro' },
        { name: 'Analize', url: 'https://anyway.ro/analize' },
        { name: 'Analize Istorice', url: 'https://anyway.ro/analize-istorice' }
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
        <section className="bg-gradient-to-br from-purple-600 to-purple-800 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-white/10 rounded-full">
                  <TrendingUp className="h-12 w-12" />
                </div>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold mb-6">
                Analize Istorice Zboruri România
              </h1>
              <p className="text-xl text-purple-100 mb-8 max-w-3xl mx-auto">
                Urmărește tendințele și evoluția traficului aerian din România și Moldova pe termen lung. 
                Analize detaliate de sezonalitate, creștere și performanță istorică.
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
              {/* Analysis Types Overview */}
              <section>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                  Tipuri de Analize Istorice Disponibile
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg border border-purple-200 dark:border-purple-700 p-6">
                    <div className="flex items-start space-x-4">
                      <div className="p-3 bg-purple-600 rounded-lg">
                        <TrendingUp className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-purple-800 dark:text-purple-200 mb-2">
                          Tendințe Trafic Aerian
                        </h3>
                        <p className="text-sm text-purple-700 dark:text-purple-300 mb-3">
                          Evoluția numărului de zboruri, pasageri și destinații pe luni, trimestre și ani
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-700 p-6">
                    <div className="flex items-start space-x-4">
                      <div className="p-3 bg-blue-600 rounded-lg">
                        <Calendar className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-blue-800 dark:text-blue-200 mb-2">
                          Analize Sezonale
                        </h3>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                          Identificarea perioadelor de vârf, sezonalitatea destinațiilor și fluctuațiile anuale
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border border-green-200 dark:border-green-700 p-6">
                    <div className="flex items-start space-x-4">
                      <div className="p-3 bg-green-600 rounded-lg">
                        <BarChart3 className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-green-800 dark:text-green-200 mb-2">
                          Performanță pe Termen Lung
                        </h3>
                        <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                          Evoluția punctualității, întârzierilor și eficienței operaționale în timp
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg border border-orange-200 dark:border-orange-700 p-6">
                    <div className="flex items-start space-x-4">
                      <div className="p-3 bg-orange-600 rounded-lg">
                        <Clock className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-orange-800 dark:text-orange-200 mb-2">
                          Comparații Temporale
                        </h3>
                        <p className="text-sm text-orange-700 dark:text-orange-300 mb-3">
                          Compararea performanței între diferite perioade și identificarea îmbunătățirilor
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

              {/* Data Availability Notice */}
              <section className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-6">
                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-amber-100 dark:bg-amber-800 rounded-lg">
                    <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">
                      Disponibilitatea Datelor Istorice
                    </h3>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                      Analizele istorice sunt disponibile doar pentru aeroporturile cu suficiente date colectate în timp. 
                      Pentru aeroporturile cu date limitate, va fi afișat mesajul "Nu sunt suficiente date pentru a afișa această informație".
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      Datele istorice se actualizează automat pe măsură ce colectăm mai multe informații despre zboruri.
                    </p>
                  </div>
                </div>
              </section>

              {/* Romanian Airports */}
              <section>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                  Analize Istorice - Aeroporturi România
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {romanianAirports.map((airport) => (
                    <Link
                      key={airport.code}
                      href={`/aeroport/${generateAirportSlug(airport)}/istoric-zboruri`}
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
                          <TrendingUp className="h-4 w-4 text-purple-500" />
                          <span className="text-gray-600 dark:text-gray-400">Tendințe Trafic</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2 text-sm">
                          <Calendar className="h-4 w-4 text-blue-500" />
                          <span className="text-gray-600 dark:text-gray-400">Analize Sezonale</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2 text-sm">
                          <BarChart3 className="h-4 w-4 text-green-500" />
                          <span className="text-gray-600 dark:text-gray-400">Performanță Istorică</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>

              {/* Moldovan Airports */}
              <section>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                  Analize Istorice - Aeroporturi Moldova
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {moldovanAirports.map((airport) => (
                    <Link
                      key={airport.code}
                      href={`/aeroport/${generateAirportSlug(airport)}/istoric-zboruri`}
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
                          <TrendingUp className="h-4 w-4 text-purple-500" />
                          <span className="text-gray-600 dark:text-gray-400">Tendințe Trafic</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2 text-sm">
                          <Calendar className="h-4 w-4 text-blue-500" />
                          <span className="text-gray-600 dark:text-gray-400">Analize Sezonale</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2 text-sm">
                          <BarChart3 className="h-4 w-4 text-green-500" />
                          <span className="text-gray-600 dark:text-gray-400">Performanță Istorică</span>
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
                    href="/aeroport/bucuresti-henri-coanda/istoric-zboruri"
                    className="block p-3 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-sm"
                  >
                    <div className="font-medium">OTP - București</div>
                    <div className="text-xs text-gray-500">Analize Istorice</div>
                  </Link>
                  <Link
                    href="/aeroport/cluj-napoca/istoric-zboruri"
                    className="block p-3 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-sm"
                  >
                    <div className="font-medium">CLJ - Cluj-Napoca</div>
                    <div className="text-xs text-gray-500">Analize Istorice</div>
                  </Link>
                  <Link
                    href="/aeroport/timisoara-traian-vuia/istoric-zboruri"
                    className="block p-3 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-sm"
                  >
                    <div className="font-medium">TSR - Timișoara</div>
                    <div className="text-xs text-gray-500">Analize Istorice</div>
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