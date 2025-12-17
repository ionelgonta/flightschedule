import Link from 'next/link'
import { Plane, Clock, MapPin, TrendingUp } from 'lucide-react'
import { MAJOR_AIRPORTS, generateAirportSlug } from '@/lib/airports'
import { AdBanner } from '@/components/ads/AdBanner'
import { StructuredData, generateOrganizationSchema, generateWebSiteSchema } from '@/components/seo/StructuredData'
import { InternalLinks } from '@/components/seo/InternalLinks'

export default function HomePage() {
  // Feature Romanian and Moldovan airports
  const romanianAirports = MAJOR_AIRPORTS.filter(a => a.country === 'România')
  const moldovanAirports = MAJOR_AIRPORTS.filter(a => a.country === 'Moldova')
  const featuredAirports = [...romanianAirports.slice(0, 2), ...moldovanAirports.slice(0, 1)]

  return (
    <>
      {/* Structured Data */}
      <StructuredData data={generateOrganizationSchema()} />
      <StructuredData data={generateWebSiteSchema()} />
      <StructuredData data={{
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Orarul Zborurilor România - Informații Zboruri în Timp Real',
        description: 'Informații complete și în timp real despre zborurile din România și Moldova. Monitorizează sosirile și plecările de la aeroporturile OTP Otopeni, CLJ Cluj, TSR Timișoara, IAS Iași, RMO Chișinău.',
        url: 'https://anyway.ro',
        mainEntity: {
          '@type': 'Service',
          name: 'Monitorizare Zboruri România',
          description: 'Serviciu de monitorizare în timp real a zborurilor din aeroporturile majore din România și Moldova',
          provider: {
            '@type': 'Organization',
            name: 'Orarul Zborurilor România'
          },
          areaServed: ['România', 'Moldova'],
          serviceType: 'Flight Information Service'
        }
      }} />
      
      <div className="min-h-screen">
      {/* Header Banner Ad */}
      <div className="bg-surface-container border-b border-outline-variant">
        <AdBanner 
          slot="header-banner"
          size="728x90"
          className="max-w-container mx-auto py-4"
        />
      </div>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-40 to-primary-30 text-on-primary py-20 lg:py-32">
        <div className="max-w-container mx-auto container-padding">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="p-6 bg-primary-container rounded-3xl shadow-elevation-2">
                <Plane className="h-16 w-16 text-on-primary-container" />
              </div>
            </div>
            <h1 className="display-large md:display-medium mb-6 text-on-primary">
              Informații Zboruri în Timp Real
            </h1>
            <p className="headline-small md:title-large mb-12 text-primary-90 max-w-4xl mx-auto leading-relaxed">
              Găsirea informațiilor de zbor fiabile și în timp real este esențială pentru fiecare călător, 
              fie că te pregătești pentru o plecare, aștepți o sosire sau monitorizezi activitatea zborurilor din România și Moldova.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/aeroporturi"
                className="state-layer bg-primary-container text-on-primary-container px-8 py-4 rounded-xl label-large font-medium shadow-elevation-1 hover:shadow-elevation-2 transition-all duration-200"
              >
                Explorează Aeroporturi
              </Link>
              <Link
                href="#features"
                className="state-layer border-2 border-primary-90 text-primary-90 px-8 py-4 rounded-xl label-large font-medium hover:bg-primary-90/10 transition-all duration-200"
              >
                Află Mai Mult
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-container mx-auto container-padding py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-16">
            {/* Features Section */}
            <section id="features">
              <h2 className="headline-large text-on-surface mb-12">
                De Ce Să Alegi Platforma Noastră?
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center bg-surface-container rounded-2xl p-8 shadow-elevation-1 hover:shadow-elevation-2 transition-all duration-200">
                  <div className="flex justify-center mb-6">
                    <div className="p-4 bg-primary-container rounded-2xl">
                      <Clock className="h-8 w-8 text-on-primary-container" />
                    </div>
                  </div>
                  <h3 className="title-large text-on-surface mb-4">
                    Actualizări în Timp Real
                  </h3>
                  <p className="body-large text-on-surface-variant leading-relaxed">
                    Primește actualizări continue despre statusul zborurilor, întârzieri și schimbări de poartă.
                  </p>
                </div>
                <div className="text-center bg-surface-container rounded-2xl p-8 shadow-elevation-1 hover:shadow-elevation-2 transition-all duration-200">
                  <div className="flex justify-center mb-6">
                    <div className="p-4 bg-secondary-container rounded-2xl">
                      <MapPin className="h-8 w-8 text-on-secondary-container" />
                    </div>
                  </div>
                  <h3 className="title-large text-on-surface mb-4">
                    Acoperire Globală
                  </h3>
                  <p className="body-large text-on-surface-variant leading-relaxed">
                    Urmărește zboruri de la aeroporturi majore din întreaga lume cu informații detaliate.
                  </p>
                </div>
                <div className="text-center bg-surface-container rounded-2xl p-8 shadow-elevation-1 hover:shadow-elevation-2 transition-all duration-200">
                  <div className="flex justify-center mb-6">
                    <div className="p-4 bg-tertiary-container rounded-2xl">
                      <TrendingUp className="h-8 w-8 text-on-tertiary-container" />
                    </div>
                  </div>
                  <h3 className="title-large text-on-surface mb-4">
                    Analize Detaliate
                  </h3>
                  <p className="body-large text-on-surface-variant leading-relaxed">
                    Accesează date complete despre zboruri incluzând terminale, porți și informații despre companii aeriene.
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

            {/* Popular Airports */}
            <section>
              <h2 className="headline-large text-on-surface mb-12">
                Aeroporturi din România și Moldova
              </h2>
              
              {/* Desktop Table */}
              <div className="hidden md:block mb-8">
                <div className="bg-surface rounded-xl border border-outline-variant overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-surface-container-high">
                      <tr className="border-b border-outline-variant">
                        <th className="px-6 py-4 text-left label-large font-medium text-on-surface-variant">Cod</th>
                        <th className="px-6 py-4 text-left label-large font-medium text-on-surface-variant">Oraș</th>
                        <th className="px-6 py-4 text-left label-large font-medium text-on-surface-variant">Aeroport</th>
                        <th className="px-6 py-4 text-left label-large font-medium text-on-surface-variant">Țară</th>
                        <th className="px-6 py-4 text-left label-large font-medium text-on-surface-variant">Acțiuni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {featuredAirports.map((airport, index) => (
                        <tr 
                          key={airport.code}
                          className={`
                            state-layer hover:bg-surface-container-high transition-colors duration-200
                            ${index !== featuredAirports.length - 1 ? 'border-b border-outline-variant/50' : ''}
                          `}
                        >
                          <td className="px-6 py-4 body-medium text-primary-40 font-medium">{airport.code}</td>
                          <td className="px-6 py-4 body-medium text-on-surface font-medium">{airport.city}</td>
                          <td className="px-6 py-4 body-medium text-on-surface">{airport.name}</td>
                          <td className="px-6 py-4 body-small text-on-surface-variant">{airport.country}</td>
                          <td className="px-6 py-4">
                            <Link
                              href={`/aeroport/${generateAirportSlug(airport)}`}
                              className="inline-flex items-center px-3 py-1 rounded-lg bg-primary-container text-on-primary-container label-small font-medium hover:bg-primary-40 hover:text-on-primary transition-colors duration-200"
                            >
                              Vezi detalii
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3 mb-8">
                {featuredAirports.map((airport) => (
                  <Link
                    key={airport.code}
                    href={`/aeroport/${generateAirportSlug(airport)}`}
                    className="block state-layer bg-surface-container rounded-xl border border-outline-variant p-4 hover:bg-surface-container-high transition-colors duration-200"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="title-medium text-primary-40 font-medium">{airport.code}</div>
                        <div className="body-small text-on-surface-variant">{airport.country}</div>
                      </div>
                      <div className="px-2 py-1 bg-primary-container rounded-lg">
                        <span className="label-small text-on-primary-container font-medium">Vezi</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="body-medium text-on-surface font-medium">{airport.city}</div>
                      <div className="body-small text-on-surface-variant">{airport.name}</div>
                    </div>
                  </Link>
                ))}
              </div>
              
              {/* Vezi toate aeroporturile */}
              <div className="bg-primary-container rounded-xl border-2 border-primary-40 p-6 text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-primary-40 rounded-2xl">
                    <MapPin className="h-6 w-6 text-on-primary" />
                  </div>
                </div>
                <h3 className="title-medium text-on-primary-container mb-3 font-medium">
                  Vezi toate aeroporturile
                </h3>
                <p className="body-medium text-on-primary-container/80 mb-4">
                  Explorează toate cele {MAJOR_AIRPORTS.length} aeroporturi din România și Moldova
                </p>
                <Link
                  href="/aeroporturi"
                  className="inline-flex items-center px-6 py-3 bg-primary-40 text-on-primary rounded-xl label-large font-medium hover:bg-primary-30 transition-colors duration-200"
                >
                  Explorează aeroporturi
                </Link>
              </div>
            </section>

            {/* Analytics Section */}
            <section>
              <h2 className="headline-large text-on-surface mb-12">
                Analize și Statistici Zboruri
              </h2>
              
              {/* Desktop Table */}
              <div className="hidden md:block">
                <div className="bg-surface rounded-xl border border-outline-variant overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-surface-container-high">
                      <tr className="border-b border-outline-variant">
                        <th className="px-6 py-4 text-left label-large font-medium text-on-surface-variant">Tip Analiză</th>
                        <th className="px-6 py-4 text-left label-large font-medium text-on-surface-variant">Descriere</th>
                        <th className="px-6 py-4 text-left label-large font-medium text-on-surface-variant">Funcționalități</th>
                        <th className="px-6 py-4 text-left label-large font-medium text-on-surface-variant">Acțiuni</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="state-layer hover:bg-surface-container-high transition-colors duration-200 border-b border-outline-variant/50">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-primary-container rounded-lg">
                              <TrendingUp className="h-5 w-5 text-on-primary-container" />
                            </div>
                            <span className="title-small text-on-surface font-medium">Statistici Aeroporturi</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 body-medium text-on-surface-variant">
                          Analizează performanța tuturor aeroporturilor
                        </td>
                        <td className="px-6 py-4 body-small text-on-surface-variant">
                          Indice întârzieri, punctualitate, ore de vârf
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href="/analize"
                            className="inline-flex items-center px-3 py-1 rounded-lg bg-primary-container text-on-primary-container label-small font-medium hover:bg-primary-40 hover:text-on-primary transition-colors duration-200"
                          >
                            Alege aeroportul
                          </Link>
                        </td>
                      </tr>
                      
                      <tr className="state-layer hover:bg-surface-container-high transition-colors duration-200 border-b border-outline-variant/50">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-secondary-container rounded-lg">
                              <Clock className="h-5 w-5 text-on-secondary-container" />
                            </div>
                            <span className="title-small text-on-surface font-medium">Program Zboruri</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 body-medium text-on-surface-variant">
                          Calendar interactiv pentru toate aeroporturile
                        </td>
                        <td className="px-6 py-4 body-small text-on-surface-variant">
                          Filtrare după dată, companie, destinație
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href="/analize"
                            className="inline-flex items-center px-3 py-1 rounded-lg bg-secondary-container text-on-secondary-container label-small font-medium hover:bg-secondary-40 hover:text-on-secondary transition-colors duration-200"
                          >
                            Alege aeroportul
                          </Link>
                        </td>
                      </tr>
                      
                      <tr className="state-layer hover:bg-surface-container-high transition-colors duration-200 border-b border-outline-variant/50">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-tertiary-container rounded-lg">
                              <TrendingUp className="h-5 w-5 text-on-tertiary-container" />
                            </div>
                            <span className="title-small text-on-surface font-medium">Analize Istorice</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 body-medium text-on-surface-variant">
                          Tendințe și evoluție pentru toate aeroporturile
                        </td>
                        <td className="px-6 py-4 body-small text-on-surface-variant">
                          Volum trafic, întârzieri, performanță în timp
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href="/analize"
                            className="inline-flex items-center px-3 py-1 rounded-lg bg-tertiary-container text-on-tertiary-container label-small font-medium hover:bg-tertiary-40 hover:text-on-tertiary transition-colors duration-200"
                          >
                            Alege aeroportul
                          </Link>
                        </td>
                      </tr>
                      
                      <tr className="state-layer hover:bg-surface-container-high transition-colors duration-200">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-primary-container rounded-lg">
                              <Plane className="h-5 w-5 text-on-primary-container" />
                            </div>
                            <span className="title-small text-on-surface font-medium">Catalog Aeronave</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 body-medium text-on-surface-variant">
                          Căutare aeronave după ICAO24 sau înmatriculare
                        </td>
                        <td className="px-6 py-4 body-small text-on-surface-variant">
                          Istoric zboruri, statistici aeronave
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href="/aeronave"
                            className="inline-flex items-center px-3 py-1 rounded-lg bg-primary-container text-on-primary-container label-small font-medium hover:bg-primary-40 hover:text-on-primary transition-colors duration-200"
                          >
                            Explorează catalogul
                          </Link>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                <div className="bg-surface-container rounded-xl border border-outline-variant p-4">
                  <div className="flex items-start space-x-3 mb-3">
                    <div className="p-2 bg-primary-container rounded-lg">
                      <TrendingUp className="h-5 w-5 text-on-primary-container" />
                    </div>
                    <div className="flex-1">
                      <h3 className="title-small text-on-surface font-medium mb-1">Statistici Aeroporturi</h3>
                      <p className="body-small text-on-surface-variant">Indice întârzieri, punctualitate, ore de vârf</p>
                    </div>
                  </div>
                  <Link
                    href="/analize"
                    className="inline-flex items-center px-3 py-2 bg-primary-container text-on-primary-container rounded-lg label-small font-medium w-full justify-center"
                  >
                    Alege aeroportul
                  </Link>
                </div>

                <div className="bg-surface-container rounded-xl border border-outline-variant p-4">
                  <div className="flex items-start space-x-3 mb-3">
                    <div className="p-2 bg-secondary-container rounded-lg">
                      <Clock className="h-5 w-5 text-on-secondary-container" />
                    </div>
                    <div className="flex-1">
                      <h3 className="title-small text-on-surface font-medium mb-1">Program Zboruri</h3>
                      <p className="body-small text-on-surface-variant">Filtrare după dată, companie, destinație</p>
                    </div>
                  </div>
                  <Link
                    href="/analize"
                    className="inline-flex items-center px-3 py-2 bg-secondary-container text-on-secondary-container rounded-lg label-small font-medium w-full justify-center"
                  >
                    Alege aeroportul
                  </Link>
                </div>

                <div className="bg-surface-container rounded-xl border border-outline-variant p-4">
                  <div className="flex items-start space-x-3 mb-3">
                    <div className="p-2 bg-tertiary-container rounded-lg">
                      <TrendingUp className="h-5 w-5 text-on-tertiary-container" />
                    </div>
                    <div className="flex-1">
                      <h3 className="title-small text-on-surface font-medium mb-1">Analize Istorice</h3>
                      <p className="body-small text-on-surface-variant">Volum trafic, întârzieri, performanță în timp</p>
                    </div>
                  </div>
                  <Link
                    href="/analize"
                    className="inline-flex items-center px-3 py-2 bg-tertiary-container text-on-tertiary-container rounded-lg label-small font-medium w-full justify-center"
                  >
                    Alege aeroportul
                  </Link>
                </div>

                <div className="bg-surface-container rounded-xl border border-outline-variant p-4">
                  <div className="flex items-start space-x-3 mb-3">
                    <div className="p-2 bg-primary-container rounded-lg">
                      <Plane className="h-5 w-5 text-on-primary-container" />
                    </div>
                    <div className="flex-1">
                      <h3 className="title-small text-on-surface font-medium mb-1">Catalog Aeronave</h3>
                      <p className="body-small text-on-surface-variant">Istoric zboruri, statistici aeronave</p>
                    </div>
                  </div>
                  <Link
                    href="/aeronave"
                    className="inline-flex items-center px-3 py-2 bg-primary-container text-on-primary-container rounded-lg label-small font-medium w-full justify-center"
                  >
                    Explorează catalogul
                  </Link>
                </div>
              </div>
            </section>

            {/* SEO Content Section */}
            <section className="bg-surface-container rounded-2xl p-8 shadow-elevation-1">
              <h2 className="headline-large text-on-surface mb-8">
                Platforma Completă de Monitorizare Zboruri România
              </h2>
              <div className="space-y-6">
                <p className="body-large text-on-surface-variant leading-relaxed">
                  Platforma noastră oferă actualizări continue asupra sosirii și plecării zborurilor din aeroporturile majore din România și Moldova, 
                  alături de informații detaliate despre status, ajustări de orar, terminale, porți și date despre companii aeriene. 
                  Site-ul include, de asemenea, zone dedicate de publicitate pentru bannere parteneri și Google AdSense, 
                  optimizate pentru a menține viteza și experiența utilizatorului în timp ce livrează conținut comercial relevant.
                </p>
                <p className="body-large text-on-surface-variant leading-relaxed">
                  Fie că ești un călător frecvent, un entuziast al aviației sau pur și simplu trebuie să urmărești un zbor specific, 
                  baza noastră de date cuprinzătoare oferă informații în timp real din toate aeroporturile din România: 
                  Otopeni (OTP), Cluj-Napoca (CLJ), Timișoara (TSR), Iași (IAS), Constanța (CND), Sibiu (SBZ) și multe altele, 
                  precum și din Chișinău (RMO), Moldova.
                </p>
                <p className="body-large text-on-surface-variant leading-relaxed">
                  Rămâi informat cu notificări instantanee despre întârzierile zborurilor, schimbările de poartă și anulări. 
                  Platforma noastră agregă date din multiple surse fiabile pentru a asigura acuratețea și promptitudinea, 
                  oferindu-ți încrederea de a lua decizii de călătorie informate pentru zborurile din și către România.
                </p>
              </div>
            </section>

            {/* FAQ Section */}
            <section>
              <h2 className="headline-large text-on-surface mb-12">
                Întrebări Frecvente
              </h2>
              <div className="space-y-4">
                <div className="bg-surface-container rounded-2xl border border-outline-variant p-6 hover:shadow-elevation-1 transition-all duration-200">
                  <h3 className="title-medium text-on-surface mb-4">
                    Cât de des sunt actualizate informațiile despre zboruri?
                  </h3>
                  <p className="body-large text-on-surface-variant leading-relaxed">
                    Informațiile despre zboruri sunt actualizate în timp real, cu date reîmprospătate la fiecare câteva minute 
                    pentru a vă asigura că aveți cele mai recente informații despre statusul zborurilor, întârzieri și schimbări de poartă.
                  </p>
                </div>
                <div className="bg-surface-container rounded-2xl border border-outline-variant p-6 hover:shadow-elevation-1 transition-all duration-200">
                  <h3 className="title-medium text-on-surface mb-4">
                    Ce aeroporturi sunt acoperite?
                  </h3>
                  <p className="body-large text-on-surface-variant leading-relaxed">
                    Acoperim aeroporturi internaționale majore din întreaga lume, incluzând hub-uri din America de Nord, Europa, Asia 
                    și alte regiuni. Baza noastră de date include informații detaliate pentru sute de aeroporturi la nivel global.
                  </p>
                </div>
                <div className="bg-surface-container rounded-2xl border border-outline-variant p-6 hover:shadow-elevation-1 transition-all duration-200">
                  <h3 className="title-medium text-on-surface mb-4">
                    Pot urmări zboruri specifice?
                  </h3>
                  <p className="body-large text-on-surface-variant leading-relaxed">
                    Da, poți căuta zboruri specifice folosind numărul de zbor sau filtra după compania aeriană, 
                    destinație și alte criterii pentru a găsi rapid informațiile de care ai nevoie.
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
            
            {/* Quick Stats */}
            <div className="bg-surface-container rounded-2xl border border-outline-variant p-6 shadow-elevation-1">
              <h3 className="title-medium text-on-surface mb-6">
                Statistici Platformă
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="body-medium text-on-surface-variant">Aeroporturi Acoperite</span>
                  <span className="title-small text-on-surface font-medium">500+</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="body-medium text-on-surface-variant">Zboruri Zilnice</span>
                  <span className="title-small text-on-surface font-medium">100K+</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="body-medium text-on-surface-variant">Companii Aeriene</span>
                  <span className="title-small text-on-surface font-medium">200+</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="body-medium text-on-surface-variant">Țări</span>
                  <span className="title-small text-on-surface font-medium">150+</span>
                </div>
              </div>
            </div>

            {/* Internal Links */}
            <InternalLinks currentPage="/" />

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