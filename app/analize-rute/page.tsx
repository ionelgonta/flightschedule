import { Metadata } from 'next'
import Link from 'next/link'
import { Route, Plane, MapPin, Users } from 'lucide-react'
import { MAJOR_AIRPORTS, generateAirportSlug } from '@/lib/airports'
import { AdBanner } from '@/components/ads/AdBanner'
import { Breadcrumbs } from '@/components/seo/Breadcrumbs'
import { StructuredData, generateBreadcrumbSchema } from '@/components/seo/StructuredData'

export const metadata: Metadata = {
  title: 'Analize Rute Zboruri România - Destinații și Companii Aeriene',
  description: 'Analize complete de rute și destinații pentru zborurile din România și Moldova. Explorează rutele populare, companiile aeriene active, frecvența zborurilor și conectivitatea pentru OTP, CLJ, TSR, IAS, RMO și toate aeroporturile naționale.',
  keywords: [
    'analize rute zboruri romania',
    'destinatii populare romania',
    'companii aeriene romania',
    'rute aeriene romania',
    'conectivitate aeroporturi',
    'frecventa zboruri destinatii',
    'analize destinatii aeroporturi',
    'rute internationale romania'
  ],
  openGraph: {
    title: 'Analize Rute Zboruri România - Destinații și Companii Aeriene',
    description: 'Analize complete de rute, destinații și companii aeriene pentru toate aeroporturile din România și Moldova.',
    type: 'website',
    url: 'https://anyway.ro/analize-rute'
  },
  alternates: {
    canonical: '/analize-rute',
  },
}

