'use client'

import { useState, useEffect } from 'react'
import { adConfig, toggleAdZone, setCustomBanner } from '@/lib/adConfig'
import { Save, Eye, EyeOff, Upload, Trash2, Settings } from 'lucide-react'

export default function AdminPage() {
  const [config, setConfig] = useState(adConfig)
  const [activeTab, setActiveTab] = useState('adsense')
  const [saved, setSaved] = useState(false)

  const handleToggleZone = (zone: keyof typeof adConfig.zones) => {
    toggleAdZone(zone, !config.zones[zone].active)
    setConfig({ ...adConfig })
  }

  const handleCustomBanner = (zone: keyof typeof adConfig.zones, html: string) => {
    setCustomBanner(zone, html)
    setConfig({ ...adConfig })
  }

  const handleSave = () => {
    // În producție, aici ai salva în baza de date
    localStorage.setItem('adConfig', JSON.stringify(config))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const adZones = [
    { key: 'header-banner', name: 'Header Banner', size: '728x90', description: 'Banner în partea de sus a paginii' },
    { key: 'sidebar-right', name: 'Sidebar Dreapta', size: '300x600', description: 'Banner în sidebar-ul din dreapta' },
    { key: 'sidebar-square', name: 'Sidebar Pătrat', size: '300x250', description: 'Banner pătrat în sidebar' },
    { key: 'inline-banner', name: 'Banner Inline', size: '728x90', description: 'Banner între secțiuni' },
    { key: 'footer-banner', name: 'Footer Banner', size: '970x90', description: 'Banner în footer' },
    { key: 'mobile-banner', name: 'Banner Mobil', size: '320x50', description: 'Banner pentru dispozitive mobile' },
    { key: 'partner-banner-1', name: 'Banner Partener 1', size: '728x90', description: 'Banner personalizat partener' },
    { key: 'partner-banner-2', name: 'Banner Partener 2', size: '300x250', description: 'Banner personalizat partener' },
  ] as const

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                🎯 Admin Publicitate
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Gestionează bannerele publicitare și AdSense pentru website-ul de zboruri
              </p>
            </div>
            <button
              onClick={handleSave}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
                saved 
                  ? 'bg-green-600 text-white' 
                  : 'bg-primary-600 hover:bg-primary-700 text-white'
              }`}
            >
              <Save className="h-5 w-5" />
              <span>{saved ? 'Salvat!' : 'Salvează Configurația'}</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('adsense')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'adsense'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Settings className="h-4 w-4 inline mr-2" />
                Google AdSense
              </button>
              <button
                onClick={() => setActiveTab('partners')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'partners'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Upload className="h-4 w-4 inline mr-2" />
                Bannere Parteneri
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'adsense' && (
              <div className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    Configurare Google AdSense
                  </h3>
                  <p className="text-blue-700 dark:text-blue-300 text-sm mb-4">
                    Pentru a activa AdSense, actualizează Publisher ID-ul în fișierul de configurare.
                  </p>
                  <div className="bg-white dark:bg-gray-800 rounded p-3 font-mono text-sm">
                    <span className="text-gray-500">Publisher ID actual:</span> 
                    <span className="text-primary-600 dark:text-primary-400 ml-2">
                      {config.publisherId}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {adZones.filter(zone => !zone.key.includes('partner')).map((zone) => (
                    <div key={zone.key} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {zone.name}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {zone.size} - {zone.description}
                          </p>
                        </div>
                        <button
                          onClick={() => handleToggleZone(zone.key)}
                          className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
                            config.zones[zone.key].active
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {config.zones[zone.key].active ? (
                            <>
                              <Eye className="h-4 w-4" />
                              <span>Activ</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-4 w-4" />
                              <span>Inactiv</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Slot ID: {config.zones[zone.key].slotId || 'Nu este configurat'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'partners' && (
              <div className="space-y-6">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
                    Bannere Parteneri Personalizate
                  </h3>
                  <p className="text-green-700 dark:text-green-300 text-sm">
                    Adaugă HTML personalizat pentru bannerele partenerilor. Poți include imagini, linkuri și cod de tracking.
                  </p>
                </div>

                {adZones.filter(zone => zone.key.includes('partner')).map((zone) => (
                  <div key={zone.key} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {zone.name}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Dimensiune recomandată: {zone.size}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleToggleZone(zone.key)}
                          className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
                            config.zones[zone.key].active
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {config.zones[zone.key].active ? (
                            <>
                              <Eye className="h-4 w-4" />
                              <span>Activ</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-4 w-4" />
                              <span>Inactiv</span>
                            </>
                          )}
                        </button>
                        {config.zones[zone.key].customHtml && (
                          <button
                            onClick={() => handleCustomBanner(zone.key, '')}
                            className="flex items-center space-x-1 px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 rounded text-sm"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Șterge</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          HTML Personalizat
                        </label>
                        <textarea
                          rows={6}
                          placeholder={`Exemplu:
<a href="https://partener.com" target="_blank">
  <img src="/banner-partener.jpg" alt="Partener" style="width:100%;height:auto;" />
</a>`}
                          value={config.zones[zone.key].customHtml || ''}
                          onChange={(e) => handleCustomBanner(zone.key, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>

                      {config.zones[zone.key].customHtml && (
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Preview:
                          </h5>
                          <div 
                            className="border border-gray-200 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-800"
                            dangerouslySetInnerHTML={{ __html: config.zones[zone.key].customHtml || '' }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                    💡 Sfaturi pentru Bannere Parteneri
                  </h4>
                  <ul className="text-yellow-700 dark:text-yellow-300 text-sm space-y-1">
                    <li>• Folosește imagini optimizate (WebP, dimensiuni corecte)</li>
                    <li>• Adaugă target="_blank" pentru linkuri externe</li>
                    <li>• Include cod de tracking pentru măsurarea performanței</li>
                    <li>• Testează pe dispozitive mobile</li>
                    <li>• Respectă dimensiunile recomandate pentru fiecare zonă</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Zone de Plasare */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            📍 Zone de Plasare Disponibile
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {adZones.map((zone) => (
              <div key={zone.key} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {zone.name}
                  </h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    config.zones[zone.key].active
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {config.zones[zone.key].active ? 'Activ' : 'Inactiv'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  {zone.description}
                </p>
                <div className="text-xs text-gray-400 dark:text-gray-500">
                  Dimensiune: {zone.size}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}