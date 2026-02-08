import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAirportByCodeOrSlug, generateAirportSlug } from '@/lib/airports'
import { FlightSchedulesView } from '@/components/analytics/FlightSchedulesView'
import { AirportSelector } from '@/components/analytics/AirportSelector'
import { AdBanner } from '@/components/ads/AdBanner'

interface Props {
  params: { code: string }
  searchParams: { 
    type?: 'arrivals' | 'departures'
    from?: string
    to?: string
    airline?: string
    status?: string
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
    title: `Program Zboruri ${airport.city} - ${airport.name}`,
    description: `Programul complet al zborurilor de la ${airport.name} din ${airport.city}. Consultă sosirile și plecările zilnice, săptămânale și istorice cu filtre avansate.`,
    keywords: [
      `program zboruri ${airport.city}`,
      `orarul zborurilor ${airport.code}`,
      `sosiri plecari ${airport.city}`,
      `calendar zboruri ${airport.name}`,
      'program zbor Romania'
    ],
    openGraph: {
      title: `Program Zboruri ${airport.city} - ${airport.name}`,
      description: `Programul complet al zborurilor de la ${airport.name}. Sosiri, plecări și informații detaliate despre zboruri.`,
      type: 'website',
    },
    alternates: {
      canonical: `/aeroport/${generateAirportSlug(airport)}/program-zboruri`,
    },
  }
}

export default function FlightSchedulesPage({ params, searchParams }: Props) {
  const airport = getAirportByCodeOrSlug(params.code)
  
  if (!airport) {
    notFound()
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `Program Zboruri ${airport.city} - ${airport.name}`,
    description: `Programul complet al zborurilor de la ${airport.name} din ${airport.city}`,
    url: `https://anyway.ro/aeroport/${generateAirportSlug(airport)}/program-zboruri`,
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
              <h1 className="text-3xl md:text-4xl font-bold mb-4 text-white">Program Zboruri {airport.city}</h1>
              <p className="text-xl text-white/90 mb-2">{airport.name}</p>
              <p className="text-white/80">Programul complet al zborurilor cu filtre avansate și calendar interactiv</p>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3 space-y-6">
              {/* Airport Selector */}
              <AirportSelector 
                currentAirport={airport}
                analyticsType="program-zboruri"
              />
              
              <FlightSchedulesView 
                airport={airport}
                initialType={searchParams.type || 'departures'}
                initialFilters={{
                  airline: searchParams.airline,
                  status: searchParams.status,
                  from: searchParams.from,
                  to: searchParams.to
                }}
              />
            </div>

            <div className="lg:col-span-1 space-y-6">
              <div className="glass-card rounded-2xl overflow-hidden p-2">
                <AdBanner slot="sidebar-right" size="300x600" />
              </div>
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Informații Aeroport</h3>
                <div className="space-y-3 text-sm">
                  <div><div className="text-sm text-white/70">Cod IATA</div><div className="font-semibold text-white">{airport.code}</div></div>
                  <div><div className="text-sm text-white/70">Oraș</div><div className="font-semibold text-white">{airport.city}</div></div>
                  <div><div className="text-sm text-white/70">Țară</div><div className="font-semibold text-white">{airport.country}</div></div>
                </div>
              </div>
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Analize Zboruri</h3>
                <div className="space-y-2">
                  <a href={`/aeroport/${generateAirportSlug(airport)}/statistici`} className="block p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors border border-white/10"><div className="font-medium text-white">Statistici</div><div className="text-sm text-white/80">Performanță și întârzieri</div></a>
                  <a href={`/aeroport/${generateAirportSlug(airport)}/istoric-zboruri`} className="block p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors border border-white/10"><div className="font-medium text-white">Istoric</div><div className="text-sm text-white/80">Tendințe și evoluție</div></a>
                  <a href={`/aeroport/${generateAirportSlug(airport)}/analize-zboruri`} className="block p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors border border-white/10"><div className="font-medium text-white">Analize</div><div className="text-sm text-white/80">Rute și destinații</div></a>
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