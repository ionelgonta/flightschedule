import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAirportByCodeOrSlug, generateAirportSlug } from '@/lib/airports'
import { HistoricalAnalysisView } from '@/components/analytics/HistoricalAnalysisView'
import { AirportSelector } from '@/components/analytics/AirportSelector'
import { AdBanner } from '@/components/ads/AdBanner'

interface Props {
  params: { code: string }
  searchParams: { 
    from?: string
    to?: string
    type?: 'volume' | 'delays' | 'performance'
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
    title: `Istoric Zboruri ${airport.city} - Analize Tendințe ${airport.name}`,
    description: `Analize istorice detaliate pentru zborurile de la ${airport.name}: evoluția volumului de trafic, tendințe întârzieri și performanță în timp pentru ${airport.city}.`,
    keywords: [
      `istoric zboruri ${airport.city}`,
      `tendinte aviatie ${airport.code}`,
      `evolutie trafic aerian ${airport.city}`,
      `analiza istorica ${airport.name}`,
      'statistici aviatie Romania istoric'
    ],
    openGraph: {
      title: `Istoric Zboruri ${airport.city} - ${airport.name}`,
      description: `Urmărește evoluția zborurilor și tendințele de performanță la ${airport.name}. Analize istorice complete.`,
      type: 'website',
    },
    alternates: {
      canonical: `/aeroport/${generateAirportSlug(airport)}/istoric-zboruri`,
    },
  }
}

export default function HistoricalAnalysisPage({ params, searchParams }: Props) {
  const airport = getAirportByCodeOrSlug(params.code)
  
  if (!airport) {
    notFound()
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `Istoric Zboruri ${airport.city} - ${airport.name}`,
    description: `Analize istorice și tendințe pentru zborurile de la ${airport.name} din ${airport.city}`,
    url: `https://anyway.ro/aeroport/${generateAirportSlug(airport)}/istoric-zboruri`,
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
              <h1 className="text-3xl md:text-4xl font-bold mb-4 text-white">Istoric Zboruri {airport.city}</h1>
              <p className="text-xl text-white/90 mb-2">{airport.name}</p>
              <p className="text-white/80">Analize istorice și tendințe: evoluție trafic, performanță în timp</p>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3 space-y-6">
              {/* Airport Selector */}
              <AirportSelector 
                currentAirport={airport}
                analyticsType="istoric-zboruri"
              />
              
              <HistoricalAnalysisView 
                airport={airport}
                initialFilters={{
                  from: searchParams.from,
                  to: searchParams.to,
                  type: searchParams.type || 'volume'
                }}
              />
            </div>

            <div className="lg:col-span-1 space-y-6">
              <div className="glass-card rounded-2xl overflow-hidden p-2">
                <AdBanner slot="sidebar-right" size="300x600" />
              </div>
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Tipuri de Analize</h3>
                <div className="space-y-3 text-sm">
                  <div><div className="font-medium text-white">Volum Trafic</div><div className="text-white/80">Evoluția numărului de zboruri în timp</div></div>
                  <div><div className="font-medium text-white">Tendințe Întârzieri</div><div className="text-white/80">Analiza întârzierilor pe perioade lungi</div></div>
                  <div><div className="font-medium text-white">Performanță</div><div className="text-white/80">Comparații între luni și sezoane</div></div>
                </div>
              </div>
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Alte Analize</h3>
                <div className="space-y-2">
                  <a href={`/aeroport/${generateAirportSlug(airport)}/program-zboruri`} className="block p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors border border-white/10"><div className="font-medium text-white">Program Zboruri</div><div className="text-sm text-white/80">Calendar și filtre</div></a>
                  <a href={`/aeroport/${generateAirportSlug(airport)}/statistici`} className="block p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors border border-white/10"><div className="font-medium text-white">Statistici</div><div className="text-sm text-white/80">Performanță și indici</div></a>
                  <a href={`/aeroport/${generateAirportSlug(airport)}/analize-zboruri`} className="block p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors border border-white/10"><div className="font-medium text-white">Analize Rute</div><div className="text-sm text-white/80">Destinații și companii</div></a>
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