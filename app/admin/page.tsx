'use client'

import { useState, useEffect } from 'react'
import { adConfig, toggleAdZone, setCustomBanner } from '@/lib/adConfig'
import { Save, Eye, EyeOff, Upload, Trash2, Settings, Key, TestTube, CheckCircle, XCircle } from 'lucide-react'

export default function AdminPage() {
  const [config, setConfig] = useState(adConfig)
  const [activeTab, setActiveTab] = useState('adsense')
  const [saved, setSaved] = useState(false)
  
  // API Key Management State
  const [apiKey, setApiKey] = useState('')
  const [currentApiKey, setCurrentApiKey] = useState('')
  const [apiKeyTesting, setApiKeyTesting] = useState(false)
  const [apiKeyValid, setApiKeyValid] = useState<boolean | null>(null)
  const [apiKeyError, setApiKeyError] = useState('')
  const [apiKeySaved, setApiKeySaved] = useState(false)

  // MCP Integration State
  const [mcpInitialized, setMcpInitialized] = useState(false)
  const [mcpTools, setMcpTools] = useState<any[]>([])
  const [mcpTesting, setMcpTesting] = useState(false)
  const [mcpError, setMcpError] = useState('')
  const [mcpTestResult, setMcpTestResult] = useState<any>(null)

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

  // Load current API key on component mount
  useEffect(() => {
    const loadCurrentApiKey = async () => {
      try {
        const response = await fetch('/api/admin/api-key')
        const data = await response.json()
        
        if (data.success && data.hasKey) {
          setCurrentApiKey(data.apiKey) // This is masked for security
          // Don't set the full key in the input field for security
        }
      } catch (error) {
        console.error('Error loading API key:', error)
        // Fallback to environment variable
        const envKey = process.env.NEXT_PUBLIC_FLIGHT_API_KEY || ''
        if (envKey) {
          setCurrentApiKey(`${envKey.substring(0, 8)}...${envKey.substring(envKey.length - 8)}`)
        }
      }
    }
    
    loadCurrentApiKey()
  }, [])

  // Test API Key function
  const testApiKey = async (keyToTest: string) => {
    if (!keyToTest.trim()) {
      setApiKeyError('Introduceți un API key')
      return false
    }

    setApiKeyTesting(true)
    setApiKeyError('')
    setApiKeyValid(null)

    try {
      const response = await fetch('/api/admin/api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          apiKey: keyToTest,
          action: 'test'
        })
      })

      const data = await response.json()

      if (data.success) {
        setApiKeyValid(data.valid)
        if (!data.valid) {
          setApiKeyError(data.error || 'API key invalid')
        } else {
          setApiKeyError('')
        }
        return data.valid
      } else {
        setApiKeyValid(false)
        setApiKeyError(data.error || 'Eroare la testarea API key-ului')
        return false
      }
    } catch (error) {
      setApiKeyValid(false)
      setApiKeyError('Eroare de conexiune')
      return false
    } finally {
      setApiKeyTesting(false)
    }
  }

  // Save API Key function
  const saveApiKey = async () => {
    if (!apiKey.trim()) {
      setApiKeyError('Introduceți un API key')
      return
    }

    setApiKeyTesting(true)
    setApiKeyError('')

    try {
      const response = await fetch('/api/admin/api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          apiKey: apiKey,
          action: 'save'
        })
      })

      const data = await response.json()

      if (data.success) {
        setCurrentApiKey(apiKey)
        setApiKeySaved(true)
        setApiKeyValid(true)
        setApiKeyError('')
        
        // Show success message
        setTimeout(() => setApiKeySaved(false), 3000)
        
        // Ask to restart application
        setTimeout(() => {
          if (confirm('API key salvat cu succes! Pentru a aplica modificările, aplicația trebuie repornită. Continuați?')) {
            // În producție, aici ai putea face un restart automat sau notifica administratorul
            alert('API key-ul a fost salvat în fișierul de configurare. Reporniți aplicația pentru a aplica modificările.')
          }
        }, 1000)
      } else {
        setApiKeyError(data.error || 'Eroare la salvarea API key-ului')
        setApiKeyValid(false)
      }
    } catch (error) {
      setApiKeyError('Eroare de conexiune la server')
      setApiKeyValid(false)
    } finally {
      setApiKeyTesting(false)
    }
  }

  // Handle API key input change
  const handleApiKeyChange = (value: string) => {
    setApiKey(value)
    setApiKeyValid(null)
    setApiKeyError('')
  }

  // MCP Integration Functions
  const loadMCPStatus = async () => {
    try {
      const response = await fetch('/api/mcp/flights')
      const data = await response.json()
      
      if (data.success) {
        setMcpInitialized(data.initialized)
        setMcpTools(data.tools || [])
        setMcpError('')
      } else {
        setMcpError(data.error || 'Eroare la încărcarea statusului MCP')
        setMcpInitialized(false)
        setMcpTools([])
      }
    } catch (error) {
      setMcpError('Eroare de conexiune la MCP')
      setMcpInitialized(false)
      setMcpTools([])
    }
  }

  const testMCPConnection = async () => {
    setMcpTesting(true)
    setMcpError('')
    setMcpTestResult(null)

    try {
      const response = await fetch('/api/mcp/flights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          airport: 'OTP',
          type: 'arrivals'
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setMcpTestResult(data.result)
        setMcpError('')
      } else {
        setMcpError(data.error || 'Eroare la testarea MCP')
        setMcpTestResult(null)
      }
    } catch (error) {
      setMcpError('Eroare de conexiune la MCP')
      setMcpTestResult(null)
    } finally {
      setMcpTesting(false)
    }
  }

  const reinitializeMCP = async () => {
    setMcpTesting(true)
    setMcpError('')

    try {
      const response = await fetch('/api/mcp/flights', {
        method: 'PUT'
      })

      const data = await response.json()
      
      if (data.success) {
        await loadMCPStatus()
        setMcpError('')
      } else {
        setMcpError(data.error || 'Eroare la reinițializarea MCP')
      }
    } catch (error) {
      setMcpError('Eroare de conexiune la MCP')
    } finally {
      setMcpTesting(false)
    }
  }

  // Load MCP status on component mount
  useEffect(() => {
    if (activeTab === 'mcp') {
      loadMCPStatus()
    }
  }, [activeTab])

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
              <button
                onClick={() => setActiveTab('api')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'api'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Key className="h-4 w-4 inline mr-2" />
                API Management
              </button>
              <button
                onClick={() => setActiveTab('mcp')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'mcp'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <TestTube className="h-4 w-4 inline mr-2" />
                MCP Integration
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

            {activeTab === 'api' && (
              <div className="space-y-6">
                {/* API Key Status */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center">
                    <Key className="h-5 w-5 mr-2" />
                    🔑 API.Market AeroDataBox Management
                  </h4>
                  <p className="text-blue-700 dark:text-blue-300 text-sm">
                    Gestionează API key-ul pentru serviciul de date de zboruri AeroDataBox prin API.Market
                  </p>
                </div>

                {/* Current API Key Status */}
                <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-6">
                  <h5 className="font-medium text-gray-900 dark:text-white mb-4">
                    Status API Key Curent
                  </h5>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <span className="text-sm text-gray-600 dark:text-gray-400">API Key:</span>
                      <span className="font-mono text-sm text-gray-900 dark:text-white">
                        {currentApiKey ? `${currentApiKey.substring(0, 8)}...${currentApiKey.substring(-8)}` : 'Nu este configurat'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Provider:</span>
                      <span className="text-sm text-gray-900 dark:text-white">API.Market AeroDataBox</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                      <div className="flex items-center">
                        {apiKeyValid === true && (
                          <span className="flex items-center text-green-600 dark:text-green-400">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Funcțional
                          </span>
                        )}
                        {apiKeyValid === false && (
                          <span className="flex items-center text-red-600 dark:text-red-400">
                            <XCircle className="h-4 w-4 mr-1" />
                            Nefuncțional
                          </span>
                        )}
                        {apiKeyValid === null && currentApiKey && (
                          <button
                            onClick={() => testApiKey(currentApiKey)}
                            disabled={apiKeyTesting}
                            className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                          >
                            <TestTube className="h-4 w-4 mr-1" />
                            {apiKeyTesting ? 'Testare...' : 'Testează'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* API Key Management */}
                <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-6">
                  <h5 className="font-medium text-gray-900 dark:text-white mb-4">
                    Actualizare API Key
                  </h5>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Noul API Key
                      </label>
                      <input
                        type="text"
                        value={apiKey}
                        onChange={(e) => handleApiKeyChange(e.target.value)}
                        placeholder="Introduceți noul API key de la API.Market"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Obțineți API key de la: <a href="https://api.market/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">API.Market Dashboard</a>
                      </p>
                    </div>

                    {/* API Key Validation Status */}
                    {apiKeyError && (
                      <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-red-700 dark:text-red-400 text-sm flex items-center">
                          <XCircle className="h-4 w-4 mr-2" />
                          {apiKeyError}
                        </p>
                      </div>
                    )}

                    {apiKeyValid === true && (
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <p className="text-green-700 dark:text-green-400 text-sm flex items-center">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          API Key valid și funcțional!
                        </p>
                      </div>
                    )}

                    {apiKeySaved && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <p className="text-blue-700 dark:text-blue-400 text-sm flex items-center">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          API Key salvat cu succes!
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex space-x-3">
                      <button
                        onClick={() => testApiKey(apiKey)}
                        disabled={apiKeyTesting || !apiKey.trim()}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <TestTube className="h-4 w-4 mr-2" />
                        {apiKeyTesting ? 'Testare...' : 'Testează API Key'}
                      </button>
                      
                      <button
                        onClick={saveApiKey}
                        disabled={!apiKey.trim() || apiKeyTesting}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Salvează API Key
                      </button>
                    </div>
                  </div>
                </div>

                {/* API Information */}
                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <h5 className="font-medium text-gray-900 dark:text-white mb-4">
                    📊 Informații API
                  </h5>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h6 className="font-medium text-gray-900 dark:text-white mb-2">Provider</h6>
                      <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                        <li>• <strong>Serviciu:</strong> AeroDataBox</li>
                        <li>• <strong>Platform:</strong> API.Market</li>
                        <li>• <strong>Rate Limit:</strong> 150 requests/minute</li>
                        <li>• <strong>Autentificare:</strong> Bearer Token</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h6 className="font-medium text-gray-900 dark:text-white mb-2">Funcționalități</h6>
                      <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                        <li>• Zboruri în timp real (sosiri/plecări)</li>
                        <li>• Căutare zboruri după număr</li>
                        <li>• Informații detaliate aeroporturi</li>
                        <li>• Statistici și analize</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Help Section */}
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                    💡 Cum să obții un API Key
                  </h4>
                  <ol className="text-yellow-700 dark:text-yellow-300 text-sm space-y-1 list-decimal list-inside">
                    <li>Vizitează <a href="https://api.market/dashboard" target="_blank" rel="noopener noreferrer" className="underline">API.Market Dashboard</a></li>
                    <li>Creează un cont sau autentifică-te</li>
                    <li>Abonează-te la serviciul AeroDataBox</li>
                    <li>Generează un nou API key din dashboard</li>
                    <li>Copiază key-ul și testează-l aici</li>
                    <li>Salvează key-ul pentru a activa datele de zboruri</li>
                  </ol>
                </div>
              </div>
            )}

            {activeTab === 'mcp' && (
              <div className="space-y-6">
                {/* MCP Status */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    🔗 MCP Integration Status
                  </h3>
                  <div className="flex items-center space-x-4">
                    <div className={`flex items-center space-x-2 ${mcpInitialized ? 'text-green-600' : 'text-red-600'}`}>
                      {mcpInitialized ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                      <span className="font-medium">
                        {mcpInitialized ? 'Conectat' : 'Deconectat'}
                      </span>
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">
                      Tools disponibile: {mcpTools.length}
                    </div>
                  </div>
                </div>

                {/* MCP Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={loadMCPStatus}
                    disabled={mcpTesting}
                    className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <TestTube className="h-4 w-4" />
                    <span>Verifică Status</span>
                  </button>

                  <button
                    onClick={testMCPConnection}
                    disabled={mcpTesting}
                    className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <TestTube className="h-4 w-4" />
                    <span>{mcpTesting ? 'Testez...' : 'Test Conexiune'}</span>
                  </button>

                  <button
                    onClick={reinitializeMCP}
                    disabled={mcpTesting}
                    className="flex items-center justify-center space-x-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Reinițializează</span>
                  </button>
                </div>

                {/* MCP Error Display */}
                {mcpError && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                      <XCircle className="h-5 w-5" />
                      <span className="font-medium">Eroare MCP</span>
                    </div>
                    <p className="text-red-700 dark:text-red-300 mt-2">{mcpError}</p>
                  </div>
                )}

                {/* MCP Test Results */}
                {mcpTestResult && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                      ✅ Test Rezultat
                    </h4>
                    <pre className="text-sm text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/40 p-3 rounded overflow-x-auto">
                      {JSON.stringify(mcpTestResult, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Available Tools */}
                {mcpTools.length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                      🛠️ Tools Disponibile ({mcpTools.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {mcpTools.map((tool, index) => (
                        <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                          <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                            {tool.name}
                          </h5>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {tool.description}
                          </p>
                          <div className="text-xs text-gray-500 dark:text-gray-500">
                            Parametri: {Object.keys(tool.inputSchema?.properties || {}).join(', ') || 'Niciunul'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* MCP Information */}
                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <h5 className="font-medium text-gray-900 dark:text-white mb-4">
                    📊 Informații MCP
                  </h5>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h6 className="font-medium text-gray-900 dark:text-white mb-2">Protocol</h6>
                      <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                        <li>• <strong>Versiune:</strong> 2024-11-05</li>
                        <li>• <strong>Transport:</strong> HTTP/JSON-RPC</li>
                        <li>• <strong>Endpoint:</strong> API.Market MCP</li>
                        <li>• <strong>Autentificare:</strong> x-api-market-key</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h6 className="font-medium text-gray-900 dark:text-white mb-2">Capabilități</h6>
                      <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                        <li>• Acces direct la AeroDataBox tools</li>
                        <li>• Execuție contextuală de funcții</li>
                        <li>• Gestionare automată de erori</li>
                        <li>• Cache și optimizare</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Help Section */}
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                    💡 Despre MCP Integration
                  </h4>
                  <div className="text-yellow-700 dark:text-yellow-300 text-sm space-y-2">
                    <p>
                      <strong>Model Context Protocol (MCP)</strong> oferă acces direct la funcționalitățile AeroDataBox 
                      prin intermediul unui protocol standardizat, permițând execuția de funcții complexe și contextuale.
                    </p>
                    <p>
                      <strong>Avantaje:</strong> Acces la funcții avansate, execuție optimizată, gestionare automată de erori, 
                      și integrare seamless cu serviciile API.Market.
                    </p>
                  </div>
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