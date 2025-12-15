import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getAirportByCodeOrSlug, generateAirportSlug } from '@/lib/airports'
import { Plane, ArrowRight, MapPin, Clock, Users, Building } from 'lucide-react'
import { AdBanner } from '@/components/ads/AdBanner'

interface AirportPageProps {
  params: {
    code: string
  }
}

export async function generateMetadata({ params }: AirportPageProps): Promise<Metadata> {
  const airport = getAirportByCodeOrSlug(params.code)
  
  if (!airport) {
    return {
      title: 'Aeroport Negăsit'
    }
  }

  return {
    title: `${airport.name} (${airport.code}) - Programul Zborurilor`,
    description: `Sosiri și plecări în timp real pentru ${airport.name} din ${airport.city}, ${airport.country}. Urmărește zborurile, verifică statusul și obține informații detaliate.`,
    keywords: [`${airport.code} aeroport`, `${airport.city} zboruri`, `${airport.name}`, 'program zboruri', 'sosiri', 'plecări'],
    openGraph: {
      title: `${airport.name} (${airport.code}) - Programul Zborurilor`,
      description: `Informații în timp real despre zboruri pentru ${airport.name} din ${airport.city}, ${airport.country}`,
      type: 'website',
    },
    alternates: {
      canonical: `/airport/${generateAirportSlug(airport)}`,
    },
  }
}

export default function AirportPage({ params }: AirportPageProps) {
  const airport = getAirportByCodeOrSlug(params.code)

  if (!airport) {
    notFound()
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Airport',
    name: airport.name,
    iataCode: airport.code,
    address: {
      '@type': 'PostalAddress',
      addressLocality: airport.city,
      addressCountry: airport.country,
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <div className="min-h-screen">
        {/* Header Banner Ad */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <AdBanner 
            slot="header-banner"
            size="728x90"
            className="max-w-7xl mx-auto py-4"
          />
        </div>

        {/* Airport Header */}
        <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-white/10 rounded-full">
                  <Plane className="h-12 w-12" />
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                {airport.name}
              </h1>
              <div className="flex items-center justify-center space-x-2 text-xl text-primary-100 mb-8">
                <MapPin className="h-5 w-5" />
                <span>{airport.city} - {airport.name}</span>
                <span className="mx-2">•</span>
                <span>{airport.country}</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href={`/airport/${generateAirportSlug(airport)}/arrivals`}
                  className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center space-x-2"
                >
                  <span>Vezi Sosiri</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href={`/airport/${generateAirportSlug(airport)}/departures`}
                  className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors flex items-center justify-center space-x-2"
                >
                  <span>Vezi Plecări</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-12">
              {/* Quick Stats */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Prezentare Aeroport
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 text-center">
                    <div className="flex justify-center mb-4">
                      <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                        <Clock className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Date în Timp Real
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Informații live despre zboruri actualizate la fiecare câteva minute
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 text-center">
                    <div className="flex justify-center mb-4">
                      <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                        <Users className="h-8 w-8 text-green-600 dark:text-green-400" />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Multiple Companii Aeriene
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Acoperire cuprinzătoare a tuturor companiilor majore
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 text-center">
                    <div className="flex justify-center mb-4">
                      <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                        <Building className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Informații Terminal
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Informații detaliate despre terminale și porți
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

              {/* Airport Information */}
              <section className="prose prose-gray dark:prose-invert max-w-none">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                  Despre {airport.name}
                </h2>
                <div className="text-gray-600 dark:text-gray-400 space-y-4">
                  <p>
                    {airport.name} ({airport.code}) este un aeroport internațional major care deservește {airport.city}, {airport.country}. 
                    Ca unul dintre cele mai aglomerate aeroporturi din regiune, gestionează milioane de pasageri anual și servește ca 
                    un hub crucial atât pentru călătoriile interne, cât și pentru cele internaționale.
                  </p>
                  <p>
                    Aeroportul dispune de facilități moderne și terminale multiple concepute pentru a acomoda numărul crescând 
                    de călători. Cu tehnologie de ultimă generație și operațiuni eficiente, {airport.name} oferă o experiență 
                    de călătorie fără probleme pentru pasagerii din întreaga lume.
                  </p>
                  <p>
                    Sistemul nostru de urmărire a zborurilor în timp real oferă informații cuprinzătoare despre toate sosirile și plecările 
                    de la {airport.name}, incluzând actualizări de status ale zborurilor, atribuiri de porți, informații despre terminale și 
                    timpii estimați de sosire/plecare. Fie că ridici pasageri, prinzi un zbor sau pur și simplu monitorizezi 
                    activitatea zborurilor, platforma noastră te ține informat cu cele mai recente informații.
                  </p>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
                  Companii Aeriene care Operează la {airport.code}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {airport.name} servește ca hub pentru numeroase companii aeriene internaționale și interne, oferind conexiuni 
                  către destinații din întreaga lume. Companiile majore care operează de la acest aeroport includ atât companii 
                  cu servicii complete, cât și companii low-cost, oferind călătorilor o gamă largă de opțiuni pentru călătoria lor.
                </p>

                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
                  Facilități Terminal
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Aeroportul dispune de terminale multiple echipate cu facilități moderne incluzând restaurante, magazine, 
                  lounge-uri și facilități de business. Fiecare terminal este conceput pentru a oferi confort și comoditate 
                  călătorilor, cu semnalizare clară și gestionare eficientă a fluxului de pasageri.
                </p>

                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
                  Transport și Acces
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {airport.name} este bine conectat la {airport.city} și zonele înconjurătoare prin diverse opțiuni de transport 
                  incluzând transportul public, taxiuri, servicii de ride-sharing și închirieri auto. Locația strategică a aeroportului 
                  asigură acces ușor atât pentru călătorii locali, cât și pentru cei internaționale.
                </p>
              </section>

              {/* FAQ Section */}
              <section>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                  Întrebări Frecvente - {airport.code}
                </h2>
                <div className="space-y-6">
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Cum verific statusul zborurilor în timp real la {airport.code}?
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Folosește paginile noastre de sosiri și plecări pentru a obține informații în timp real despre zboruri pentru {airport.name}. 
                      Poți filtra după compania aeriană, statusul zborului sau căuta zboruri specifice.
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Ce informații sunt disponibile pentru fiecare zbor?
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Sistemul nostru oferă detalii cuprinzătoare despre zboruri incluzând compania aeriană, numărul zborului, originea/destinația, 
                      timpii programați și estimați, statusul curent, terminalul și informațiile despre poartă.
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Cât de des sunt actualizate datele despre zboruri?
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Informațiile despre zboruri sunt actualizate în timp real, cu date reîmprospătate la fiecare câteva minute pentru a asigura 
                      acuratețea și pentru a oferi cele mai recente actualizări de status.
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
              
              {/* Quick Links */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Acces Rapid
                </h3>
                <div className="space-y-3">
                  <Link
                    href={`/airport/${generateAirportSlug(airport)}/arrivals`}
                    className="block w-full text-left px-4 py-2 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
                  >
                    Vezi Sosiri
                  </Link>
                  <Link
                    href={`/airport/${generateAirportSlug(airport)}/departures`}
                    className="block w-full text-left px-4 py-2 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
                  >
                    Vezi Plecări
                  </Link>
                </div>
              </div>

              {/* Airport Stats */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Informații Aeroport
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Cod</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{airport.code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Oraș</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{airport.city}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Țară</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{airport.country}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Fus Orar</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{airport.timezone}</span>
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
    </>
  )
}