'use client'

import { useState, useEffect, useCallback } from 'react'
import WeeklyScheduleView from '@/components/analytics/WeeklyScheduleView'
import CacheManagement from './CacheManagement'
import { AdManagement } from './AdManagement'
import AirportManagement from './AirportManagement'
import { Save, Settings, Key, TestTube, CheckCircle, XCircle, Clock, TrendingUp, Calendar, LogOut, Globe, MapPin } from 'lucide-react'

interface AdminDashboardProps {
  onLogout?: () => void
}

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('api')
  
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

  // API Tracker State
  const [apiTrackerStats, setApiTrackerStats] = useState<any>(null)
  const [recentRequests, setRecentRequests] = useState<any[]>([])
  const [topAirports, setTopAirports] = useState<Array<{airport: string, count: number}>>([])
  const [monthlyHistory, setMonthlyHistory] = useState<Array<{month: string, requests: number, lastReset: string}>>([])

  const handleLogout = () => {
    if (confirm('Sigur doriți să vă deconectați?')) {
      if (onLogout) {
        onLogout() // Use the logout function from props
      } else {
        window.location.reload() // Fallback
      }
    }
  }

  // Load current API key on component mount
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

    loadCurrentApiKey()

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

  // MCP Integration Functions
  const loadMCPStatus = useCallback(async () => {
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
  }, [])

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
  const loadCacheStats = useCallback(async () => {
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
  }, [])

  // API Tracker Functions
  const loadApiTrackerStats = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/api-tracker?action=detailed')
      const data = await response.json()
      
      if (data.success) {
        setApiTrackerStats(data.stats)
        setRecentRequests(data.recentRequests)
        setTopAirports(data.topAirports)
        setMonthlyHistory(data.monthlyHistory || [])
      }
    } catch (error) {
      console.error('Error loading API tracker stats:', error)
    }
  }, [])

  const resetApiTracker = async () => {
    setApiCounterResetting(true)
    
    try {
      const response = await fetch('/api/admin/api-tracker', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'reset' })
      })

      const data = await response.json()
      
      if (data.success) {
        setApiCounterReset(true)
        setTimeout(() => setApiCounterReset(false), 3000)
        await loadApiTrackerStats()
      }
    } catch (error) {
      console.error('Error resetting API tracker:', error)
    } finally {
      setApiCounterResetting(false)
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
        await loadCacheStats()
      }
    } catch (error) {
      console.error('Error resetting API counter:', error)
    } finally {
      setApiCounterResetting(false)
    }
  }

  const refreshStatistics = async () => {
    setStatsRefreshing(true)
    
    try {
      const clearResponse = await fetch('/api/admin/cache-clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pattern: 'airport-statistics'
        })
      })

      if (clearResponse.ok) {
        const statsResponse = await fetch('/api/statistici-aeroporturi?force=true', {
          method: 'GET',
          cache: 'no-cache'
        })

        if (statsResponse.ok) {
          setStatsRefreshed(true)
          setTimeout(() => setStatsRefreshed(false), 3000)
          await loadCacheStats()
        }
      }
    } catch (error) {
      console.error('Error refreshing statistics:', error)
    } finally {
      setStatsRefreshing(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'mcp') {
      loadMCPStatus()
    } else if (activeTab === 'cache') {
      loadCacheStats()
      loadApiTrackerStats()
    }
  }, [activeTab, loadMCPStatus, loadCacheStats, loadApiTrackerStats])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                🎯 Admin Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Gestionează API Keys, Cache și MCP Integration
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Deconectare</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6">
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
              <button
                onClick={() => setActiveTab('weekly-schedule')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'weekly-schedule'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Calendar className="h-4 w-4 inline mr-2" />
                Program Săptămânal
              </button>
              <button
                onClick={() => setActiveTab('airports')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'airports'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <MapPin className="h-4 w-4 inline mr-2" />
                Aeroporturi
              </button>
              <button
                onClick={() => setActiveTab('ads')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'ads'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Globe className="h-4 w-4 inline mr-2" />
                Publicitate
              </button>
            </nav>
          </div>

          <div className="p-6">
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
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'cache' && (
              <div className="space-y-6">
                {/* Cache Management Header */}
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-2">
                    🗄️ Sistem Cache Complet Nou - Cron Jobs & Request Tracking
                  </h3>
                  <p className="text-purple-700 dark:text-purple-300 text-sm">
                    Sistem complet configurabil cu cron jobs automate, cache persistent și tracking exact al request-urilor API. 
                    Toate intervalele sunt configurabile din admin, fără valori hardcodate.
                  </p>
                </div>

                {/* New Cache Management Component */}
                <CacheManagement />
              </div>
            )}

            {activeTab === 'weekly-schedule' && (
              <div className="space-y-6">
                {/* Weekly Schedule Analysis Header */}
                <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100 mb-2">
                    📅 Analiză Program Săptămânal Zboruri
                  </h3>
                  <p className="text-indigo-700 dark:text-indigo-300 text-sm">
                    Sistem de analiză offline bazat pe datele din cache (ultimele 3 luni). Generează programe săptămânale pentru toate rutele de zbor fără apeluri externe la API.
                  </p>
                </div>

                {/* Key Features */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">Offline Complet</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Doar date din cache local</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">Programe Săptămânale</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Modele pe zile ale săptămânii</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">Export Flexibil</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">JSON și CSV disponibile</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Weekly Schedule Component */}
                <WeeklyScheduleView />
              </div>
            )}

            {activeTab === 'airports' && (
              <AirportManagement />
            )}

            {activeTab === 'ads' && (
              <AdManagement />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}