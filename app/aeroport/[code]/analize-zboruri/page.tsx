import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAirportByCodeOrSlug, generateAirportSlug } from '@/lib/airports'
import { FlightAnalyticsView } from '@/components/analytics/FlightAnalyticsView'
import { AirportSelector } from '@/components/analytics/AirportSelector'
import { AdBanner } from '@/components/ads/AdBanner'

interface Props {
  params: { code: string }
  searchParams: { 
    view?: 'routes' | 'airlines' | 'punctuality'
    period?: 'week' | 'month' | 'quarter'
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
    title: `Analize Zboruri ${airport.city} - Rute și Destinații ${airport.name}`,
    description: `Analize complete ale zborurilor de la ${airport.name}: cele mai frecvente rute, top destinații, companii aeriene punctuale și statistici detaliate pentru ${airport.city}.`,
    keywords: [
      `analize zboruri ${airport.city}`,
      `rute aeriene ${airport.code}`,
      `destinatii populare ${airport.city}`,
      `companii aeriene ${airport.name}`,
      'analiza trafic aerian Romania'
    ],
    openGraph: {
      title: `Analize Zboruri ${airport.city} - ${airport.name}`,
      description: `Descoperă rutele cele mai frecvente și companiile aeriene de la ${airport.name}. Analize complete de trafic aerian.`,
      type: 'website',
    },
    alternates: {
      canonical: `/aeroport/${generateAirportSlug(airport)}/analize-zboruri`,
    },
  }
}

export default function FlightAnalyticsPage({ params, searchParams }: Props) {
  const airport = getAirportByCodeOrSlug(params.code)
  
  if (!airport) {
    notFound()
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `Analize Zboruri ${airport.city} - ${airport.name}`,
    description: `Analize detaliate ale rutelor și companiilor aeriene de la ${airport.name} din ${airport.city}`,
    url: `https://anyway.ro/aeroport/${generateAirportSlug(airport)}/analize-zboruri`,
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
              <h1 className="text-3xl md:text-4xl font-bold mb-4 text-white">Analize Zboruri {airport.city}</h1>
              <p className="text-xl text-white/90 mb-2">{airport.name}</p>
              <p className="text-white/80">Rute frecvente, destinații populare și analize de punctualitate</p>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3 space-y-6">
              {/* Airport Selector */}
              <AirportSelector 
                currentAirport={airport}
                analyticsType="analize-zboruri"
              />
              
              <FlightAnalyticsView 
                airport={airport}
                initialView={searchParams.view || 'routes'}
                initialPeriod={searchParams.period || 'month'}
              />
            </div>

            <div className="lg:col-span-1 space-y-6">
              <div className="glass-card rounded-2xl overflow-hidden p-2">
                <AdBanner slot="sidebar-right" size="300x600" />
              </div>
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Tipuri de Analize</h3>
                <div className="space-y-3 text-sm">
                  <div><div className="font-medium text-white">Rute Frecvente</div><div className="text-white/80">Destinațiile cele mai populare și volumul de trafic</div></div>
                  <div><div className="font-medium text-white">Companii Aeriene</div><div className="text-white/80">Operatorii principali și cota de piață</div></div>
                  <div><div className="font-medium text-white">Punctualitate</div><div className="text-white/80">Zborurile cele mai punctuale și întârziate</div></div>
                </div>
              </div>
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Alte Analize</h3>
                <div className="space-y-2">
                  <a href={`/aeroport/${generateAirportSlug(airport)}/program-zboruri`} className="block p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors border border-white/10"><div className="font-medium text-white">Program Zboruri</div><div className="text-sm text-white/80">Calendar și filtre</div></a>
                  <a href={`/aeroport/${generateAirportSlug(airport)}/statistici`} className="block p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors border border-white/10"><div className="font-medium text-white">Statistici</div><div className="text-sm text-white/80">Performanță și indici</div></a>
                  <a href={`/aeroport/${generateAirportSlug(airport)}/istoric-zboruri`} className="block p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors border border-white/10"><div className="font-medium text-white">Istoric</div><div className="text-sm text-white/80">Tendințe și evoluție</div></a>
                </div>
              </div>
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Catalog Aeronave</h3>
                <a href="/aeronave" className="block p-4 bg-white/10 rounded-xl hover:bg-white/20 border border-white/20 transition-colors">
                  <div className="font-medium text-white">Explorează Aeronavele</div>
                  <div className="text-sm text-white/80 mt-1">Căutare după ICAO24, înmatriculare și istoric zboruri</div>
                </a>
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