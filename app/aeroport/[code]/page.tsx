import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getAirportByCodeOrSlug, generateAirportSlug } from '@/lib/airports'
import { Plane, ArrowRight, MapPin, Clock, Users, Building, TrendingUp } from 'lucide-react'
import { AdBanner } from '@/components/ads/AdBanner'
import WeatherWidget from '@/components/weather/WeatherWidget'
import { getWeatherCityForAirport } from '@/lib/weatherUtils'

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
      canonical: `/aeroport/${generateAirportSlug(airport)}`,
    },
  }
}

export default function AirportPage({ params }: AirportPageProps) {
  const airport = getAirportByCodeOrSlug(params.code)

  if (!airport) {
    notFound()
  }

  const weatherCity = getWeatherCityForAirport(airport.code)

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
      
      <div className="min-h-screen relative z-10">
        <div className="glass-card mx-4 mt-4 rounded-2xl overflow-hidden">
          <AdBanner slot="header-banner" size="728x90" className="max-w-7xl mx-auto py-2" />
        </div>

        <section className="px-4 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <div className="p-2 bg-white/20 rounded-2xl backdrop-blur-sm border border-white/20">
                  <Plane className="h-6 w-6 text-white" />
                </div>
              </div>
              <h1 className="text-xl md:text-2xl font-bold mb-2 text-white">{airport.name}</h1>
              <div className="flex items-center justify-center space-x-2 text-sm text-white/85 mb-4">
                <MapPin className="h-3 w-3" />
                <span>{airport.city} - {airport.name}</span>
                <span className="mx-1">•</span>
                <span>{airport.country}</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
                <Link href={`/aeroport/${generateAirportSlug(airport)}/sosiri`} className="bg-white/25 text-white px-6 py-3 rounded-2xl font-medium hover:bg-white/35 border border-white/20 transition-colors flex items-center justify-center space-x-2 text-sm">
                  <Plane className="h-4 w-4 rotate-180" />
                  <span>Vezi Sosiri</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
                <Link href={`/aeroport/${generateAirportSlug(airport)}/plecari`} className="bg-white/25 text-white px-6 py-3 rounded-2xl font-medium hover:bg-white/35 border border-white/20 transition-colors flex items-center justify-center space-x-2 text-sm">
                  <Plane className="h-4 w-4" />
                  <span>Vezi Plecări</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                <Link href={`/aeroport/${generateAirportSlug(airport)}/statistici`} className="border border-white/30 text-white px-4 py-2 rounded-xl font-medium hover:bg-white/10 transition-colors text-xs">Statistici</Link>
                <Link href={`/aeroport/${generateAirportSlug(airport)}/program-zboruri`} className="border border-white/30 text-white px-4 py-2 rounded-xl font-medium hover:bg-white/10 transition-colors text-xs">Program Zboruri</Link>
                <Link href={`/aeroport/${generateAirportSlug(airport)}/analize-zboruri`} className="border border-white/30 text-white px-4 py-2 rounded-xl font-medium hover:bg-white/10 transition-colors text-xs">Analize Rute</Link>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 space-y-8">
              <section>
                <h2 className="text-lg font-bold text-white mb-3">Prezentare Aeroport</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="glass-card rounded-2xl p-4 text-center">
                    <div className="flex justify-center mb-2">
                      <div className="p-1.5 bg-white/25 rounded-xl">
                        <Clock className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <h3 className="text-xs font-semibold text-white mb-1">Date în Timp Real</h3>
                    <p className="text-xs text-white/80">Informații live despre zboruri actualizate la fiecare câteva minute</p>
                  </div>
                  <div className="glass-card rounded-2xl p-4 text-center">
                    <div className="flex justify-center mb-2">
                      <div className="p-1.5 bg-white/25 rounded-xl">
                        <Users className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <h3 className="text-xs font-semibold text-white mb-1">Multiple Companii Aeriene</h3>
                    <p className="text-xs text-white/80">Acoperire cuprinzătoare a tuturor companiilor majore</p>
                  </div>
                  <div className="glass-card rounded-2xl p-4 text-center">
                    <div className="flex justify-center mb-2">
                      <div className="p-1.5 bg-white/25 rounded-xl">
                        <Building className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <h3 className="text-xs font-semibold text-white mb-1">Informații Detaliate</h3>
                    <p className="text-xs text-white/80">Informații complete despre zboruri și companii aeriene</p>
                  </div>
                </div>
              </section>

              <section>
                <div className="glass-card rounded-2xl p-4">
                  <WeatherWidget city={weatherCity} />
                </div>
              </section>

              <section>
                <h2 className="text-lg font-bold text-white mb-3">Analize și Statistici</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Link href={`/aeroport/${generateAirportSlug(airport)}/statistici`} className="glass-card rounded-2xl p-4 hover:bg-white/20 transition-all group">
                    <div className="flex items-start space-x-2">
                      <div className="p-1.5 bg-white/25 rounded-xl"><Building className="h-3 w-3 text-white" /></div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white mb-1 text-xs">Statistici Aeroport</h3>
                        <p className="text-xs text-white/80 mb-1">Indice întârzieri, performanță la timp și ore de vârf pentru {airport.city}</p>
                        <div className="text-xs text-white/90 font-medium">Vezi statistici →</div>
                      </div>
                    </div>
                  </Link>
                  <Link href={`/aeroport/${generateAirportSlug(airport)}/program-zboruri`} className="glass-card rounded-2xl p-4 hover:bg-white/20 transition-all group">
                    <div className="flex items-start space-x-2">
                      <div className="p-1.5 bg-white/25 rounded-xl"><Clock className="h-3 w-3 text-white" /></div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white mb-1 text-xs">Program Zboruri</h3>
                        <p className="text-xs text-white/80 mb-1">Calendar interactiv cu filtre pentru zborurile de la {airport.name}</p>
                        <div className="text-xs text-white/90 font-medium">Vezi programul →</div>
                      </div>
                    </div>
                  </Link>
                  <Link href={`/aeroport/${generateAirportSlug(airport)}/istoric-zboruri`} className="glass-card rounded-2xl p-4 hover:bg-white/20 transition-all group">
                    <div className="flex items-start space-x-2">
                      <div className="p-1.5 bg-white/25 rounded-xl"><MapPin className="h-3 w-3 text-white" /></div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white mb-1 text-xs">Analize Istorice</h3>
                        <p className="text-xs text-white/80 mb-1">Tendințe și evoluție pentru traficul aerian de la {airport.name}</p>
                        <div className="text-xs text-white/90 font-medium">Vezi istoricul →</div>
                      </div>
                    </div>
                  </Link>
                  <Link href={`/aeroport/${generateAirportSlug(airport)}/analize-zboruri`} className="glass-card rounded-2xl p-4 hover:bg-white/20 transition-all group">
                    <div className="flex items-start space-x-2">
                      <div className="p-1.5 bg-white/25 rounded-xl"><Plane className="h-3 w-3 text-white" /></div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white mb-1 text-xs">Analize Rute</h3>
                        <p className="text-xs text-white/80 mb-1">Rute frecvente, companii aeriene și analize de punctualitate</p>
                        <div className="text-xs text-white/90 font-medium">Vezi analizele →</div>
                      </div>
                    </div>
                  </Link>
                  <Link href={`/program-saptamanal?airport=${airport.city} (${airport.code})`} className="glass-card rounded-2xl p-4 hover:bg-white/20 transition-all group md:col-span-2">
                    <div className="flex items-start space-x-2">
                      <div className="p-1.5 bg-white/25 rounded-xl"><TrendingUp className="h-3 w-3 text-white" /></div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white mb-1 text-xs">Program Săptămânal</h3>
                        <p className="text-xs text-white/80 mb-1">Modele săptămânale de zboruri pentru {airport.city}</p>
                        <div className="text-xs text-white/90 font-medium">Vezi programul →</div>
                      </div>
                    </div>
                  </Link>
                </div>
              </section>

              <div className="py-4">
                <div className="glass-card rounded-2xl overflow-hidden p-2">
                  <AdBanner slot="inline-banner" size="728x90" className="mx-auto" />
                </div>
              </div>

              <section className="max-w-none">
                <h2 className="text-xl font-bold text-white mb-4">Despre {airport.name}</h2>
                <div className="text-white/85 space-y-3 text-sm">
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

                <h3 className="text-lg font-bold text-white mt-6 mb-3">Companii Aeriene care Operează la {airport.name}</h3>
                <p className="text-white/85 mb-3 text-sm">
                  {airport.name} servește ca hub pentru numeroase companii aeriene internaționale și interne, oferind conexiuni 
                  către destinații din întreaga lume. Companiile majore care operează de la acest aeroport includ atât companii 
                  cu servicii complete, cât și companii low-cost, oferind călătorilor o gamă largă de opțiuni pentru călătoria lor.
                </p>

                <h3 className="text-lg font-bold text-white mt-6 mb-3">Facilități Terminal</h3>
                <p className="text-white/85 mb-3 text-sm">
                  Aeroportul dispune de terminale multiple echipate cu facilități moderne incluzând restaurante, magazine, 
                  lounge-uri și facilități de business. Fiecare terminal este conceput pentru a oferi confort și comoditate 
                  călătorilor, cu semnalizare clară și gestionare eficientă a fluxului de pasageri.
                </p>

                <h3 className="text-lg font-bold text-white mt-6 mb-3">Transport și Acces</h3>
                <p className="text-white/85 mb-3 text-sm">
                  {airport.name} este bine conectat la {airport.city} și zonele înconjurătoare prin diverse opțiuni de transport 
                  incluzând transportul public, taxiuri, servicii de ride-sharing și închirieri auto. Locația strategică a aeroportului 
                  asigură acces ușor atât pentru călătorii locali, cât și pentru cei internaționale.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-4">Întrebări Frecvente - {airport.name}</h2>
                <div className="space-y-4">
                  <div className="glass-card rounded-2xl p-4">
                    <h3 className="text-sm font-semibold text-white mb-2">Cum verific statusul zborurilor în timp real la {airport.name}?</h3>
                    <p className="text-xs text-white/85">Folosește paginile noastre de sosiri și plecări pentru a obține informații în timp real despre zboruri pentru {airport.name}. Poți filtra după compania aeriană, statusul zborului sau căuta zboruri specifice.</p>
                  </div>
                  <div className="glass-card rounded-2xl p-4">
                    <h3 className="text-sm font-semibold text-white mb-2">Ce informații sunt disponibile pentru fiecare zbor?</h3>
                    <p className="text-xs text-white/85">Sistemul nostru oferă detalii cuprinzătoare despre zboruri incluzând compania aeriană, numărul zborului, originea/destinația, timpii programați și estimați, statusul curent, terminalul și informațiile despre poartă.</p>
                  </div>
                  <div className="glass-card rounded-2xl p-4">
                    <h3 className="text-sm font-semibold text-white mb-2">Cât de des sunt actualizate datele despre zboruri?</h3>
                    <p className="text-xs text-white/85">Informațiile despre zboruri sunt actualizate în timp real, cu date reîmprospătate la fiecare câteva minute pentru a asigura acuratețea și pentru a oferi cele mai recente actualizări de status.</p>
                  </div>
                </div>
              </section>
            </div>

            <div className="lg:col-span-1 space-y-6">
              <div className="glass-card rounded-2xl overflow-hidden p-2">
                <AdBanner slot="sidebar-right" size="300x600" />
              </div>
              <div className="glass-card rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-white mb-3">Acces Rapid</h3>
                <div className="space-y-2">
                  <Link href={`/aeroport/${generateAirportSlug(airport)}/sosiri`} className="block w-full text-left px-3 py-2 bg-white/15 text-white rounded-xl hover:bg-white/25 transition-colors text-sm">Vezi Sosiri</Link>
                  <Link href={`/aeroport/${generateAirportSlug(airport)}/plecari`} className="block w-full text-left px-3 py-2 bg-white/15 text-white rounded-xl hover:bg-white/25 transition-colors text-sm">Vezi Plecări</Link>
                </div>
              </div>
              <div className="glass-card rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-white mb-3">Analize și Statistici</h3>
                <div className="space-y-2">
                  <Link href={`/aeroport/${generateAirportSlug(airport)}/statistici`} className="block w-full text-left px-3 py-2 text-xs bg-white/15 text-white rounded-xl hover:bg-white/25 transition-colors"><div className="font-medium">Statistici</div><div className="text-xs text-white/80">Performanță și întârzieri</div></Link>
                  <Link href={`/aeroport/${generateAirportSlug(airport)}/program-zboruri`} className="block w-full text-left px-3 py-2 text-xs bg-white/15 text-white rounded-xl hover:bg-white/25 transition-colors"><div className="font-medium">Program Zboruri</div><div className="text-xs text-white/80">Calendar interactiv</div></Link>
                  <Link href={`/aeroport/${generateAirportSlug(airport)}/istoric-zboruri`} className="block w-full text-left px-3 py-2 text-xs bg-white/15 text-white rounded-xl hover:bg-white/25 transition-colors"><div className="font-medium">Istoric</div><div className="text-xs text-white/80">Tendințe și evoluție</div></Link>
                  <Link href={`/aeroport/${generateAirportSlug(airport)}/analize-zboruri`} className="block w-full text-left px-3 py-2 text-xs bg-white/15 text-white rounded-xl hover:bg-white/25 transition-colors"><div className="font-medium">Analize Rute</div><div className="text-xs text-white/80">Companii și destinații</div></Link>
                  <Link href={`/program-saptamanal?airport=${airport.city} (${airport.code})`} className="block w-full text-left px-3 py-2 text-xs bg-white/15 text-white rounded-xl hover:bg-white/25 transition-colors"><div className="font-medium">Program Săptămânal</div><div className="text-xs text-white/80">Modele săptămânale</div></Link>
                </div>
              </div>
              <div className="glass-card rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-white mb-3">Informații Aeroport</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-white/90"><span>Cod</span><span className="font-semibold text-white">{airport.code}</span></div>
                  <div className="flex justify-between text-xs text-white/90"><span>Oraș</span><span className="font-semibold text-white">{airport.city}</span></div>
                  <div className="flex justify-between text-xs text-white/90"><span>Țară</span><span className="font-semibold text-white">{airport.country}</span></div>
                  <div className="flex justify-between text-xs text-white/90"><span>Fus Orar</span><span className="font-semibold text-white">{airport.timezone}</span></div>
                </div>
              </div>
              <div className="glass-card rounded-2xl overflow-hidden p-2">
                <AdBanner slot="sidebar-square" size="300x250" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}