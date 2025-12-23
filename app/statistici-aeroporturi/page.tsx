import { Metadata } from 'next'
import Link from 'next/link'
import { Building, TrendingUp, Clock, MapPin, BarChart3 } from 'lucide-react'
import { MAJOR_AIRPORTS } from '@/lib/airports'
import { AdBanner } from '@/components/ads/AdBanner'
import { Breadcrumbs } from '@/components/seo/Breadcrumbs'
import { StructuredData, generateBreadcrumbSchema } from '@/components/seo/StructuredData'
import { AirportStatisticsGrid } from '@/components/statistics/AirportStatisticsGrid'
import { GlobalStatusDistribution } from '@/components/statistics/GlobalStatusDistribution'

export const metadata: Metadata = {
  title: 'Statistici Aeroporturi România - Performanță și Punctualitate',
  description: 'Statistici complete de performanță pentru toate aeroporturile din România și Moldova. Indice întârzieri, punctualitate, ore de vârf și distribuția statusurilor pentru OTP, CLJ, TSR, IAS, RMO și toate aeroporturile naționale.',
  keywords: [
    'statistici aeroporturi romania',
    'performanta aeroporturi',
    'punctualitate zboruri romania',
    'intarzieri aeroporturi',
    'ore varf aeroporturi',
    'statistici OTP CLJ TSR IAS',
    'performanta zboruri romania',
    'indice punctualitate aeroporturi'
  ],
  openGraph: {
    title: 'Statistici Aeroporturi România - Performanță și Punctualitate',
    description: 'Statistici complete de performanță pentru toate aeroporturile din România și Moldova.',
    type: 'website',
    url: 'https://anyway.ro/statistici-aeroporturi'
  },
  alternates: {
    canonical: '/statistici-aeroporturi',
  },
}

export default function StatisticiAeroporturiPage() {

  const breadcrumbItems = [
    { name: 'Analize', href: '/analize' },
    { name: 'Statistici Aeroporturi' }
  ]

  const statisticsSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Statistici Aeroporturi România',
    description: 'Statistici complete de performanță pentru toate aeroporturile din România și Moldova',
    url: 'https://anyway.ro/statistici-aeroporturi',
    mainEntity: {
      '@type': 'Service',
      name: 'Statistici Performanță Aeroporturi',
      description: 'Analize detaliate de performanță, punctualitate și eficiență pentru aeroporturile românești',
      provider: {
        '@type': 'Organization',
        name: 'Orarul Zborurilor România'
      }
    }
  }

  return (
    <>
      <StructuredData data={statisticsSchema} />
      <StructuredData data={generateBreadcrumbSchema([
        { name: 'Acasă', url: 'https://anyway.ro' },
        { name: 'Analize', url: 'https://anyway.ro/analize' },
        { name: 'Statistici Aeroporturi', url: 'https://anyway.ro/statistici-aeroporturi' }
      ])} />
      
      <div className="min-h-screen">
        {/* Header Banner Ad */}
        <div className="bg-white border-b border-gray-200">
          <AdBanner 
            slot="header-banner"
            size="728x90"
            className="max-w-7xl mx-auto py-2"
          />
        </div>

        {/* Hero Section */}
        <section className="bg-white border-b border-gray-200 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-2 bg-green-50 rounded-lg">
                  <Building className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold mb-4 text-gray-900">
                Statistici Aeroporturi România
              </h1>
              <p className="text-base text-gray-600 mb-6 max-w-2xl mx-auto">
                Analize complete de performanță pentru toate aeroporturile din România și Moldova. 
                Monitorizează punctualitatea, întârzierile și eficiența operațională.
              </p>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumbs */}
          <Breadcrumbs items={breadcrumbItems} className="mb-6" />
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-8">
              {/* Statistics Overview */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Tipuri de Statistici Disponibile
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-50 rounded-lg border border-green-200 p-4">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-green-600 rounded-lg">
                        <TrendingUp className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-green-800 mb-1 text-sm">
                          Indice Punctualitate
                        </h3>
                        <p className="text-xs text-green-700">
                          Procentajul zborurilor la timp, întârzieri medii și distribuția întârzierilor pe categorii
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-blue-600 rounded-lg">
                        <Clock className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-blue-800 mb-1 text-sm">
                          Ore de Vârf
                        </h3>
                        <p className="text-xs text-blue-700">
                          Analiza traficului pe ore, identificarea perioadelor aglomerate și optimizarea programului
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 rounded-lg border border-purple-200 p-4">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-purple-600 rounded-lg">
                        <Building className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-purple-800 mb-1 text-sm">
                          Performanță Operațională
                        </h3>
                        <p className="text-xs text-purple-700">
                          Capacitate de procesare, eficiența terminalelor și utilizarea pistelor
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-orange-50 rounded-lg border border-orange-200 p-4">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-orange-600 rounded-lg">
                        <MapPin className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-orange-800 mb-1 text-sm">
                          Comparații Regionale
                        </h3>
                        <p className="text-xs text-orange-700">
                          Benchmarking între aeroporturi, clasamente de performanță și analize comparative
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Inline Banner Ad */}
              <div className="py-6">
                <AdBanner 
                  slot="inline-banner"
                  size="728x90"
                  className="mx-auto"
                />
              </div>

              {/* Global Status Distribution */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Statistici Generale România
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
                  <div className="lg:col-span-1">
                    <GlobalStatusDistribution />
                  </div>
                  <div className="lg:col-span-2">
                    {/* Placeholder for additional global stats */}
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <h3 className="text-base font-semibold text-gray-900 mb-3">
                        Performanță Generală
                      </h3>
                      <div className="text-center py-6">
                        <BarChart3 className="h-8 w-8 text-blue-500 mx-auto mb-3" />
                        <p className="text-gray-600 text-sm">
                          Grafice detaliate de performanță vor fi disponibile în curând
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Airport Statistics with Real Data */}
              <AirportStatisticsGrid />
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Sidebar Ad */}
              <AdBanner 
                slot="sidebar-right"
                size="300x600"
              />
              
              {/* Quick Stats */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="text-base font-semibold text-gray-900 mb-3">
                  Informații Generale
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Aeroporturi Monitorizate</span>
                    <span className="font-semibold text-gray-900">{MAJOR_AIRPORTS.length}</span>
                  </div>
                  <div className="text-xs text-gray-600 pt-2 border-t border-gray-200">
                    Statisticile se calculează pe baza datelor reale din ultimele 7 zile. Pentru aeroporturile cu date insuficiente, se afișează mesajul corespunzător.
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