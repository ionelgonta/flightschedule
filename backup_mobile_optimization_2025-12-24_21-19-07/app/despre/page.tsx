import { Metadata } from 'next'
import Link from 'next/link'
import { Plane, Clock, MapPin, Zap, Globe, Heart } from 'lucide-react'
import { AdBanner } from '@/components/ads/AdBanner'
import { Breadcrumbs } from '@/components/seo/Breadcrumbs'
import { StructuredData, generateBreadcrumbSchema } from '@/components/seo/StructuredData'

export const metadata: Metadata = {
  title: 'Despre Noi - Platforma Românească de Monitorizare Zboruri',
  description: 'Descoperă povestea platformei românești #1 pentru monitorizarea zborurilor în timp real. Misiunea noastră, tehnologia avansată și angajamentul față de călătorii din România și Moldova. Informații complete despre echipa și viziunea noastră pentru aviația românească.',
  keywords: [
    'despre orarul zborurilor romania',
    'platforma romaneasca zboruri',
    'monitorizare zboruri romania',
    'echipa zboruri romania',
    'misiune aviatie romania',
    'tehnologie zboruri timp real',
    'platforma aeroporturi romania',
    'servicii aviatie romania',
    'informatii companie zboruri',
    'viziune aviatie romania'
  ],
  openGraph: {
    title: 'Despre Noi - Platforma Românească de Monitorizare Zboruri',
    description: 'Platforma românească dedicată monitorizării zborurilor în timp real din aeroporturile majore din România și Moldova. Descoperă misiunea și tehnologia noastră.',
    type: 'website',
    url: 'https://anyway.ro/despre'
  },
  alternates: {
    canonical: '/despre',
  },
}

