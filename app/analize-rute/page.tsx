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
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <Route className="h-8 w-8 text-indigo-600" />
                </div>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold mb-4 text-gray-900">
                Analize Rute Zboruri România
              </h1>
              <p className="text-base text-gray-600 mb-6 max-w-2xl mx-auto">
                Explorează rutele aeriene, destinațiile populare și companiile aeriene active din România și Moldova. 
                Analize detaliate de conectivitate și frecvență zboruri.
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
                  Tipuri de Analize Rute Disponibile
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-indigo-50 rounded-lg border border-indigo-200 p-4">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-indigo-600 rounded-lg">
                        <Route className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-indigo-800 mb-1 text-sm">
                          Rute Populare
                        </h3>
                        <p className="text-xs text-indigo-700">
                          Identificarea rutelor cu cel mai mare trafic, destinațiile preferate și frecvența zborurilor
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-blue-600 rounded-lg">
                        <Plane className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-blue-800 mb-1 text-sm">
                          Companii Aeriene
                        </h3>
                        <p className="text-xs text-blue-700">
                          Analiza companiilor aeriene active, cota de piață și destinațiile deservite
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg border border-green-200 p-4">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-green-600 rounded-lg">
                        <MapPin className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-green-800 mb-1 text-sm">
                          Conectivitate Geografică
                        </h3>
                        <p className="text-xs text-green-700">
                          Hărți interactive cu rutele aeriene, conectivitatea regională și internațională
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-orange-50 rounded-lg border border-orange-200 p-4">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-orange-600 rounded-lg">
                        <Users className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-orange-800 mb-1 text-sm">
                          Capacitate și Cerere
                        </h3>
                        <p className="text-xs text-orange-700">
                          Analiza capacității pe rute, ocuparea zborurilor și cererea pentru destinații
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
                    <Route className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-amber-800 mb-2 text-sm">
                      Disponibilitatea Datelor de Rute
                    </h3>
                    <p className="text-xs text-amber-700 mb-2">
                      Analizele de rute sunt disponibile doar pentru aeroporturile cu suficiente date despre destinații și companii aeriene. 
                      Pentru aeroporturile cu date limitate, va fi afișat mesajul "Nu sunt suficiente date pentru a afișa această informație".
                    </p>
                    <p className="text-xs text-amber-600">
                      Datele de rute se actualizează în timp real pe măsură ce colectăm informații despre zboruri și destinații.
                    </p>
                  </div>
                </div>
              </section>

              {/* Romanian Airports */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Analize Rute - Aeroporturi România
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {romanianAirports.map((airport) => (
                    <Link
                      key={airport.code}
                      href={`/aeroport/${generateAirportSlug(airport)}/analize-zboruri`}
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
                          <Route className="h-3 w-3 text-indigo-500" />
                          <span className="text-gray-600">Rute Populare</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2 text-xs">
                          <Plane className="h-3 w-3 text-blue-500" />
                          <span className="text-gray-600">Companii Aeriene</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2 text-xs">
                          <MapPin className="h-3 w-3 text-green-500" />
                          <span className="text-gray-600">Conectivitate</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>

              {/* Moldovan Airports */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Analize Rute - Aeroporturi Moldova
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {moldovanAirports.map((airport) => (
                    <Link
                      key={airport.code}
                      href={`/aeroport/${generateAirportSlug(airport)}/analize-zboruri`}
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
                          <Route className="h-3 w-3 text-indigo-500" />
                          <span className="text-gray-600">Rute Populare</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2 text-xs">
                          <Plane className="h-3 w-3 text-blue-500" />
                          <span className="text-gray-600">Companii Aeriene</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2 text-xs">
                          <MapPin className="h-3 w-3 text-green-500" />
                          <span className="text-gray-600">Conectivitate</span>
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
                    href="/aeroport/bucuresti-henri-coanda/analize-zboruri"
                    className="block p-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-xs"
                  >
                    <div className="font-medium">OTP - București</div>
                    <div className="text-xs text-gray-500">Analize Rute</div>
                  </Link>
                  <Link
                    href="/aeroport/cluj-napoca/analize-zboruri"
                    className="block p-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-xs"
                  >
                    <div className="font-medium">CLJ - Cluj-Napoca</div>
                    <div className="text-xs text-gray-500">Analize Rute</div>
                  </Link>
                  <Link
                    href="/aeroport/timisoara-traian-vuia/analize-zboruri"
                    className="block p-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-xs"
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