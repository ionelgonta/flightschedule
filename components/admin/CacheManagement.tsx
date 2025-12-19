'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { RefreshCw, Settings, BarChart3, Plane, Database, Clock, AlertCircle } from 'lucide-react'

interface CacheStats {
  config: {
    flightData: {
      cronInterval: number
      cacheUntilNext: boolean
    }
    analytics: {
      cronInterval: number
      cacheMaxAge: number
    }
    aircraft: {
      cronInterval: number
      cacheMaxAge: number
    }
  }
  requestCounter: {
    flightData: number
    analytics: number
    aircraft: number
    totalRequests: number
    lastReset: string
  }
  cacheEntries: {
    flightData: number
    analytics: number
    aircraft: number
    total: number
  }
  lastUpdated: {
    flightData: string | null
    analytics: string | null
    aircraft: string | null
  }
}

export default function CacheManagement() {
  const [stats, setStats] = useState<CacheStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [refreshing, setRefreshing] = useState<string | null>(null)
  const [reloadingStats, setReloadingStats] = useState(false)
  
  // Form state pentru configurație
  const [config, setConfig] = useState({
    flightData: {
      cronInterval: 60
    },
    analytics: {
      cronInterval: 30,
      cacheMaxAge: 360
    },
    aircraft: {
      cronInterval: 360,
      cacheMaxAge: 360
    }
  })

  useEffect(() => {
    loadStats()
  }, [])

  useEffect(() => {
    if (stats?.config) {
      setConfig(stats.config)
    }
  }, [stats])

  const loadStats = async () => {
    setReloadingStats(true)
    try {
      const response = await fetch('/api/admin/cache-management')
      const data = await response.json()
      
      if (data.success) {
        setStats(data.data)
        console.log('Cache stats reloaded successfully')
      }
    } catch (error) {
      console.error('Error loading cache stats:', error)
    } finally {
      setLoading(false)
      setReloadingStats(false)
    }
  }

  const updateConfig = async () => {
    setUpdating(true)
    try {
      const response = await fetch('/api/admin/cache-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateConfig',
          config
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        await loadStats()
        alert('Configurația cache a fost actualizată cu succes!')
      } else {
        alert(`Eroare: ${data.error}`)
      }
    } catch (error) {
      console.error('Error updating config:', error)
      alert('Eroare la actualizarea configurației')
    } finally {
      setUpdating(false)
    }
  }

  const manualRefresh = async (category: 'flightData' | 'analytics' | 'aircraft', identifier?: string) => {
    const refreshKey = `${category}${identifier ? `-${identifier}` : ''}`
    setRefreshing(refreshKey)
    
    try {
      const response = await fetch('/api/admin/cache-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'manualRefresh',
          category,
          identifier
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        await loadStats()
        alert(`Refresh completat pentru ${category}${identifier ? ` (${identifier})` : ''}`)
      } else {
        alert(`Eroare: ${data.error}`)
      }
    } catch (error) {
      console.error('Error during manual refresh:', error)
      alert('Eroare la refresh manual')
    } finally {
      setRefreshing(null)
    }
  }

  const resetCounter = async () => {
    if (!confirm('Sigur vrei să resetezi contorul de request-uri?')) return
    
    try {
      const response = await fetch('/api/admin/cache-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resetCounter'
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        await loadStats()
        alert('Contorul de request-uri a fost resetat!')
      } else {
        alert(`Eroare: ${data.error}`)
      }
    } catch (error) {
      console.error('Error resetting counter:', error)
      alert('Eroare la resetarea contorului')
    }
  }

  const cleanExpired = async () => {
    try {
      const response = await fetch('/api/admin/cache-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cleanExpired'
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        await loadStats()
        alert(data.message)
      } else {
        alert(`Eroare: ${data.error}`)
      }
    } catch (error) {
      console.error('Error cleaning expired cache:', error)
      alert('Eroare la curățarea cache-ului')
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Niciodată'
    return new Date(dateString).toLocaleString('ro-RO')
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} minute`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }

  const formatDays = (days: number) => {
    if (days === 1) return '1 zi'
    if (days < 30) return `${days} zile`
    if (days === 30) return '1 lună'
    if (days < 365) return `${Math.floor(days / 30)} luni`
    return `${Math.floor(days / 365)} an(i)`
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            Se încarcă statisticile cache...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Configurație Cache */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurație Cache & Cron Jobs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Flight Data Config */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Plane className="h-4 w-4" />
              Sosiri/Plecări (Flight Data)
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="flightDataInterval">Interval Cron (minute)</Label>
                <Input
                  id="flightDataInterval"
                  type="number"
                  min="1"
                  max="1440"
                  value={config.flightData.cronInterval}
                  onChange={(e) => setConfig({
                    ...config,
                    flightData: {
                      ...config.flightData,
                      cronInterval: parseInt(e.target.value) || 60
                    }
                  })}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Actualizare automată la fiecare {formatDuration(config.flightData.cronInterval)}. Datele se păstrează 30 zile pentru statistici pe perioade.
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Analytics Config */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analize & Statistici
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="analyticsCronInterval">Interval Cron (zile)</Label>
                <Input
                  id="analyticsCronInterval"
                  type="number"
                  min="1"
                  max="365"
                  value={config.analytics.cronInterval}
                  onChange={(e) => setConfig({
                    ...config,
                    analytics: {
                      ...config.analytics,
                      cronInterval: parseInt(e.target.value) || 30
                    }
                  })}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Actualizare automată la fiecare {formatDays(config.analytics.cronInterval)}
                </p>
              </div>
              <div>
                <Label htmlFor="analyticsCacheAge">Durată Cache (zile)</Label>
                <Input
                  id="analyticsCacheAge"
                  type="number"
                  min="1"
                  max="365"
                  value={config.analytics.cacheMaxAge}
                  onChange={(e) => setConfig({
                    ...config,
                    analytics: {
                      ...config.analytics,
                      cacheMaxAge: parseInt(e.target.value) || 360
                    }
                  })}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Cache valid pentru {formatDays(config.analytics.cacheMaxAge)}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Aircraft Config */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Database className="h-4 w-4" />
              Informații Aeronave
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="aircraftCronInterval">Interval Cron (zile)</Label>
                <Input
                  id="aircraftCronInterval"
                  type="number"
                  min="1"
                  max="365"
                  value={config.aircraft.cronInterval}
                  onChange={(e) => setConfig({
                    ...config,
                    aircraft: {
                      ...config.aircraft,
                      cronInterval: parseInt(e.target.value) || 360
                    }
                  })}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Actualizare automată la fiecare {formatDays(config.aircraft.cronInterval)}
                </p>
              </div>
              <div>
                <Label htmlFor="aircraftCacheAge">Durată Cache (zile)</Label>
                <Input
                  id="aircraftCacheAge"
                  type="number"
                  min="1"
                  max="365"
                  value={config.aircraft.cacheMaxAge}
                  onChange={(e) => setConfig({
                    ...config,
                    aircraft: {
                      ...config.aircraft,
                      cacheMaxAge: parseInt(e.target.value) || 360
                    }
                  })}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Cache valid pentru {formatDays(config.aircraft.cacheMaxAge)}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button 
              onClick={updateConfig} 
              disabled={updating}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {updating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Actualizează...
                </>
              ) : (
                <>
                  <Settings className="h-4 w-4 mr-2" />
                  Salvează Configurația
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistici Cache */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Statistici Cache & Request-uri API
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Request Counter */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.requestCounter.flightData}</div>
                <div className="text-sm text-muted-foreground">Flight Data</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.requestCounter.analytics}</div>
                <div className="text-sm text-muted-foreground">Analytics</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{stats.requestCounter.aircraft}</div>
                <div className="text-sm text-muted-foreground">Aircraft</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">{stats.requestCounter.totalRequests}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                <Clock className="h-4 w-4 inline mr-1" />
                Ultimul reset: {formatDate(stats.requestCounter.lastReset)}
              </div>
              <Button variant="outline" onClick={resetCounter}>
                Reset Contor
              </Button>
            </div>

            <Separator />

            {/* Cache Entries */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Intrări Cache</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-xl font-bold">{stats.cacheEntries.flightData}</div>
                  <div className="text-sm text-muted-foreground">Flight Data</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatDate(stats.lastUpdated.flightData)}
                  </div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-xl font-bold">{stats.cacheEntries.analytics}</div>
                  <div className="text-sm text-muted-foreground">Analytics</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatDate(stats.lastUpdated.analytics)}
                  </div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-xl font-bold">{stats.cacheEntries.aircraft}</div>
                  <div className="text-sm text-muted-foreground">Aircraft</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatDate(stats.lastUpdated.aircraft)}
                  </div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-xl font-bold">{stats.cacheEntries.total}</div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Butoane Refresh Manual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Actualizare Manuală Cache
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={() => manualRefresh('flightData')}
              disabled={refreshing === 'flightData'}
              className="h-20 flex flex-col items-center justify-center"
            >
              {refreshing === 'flightData' ? (
                <RefreshCw className="h-6 w-6 animate-spin mb-2" />
              ) : (
                <Plane className="h-6 w-6 mb-2" />
              )}
              <span>Refresh Flight Data</span>
              <span className="text-xs text-muted-foreground">Toate aeroporturile</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => manualRefresh('analytics')}
              disabled={refreshing === 'analytics'}
              className="h-20 flex flex-col items-center justify-center"
            >
              {refreshing === 'analytics' ? (
                <RefreshCw className="h-6 w-6 animate-spin mb-2" />
              ) : (
                <BarChart3 className="h-6 w-6 mb-2" />
              )}
              <span>Refresh Analytics</span>
              <span className="text-xs text-muted-foreground">Toate analizele</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => manualRefresh('aircraft')}
              disabled={refreshing === 'aircraft'}
              className="h-20 flex flex-col items-center justify-center"
            >
              {refreshing === 'aircraft' ? (
                <RefreshCw className="h-6 w-6 animate-spin mb-2" />
              ) : (
                <Database className="h-6 w-6 mb-2" />
              )}
              <span>Refresh Aircraft</span>
              <span className="text-xs text-muted-foreground">Toate aeronavele</span>
            </Button>
          </div>

          <Separator />

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              Refresh-ul manual va face request-uri API imediate
            </div>
            <Button variant="outline" onClick={cleanExpired}>
              Curăță Cache Expirat
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Refresh Button */}
      <div className="flex justify-center">
        <Button onClick={loadStats} variant="outline" disabled={reloadingStats}>
          <RefreshCw className={`h-4 w-4 mr-2 ${reloadingStats ? 'animate-spin' : ''}`} />
          {reloadingStats ? 'Se reîncarcă...' : 'Reîncarcă Statistici'}
        </Button>
      </div>
    </div>
  )
}