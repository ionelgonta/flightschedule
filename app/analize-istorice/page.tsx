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
        <div className="bg-white border-b border-gray-200">
          <AdBanner 
            slot="header-banner"
            size="728x90"
            className="max-w-7xl mx-auto py-2"
          />
        </div>

        {/* Hero Section */}
        <section className="bg-white border-b border-gray-200 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold mb-4 text-gray-900">
                Analize Istorice Zboruri România
              </h1>
              <p className="text-base text-gray-600 mb-6 max-w-2xl mx-auto">
                Urmărește tendințele și evoluția traficului aerian din România și Moldova pe termen lung. 
                Analize detaliate de sezonalitate, creștere și performanță istorică.
              </p>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumbs */}
          <Breadcrumbs items={breadcrumbItems} className="mb-6" />
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-8">
              {/* Analysis Types Overview */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Tipuri de Analize Istorice Disponibile
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-purple-50 rounded-lg border border-purple-200 p-4">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-purple-600 rounded-lg">
                        <TrendingUp className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-purple-800 mb-1 text-sm">
                          Tendințe Trafic Aerian
                        </h3>
                        <p className="text-xs text-purple-700">
                          Evoluția numărului de zboruri, pasageri și destinații pe luni, trimestre și ani
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-blue-600 rounded-lg">
                        <Calendar className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-blue-800 mb-1 text-sm">
                          Analize Sezonale
                        </h3>
                        <p className="text-xs text-blue-700">
                          Identificarea perioadelor de vârf, sezonalitatea destinațiilor și fluctuațiile anuale
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg border border-green-200 p-4">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-green-600 rounded-lg">
                        <BarChart3 className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-green-800 mb-1 text-sm">
                          Performanță pe Termen Lung
                        </h3>
                        <p className="text-xs text-green-700">
                          Evoluția punctualității, întârzierilor și eficienței operaționale în timp
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-orange-50 rounded-lg border border-orange-200 p-4">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-orange-600 rounded-lg">
                        <Clock className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-orange-800 mb-1 text-sm">
                          Comparații Temporale
                        </h3>
                        <p className="text-xs text-orange-700">
                          Compararea performanței între diferite perioade și identificarea îmbunătățirilor
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Inline Banner Ad */}
              <div className="py-6">
                <AdBanner 
                  slot="inline-banner"
                  size="728x90"
                  className="mx-auto"
                />
              </div>

              {/* Data Availability Notice */}
              <section className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="p-1 bg-amber-100 rounded-lg">
                    <Clock className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-amber-800 mb-2 text-sm">
                      Disponibilitatea Datelor Istorice
                    </h3>
                    <p className="text-xs text-amber-700 mb-2">
                      Analizele istorice sunt disponibile doar pentru aeroporturile cu suficiente date colectate în timp. 
                      Pentru aeroporturile cu date limitate, va fi afișat mesajul "Nu sunt suficiente date pentru a afișa această informație".
                    </p>
                    <p className="text-xs text-amber-600">
                      Datele istorice se actualizează automat pe măsură ce colectăm mai multe informații despre zboruri.
                    </p>
                  </div>
                </div>
              </section>

              {/* Romanian Airports */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Analize Istorice - Aeroporturi România
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {romanianAirports.map((airport) => (
                    <Link
                      key={airport.code}
                      href={`/aeroport/${generateAirportSlug(airport)}/istoric-zboruri`}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all duration-200 hover:scale-105"
                    >
                      <div className="text-center mb-3">
                        <div className="text-base font-bold text-blue-600 mb-1">
                          {airport.city}
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1 text-sm">
                          {airport.name}
                        </h3>
                        <p className="text-xs text-gray-600 mb-3">
                          Cod: {airport.code}
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-center space-x-2 text-xs">
                          <TrendingUp className="h-3 w-3 text-purple-500" />
                          <span className="text-gray-600">Tendințe Trafic</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2 text-xs">
                          <Calendar className="h-3 w-3 text-blue-500" />
                          <span className="text-gray-600">Analize Sezonale</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2 text-xs">
                          <BarChart3 className="h-3 w-3 text-green-500" />
                          <span className="text-gray-600">Performanță Istorică</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>

              {/* Moldovan Airports */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Analize Istorice - Aeroporturi Moldova
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {moldovanAirports.map((airport) => (
                    <Link
                      key={airport.code}
                      href={`/aeroport/${generateAirportSlug(airport)}/istoric-zboruri`}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all duration-200 hover:scale-105"
                    >
                      <div className="text-center mb-3">
                        <div className="text-base font-bold text-blue-600 mb-1">
                          {airport.city}
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1 text-sm">
                          {airport.name}
                        </h3>
                        <p className="text-xs text-gray-600 mb-3">
                          Cod: {airport.code}
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-center space-x-2 text-xs">
                          <TrendingUp className="h-3 w-3 text-purple-500" />
                          <span className="text-gray-600">Tendințe Trafic</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2 text-xs">
                          <Calendar className="h-3 w-3 text-blue-500" />
                          <span className="text-gray-600">Analize Sezonale</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2 text-xs">
                          <BarChart3 className="h-3 w-3 text-green-500" />
                          <span className="text-gray-600">Performanță Istorică</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Sidebar Ad */}
              <AdBanner 
                slot="sidebar-right"
                size="300x600"
              />
              
              {/* Quick Access */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="text-base font-semibold text-gray-900 mb-3">
                  Acces Rapid
                </h3>
                <div className="space-y-2">
                  <Link
                    href="/aeroport/bucuresti-henri-coanda/istoric-zboruri"
                    className="block p-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-xs"
                  >
                    <div className="font-medium">OTP - București</div>
                    <div className="text-xs text-gray-500">Analize Istorice</div>
                  </Link>
                  <Link
                    href="/aeroport/cluj-napoca/istoric-zboruri"
                    className="block p-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-xs"
                  >
                    <div className="font-medium">CLJ - Cluj-Napoca</div>
                    <div className="text-xs text-gray-500">Analize Istorice</div>
                  </Link>
                  <Link
                    href="/aeroport/timisoara-traian-vuia/istoric-zboruri"
                    className="block p-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-xs"
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