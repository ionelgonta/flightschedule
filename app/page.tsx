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
  const featuredAirports = [...romanianAirports.slice(0, 2), ...moldovanAirports.slice(0, 1)]

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
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <AdBanner 
          slot="header-banner"
          size="728x90"
          className="max-w-7xl mx-auto py-4"
        />
      </div>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-white/10 rounded-full">
                <Plane className="h-16 w-16" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Informații Zboruri în Timp Real
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100 max-w-3xl mx-auto">
              Găsirea informațiilor de zbor fiabile și în timp real este esențială pentru fiecare călător, 
              fie că te pregătești pentru o plecare, aștepți o sosire sau monitorizezi activitatea zborurilor din România și Moldova.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/aeroporturi"
                className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Explorează Aeroporturi
              </Link>
              <Link
                href="#features"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
              >
                Află Mai Mult
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-12">
            {/* Features Section */}
            <section id="features">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                De Ce Să Alegi Platforma Noastră?
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-primary-100 dark:bg-primary-900 rounded-full">
                      <Clock className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Actualizări în Timp Real
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Primește actualizări continue despre statusul zborurilor, întârzieri și schimbări de poartă.
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-primary-100 dark:bg-primary-900 rounded-full">
                      <MapPin className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Acoperire Globală
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Urmărește zboruri de la aeroporturi majore din întreaga lume cu informații detaliate.
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-primary-100 dark:bg-primary-900 rounded-full">
                      <TrendingUp className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Analize Detaliate
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Accesează date complete despre zboruri incluzând terminale, porți și informații despre companii aeriene.
                  </p>
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

            {/* Popular Airports */}
            <section>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                Aeroporturi din România și Moldova
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredAirports.map((airport) => (
                  <Link
                    key={airport.code}
                    href={`/aeroport/${generateAirportSlug(airport)}`}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow group"
                  >
                    <div className="text-center">
                      <div className="text-xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                        {airport.city}
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {airport.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {airport.country}
                      </p>
                    </div>
                  </Link>
                ))}
                
                {/* Vezi toate aeroporturile card */}
                <Link
                  href="/aeroporturi"
                  className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-lg shadow-sm border-2 border-primary-200 dark:border-primary-700 p-6 hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600 transition-all group"
                >
                  <div className="text-center">
                    <div className="flex justify-center mb-3">
                      <div className="p-2 bg-primary-600 rounded-full">
                        <MapPin className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <h3 className="font-bold text-primary-700 dark:text-primary-300 mb-2 group-hover:text-primary-800 dark:group-hover:text-primary-200 transition-colors">
                      Vezi toate aeroporturile
                    </h3>
                    <p className="text-sm text-primary-600 dark:text-primary-400">
                      Explorează toate cele {MAJOR_AIRPORTS.length} aeroporturi din România și Moldova
                    </p>
                  </div>
                </Link>
              </div>
            </section>

            {/* Analytics Section */}
            <section>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                Analize și Statistici Zboruri
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link
                  href="/analize"
                  className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg shadow-sm border border-green-200 dark:border-green-700 p-6 hover:shadow-md hover:border-green-300 dark:hover:border-green-600 transition-all group"
                >
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-green-600 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-green-800 dark:text-green-200 mb-2 group-hover:text-green-900 dark:group-hover:text-green-100 transition-colors">
                        Statistici Aeroporturi
                      </h3>
                      <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                        Analizează performanța tuturor aeroporturilor: indice întârzieri, punctualitate și ore de vârf
                      </p>
                      <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                        Alege aeroportul →
                      </div>
                    </div>
                  </div>
                </Link>

                <Link
                  href="/analize"
                  className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg shadow-sm border border-blue-200 dark:border-blue-700 p-6 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all group"
                >
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-blue-600 rounded-lg">
                      <Clock className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-blue-800 dark:text-blue-200 mb-2 group-hover:text-blue-900 dark:group-hover:text-blue-100 transition-colors">
                        Program Zboruri
                      </h3>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                        Calendar interactiv pentru toate aeroporturile: filtrează după dată, companie aeriană și destinație
                      </p>
                      <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                        Alege aeroportul →
                      </div>
                    </div>
                  </div>
                </Link>

                <Link
                  href="/analize"
                  className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg shadow-sm border border-purple-200 dark:border-purple-700 p-6 hover:shadow-md hover:border-purple-300 dark:hover:border-purple-600 transition-all group"
                >
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-purple-600 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-purple-800 dark:text-purple-200 mb-2 group-hover:text-purple-900 dark:group-hover:text-purple-100 transition-colors">
                        Analize Istorice
                      </h3>
                      <p className="text-sm text-purple-700 dark:text-purple-300 mb-3">
                        Tendințe și evoluție pentru toate aeroporturile: volum trafic, întârzieri și performanță în timp
                      </p>
                      <div className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                        Alege aeroportul →
                      </div>
                    </div>
                  </div>
                </Link>

                <Link
                  href="/aeronave"
                  className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20 rounded-lg shadow-sm border border-cyan-200 dark:border-cyan-700 p-6 hover:shadow-md hover:border-cyan-300 dark:hover:border-cyan-600 transition-all group"
                >
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-cyan-600 rounded-lg">
                      <Plane className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-cyan-800 dark:text-cyan-200 mb-2 group-hover:text-cyan-900 dark:group-hover:text-cyan-100 transition-colors">
                        Catalog Aeronave
                      </h3>
                      <p className="text-sm text-cyan-700 dark:text-cyan-300 mb-3">
                        Căutare aeronave după ICAO24 sau înmatriculare, istoric zboruri și statistici
                      </p>
                      <div className="text-xs text-cyan-600 dark:text-cyan-400 font-medium">
                        Explorează catalogul →
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            </section>

            {/* SEO Content Section */}
            <section className="prose prose-gray dark:prose-invert max-w-none">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                Platforma Completă de Monitorizare Zboruri România
              </h2>
              <div className="text-gray-600 dark:text-gray-400 space-y-4">
                <p>
                  Platforma noastră oferă actualizări continue asupra sosirii și plecării zborurilor din aeroporturile majore din România și Moldova, 
                  alături de informații detaliate despre status, ajustări de orar, terminale, porți și date despre companii aeriene. 
                  Site-ul include, de asemenea, zone dedicate de publicitate pentru bannere parteneri și Google AdSense, 
                  optimizate pentru a menține viteza și experiența utilizatorului în timp ce livrează conținut comercial relevant.
                </p>
                <p>
                  Fie că ești un călător frecvent, un entuziast al aviației sau pur și simplu trebuie să urmărești un zbor specific, 
                  baza noastră de date cuprinzătoare oferă informații în timp real din toate aeroporturile din România: 
                  Otopeni (OTP), Cluj-Napoca (CLJ), Timișoara (TSR), Iași (IAS), Constanța (CND), Sibiu (SBZ) și multe altele, 
                  precum și din Chișinău (RMO), Moldova.
                </p>
                <p>
                  Rămâi informat cu notificări instantanee despre întârzierile zborurilor, schimbările de poartă și anulări. 
                  Platforma noastră agregă date din multiple surse fiabile pentru a asigura acuratețea și promptitudinea, 
                  oferindu-ți încrederea de a lua decizii de călătorie informate pentru zborurile din și către România.
                </p>
              </div>
            </section>

            {/* FAQ Section */}
            <section>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                Întrebări Frecvente
              </h2>
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Cât de des sunt actualizate informațiile despre zboruri?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Informațiile despre zboruri sunt actualizate în timp real, cu date reîmprospătate la fiecare câteva minute 
                    pentru a vă asigura că aveți cele mai recente informații despre statusul zborurilor, întârzieri și schimbări de poartă.
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Ce aeroporturi sunt acoperite?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Acoperim aeroporturi internaționale majore din întreaga lume, incluzând hub-uri din America de Nord, Europa, Asia 
                    și alte regiuni. Baza noastră de date include informații detaliate pentru sute de aeroporturi la nivel global.
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Pot urmări zboruri specifice?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
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
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Statistici Platformă
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Aeroporturi Acoperite</span>
                  <span className="font-semibold text-gray-900 dark:text-white">500+</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Zboruri Zilnice</span>
                  <span className="font-semibold text-gray-900 dark:text-white">100K+</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Companii Aeriene</span>
                  <span className="font-semibold text-gray-900 dark:text-white">200+</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Țări</span>
                  <span className="font-semibold text-gray-900 dark:text-white">150+</span>
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