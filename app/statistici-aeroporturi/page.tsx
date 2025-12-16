import { Metadata } from 'next'
import Link from 'next/link'
import { Building, TrendingUp, Clock, MapPin } from 'lucide-react'
import { MAJOR_AIRPORTS } from '@/lib/airports'
import { AdBanner } from '@/components/ads/AdBanner'
import { Breadcrumbs } from '@/components/seo/Breadcrumbs'
import { StructuredData, generateBreadcrumbSchema } from '@/components/seo/StructuredData'
import { AirportStatisticsGrid } from '@/components/statistics/AirportStatisticsGrid'

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
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <AdBanner 
            slot="header-banner"
            size="728x90"
            className="max-w-7xl mx-auto py-4"
          />
        </div>

        {/* Hero Section */}
        <section className="bg-gradient-to-br from-green-600 to-green-800 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-white/10 rounded-full">
                  <Building className="h-12 w-12" />
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Statistici Aeroporturi România
              </h1>
              <p className="text-xl text-green-100 mb-8 max-w-3xl mx-auto">
                Analize complete de performanță pentru toate aeroporturile din România și Moldova. 
                Monitorizează punctualitatea, întârzierile și eficiența operațională.
              </p>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Breadcrumbs */}
          <Breadcrumbs items={breadcrumbItems} className="mb-8" />
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-12">
              {/* Statistics Overview */}
              <section>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                  Tipuri de Statistici Disponibile
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border border-green-200 dark:border-green-700 p-6">
                    <div className="flex items-start space-x-4">
                      <div className="p-3 bg-green-600 rounded-lg">
                        <TrendingUp className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-green-800 dark:text-green-200 mb-2">
                          Indice Punctualitate
                        </h3>
                        <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                          Procentajul zborurilor la timp, întârzieri medii și distribuția întârzierilor pe categorii
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-700 p-6">
                    <div className="flex items-start space-x-4">
                      <div className="p-3 bg-blue-600 rounded-lg">
                        <Clock className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-blue-800 dark:text-blue-200 mb-2">
                          Ore de Vârf
                        </h3>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                          Analiza traficului pe ore, identificarea perioadelor aglomerate și optimizarea programului
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg border border-purple-200 dark:border-purple-700 p-6">
                    <div className="flex items-start space-x-4">
                      <div className="p-3 bg-purple-600 rounded-lg">
                        <Building className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-purple-800 dark:text-purple-200 mb-2">
                          Performanță Operațională
                        </h3>
                        <p className="text-sm text-purple-700 dark:text-purple-300 mb-3">
                          Capacitate de procesare, eficiența terminalelor și utilizarea pistelor
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg border border-orange-200 dark:border-orange-700 p-6">
                    <div className="flex items-start space-x-4">
                      <div className="p-3 bg-orange-600 rounded-lg">
                        <MapPin className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-orange-800 dark:text-orange-200 mb-2">
                          Comparații Regionale
                        </h3>
                        <p className="text-sm text-orange-700 dark:text-orange-300 mb-3">
                          Benchmarking între aeroporturi, clasamente de performanță și analize comparative
                        </p>
                      </div>
                    </div>
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

              {/* Airport Statistics with Real Data */}
              <AirportStatisticsGrid />
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
                  Informații Generale
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Aeroporturi Monitorizate</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{MAJOR_AIRPORTS.length}</span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
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