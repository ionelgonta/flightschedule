'use client'

import { useState, useEffect } from 'react'
import { adConfig } from '@/lib/adConfig'
import { Save, Settings, Key, TestTube, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react'

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

  // AdSense Management State
  const [adsensePublisherId, setAdsensePublisherId] = useState('')
  const [currentAdsensePublisherId, setCurrentAdsensePublisherId] = useState('')
  const [adsenseTesting, setAdsenseTesting] = useState(false)
  const [adsenseValid, setAdsenseValid] = useState<boolean | null>(null)
  const [adsenseError, setAdsenseError] = useState('')
  const [adsenseSaved, setAdsenseSaved] = useState(false)

  // Demo Ads State
  const [demoAdsEnabled, setDemoAdsEnabled] = useState(false)

  // MCP Integration State
  const [mcpInitialized, setMcpInitialized] = useState(false)
  const [mcpTools, setMcpTools] = useState<any[]>([])
  const [mcpTesting, setMcpTesting] = useState(false)
  const [mcpError, setMcpError] = useState('')
  const [mcpTestResult, setMcpTestResult] = useState<any>(null)

  // Cache Management State
  const [analyticsInterval, setAnalyticsInterval] = useState(30) // days
  const [realtimeInterval, setRealtimeInterval] = useState(60) // minutes
  const [cacheStats, setCacheStats] = useState<{
    size: number, 
    keys: string[], 
    lastApiCall: string | null,
    apiRequestCount: number,
    cacheEntries: Array<{key: string, timestamp: string, ttl: number, expired: boolean}>
  } | null>(null)
  const [cacheSaving, setCacheSaving] = useState(false)
  const [cacheClearing, setCacheClearing] = useState(false)
  const [cacheSaved, setCacheSaved] = useState(false)
  const [cacheCleared, setCacheCleared] = useState(false)
  const [statsRefreshing, setStatsRefreshing] = useState(false)
  const [statsRefreshed, setStatsRefreshed] = useState(false)
  const [apiCounterResetting, setApiCounterResetting] = useState(false)
  const [apiCounterReset, setApiCounterReset] = useState(false)



  const handleSave = () => {
    localStorage.setItem('adConfig', JSON.stringify(config))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }


  // Load current API key and AdSense config on component mount
  useEffect(() => {
    const loadCurrentApiKey = async () => {
      try {
        const response = await fetch('/api/admin/api-key')
        const data = await response.json()
        
        if (data.success && data.hasKey) {
          setCurrentApiKey(data.apiKey)
        }
      } catch (error) {
        console.error('Error loading API key:', error)
        const envKey = process.env.NEXT_PUBLIC_FLIGHT_API_KEY || ''
        if (envKey) {
          setCurrentApiKey(`${envKey.substring(0, 8)}...${envKey.substring(envKey.length - 8)}`)
        }
      }
    }

    const loadCurrentAdsenseConfig = async () => {
      try {
        const response = await fetch('/api/admin/adsense')
        const data = await response.json()
        
        if (data.success && data.hasPublisherId) {
          setCurrentAdsensePublisherId(data.publisherId)
        }
      } catch (error) {
        console.error('Error loading AdSense config:', error)
        setCurrentAdsensePublisherId(config.publisherId)
      }
    }
    
    loadCurrentApiKey()
    loadCurrentAdsenseConfig()
    
    // Load demo ads state
    const savedDemoState = localStorage.getItem('demoAdsEnabled')
    if (savedDemoState) {
      try {
        setDemoAdsEnabled(JSON.parse(savedDemoState))
      } catch (error) {
        console.error('Error loading demo ads state:', error)
      }
    }

    // Load cache configuration
    const loadCacheConfig = async () => {
      try {
        const response = await fetch('/api/admin/cache-config')
        const data = await response.json()
        
        if (data.success) {
          setAnalyticsInterval(data.config.analyticsInterval)
          setRealtimeInterval(data.config.realtimeInterval)
        }
      } catch (error) {
        console.error('Error loading cache config:', error)
      }
    }

    loadCacheConfig()
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
        
        setTimeout(() => setApiKeySaved(false), 3000)
        
        setTimeout(() => {
          if (confirm('API key salvat cu succes! Pentru a aplica modificările, aplicația trebuie repornită. Continuați?')) {
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

  const handleApiKeyChange = (value: string) => {
    setApiKey(value)
    setApiKeyValid(null)
    setApiKeyError('')
  }

  // AdSense Management Functions
  const testAdsensePublisherId = async (publisherIdToTest: string) => {
    if (!publisherIdToTest.trim()) {
      setAdsenseError('Introduceți un Publisher ID')
      return false
    }

    setAdsenseTesting(true)
    setAdsenseError('')
    setAdsenseValid(null)

    try {
      const response = await fetch('/api/admin/adsense', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          publisherId: publisherIdToTest,
          action: 'test'
        })
      })

      const data = await response.json()

      if (data.success) {
        setAdsenseValid(data.valid)
        if (!data.valid) {
          setAdsenseError(data.error || 'Publisher ID invalid')
        } else {
          setAdsenseError('')
        }
        return data.valid
      } else {
        setAdsenseValid(false)
        setAdsenseError(data.error || 'Eroare la testarea Publisher ID-ului')
        return false
      }
    } catch (error) {
      setAdsenseValid(false)
      setAdsenseError('Eroare de conexiune')
      return false
    } finally {
      setAdsenseTesting(false)
    }
  }
  const saveAdsensePublisherId = async () => {
    if (!adsensePublisherId.trim()) {
      setAdsenseError('Introduceți un Publisher ID')
      return
    }

    setAdsenseTesting(true)
    setAdsenseError('')

    try {
      const response = await fetch('/api/admin/adsense', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          publisherId: adsensePublisherId,
          action: 'save'
        })
      })

      const data = await response.json()

      if (data.success) {
        setCurrentAdsensePublisherId(adsensePublisherId)
        setAdsenseSaved(true)
        setAdsenseValid(true)
        setAdsenseError('')
        
        config.publisherId = adsensePublisherId
        setConfig({ ...config })
        
        setTimeout(() => setAdsenseSaved(false), 3000)
        
        setTimeout(() => {
          if (confirm('Publisher ID AdSense salvat cu succes! Pentru a aplica modificările, aplicația trebuie repornită. Continuați?')) {
            alert('Publisher ID-ul AdSense a fost salvat în fișierul de configurare. Reporniți aplicația pentru a aplica modificările.')
          }
        }, 1000)
      } else {
        setAdsenseError(data.error || 'Eroare la salvarea Publisher ID-ului')
        setAdsenseValid(false)
      }
    } catch (error) {
      setAdsenseError('Eroare de conexiune la server')
      setAdsenseValid(false)
    } finally {
      setAdsenseTesting(false)
    }
  }

  const handleAdsensePublisherIdChange = (value: string) => {
    setAdsensePublisherId(value)
    setAdsenseValid(null)
    setAdsenseError('')
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

  // Cache Management Functions
  const loadCacheStats = async () => {
    setStatsRefreshing(true)
    try {
      const response = await fetch('/api/admin/cache-stats')
      const data = await response.json()
      
      if (data.success) {
        setCacheStats(data.stats)
        setStatsRefreshed(true)
        setTimeout(() => setStatsRefreshed(false), 3000)
      }
    } catch (error) {
      console.error('Error loading cache stats:', error)
    } finally {
      setStatsRefreshing(false)
    }
  }

  const saveCacheConfig = async () => {
    setCacheSaving(true)
    
    try {
      const response = await fetch('/api/admin/cache-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          analyticsInterval,
          realtimeInterval
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setCacheSaved(true)
        setTimeout(() => setCacheSaved(false), 3000)
      }
    } catch (error) {
      console.error('Error saving cache config:', error)
    } finally {
      setCacheSaving(false)
    }
  }

  const clearCache = async () => {
    setCacheClearing(true)
    
    try {
      const response = await fetch('/api/admin/cache-clear', {
        method: 'POST'
      })

      const data = await response.json()
      
      if (data.success) {
        setCacheCleared(true)
        setTimeout(() => setCacheCleared(false), 3000)
        // Reload stats after clearing
        await loadCacheStats()
      }
    } catch (error) {
      console.error('Error clearing cache:', error)
    } finally {
      setCacheClearing(false)
    }
  }

  const resetApiCounter = async () => {
    setApiCounterResetting(true)
    
    try {
      const response = await fetch('/api/admin/cache-stats', {
        method: 'POST'
      })

      const data = await response.json()
      
      if (data.success) {
        setApiCounterReset(true)
        setTimeout(() => setApiCounterReset(false), 3000)
        // Reload stats after reset
        await loadCacheStats()
      }
    } catch (error) {
      console.error('Error resetting API counter:', error)
    } finally {
      setApiCounterResetting(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'mcp') {
      loadMCPStatus()
    } else if (activeTab === 'cache') {
      loadCacheStats()
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
                🎯 Admin Complet - AdSense, API & MCP
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Gestionează AdSense Toggle, API Keys (AeroDataBox) și MCP Integration
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
                AdSense Toggle
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
              <button
                onClick={() => setActiveTab('cache')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'cache'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Settings className="h-4 w-4 inline mr-2" />
                Cache Management
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'adsense' && (
              <div className="space-y-6">
                {/* Simple Demo Toggle */}
                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Demo Ads
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Activează/dezactivează anunțuri demo
                      </p>
                    </div>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={demoAdsEnabled}
                        onChange={(e) => {
                          const enabled = e.target.checked
                          setDemoAdsEnabled(enabled)
                          localStorage.setItem('demoAdsEnabled', JSON.stringify(enabled))
                        }}
                        className="sr-only"
                      />
                      <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        demoAdsEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          demoAdsEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </div>
                      <span className="ml-3 text-sm font-medium text-gray-900 dark:text-white">
                        {demoAdsEnabled ? 'Activat' : 'Dezactivat'}
                      </span>
                    </label>
                  </div>
                </div>

                {/* AdSense Toggle Instructions */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-4">
                    🎯 Sistem Toggle AdSense (2 Moduri)
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-green-100 dark:bg-green-900/20 p-4 rounded-lg">
                      <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">🟢 Activ</h3>
                      <p className="text-green-700 dark:text-green-300 text-sm">
                        AdSense real cu Publisher ID: {config.publisherId}
                      </p>
                    </div>
                    
                    <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">⚫ Inactiv</h3>
                      <p className="text-gray-700 dark:text-gray-300 text-sm">
                        Ascunde complet bannerele
                      </p>
                    </div>
                    

                  </div>

                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                      📋 Instrucțiuni Console Script
                    </h4>
                    <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 text-sm">
                      <li>Deschide <strong>Developer Console</strong> (F12)</li>
                      <li>Selectează tab-ul <strong>Console</strong></li>
                      <li>Copiază scriptul din <code>ADSENSE_TOGGLE_CONSOLE.md</code></li>
                      <li>Execută scriptul pentru interfața completă</li>
                      <li>Controlează toate zonele cu butoane</li>
                    </ol>
                  </div>
                </div>
                {/* Zone Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {adZones.map((zone) => (
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
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          config.zones[zone.key].mode === 'active'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {config.zones[zone.key].mode === 'active' ? 'Activ' : 'Inactiv'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Mod curent: {config.zones[zone.key].mode}
                      </div>
                    </div>
                  ))}
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
                        {currentApiKey || 'Nu este configurat'}
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

                {/* AdSense Publisher ID Management */}
                <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-6">
                  <h5 className="font-medium text-gray-900 dark:text-white mb-4">
                    🎯 AdSense Publisher ID Management
                  </h5>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Publisher ID AdSense
                      </label>
                      <input
                        type="text"
                        value={adsensePublisherId}
                        onChange={(e) => handleAdsensePublisherIdChange(e.target.value)}
                        placeholder="ca-pub-2305349540791838"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Publisher ID curent: <strong>{currentAdsensePublisherId || 'Nu este configurat'}</strong>
                      </p>
                    </div>

                    {/* AdSense Validation Status */}
                    {adsenseError && (
                      <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-red-700 dark:text-red-400 text-sm flex items-center">
                          <XCircle className="h-4 w-4 mr-2" />
                          {adsenseError}
                        </p>
                      </div>
                    )}

                    {adsenseValid === true && (
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <p className="text-green-700 dark:text-green-400 text-sm flex items-center">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Publisher ID valid și funcțional!
                        </p>
                      </div>
                    )}

                    {adsenseSaved && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <p className="text-blue-700 dark:text-blue-400 text-sm flex items-center">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Publisher ID AdSense salvat cu succes!
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex space-x-3">
                      <button
                        onClick={() => testAdsensePublisherId(adsensePublisherId)}
                        disabled={adsenseTesting || !adsensePublisherId.trim()}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <TestTube className="h-4 w-4 mr-2" />
                        {adsenseTesting ? 'Testare...' : 'Testează Publisher ID'}
                      </button>
                      
                      <button
                        onClick={saveAdsensePublisherId}
                        disabled={!adsensePublisherId.trim() || adsenseTesting}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Salvează Publisher ID
                      </button>
                    </div>
                  </div>
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
              </div>
            )}

            {activeTab === 'cache' && (
              <div className="space-y-6">
                {/* Cache Configuration Header */}
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-2">
                    🗄️ Cache Management System
                  </h3>
                  <p className="text-purple-700 dark:text-purple-300 text-sm">
                    Configurează intervalele de cache pentru date live și analize. Sistemul folosește cronjobs automate pentru reîmprospătare.
                  </p>
                </div>

                {/* Cache Configuration */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Analytics Cache */}
                  <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2 text-purple-600" />
                      Cache Analize
                    </h4>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Interval Cache (zile)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="90"
                          value={analyticsInterval}
                          onChange={(e) => setAnalyticsInterval(parseInt(e.target.value) || 30)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Datele de analize se păstrează în cache pentru {analyticsInterval} zile
                        </p>
                      </div>
                      
                      <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                        <p className="text-sm text-purple-700 dark:text-purple-300">
                          <strong>Acoperă:</strong> Statistici aeroporturi, analize istorice, analize rute, catalog aeronave
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Real-time Cache */}
                  <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <Clock className="h-5 w-5 mr-2 text-blue-600" />
                      Cache Timp Real
                    </h4>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Interval Cache (minute)
                        </label>
                        <input
                          type="number"
                          min="5"
                          max="1440"
                          value={realtimeInterval}
                          onChange={(e) => setRealtimeInterval(parseInt(e.target.value) || 60)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Datele live se reîmprospătează la fiecare {realtimeInterval} minute
                        </p>
                      </div>
                      
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          <strong>Acoperă:</strong> Sosiri/plecări aeroporturi, program zboruri recent
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cache Actions */}
                <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                    Acțiuni Cache
                  </h4>
                  
                  <div className="flex flex-wrap gap-4">
                    <button
                      onClick={saveCacheConfig}
                      disabled={cacheSaving}
                      className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {cacheSaving ? 'Salvez...' : 'Salvează Configurația'}
                    </button>
                    
                    <button
                      onClick={clearCache}
                      disabled={cacheClearing}
                      className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      {cacheClearing ? 'Șterg...' : 'Șterge Tot Cache-ul'}
                    </button>
                    
                    <button
                      onClick={loadCacheStats}
                      disabled={statsRefreshing}
                      className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <TestTube className="h-4 w-4 mr-2" />
                      {statsRefreshing ? 'Reîmprospătez...' : 'Reîmprospătează Statistici'}
                    </button>
                    
                    <button
                      onClick={resetApiCounter}
                      disabled={apiCounterResetting}
                      className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      {apiCounterResetting ? 'Resetez...' : 'Resetează Contor API'}
                    </button>
                  </div>

                  {/* Success Messages */}
                  {cacheSaved && (
                    <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <p className="text-green-700 dark:text-green-400 text-sm flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Configurația cache a fost salvată cu succes!
                      </p>
                    </div>
                  )}

                  {cacheCleared && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <p className="text-blue-700 dark:text-blue-400 text-sm flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Cache-ul a fost șters complet!
                      </p>
                    </div>
                  )}

                  {statsRefreshed && (
                    <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <p className="text-green-700 dark:text-green-400 text-sm flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Statisticile au fost reîmprospătate cu succes!
                      </p>
                    </div>
                  )}

                  {apiCounterReset && (
                    <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                      <p className="text-orange-700 dark:text-orange-400 text-sm flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Contorul de request-uri API a fost resetat!
                      </p>
                    </div>
                  )}
                </div>

                {/* Cache Statistics */}
                {cacheStats && (
                  <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                      📊 Statistici Cache
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {cacheStats.size}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Intrări în Cache
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {cacheStats.keys.filter(k => k.startsWith('stats:')).length}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Cache Analize
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {cacheStats.keys.filter(k => k.startsWith('schedules:')).length}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Cache Program
                        </div>
                      </div>

                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <div className="text-sm font-bold text-blue-900 dark:text-blue-100">
                          {cacheStats.lastApiCall 
                            ? new Date(cacheStats.lastApiCall).toLocaleString('ro-RO')
                            : 'Niciodată'
                          }
                        </div>
                        <div className="text-xs text-blue-600 dark:text-blue-400">
                          Ultima Interogare API
                        </div>
                      </div>

                      <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                          {cacheStats.apiRequestCount || 0}
                        </div>
                        <div className="text-xs text-orange-600 dark:text-orange-400">
                          Request-uri API (Units)
                        </div>
                      </div>
                    </div>

                    {cacheStats.keys.length > 0 && (
                      <div>
                        <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                          Chei Cache Active (primele 10):
                        </h5>
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                          <div className="text-xs font-mono text-gray-600 dark:text-gray-400 space-y-1">
                            {cacheStats.keys.slice(0, 10).map((key, index) => (
                              <div key={index}>{key}</div>
                            ))}
                            {cacheStats.keys.length > 10 && (
                              <div className="text-gray-500 dark:text-gray-500">
                                ... și încă {cacheStats.keys.length - 10} chei
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Cronjob Information */}
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
                  <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-3">
                    ⏰ Cronjobs Automate
                  </h4>
                  
                  <div className="space-y-3 text-sm text-yellow-800 dark:text-yellow-200">
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                      <div>
                        <strong>Cache Analize:</strong> Se reîmprospătează automat la fiecare {analyticsInterval} zile
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                      <div>
                        <strong>Cache Timp Real:</strong> Se reîmprospătează automat la fiecare {realtimeInterval} minute
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                      <div>
                        <strong>Sistem Automat:</strong> Cronjobs rulează în background pentru menținerea datelor fresh
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}