'use client'

import { useState, useEffect } from 'react'
import { Metadata } from 'next'

interface Parcare {
  nume: string
  descriere: string
  link: string
  tip: 'oficial' | 'privat'
  pret: string
  adresa: string
  distanta_terminal: string
  tip_parcare: string
  facilitati: string
  program: string
  plata: string
  contact: string
  politica_anulare: string
  imagini: string[]
  recenzii: string
}

export default function ParcariOtopeniPage() {
  const [parcari, setParcari] = useState<Parcare[]>([])
  const [filtruActiv, setFiltruActiv] = useState<'toate' | 'oficial' | 'privat'>('toate')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const incarcaParcari = async () => {
      try {
        const response = await fetch('/data/parking.json')
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

  const parcariFiltered = parcari.filter(parcare => {
    if (filtruActiv === 'toate') return true
    return parcare.tip === filtruActiv
  })

  const parcariOficiale = parcariFiltered.filter(p => p.tip === 'oficial')
  const parcariPrivate = parcariFiltered.filter(p => p.tip === 'privat')

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Se încarcă parcările...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Eroare</h2>
              <p className="text-gray-600 dark:text-gray-400">{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            🅿️ Parcări Aeroport București – Otopeni Henri Coandă
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Găsește cea mai potrivită parcare pentru călătoria ta. Compară opțiunile oficiale și private 
            pentru Aeroportul Internațional Henri Coandă București.
          </p>
        </div>

        {/* Filtre */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <button
            onClick={() => setFiltruActiv('toate')}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              filtruActiv === 'toate'
                ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-gray-700'
            }`}
          >
            📋 Toate Parcările ({parcari.length})
          </button>
          <button
            onClick={() => setFiltruActiv('oficial')}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              filtruActiv === 'oficial'
                ? 'bg-green-600 text-white shadow-lg transform scale-105'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-green-50 dark:hover:bg-gray-700'
            }`}
          >
            🏛️ Oficiale ({parcari.filter(p => p.tip === 'oficial').length})
          </button>
          <button
            onClick={() => setFiltruActiv('privat')}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              filtruActiv === 'privat'
                ? 'bg-purple-600 text-white shadow-lg transform scale-105'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-purple-50 dark:hover:bg-gray-700'
            }`}
          >
            🏢 Private ({parcari.filter(p => p.tip === 'privat').length})
          </button>
        </div>

        {/* Parcări Oficiale */}
        {(filtruActiv === 'toate' || filtruActiv === 'oficial') && parcariOficiale.length > 0 && (
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              🏛️ Parcări Oficiale
              <span className="ml-3 text-sm bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1 rounded-full">
                {parcariOficiale.length} disponibil{parcariOficiale.length !== 1 ? 'e' : 'ă'}
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {parcariOficiale.map((parcare, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-200 dark:border-gray-700"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                        {parcare.nume}
                      </h3>
                      <div className="flex flex-col items-end gap-2">
                        <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs font-medium px-2 py-1 rounded-full flex-shrink-0">
                          Oficial
                        </span>
                        <div className="flex items-center text-yellow-600 dark:text-yellow-400 text-xs">
                          ⭐ {parcare.recenzii}
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                      {parcare.descriere}
                    </p>
                    
                    {/* Price Section */}
                    <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                      <div className="flex items-center">
                        <span className="text-green-600 dark:text-green-400 font-medium text-sm">💰 Preț:</span>
                        <span className="ml-2 text-green-800 dark:text-green-200 font-semibold text-sm">{parcare.pret}</span>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 gap-3 mb-6 text-sm">
                      <div className="flex items-start">
                        <span className="text-gray-500 dark:text-gray-400 font-medium min-w-[80px]">📍 Adresă:</span>
                        <span className="text-gray-700 dark:text-gray-300 ml-2">{parcare.adresa}</span>
                      </div>
                      <div className="flex items-start">
                        <span className="text-gray-500 dark:text-gray-400 font-medium min-w-[80px]">🚌 Distanță:</span>
                        <span className="text-gray-700 dark:text-gray-300 ml-2">{parcare.distanta_terminal}</span>
                      </div>
                      <div className="flex items-start">
                        <span className="text-gray-500 dark:text-gray-400 font-medium min-w-[80px]">🅿️ Tip:</span>
                        <span className="text-gray-700 dark:text-gray-300 ml-2">{parcare.tip_parcare}</span>
                      </div>
                      <div className="flex items-start">
                        <span className="text-gray-500 dark:text-gray-400 font-medium min-w-[80px]">⚡ Facilități:</span>
                        <span className="text-gray-700 dark:text-gray-300 ml-2">{parcare.facilitati}</span>
                      </div>
                      <div className="flex items-start">
                        <span className="text-gray-500 dark:text-gray-400 font-medium min-w-[80px]">🕒 Program:</span>
                        <span className="text-gray-700 dark:text-gray-300 ml-2">{parcare.program}</span>
                      </div>
                      <div className="flex items-start">
                        <span className="text-gray-500 dark:text-gray-400 font-medium min-w-[80px]">💳 Plată:</span>
                        <span className="text-gray-700 dark:text-gray-300 ml-2">{parcare.plata}</span>
                      </div>
                      <div className="flex items-start">
                        <span className="text-gray-500 dark:text-gray-400 font-medium min-w-[80px]">📞 Contact:</span>
                        <span className="text-gray-700 dark:text-gray-300 ml-2">{parcare.contact}</span>
                      </div>
                      <div className="flex items-start">
                        <span className="text-gray-500 dark:text-gray-400 font-medium min-w-[80px]">❌ Anulare:</span>
                        <span className="text-gray-700 dark:text-gray-300 ml-2">{parcare.politica_anulare}</span>
                      </div>
                    </div>

                    <a
                      href={parcare.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 group"
                    >
                      🎫 Rezervă Acum
                      <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Parcări Private */}
        {(filtruActiv === 'toate' || filtruActiv === 'privat') && parcariPrivate.length > 0 && (
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              🏢 Parcări Private
              <span className="ml-3 text-sm bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-3 py-1 rounded-full">
                {parcariPrivate.length} disponibil{parcariPrivate.length !== 1 ? 'e' : 'ă'}
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {parcariPrivate.map((parcare, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-200 dark:border-gray-700"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                        {parcare.nume}
                      </h3>
                      <div className="flex flex-col items-end gap-2">
                        <span className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs font-medium px-2 py-1 rounded-full flex-shrink-0">
                          Privat
                        </span>
                        <div className="flex items-center text-yellow-600 dark:text-yellow-400 text-xs">
                          ⭐ {parcare.recenzii}
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                      {parcare.descriere}
                    </p>
                    
                    {/* Price Section */}
                    <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                      <div className="flex items-center">
                        <span className="text-purple-600 dark:text-purple-400 font-medium text-sm">💰 Preț:</span>
                        <span className="ml-2 text-purple-800 dark:text-purple-200 font-semibold text-sm">{parcare.pret}</span>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 gap-3 mb-6 text-sm">
                      <div className="flex items-start">
                        <span className="text-gray-500 dark:text-gray-400 font-medium min-w-[80px]">📍 Adresă:</span>
                        <span className="text-gray-700 dark:text-gray-300 ml-2">{parcare.adresa}</span>
                      </div>
                      <div className="flex items-start">
                        <span className="text-gray-500 dark:text-gray-400 font-medium min-w-[80px]">🚌 Distanță:</span>
                        <span className="text-gray-700 dark:text-gray-300 ml-2">{parcare.distanta_terminal}</span>
                      </div>
                      <div className="flex items-start">
                        <span className="text-gray-500 dark:text-gray-400 font-medium min-w-[80px]">🅿️ Tip:</span>
                        <span className="text-gray-700 dark:text-gray-300 ml-2">{parcare.tip_parcare}</span>
                      </div>
                      <div className="flex items-start">
                        <span className="text-gray-500 dark:text-gray-400 font-medium min-w-[80px]">⚡ Facilități:</span>
                        <span className="text-gray-700 dark:text-gray-300 ml-2">{parcare.facilitati}</span>
                      </div>
                      <div className="flex items-start">
                        <span className="text-gray-500 dark:text-gray-400 font-medium min-w-[80px]">🕒 Program:</span>
                        <span className="text-gray-700 dark:text-gray-300 ml-2">{parcare.program}</span>
                      </div>
                      <div className="flex items-start">
                        <span className="text-gray-500 dark:text-gray-400 font-medium min-w-[80px]">💳 Plată:</span>
                        <span className="text-gray-700 dark:text-gray-300 ml-2">{parcare.plata}</span>
                      </div>
                      <div className="flex items-start">
                        <span className="text-gray-500 dark:text-gray-400 font-medium min-w-[80px]">📞 Contact:</span>
                        <span className="text-gray-700 dark:text-gray-300 ml-2">{parcare.contact}</span>
                      </div>
                      <div className="flex items-start">
                        <span className="text-gray-500 dark:text-gray-400 font-medium min-w-[80px]">❌ Anulare:</span>
                        <span className="text-gray-700 dark:text-gray-300 ml-2">{parcare.politica_anulare}</span>
                      </div>
                    </div>

                    <a
                      href={parcare.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 group"
                    >
                      🎫 Rezervă Acum
                      <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Mesaj când nu sunt rezultate */}
        {parcariFiltered.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🚗</div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Nu s-au găsit parcări
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Încearcă să schimbi filtrul pentru a vedea toate opțiunile disponibile.
            </p>
          </div>
        )}

        {/* Info suplimentară */}
        <div className="mt-16 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-8 border border-blue-200 dark:border-blue-800">
          <h3 className="text-2xl font-bold text-blue-900 dark:text-blue-100 mb-4 flex items-center">
            💡 Sfaturi Utile pentru Parcare
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-blue-800 dark:text-blue-200">
            <div>
              <h4 className="font-semibold mb-2">🏛️ Parcări Oficiale:</h4>
              <ul className="space-y-1 text-sm">
                <li>• Cele mai aproape de terminal</li>
                <li>• Securitate maximă</li>
                <li>• Disponibilitate garantată</li>
                <li>• Prețuri fixe, fără surprize</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">🏢 Parcări Private:</h4>
              <ul className="space-y-1 text-sm">
                <li>• Prețuri mai competitive</li>
                <li>• Transfer gratuit la terminal</li>
                <li>• Servicii suplimentare (spălare auto)</li>
                <li>• Rezervare online obligatorie</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}