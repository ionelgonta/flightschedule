import Link from 'next/link'
import { Plane, Clock, MapPin, TrendingUp } from 'lucide-react'
import { MAJOR_AIRPORTS } from '@/lib/airports'
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
                href="/airports"
                className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Browse Airports
              </Link>
              <Link
                href="#features"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
              >
                Learn More
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
                Why Choose Our Platform?
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-primary-100 dark:bg-primary-900 rounded-full">
                      <Clock className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Real-Time Updates
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Get continuous updates on flight status, delays, and gate changes as they happen.
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-primary-100 dark:bg-primary-900 rounded-full">
                      <MapPin className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Global Coverage
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Track flights from major airports worldwide with detailed information and statistics.
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-primary-100 dark:bg-primary-900 rounded-full">
                      <TrendingUp className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Detailed Analytics
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Access comprehensive flight data including terminals, gates, and airline information.
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
                    href={`/airport/${airport.code}`}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow group"
                  >
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                        {airport.code}
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {airport.city}
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
                Frequently Asked Questions
              </h2>
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    How often is flight information updated?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Our flight information is updated in real-time, with data refreshed every few minutes to ensure 
                    you have the most current information about flight status, delays, and gate changes.
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Which airports are covered?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    We cover major international airports worldwide, including hubs in North America, Europe, Asia, 
                    and other regions. Our database includes detailed information for hundreds of airports globally.
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Can I track specific flights?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Yes, you can search for specific flights using the flight number or filter by airline, 
                    destination, and other criteria to find the information you need quickly.
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
                Platform Statistics
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Airports Covered</span>
                  <span className="font-semibold text-gray-900 dark:text-white">500+</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Daily Flights</span>
                  <span className="font-semibold text-gray-900 dark:text-white">100K+</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Airlines</span>
                  <span className="font-semibold text-gray-900 dark:text-white">200+</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Countries</span>
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