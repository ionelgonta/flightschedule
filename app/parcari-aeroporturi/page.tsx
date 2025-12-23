'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Parcare {
  oras: string
  nume: string
  descriere: string
  link: string
  tip: 'oficial' | 'privat'
  pret: string
  adresa: string
  distanta_terminal: string
  facilitati: string
  program: string
  plata: string
  contact: string
  politica_anulare: string
  imagini: string[]
  recenzii: string
}

export default function ParcariAeroporturiPage() {
  const [parcari, setParcari] = useState<Parcare[]>([])
  const [orasSelectat, setOrasSelectat] = useState<string>('toate')
  const [filtruTip, setFiltruTip] = useState<'toate' | 'oficial' | 'privat'>('toate')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const incarcaParcari = async () => {
      try {
        const response = await fetch('/data/parking-all.json')
        if (!response.ok) {
          throw new Error('Nu s-au putut încărca datele despre parcări')
        }
        const data = await response.json()
        setParcari(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Eroare necunoscută')
      } finally {
        setLoading(false)
      }
    }

    incarcaParcari()
  }, [])

  // Obține lista unică de orașe
  const orase = Array.from(new Set(parcari.map(p => p.oras))).sort()

  // Filtrează parcările
  const parcariFiltered = parcari.filter(parcare => {
    const matchOras = orasSelectat === 'toate' || parcare.oras === orasSelectat
    const matchTip = filtruTip === 'toate' || parcare.tip === filtruTip
    return matchOras && matchTip
  })

  // Grupează parcările pe orașe
  const parcariPeOrase = orase.reduce((acc, oras) => {
    acc[oras] = parcariFiltered.filter(p => p.oras === oras)
    return acc
  }, {} as Record<string, Parcare[]>)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-6"></div>
              <p className="text-gray-600 text-lg">Se încarcă parcările...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="text-red-500 text-8xl mb-6">⚠️</div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Eroare</h2>
              <p className="text-gray-600 text-lg">{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 flex items-center justify-center gap-3">
            🅿️ Parcări Aeroporturi România & Moldova
          </h1>
          <p className="text-xl text-gray-700 max-w-4xl mx-auto leading-relaxed mb-8">
            Găsește cea mai potrivită parcare pentru călătoria ta din București, Cluj-Napoca, 
            Timișoara, Iași sau Chișinău. Compară opțiunile oficiale și private pentru toate 
            aeroporturile majore.
          </p>
          
          {/* Quick Links to Individual Airport Pages */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <Link 
              href="/parcari-bucuresti"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              București (OTP & BBU)
            </Link>
            <Link 
              href="/parcari-cluj"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Cluj-Napoca (CLJ)
            </Link>
            <Link 
              href="/parcari-timisoara"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Timișoara (TSR)
            </Link>
            <Link 
              href="/parcari-iasi"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Iași (IAS)
            </Link>
            <Link 
              href="/parcari-chisinau"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Chișinău (RMO)
            </Link>
          </div>
        </div>

        {/* Filtre */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-blue-200">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Filtru oraș */}
            <div className="flex-1">
              <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                🌍 Selectează orașul
              </label>
              <select
                value={orasSelectat}
                onChange={(e) => setOrasSelectat(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white text-gray-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all duration-300"
              >
                <option value="toate">🌐 Toate orașele ({parcari.length} parcări)</option>
                {orase.map(oras => (
                  <option key={oras} value={oras}>
                    {oras} ({parcari.filter(p => p.oras === oras).length} parcări)
                  </option>
                ))}
              </select>
            </div>

            {/* Filtru tip */}
            <div className="flex-1">
              <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                🏢 Tipul parcării
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setFiltruTip('toate')}
                  className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    filtruTip === 'toate'
                      ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-blue-50'
                  }`}
                >
                  📋 Toate
                </button>
                <button
                  onClick={() => setFiltruTip('oficial')}
                  className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    filtruTip === 'oficial'
                      ? 'bg-green-600 text-white shadow-lg transform scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-green-50'
                  }`}
                >
                  🏛️ Oficiale
                </button>
                <button
                  onClick={() => setFiltruTip('privat')}
                  className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    filtruTip === 'privat'
                      ? 'bg-purple-600 text-white shadow-lg transform scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-purple-50'
                  }`}
                >
                  🏢 Private
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Statistici */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-md border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">{parcariFiltered.length}</div>
            <div className="text-sm text-gray-600">Parcări disponibile</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-md border border-green-200">
            <div className="text-2xl font-bold text-green-600">
              {parcariFiltered.filter(p => p.tip === 'oficial').length}
            </div>
            <div className="text-sm text-gray-600">Parcări oficiale</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-md border border-purple-200">
            <div className="text-2xl font-bold text-purple-600">
              {parcariFiltered.filter(p => p.tip === 'privat').length}
            </div>
            <div className="text-sm text-gray-600">Parcări private</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-md border border-orange-200">
            <div className="text-2xl font-bold text-orange-600">{orase.length}</div>
            <div className="text-sm text-gray-600">Orașe acoperite</div>
          </div>
        </div>

        {/* Parcări grupate pe orașe */}
        {orasSelectat === 'toate' ? (
          // Afișează toate orașele
          orase.map(oras => {
            const parcariOras = parcariPeOrase[oras]
            if (parcariOras.length === 0) return null

            const parcariOficiale = parcariOras.filter(p => p.tip === 'oficial')
            const parcariPrivate = parcariOras.filter(p => p.tip === 'privat')

            return (
              <div key={oras} className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  🏙️ {oras}
                  <span className="text-lg bg-blue-100 text-blue-800 px-4 py-2 rounded-full">
                    {parcariOras.length} parcări
                  </span>
                </h2>

                {/* Parcări oficiale pentru acest oraș */}
                {parcariOficiale.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                      🏛️ Parcări Oficiale
                      <span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full">
                        {parcariOficiale.length}
                      </span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {parcariOficiale.map((parcare, index) => (
                        <ParcareCard key={`${oras}-oficial-${index}`} parcare={parcare} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Parcări private pentru acest oraș */}
                {parcariPrivate.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                      🏢 Parcări Private
                      <span className="text-sm bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
                        {parcariPrivate.length}
                      </span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {parcariPrivate.map((parcare, index) => (
                        <ParcareCard key={`${oras}-privat-${index}`} parcare={parcare} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })
        ) : (
          // Afișează doar orașul selectat
          <div>
            {parcariFiltered.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {parcariFiltered.map((parcare, index) => (
                  <ParcareCard key={`${orasSelectat}-${index}`} parcare={parcare} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-8xl mb-6">🚗</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Nu s-au găsit parcări
                </h3>
                <p className="text-gray-600 text-lg">
                  Încearcă să schimbi filtrul pentru a vedea toate opțiunile disponibile.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Info suplimentară */}
        <div className="mt-16 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200 shadow-lg">
          <h3 className="text-2xl font-bold text-blue-900 mb-6 flex items-center gap-3">
            💡 Sfaturi Utile pentru Parcare
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-blue-800">
            <div className="bg-white rounded-xl p-6 shadow-md">
              <h4 className="font-bold mb-3 flex items-center gap-2">
                🏛️ Parcări Oficiale
              </h4>
              <ul className="space-y-2 text-sm">
                <li>• Cele mai aproape de terminal</li>
                <li>• Securitate maximă</li>
                <li>• Disponibilitate garantată</li>
                <li>• Prețuri fixe, fără surprize</li>
              </ul>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md">
              <h4 className="font-bold mb-3 flex items-center gap-2">
                🏢 Parcări Private
              </h4>
              <ul className="space-y-2 text-sm">
                <li>• Prețuri mai competitive</li>
                <li>• Transfer gratuit la terminal</li>
                <li>• Servicii suplimentare</li>
                <li>• Rezervare online obligatorie</li>
              </ul>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md">
              <h4 className="font-bold mb-3 flex items-center gap-2">
                📱 Rezervare Online
              </h4>
              <ul className="space-y-2 text-sm">
                <li>• Rezervă cu 24h înainte</li>
                <li>• Verifică politica de anulare</li>
                <li>• Salvează confirmarea</li>
                <li>• Contactează furnizorul pentru detalii</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Componentă pentru afișarea unei parcări
function ParcareCard({ parcare }: { parcare: Parcare }) {
  const isOficial = parcare.tip === 'oficial'
  
  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-200 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 leading-tight flex-1 pr-3">
            {parcare.nume}
          </h3>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
              isOficial 
                ? 'bg-green-100 text-green-800' 
                : 'bg-purple-100 text-purple-800'
            }`}>
              {isOficial ? '🏛️ Oficial' : '🏢 Privat'}
            </span>
            <div className="flex items-center text-yellow-600 text-xs">
              ⭐ {parcare.recenzii}
            </div>
          </div>
        </div>
        
        <p className="text-gray-600 mb-4 leading-relaxed text-sm">
          {parcare.descriere}
        </p>
        
        {/* Price Section */}
        <div className={`mb-4 p-3 rounded-xl border ${
          isOficial 
            ? 'bg-green-50 border-green-200' 
            : 'bg-purple-50 border-purple-200'
        }`}>
          <div className="flex items-center">
            <span className={`font-semibold text-sm ${
              isOficial ? 'text-green-600' : 'text-purple-600'
            }`}>
              💰 Preț:
            </span>
            <span className={`ml-2 font-bold text-sm ${
              isOficial ? 'text-green-800' : 'text-purple-800'
            }`}>
              {parcare.pret}
            </span>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 gap-2 mb-6 text-xs">
          <div className="flex items-start">
            <span className="text-gray-500 font-medium min-w-[70px]">📍 Adresă:</span>
            <span className="text-gray-700 ml-2 flex-1">{parcare.adresa}</span>
          </div>
          <div className="flex items-start">
            <span className="text-gray-500 font-medium min-w-[70px]">🚌 Distanță:</span>
            <span className="text-gray-700 ml-2 flex-1">{parcare.distanta_terminal}</span>
          </div>
          <div className="flex items-start">
            <span className="text-gray-500 font-medium min-w-[70px]">⚡ Facilități:</span>
            <span className="text-gray-700 ml-2 flex-1">{parcare.facilitati}</span>
          </div>
          <div className="flex items-start">
            <span className="text-gray-500 font-medium min-w-[70px]">🕒 Program:</span>
            <span className="text-gray-700 ml-2 flex-1">{parcare.program}</span>
          </div>
          <div className="flex items-start">
            <span className="text-gray-500 font-medium min-w-[70px]">💳 Plată:</span>
            <span className="text-gray-700 ml-2 flex-1">{parcare.plata}</span>
          </div>
          <div className="flex items-start">
            <span className="text-gray-500 font-medium min-w-[70px]">📞 Contact:</span>
            <span className="text-gray-700 ml-2 flex-1">{parcare.contact}</span>
          </div>
        </div>

        <a
          href={parcare.link}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center justify-center w-full font-semibold py-3 px-4 rounded-xl transition-all duration-300 group ${
            isOficial
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-purple-600 hover:bg-purple-700 text-white'
          }`}
        >
          🎫 Rezervă Acum
          <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  )
}