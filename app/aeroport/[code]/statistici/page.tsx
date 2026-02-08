import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAirportByCodeOrSlug, generateAirportSlug } from '@/lib/airports'
import { AirportStatisticsView } from '@/components/analytics/AirportStatisticsView'
import { AirportSelector } from '@/components/analytics/AirportSelector'
import { AdBanner } from '@/components/ads/AdBanner'
import { getWeatherCityForAirport } from '@/lib/weatherUtils'

interface Props {
  params: { code: string }
  searchParams: { 
    period?: 'daily' | 'weekly' | 'monthly'
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const airport = getAirportByCodeOrSlug(params.code)
  
  if (!airport) {
    return {
      title: 'Aeroport nu a fost găsit',
    }
  }

  return {
    title: `Statistici Zboruri ${airport.city} - ${airport.name}`,
    description: `Statistici detaliate despre zborurile de la ${airport.name}: indice întârzieri, performanță la timp, ore de vârf și analize comparative pentru ${airport.city}.`,
    keywords: [
      `statistici zboruri ${airport.city}`,
      `performanta aeroport ${airport.code}`,
      `intarzieri zboruri ${airport.city}`,
      `indice punctualitate ${airport.name}`,
      'statistici aviatie Romania'
    ],
    openGraph: {
      title: `Statistici Zboruri ${airport.city} - ${airport.name}`,
      description: `Analize statistice complete pentru zborurile de la ${airport.name}. Indice întârzieri, performanță și tendințe.`,
      type: 'website',
    },
    alternates: {
      canonical: `/aeroport/${generateAirportSlug(airport)}/statistici`,
    },
  }
}

export default function AirportStatisticsPage({ params, searchParams }: Props) {
  const airport = getAirportByCodeOrSlug(params.code)
  
  if (!airport) {
    notFound()
  }

  const weatherCity = getWeatherCityForAirport(airport.code)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `Statistici Zboruri ${airport.city} - ${airport.name}`,
    description: `Statistici detaliate despre zborurile de la ${airport.name} din ${airport.city}`,
    url: `https://anyway.ro/aeroport/${generateAirportSlug(airport)}/statistici`,
    about: {
      '@type': 'Airport',
      name: airport.name,
      iataCode: airport.code,
      address: {
        '@type': 'PostalAddress',
        addressLocality: airport.city,
        addressCountry: airport.country
      }
    }
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <div className="min-h-screen relative z-10">
        <div className="glass-card mx-4 mt-4 rounded-2xl overflow-hidden">
          <AdBanner slot="header-banner" size="728x90" className="max-w-7xl mx-auto py-4" />
        </div>

        <section className="px-4 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-3xl md:text-4xl font-bold mb-4 text-white">Statistici Zboruri {airport.city}</h1>
              <p className="text-xl text-white/90 mb-2">{airport.name}</p>
              <p className="text-white/80">Analize statistice detaliate: performanță, întârzieri și tendințe</p>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3 space-y-6">
              {/* Airport Selector */}
              <AirportSelector 
                currentAirport={airport}
                analyticsType="statistici"
              />
              
              <AirportStatisticsView 
                airport={airport}
                initialPeriod={searchParams.period || 'monthly'}
              />
            </div>

            <div className="lg:col-span-1 space-y-6">
              <div className="glass-card rounded-2xl overflow-hidden p-2">
                <AdBanner slot="sidebar-right" size="300x600" />
              </div>
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Informații Statistice</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="font-medium text-white">Indice Întârzieri</div>
                    <div className="text-white/80">Măsoară performanța generală a aeroportului în gestionarea întârzierilor</div>
                  </div>
                  <div>
                    <div className="font-medium text-white">Performanță La Timp</div>
                    <div className="text-white/80">Procentul zborurilor care pleacă/sosesc la timp programat</div>
                  </div>
                  <div>
                    <div className="font-medium text-white">Ore de Vârf</div>
                    <div className="text-white/80">Intervalele orare cu cele mai multe întârzieri</div>
                  </div>
                </div>
              </div>
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Alte Analize</h3>
                <div className="space-y-2">
                  <a href={`/aeroport/${generateAirportSlug(airport)}/program-zboruri`} className="block p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors border border-white/10">
                    <div className="font-medium text-white">Program Zboruri</div>
                    <div className="text-sm text-white/80">Calendar și filtre</div>
                  </a>
                  <a href={`/aeroport/${generateAirportSlug(airport)}/istoric-zboruri`} className="block p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors border border-white/10">
                    <div className="font-medium text-white">Istoric</div>
                    <div className="text-sm text-white/80">Tendințe și evoluție</div>
                  </a>
                  <a href={`/aeroport/${generateAirportSlug(airport)}/analize-zboruri`} className="block p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors border border-white/10">
                    <div className="font-medium text-white">Analize Rute</div>
                    <div className="text-sm text-white/80">Destinații și companii</div>
                  </a>
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