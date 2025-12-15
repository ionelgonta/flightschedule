import { Metadata } from 'next'
import Link from 'next/link'
import { Plane, Clock, MapPin, Users, Shield, Zap, Globe, Heart } from 'lucide-react'
import { AdBanner } from '@/components/ads/AdBanner'

export const metadata: Metadata = {
  title: 'Despre Noi - Platforma de Monitorizare Zboruri România',
  description: 'Descoperă povestea platformei noastre de monitorizare zboruri în timp real pentru România și Moldova. Informații complete despre misiunea noastră, tehnologia folosită și angajamentul față de călătorii români.',
  keywords: ['despre noi', 'platforma zboruri romania', 'monitorizare zboruri', 'aeroporturi romania', 'tehnologie aviație', 'zboruri timp real', 'OTP', 'CLJ', 'TSR', 'IAS', 'RMO'],
  openGraph: {
    title: 'Despre Noi - Platforma de Monitorizare Zboruri România',
    description: 'Platforma românească dedicată monitorizării zborurilor în timp real din aeroporturile majore din România și Moldova.',
    type: 'website',
  },
  alternates: {
    canonical: '/despre',
  },
}

export default function AboutPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Program Zboruri România',
    description: 'Platforma românească pentru monitorizarea zborurilor în timp real',
    url: 'https://anyway.ro',
    foundingDate: '2024',
    areaServed: ['România', 'Moldova'],
    serviceType: 'Monitorizare Zboruri în Timp Real',
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

        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-white/10 rounded-full">
                  <Heart className="h-16 w-16" />
                </div>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Despre Platforma Noastră
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-primary-100 max-w-4xl mx-auto">
                Suntem platforma românească dedicată monitorizării zborurilor în timp real, 
                creată special pentru călătorii din România și Moldova care au nevoie de 
                informații precise și actualizate despre zborurile lor.
              </p>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-12">
              {/* Mission Section */}
              <section>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                  Misiunea Noastră
                </h2>
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                    Ne-am născut din nevoia de a avea o platformă românească dedicată monitorizării 
                    zborurilor, care să înțeleagă perfect nevoile călătorilor din România și Moldova. 
                    În timp ce există multe platforme internaționale, noi ne concentrăm exclusiv pe 
                    piața românească, oferind informații în limba română și acoperind în detaliu 
                    toate aeroporturile din țara noastră.
                  </p>
                  <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                    Credem că fiecare călător român merită să aibă acces la informații precise, 
                    actualizate în timp real și prezentate într-un mod clar și ușor de înțeles. 
                    De aceea, am dezvoltat o platformă care nu doar traduce informațiile, ci le 
                    adaptează complet la contextul și nevoile locale.
                  </p>
                </div>
              </section>

              {/* Features Grid */}
              <section>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                  Ce Ne Face Speciali
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center mb-4">
                      <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full mr-4">
                        <Clock className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Date în Timp Real
                      </h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                      Informațiile noastre sunt actualizate la fiecare câteva minute, oferindu-ți 
                      cele mai recente date despre statusul zborurilor, întârzieri și schimbări de poartă.
                    </p>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center mb-4">
                      <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full mr-4">
                        <MapPin className="h-8 w-8 text-green-600 dark:text-green-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Acoperire Completă România
                      </h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                      De la Otopeni la Cluj, de la Timișoara la Iași - acoperim toate aeroporturile 
                      majore din România și Moldova cu informații detaliate și actualizate.
                    </p>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center mb-4">
                      <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full mr-4">
                        <Globe className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        100% în Română
                      </h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                      Toate informațiile, de la numele aeroporturilor la statusurile zborurilor, 
                      sunt prezentate în limba română, adaptate perfect pentru utilizatorii locali.
                    </p>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center mb-4">
                      <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-full mr-4">
                        <Zap className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Interfață Rapidă
                      </h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                      Platforma noastră este optimizată pentru viteză, oferind informațiile de care 
                      ai nevoie într-un timp record, fără încărcări lungi sau interfețe complicate.
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

              {/* Coverage Section */}
              <section>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                  Acoperirea Noastră
                </h2>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                        🇷🇴 Aeroporturi România
                      </h3>
                      <ul className="space-y-2 text-gray-600 dark:text-gray-400">
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
                      <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                        🇲🇩 Moldova
                      </h3>
                      <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                        <li>• <strong>RMO</strong> - Aeroportul Internațional Chișinău</li>
                      </ul>
                      
                      <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4 mt-6">
                        🌍 Conexiuni Internaționale
                      </h3>
                      <ul className="space-y-2 text-gray-600 dark:text-gray-400">
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
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                  Tehnologia Din Spatele Platformei
                </h2>
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                    Platforma noastră folosește tehnologii moderne pentru a-ți oferi cea mai bună 
                    experiență posibilă. Colectăm date din multiple surse oficiale de aviație, 
                    le procesăm în timp real și le prezentăm într-un format clar și ușor de înțeles.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
                    <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">99.9%</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Timp de funcționare</div>
                    </div>
                    <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">&lt;2s</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Timp de încărcare</div>
                    </div>
                    <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">24/7</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Monitorizare</div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Contact Section */}
              <section>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                  Suntem Aici Pentru Tine
                </h2>
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
                  <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                    Platforma noastră este în continuă dezvoltare, și feedback-ul tău este esențial 
                    pentru îmbunătățirea serviciilor noastre. Dacă ai sugestii, întrebări sau 
                    observații, nu ezita să ne contactezi.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        Ce Planificăm Pentru Viitor
                      </h3>
                      <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                        <li>• Notificări push pentru zborurile tale</li>
                        <li>• Aplicație mobilă dedicată</li>
                        <li>• Integrare cu calendarul personal</li>
                        <li>• Predicții bazate pe AI pentru întârzieri</li>
                        <li>• Informații despre traficul către aeroporturi</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        Mulțumiri Speciale
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Mulțumim tuturor călătorilor români care ne-au oferit feedback și ne-au 
                        ajutat să îmbunătățim platforma. Fiecare sugestie contează în dezvoltarea 
                        unui serviciu mai bun pentru comunitatea noastră.
                      </p>
                      <Link 
                        href="/aeroporturi"
                        className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        <Plane className="h-5 w-5 mr-2" />
                        Explorează Aeroporturile
                      </Link>
                    </div>
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
                  Statistici Platformă
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Aeroporturi România</span>
                    <span className="font-semibold text-gray-900 dark:text-white">15+</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Zboruri Monitorizate</span>
                    <span className="font-semibold text-gray-900 dark:text-white">1000+/zi</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Companii Aeriene</span>
                    <span className="font-semibold text-gray-900 dark:text-white">50+</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Actualizări/Zi</span>
                    <span className="font-semibold text-gray-900 dark:text-white">10K+</span>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Navigare Rapidă
                </h3>
                <div className="space-y-3">
                  <Link
                    href="/"
                    className="block w-full text-left px-4 py-2 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    Acasă
                  </Link>
                  <Link
                    href="/aeroporturi"
                    className="block w-full text-left px-4 py-2 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    Toate Aeroporturile
                  </Link>
                  <Link
                    href="/cautare"
                    className="block w-full text-left px-4 py-2 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
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