export default function AnalizeRutePage() {
  const romanianAirports = MAJOR_AIRPORTS.filter(a => a.country === 'România')
  const moldovanAirports = MAJOR_AIRPORTS.filter(a => a.country === 'Moldova')

  const breadcrumbItems = [
    { name: 'Analize', href: '/analize' },
    { name: 'Analize Rute' }
  ]

  const routeSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Analize Rute Zboruri România',
    description: 'Analize complete de rute, destinații și companii aeriene pentru aeroporturile românești',
    url: 'https://anyway.ro/analize-rute',
    mainEntity: {
      '@type': 'Service',
      name: 'Analize Rute și Destinații',
      description: 'Explorarea rutelor aeriene, destinațiilor populare și companiilor aeriene active din România',
      provider: {
        '@type': 'Organization',
        name: 'Orarul Zborurilor România'
      }
    }
  }

  return (
    <>
      <StructuredData data={routeSchema} />
      <StructuredData data={generateBreadcrumbSchema([
        { name: 'Acasă', url: 'https://anyway.ro' },
        { name: 'Analize', url: 'https://anyway.ro/analize' },
        { name: 'Analize Rute', url: 'https://anyway.ro/analize-rute' }
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
        <section className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-white/10 rounded-full">
                  <Route className="h-12 w-12" />
                </div>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold mb-6">
                Analize Rute Zboruri România
              </h1>
              <p className="text-xl text-indigo-100 mb-8 max-w-3xl mx-auto">
                Explorează rutele aeriene, destinațiile populare și companiile aeriene active din România și Moldova. 
                Analize detaliate de conectivitate și frecvență zboruri.
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
                  Tipuri de Analize Rute Disponibile
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 rounded-lg border border-indigo-200 dark:border-indigo-700 p-6">
                    <div className="flex items-start space-x-4">
                      <div className="p-3 bg-indigo-600 rounded-lg">
                        <Route className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-indigo-800 dark:text-indigo-200 mb-2">
                          Rute Populare
                        </h3>
                        <p className="text-sm text-indigo-700 dark:text-indigo-300 mb-3">
                          Identificarea rutelor cu cel mai mare trafic, destinațiile preferate și frecvența zborurilor
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-700 p-6">
                    <div className="flex items-start space-x-4">
                      <div className="p-3 bg-blue-600 rounded-lg">
                        <Plane className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-blue-800 dark:text-blue-200 mb-2">
                          Companii Aeriene
                        </h3>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                          Analiza companiilor aeriene active, cota de piață și destinațiile deservite
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border border-green-200 dark:border-green-700 p-6">
                    <div className="flex items-start space-x-4">
                      <div className="p-3 bg-green-600 rounded-lg">
                        <MapPin className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-green-800 dark:text-green-200 mb-2">
                          Conectivitate Geografică
                        </h3>
                        <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                          Hărți interactive cu rutele aeriene, conectivitatea regională și internațională
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg border border-orange-200 dark:border-orange-700 p-6">
                    <div className="flex items-start space-x-4">
                      <div className="p-3 bg-orange-600 rounded-lg">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-orange-800 dark:text-orange-200 mb-2">
                          Capacitate și Cerere
                        </h3>
                        <p className="text-sm text-orange-700 dark:text-orange-300 mb-3">
                          Analiza capacității pe rute, ocuparea zborurilor și cererea pentru destinații
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
                    <Route className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">
                      Disponibilitatea Datelor de Rute
                    </h3>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                      Analizele de rute sunt disponibile doar pentru aeroporturile cu suficiente date despre destinații și companii aeriene. 
                      Pentru aeroporturile cu date limitate, va fi afișat mesajul "Nu sunt suficiente date pentru a afișa această informație".
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      Datele de rute se actualizează în timp real pe măsură ce colectăm informații despre zboruri și destinații.
                    </p>
                  </div>
                </div>
              </section>

              {/* Romanian Airports */}
              <section>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                  Analize Rute - Aeroporturi România
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {romanianAirports.map((airport) => (
                    <Link
                      key={airport.code}
                      href={`/aeroport/${generateAirportSlug(airport)}/analize-zboruri`}
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
                          <Route className="h-4 w-4 text-indigo-500" />
                          <span className="text-gray-600 dark:text-gray-400">Rute Populare</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2 text-sm">
                          <Plane className="h-4 w-4 text-blue-500" />
                          <span className="text-gray-600 dark:text-gray-400">Companii Aeriene</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2 text-sm">
                          <MapPin className="h-4 w-4 text-green-500" />
                          <span className="text-gray-600 dark:text-gray-400">Conectivitate</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>

              {/* Moldovan Airports */}
              <section>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                  Analize Rute - Aeroporturi Moldova
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {moldovanAirports.map((airport) => (
                    <Link
                      key={airport.code}
                      href={`/aeroport/${generateAirportSlug(airport)}/analize-zboruri`}
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
                          <Route className="h-4 w-4 text-indigo-500" />
                          <span className="text-gray-600 dark:text-gray-400">Rute Populare</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2 text-sm">
                          <Plane className="h-4 w-4 text-blue-500" />
                          <span className="text-gray-600 dark:text-gray-400">Companii Aeriene</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2 text-sm">
                          <MapPin className="h-4 w-4 text-green-500" />
                          <span className="text-gray-600 dark:text-gray-400">Conectivitate</span>
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
                    href="/aeroport/bucuresti-henri-coanda/analize-zboruri"
                    className="block p-3 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-sm"
                  >
                    <div className="font-medium">OTP - București</div>
                    <div className="text-xs text-gray-500">Analize Rute</div>
                  </Link>
                  <Link
                    href="/aeroport/cluj-napoca/analize-zboruri"
                    className="block p-3 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-sm"
                  >
                    <div className="font-medium">CLJ - Cluj-Napoca</div>
                    <div className="text-xs text-gray-500">Analize Rute</div>
                  </Link>
                  <Link
                    href="/aeroport/timisoara-traian-vuia/analize-zboruri"
                    className="block p-3 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-sm"
                  >
                    <div className="font-medium">TSR - Timișoara</div>
                    <div className="text-xs text-gray-500">Analize Rute</div>
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