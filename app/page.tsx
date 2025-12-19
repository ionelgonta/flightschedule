import Link from 'next/link'
import { Plane, Clock, MapPin, TrendingUp } from 'lucide-react'
import { MAJOR_AIRPORTS, generateAirportSlug } from '@/lib/airports'
import { AdBanner } from '@/components/ads/AdBanner'
import { StructuredData, generateOrganizationSchema, generateWebSiteSchema } from '@/components/seo/StructuredData'
import { InternalLinks } from '@/components/seo/InternalLinks'

export default function HomePage() {
  // Feature Romanian and Moldovan airports
  const romanianAirports = MAJOR_AIRPORTS.filter(a => a.country === 'România')
  const moldovanAirports = MAJOR_AIRPORTS.filter(a => a.country === 'Moldova')
  const featuredAirports = [
    ...romanianAirports.slice(0, 2),
    ...moldovanAirports.slice(0, 1)
  ].filter(Boolean) // Remove any undefined values

  return (
    <>
      {/* Structured Data */}
      <StructuredData data={generateOrganizationSchema()} />
      <StructuredData data={generateWebSiteSchema()} />
      <StructuredData data={{
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Orarul Zborurilor România - Informații Zboruri în Timp Real',
        description: 'Informații complete și în timp real despre zborurile din România și Moldova. Monitorizează sosirile și plecările de la aeroporturile OTP Otopeni, CLJ Cluj, TSR Timișoara, IAS Iași, RMO Chișinău.',
        url: 'https://anyway.ro',
        mainEntity: {
          '@type': 'Service',
          name: 'Monitorizare Zboruri România',
          description: 'Serviciu de monitorizare în timp real a zborurilor din aeroporturile majore din România și Moldova',
          provider: {
            '@type': 'Organization',
            name: 'Orarul Zborurilor România'
          },
          areaServed: ['România', 'Moldova'],
          serviceType: 'Flight Information Service'
        }
      }} />
      
      <div className="min-h-screen">
      {/* Header Banner Ad */}
      <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-center">
          <AdBanner 
            slot="header-banner"
            size="728x90"
          />
        </div>
      </div>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="p-6 bg-white/10 rounded-3xl shadow-lg">
                <Plane className="h-16 w-16 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white">
              Informații Zboruri în Timp Real
            </h1>
            <p className="text-xl md:text-2xl mb-12 text-blue-100 max-w-4xl mx-auto leading-relaxed">
              Găsirea informațiilor de zbor fiabile și în timp real este esențială pentru fiecare călător, 
              fie că te pregătești pentru o plecare, aștepți o sosire sau monitorizezi activitatea zborurilor din România și Moldova.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/aeroporturi"
                className="bg-white text-blue-600 px-8 py-4 rounded-xl text-lg font-medium shadow-lg hover:bg-gray-100 transition-all duration-200"
              >
                Explorează Aeroporturi
              </Link>
              <Link
                href="#features"
                className="border-2 border-white text-white px-8 py-4 rounded-xl text-lg font-medium hover:bg-white/10 transition-all duration-200"
              >
                Află Mai Mult
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-16">
            {/* Features Section */}
            <section id="features">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-12">
                De Ce Să Alegi Platforma Noastră?
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex justify-center mb-6">
                    <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-2xl">
                      <Clock className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Actualizări în Timp Real
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    Primește actualizări continue despre statusul zborurilor, întârzieri și schimbări de poartă.
                  </p>
                </div>
                <div className="text-center bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex justify-center mb-6">
                    <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-2xl">
                      <MapPin className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Acoperire Globală
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    Urmărește zboruri de la aeroporturi majore din întreaga lume cu informații detaliate.
                  </p>
                </div>
                <div className="text-center bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex justify-center mb-6">
                    <div className="p-4 bg-purple-100 dark:bg-purple-900/30 rounded-2xl">
                      <TrendingUp className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Analize Detaliate
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    Accesează date complete despre zboruri incluzând terminale, porți și informații despre companii aeriene.
                  </p>
                </div>
              </div>
            </section>

            {/* Inline Banner Ad */}
            <div className="py-8 flex justify-center">
              <AdBanner 
                slot="inline-banner"
                size="728x90"
              />
            </div>

            {/* Popular Airports */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-12">
                Aeroporturi din România și Moldova
              </h2>
              
              {/* Desktop Table */}
              <div className="hidden md:block mb-8">
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr className="border-b border-gray-200 dark:border-gray-600">
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Cod</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Oraș</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Aeroport</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Țară</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Acțiuni</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                      {featuredAirports.filter(airport => airport && airport.city).map((airport) => (
                        <tr 
                          key={airport.code}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                        >
                          <td className="px-6 py-4 text-sm font-bold text-blue-600 dark:text-blue-400">{airport.code}</td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{airport.city}</td>
                          <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{airport.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{airport.country}</td>
                          <td className="px-6 py-4">
                            <Link
                              href={`/aeroport/${generateAirportSlug(airport)}`}
                              className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors duration-200"
                            >
                              Vezi detalii
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3 mb-8">
                {featuredAirports.filter(airport => airport && airport.city).map((airport) => (
                  <Link
                    key={airport.code}
                    href={`/aeroport/${generateAirportSlug(airport)}`}
                    className="block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{airport.code}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{airport.country}</div>
                      </div>
                      <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">Vezi</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-base font-medium text-gray-900 dark:text-white">{airport.city}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{airport.name}</div>
                    </div>
                  </Link>
                ))}
              </div>
              
              {/* Vezi toate aeroporturile */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-700 p-6 text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-blue-600 rounded-2xl">
                    <MapPin className="h-6 w-6 text-white" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
                  Vezi toate aeroporturile
                </h3>
                <p className="text-blue-700 dark:text-blue-300 mb-4">
                  Explorează toate cele {MAJOR_AIRPORTS.length} aeroporturi din România și Moldova
                </p>
                <Link
                  href="/aeroporturi"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors duration-200"
                >
                  Explorează aeroporturi
                </Link>
              </div>
            </section>

            {/* Analytics Section */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-12">
                Analize și Statistici Zboruri
              </h2>
              
              {/* Desktop Table */}
              <div className="hidden md:block">
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr className="border-b border-gray-200 dark:border-gray-600">
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Tip Analiză</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Descriere</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Funcționalități</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Acțiuni</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                      <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">Statistici Aeroporturi</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          Analizează performanța tuturor aeroporturilor
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-500">
                          Indice întârzieri, punctualitate, ore de vârf
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href="/analize"
                            className="inline-flex items-center px-3 py-1.5 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-medium hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors duration-200"
                          >
                            Alege aeroportul
                          </Link>
                        </td>
                      </tr>
                      
                      <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">Program Zboruri</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          Calendar interactiv pentru toate aeroporturile
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-500">
                          Filtrare după dată, companie, destinație
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href="/analize"
                            className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors duration-200"
                          >
                            Alege aeroportul
                          </Link>
                        </td>
                      </tr>
                      
                      <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                              <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">Analize Istorice</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          Tendințe și evoluție pentru toate aeroporturile
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-500">
                          Volum trafic, întârzieri, performanță în timp
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href="/analize"
                            className="inline-flex items-center px-3 py-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-medium hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors duration-200"
                          >
                            Alege aeroportul
                          </Link>
                        </td>
                      </tr>
                      
                      <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                              <Plane className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">Catalog Aeronave</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          Căutare aeronave după înmatriculare sau model
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-500">
                          Istoric zboruri, statistici aeronave
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href="/aeronave"
                            className="inline-flex items-center px-3 py-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-sm font-medium hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors duration-200"
                          >
                            Explorează catalogul
                          </Link>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                  <div className="flex items-start space-x-3 mb-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Statistici Aeroporturi</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Indice întârzieri, punctualitate, ore de vârf</p>
                    </div>
                  </div>
                  <Link
                    href="/analize"
                    className="inline-flex items-center px-3 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm font-medium w-full justify-center hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                  >
                    Alege aeroportul
                  </Link>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                  <div className="flex items-start space-x-3 mb-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Program Zboruri</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Filtrare după dată, companie, destinație</p>
                    </div>
                  </div>
                  <Link
                    href="/analize"
                    className="inline-flex items-center px-3 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium w-full justify-center hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                  >
                    Alege aeroportul
                  </Link>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                  <div className="flex items-start space-x-3 mb-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Analize Istorice</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Volum trafic, întârzieri, performanță în timp</p>
                    </div>
                  </div>
                  <Link
                    href="/analize"
                    className="inline-flex items-center px-3 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-sm font-medium w-full justify-center hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                  >
                    Alege aeroportul
                  </Link>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                  <div className="flex items-start space-x-3 mb-3">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                      <Plane className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Catalog Aeronave</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Istoric zboruri, statistici aeronave</p>
                    </div>
                  </div>
                  <Link
                    href="/aeronave"
                    className="inline-flex items-center px-3 py-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-lg text-sm font-medium w-full justify-center hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors"
                  >
                    Explorează catalogul
                  </Link>
                </div>
              </div>
            </section>

            {/* SEO Content Section */}
            <section className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
                Platforma Completă de Monitorizare Zboruri România
              </h2>
              <div className="space-y-6">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  Platforma noastră oferă actualizări continue asupra sosirii și plecării zborurilor din aeroporturile majore din România și Moldova, 
                  alături de informații detaliate despre status, ajustări de orar, terminale, porți și date despre companii aeriene. 
                  Site-ul include, de asemenea, zone dedicate de publicitate pentru bannere parteneri și Google AdSense, 
                  optimizate pentru a menține viteza și experiența utilizatorului în timp ce livrează conținut comercial relevant.
                </p>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  Fie că ești un călător frecvent, un entuziast al aviației sau pur și simplu trebuie să urmărești un zbor specific, 
                  baza noastră de date cuprinzătoare oferă informații în timp real din toate aeroporturile din România: 
                  Otopeni (OTP), Cluj-Napoca (CLJ), Timișoara (TSR), Iași (IAS), Constanța (CND), Sibiu (SBZ) și multe altele, 
                  precum și din Chișinău (RMO), Moldova.
                </p>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  Rămâi informat cu notificări instantanee despre întârzierile zborurilor, schimbările de poartă și anulări. 
                  Platforma noastră agregă date din multiple surse fiabile pentru a asigura acuratețea și promptitudinea, 
                  oferindu-ți încrederea de a lua decizii de călătorie informate pentru zborurile din și către România.
                </p>
              </div>
            </section>

            {/* FAQ Section */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-12">
                Întrebări Frecvente
              </h2>
              <div className="space-y-4">
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-200">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Cât de des sunt actualizate informațiile despre zboruri?
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    Informațiile despre zboruri sunt actualizate în timp real, cu date reîmprospătate la fiecare câteva minute 
                    pentru a vă asigura că aveți cele mai recente informații despre statusul zborurilor, întârzieri și schimbări de poartă.
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-200">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Ce aeroporturi sunt acoperite?
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    Acoperim aeroporturi internaționale majore din întreaga lume, incluzând hub-uri din America de Nord, Europa, Asia 
                    și alte regiuni. Baza noastră de date include informații detaliate pentru sute de aeroporturi la nivel global.
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-200">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Pot urmări zboruri specifice?
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    Da, poți căuta zboruri specifice folosind numărul de zbor sau filtra după compania aeriană, 
                    destinație și alte criterii pentru a găsi rapid informațiile de care ai nevoie.
                  </p>
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
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Statistici Platformă
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Aeroporturi Acoperite</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">500+</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Zboruri Zilnice</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">100K+</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Companii Aeriene</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">200+</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Țări</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">150+</span>
                </div>
              </div>
            </div>

            {/* Internal Links */}
            <InternalLinks currentPage="/" />

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