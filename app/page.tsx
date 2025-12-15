import Link from 'next/link'
import { Plane, Clock, MapPin, TrendingUp } from 'lucide-react'
import { MAJOR_AIRPORTS, generateAirportSlug } from '@/lib/airports'
import { AdBanner } from '@/components/ads/AdBanner'

export default function HomePage() {
  // Feature Romanian airports first, then major international ones
  const romanianAirports = MAJOR_AIRPORTS.filter(a => a.country === 'Romania' || a.country === 'Moldova')
  const internationalAirports = MAJOR_AIRPORTS.filter(a => a.country !== 'Romania' && a.country !== 'Moldova')
  const featuredAirports = [...romanianAirports.slice(0, 6), ...internationalAirports.slice(0, 2)]

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