export default function AboutPage() {
  const breadcrumbItems = [
    { name: 'Despre Noi', href: '/despre' }
  ]

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Orarul Zborurilor România',
    alternateName: 'Program Zboruri România',
    description: 'Platforma românească pentru monitorizarea zborurilor în timp real din aeroporturile majore din România și Moldova',
    url: 'https://anyway.ro',
    logo: 'https://anyway.ro/logo.png',
    foundingDate: '2024',
    areaServed: [
      {
        '@type': 'Country',
        name: 'România'
      },
      {
        '@type': 'Country',
        name: 'Moldova'
      }
    ],
    serviceType: 'Monitorizare Zboruri în Timp Real',
    knowsAbout: [
      'Monitorizare zboruri',
      'Aeroporturi România',
      'Informații aviație',
      'Statistici zboruri',
      'Program zboruri'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: 'Romanian'
    }
  }

  return (
    <>
      <StructuredData data={organizationSchema} />
      <StructuredData data={generateBreadcrumbSchema([
        { name: 'Acasă', url: 'https://anyway.ro' },
        { name: 'Despre Noi', url: 'https://anyway.ro/despre' }
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
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Heart className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold mb-4 text-gray-900">
                Despre Platforma Noastră
              </h1>
              <p className="text-base text-gray-600 max-w-3xl mx-auto">
                Suntem platforma românească dedicată monitorizării zborurilor în timp real, 
                creată special pentru călătorii din România și Moldova care au nevoie de 
                informații precise și actualizate despre zborurile lor.
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
              {/* Mission Section */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Misiunea Noastră
                </h2>
                <div className="prose prose-gray max-w-none">
                  <p className="text-base text-gray-600 mb-4">
                    Ne-am născut din nevoia de a avea o platformă românească dedicată monitorizării 
                    zborurilor, care să înțeleagă perfect nevoile călătorilor din România și Moldova. 
                    În timp ce există multe platforme internaționale, noi ne concentrăm exclusiv pe 
                    piața românească, oferind informații în limba română și acoperind în detaliu 
                    toate aeroporturile din țara noastră.
                  </p>
                  <p className="text-base text-gray-600 mb-4">
                    Credem că fiecare călător român merită să aibă acces la informații precise, 
                    actualizate în timp real și prezentate într-un mod clar și ușor de înțeles. 
                    De aceea, am dezvoltat o platformă care nu doar traduce informațiile, ci le 
                    adaptează complet la contextul și nevoile locale.
                  </p>
                </div>
              </section>

              {/* Features Grid */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Ce Ne Face Speciali
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center mb-3">
                      <div className="p-2 bg-blue-50 rounded-lg mr-3">
                        <Clock className="h-5 w-5 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Date în Timp Real
                      </h3>
                    </div>
                    <p className="text-gray-600 text-sm">
                      Informațiile noastre sunt actualizate la fiecare câteva minute, oferindu-ți 
                      cele mai recente date despre statusul zborurilor, întârzieri și schimbări de poartă.
                    </p>
                  </div>

                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center mb-3">
                      <div className="p-2 bg-green-50 rounded-lg mr-3">
                        <MapPin className="h-5 w-5 text-green-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Acoperire Completă România
                      </h3>
                    </div>
                    <p className="text-gray-600 text-sm">
                      De la Otopeni la Cluj, de la Timișoara la Iași - acoperim toate aeroporturile 
                      majore din România și Moldova cu informații detaliate și actualizate.
                    </p>
                  </div>

                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center mb-3">
                      <div className="p-2 bg-purple-50 rounded-lg mr-3">
                        <Globe className="h-5 w-5 text-purple-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        100% în Română
                      </h3>
                    </div>
                    <p className="text-gray-600 text-sm">
                      Toate informațiile, de la numele aeroporturilor la statusurile zborurilor, 
                      sunt prezentate în limba română, adaptate perfect pentru utilizatorii locali.
                    </p>
                  </div>

                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center mb-3">
                      <div className="p-2 bg-orange-50 rounded-lg mr-3">
                        <Zap className="h-5 w-5 text-orange-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Interfață Rapidă
                      </h3>
                    </div>
                    <p className="text-gray-600 text-sm">
                      Platforma noastră este optimizată pentru viteză, oferind informațiile de care 
                      ai nevoie într-un timp record, fără încărcări lungi sau interfețe complicate.
                    </p>
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

              {/* Coverage Section */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Acoperirea Noastră
                </h2>
                <div className="bg-blue-50 rounded-lg p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">
                        🇷🇴 Aeroporturi România
                      </h3>
                      <ul className="space-y-1 text-gray-600 text-sm">
                        <li>• <strong>OTP</strong> - Aeroportul Internațional Henri Coandă (București)</li>
                        <li>• <strong>BBU</strong> - Aeroportul Internațional Aurel Vlaicu (București)</li>
                        <li>• <strong>CLJ</strong> - Aeroportul Internațional Cluj-Napoca</li>
                        <li>• <strong>TSR</strong> - Aeroportul Internațional Timișoara Traian Vuia</li>
                        <li>• <strong>IAS</strong> - Aeroportul Internațional Iași</li>
                        <li>• <strong>CND</strong> - Aeroportul Internațional Mihail Kogălniceanu (Constanța)</li>
                        <li>• <strong>SBZ</strong> - Aeroportul Internațional Sibiu</li>
                        <li>• Și multe altele...</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">
                        🇲🇩 Moldova
                      </h3>
                      <ul className="space-y-1 text-gray-600 text-sm">
                        <li>• <strong>RMO</strong> - Aeroportul Internațional Chișinău</li>
                      </ul>
                      
                      <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">
                        🌍 Conexiuni Internaționale
                      </h3>
                      <ul className="space-y-1 text-gray-600 text-sm">
                        <li>• Hub-uri majore europene</li>
                        <li>• Destinații din Orientul Mijlociu</li>
                        <li>• Rute către America de Nord</li>
                        <li>• Conexiuni către Asia</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>

              {/* Technology Section */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Tehnologia Din Spatele Platformei
                </h2>
                <div className="prose prose-gray max-w-none">
                  <p className="text-base text-gray-600 mb-4">
                    Platforma noastră folosește tehnologii moderne pentru a-ți oferi cea mai bună 
                    experiență posibilă. Colectăm date din multiple surse oficiale de aviație, 
                    le procesăm în timp real și le prezentăm într-un format clar și ușor de înțeles.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
                    <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
                      <div className="text-2xl font-bold text-blue-600 mb-1">99.9%</div>
                      <div className="text-xs text-gray-600">Timp de funcționare</div>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
                      <div className="text-2xl font-bold text-green-600 mb-1">&lt;2s</div>
                      <div className="text-xs text-gray-600">Timp de încărcare</div>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
                      <div className="text-2xl font-bold text-purple-600 mb-1">24/7</div>
                      <div className="text-xs text-gray-600">Monitorizare</div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Contact Section */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Suntem Aici Pentru Tine
                </h2>
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <p className="text-base text-gray-600 mb-4">
                    Platforma noastră este în continuă dezvoltare, și feedback-ul tău este esențial 
                    pentru îmbunătățirea serviciilor noastre. Dacă ai sugestii, întrebări sau 
                    observații, nu ezita să ne contactezi.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        Ce Planificăm Pentru Viitor
                      </h3>
                      <ul className="space-y-1 text-gray-600 text-sm">
                        <li>• Notificări push pentru zborurile tale</li>
                        <li>• Aplicație mobilă dedicată</li>
                        <li>• Integrare cu calendarul personal</li>
                        <li>• Predicții bazate pe AI pentru întârzieri</li>
                        <li>• Informații despre traficul către aeroporturi</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        Mulțumiri Speciale
                      </h3>
                      <p className="text-gray-600 mb-3 text-sm">
                        Mulțumim tuturor călătorilor români care ne-au oferit feedback și ne-au 
                        ajutat să îmbunătățim platforma. Fiecare sugestie contează în dezvoltarea 
                        unui serviciu mai bun pentru comunitatea noastră.
                      </p>
                      <Link 
                        href="/aeroporturi"
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        <Plane className="h-4 w-4 mr-2" />
                        Explorează Aeroporturile
                      </Link>
                    </div>
                  </div>
                </div>
              </section>
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
                  Statistici Platformă
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Aeroporturi România</span>
                    <span className="font-semibold text-gray-900">15+</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Zboruri Monitorizate</span>
                    <span className="font-semibold text-gray-900">1000+/zi</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Companii Aeriene</span>
                    <span className="font-semibold text-gray-900">50+</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Actualizări/Zi</span>
                    <span className="font-semibold text-gray-900">10K+</span>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="text-base font-semibold text-gray-900 mb-3">
                  Navigare Rapidă
                </h3>
                <div className="space-y-2">
                  <Link
                    href="/"
                    className="block w-full text-left px-3 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                  >
                    Acasă
                  </Link>
                  <Link
                    href="/aeroporturi"
                    className="block w-full text-left px-3 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                  >
                    Toate Aeroporturile
                  </Link>
                  <Link
                    href="/cautare"
                    className="block w-full text-left px-3 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                  >
                    Căutare Zboruri
                  </Link>
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