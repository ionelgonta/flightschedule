'use client'

import { useState, useEffect } from 'react'
import { Save, Settings, CheckCircle, XCircle, Monitor, Smartphone, Globe } from 'lucide-react'

interface AdZone {
  mode: 'active' | 'inactive'
  slotId: string
  size: string
  customHtml?: string
}

interface AdConfig {
  publisherId: string
  zones: {
    [key: string]: AdZone
  }
}

export function AdManagement() {
  const [config, setConfig] = useState<AdConfig | null>(null)
  const [publisherId, setPublisherId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  // Zone descriptions for better UX
  const zoneDescriptions = {
    'header-banner': { name: 'Banner Header', description: 'Banner în partea de sus a paginii', icon: Monitor, size: '728x90' },
    'sidebar-right': { name: 'Sidebar Dreapta', description: 'Banner vertical în sidebar', icon: Monitor, size: '300x600' },
    'sidebar-square': { name: 'Sidebar Pătrat', description: 'Banner pătrat în sidebar', icon: Monitor, size: '300x250' },
    'inline-banner': { name: 'Banner Inline', description: 'Banner în conținut', icon: Monitor, size: '728x90' },
    'footer-banner': { name: 'Banner Footer', description: 'Banner în partea de jos', icon: Monitor, size: '970x90' },
    'mobile-banner': { name: 'Banner Mobile', description: 'Banner pentru dispozitive mobile', icon: Smartphone, size: '320x50' },
    'partner-banner-1': { name: 'Banner Partener 1', description: 'Banner personalizat partener', icon: Globe, size: '728x90' },
    'partner-banner-2': { name: 'Banner Partener 2', description: 'Banner personalizat partener', icon: Globe, size: '300x250' }
  }

  // Load configuration on mount
  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/adsense')
      const data = await response.json()
      
      if (data.success && data.publisherId !== undefined) {
        // Create config object from API response
        const configFromApi = {
          publisherId: data.publisherId || '',
          zones: data.zones || {
            'header-banner': { mode: 'inactive' as const, slotId: '', size: '728x90' },
            'sidebar-right': { mode: 'inactive' as const, slotId: '', size: '300x600' },
            'sidebar-square': { mode: 'inactive' as const, slotId: '', size: '300x250' },
            'inline-banner': { mode: 'inactive' as const, slotId: '', size: '728x90' },
            'footer-banner': { mode: 'inactive' as const, slotId: '', size: '970x90' },
            'mobile-banner': { mode: 'inactive' as const, slotId: '', size: '320x50' },
            'partner-banner-1': { mode: 'inactive' as const, slotId: '', size: '728x90', customHtml: '' },
            'partner-banner-2': { mode: 'inactive' as const, slotId: '', size: '300x250', customHtml: '' }
          }
        }
        setConfig(configFromApi)
        setPublisherId(data.publisherId || '')
        setError('')
      } else {
        // Initialize with default config if none exists
        const defaultConfig = {
          publisherId: '',
          zones: {
            'header-banner': { mode: 'inactive' as const, slotId: '', size: '728x90' },
            'sidebar-right': { mode: 'inactive' as const, slotId: '', size: '300x600' },
            'sidebar-square': { mode: 'inactive' as const, slotId: '', size: '300x250' },
            'inline-banner': { mode: 'inactive' as const, slotId: '', size: '728x90' },
            'footer-banner': { mode: 'inactive' as const, slotId: '', size: '970x90' },
            'mobile-banner': { mode: 'inactive' as const, slotId: '', size: '320x50' },
            'partner-banner-1': { mode: 'inactive' as const, slotId: '', size: '728x90', customHtml: '' },
            'partner-banner-2': { mode: 'inactive' as const, slotId: '', size: '300x250', customHtml: '' }
          }
        }
        setConfig(defaultConfig)
        setPublisherId('')
        if (!data.success) {
          setError(data.error || 'Configurația nu există încă - va fi creată la prima salvare')
        }
      }
    } catch (error) {
      console.error('Error loading ad config:', error)
      setError('Eroare de conexiune')
      
      // Initialize with default config on error
      const defaultConfig = {
        publisherId: '',
        zones: {
          'header-banner': { mode: 'inactive' as const, slotId: '', size: '728x90' },
          'sidebar-right': { mode: 'inactive' as const, slotId: '', size: '300x600' },
          'sidebar-square': { mode: 'inactive' as const, slotId: '', size: '300x250' },
          'inline-banner': { mode: 'inactive' as const, slotId: '', size: '728x90' },
          'footer-banner': { mode: 'inactive' as const, slotId: '', size: '970x90' },
          'mobile-banner': { mode: 'inactive' as const, slotId: '', size: '320x50' },
          'partner-banner-1': { mode: 'inactive' as const, slotId: '', size: '728x90', customHtml: '' },
          'partner-banner-2': { mode: 'inactive' as const, slotId: '', size: '300x250', customHtml: '' }
        }
      }
      setConfig(defaultConfig)
      setPublisherId('')
    } finally {
      setLoading(false)
    }
  }

  const saveConfig = async () => {
    if (!config) return
    
    try {
      setSaving(true)
      setError('')
      
      const response = await fetch('/api/admin/adsense', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'update',
          config: {
            ...config,
            publisherId
          }
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
        setError('')
      } else {
        setError(data.error || 'Eroare la salvarea configurației')
      }
    } catch (error) {
      setError('Eroare de conexiune')
      console.error('Error saving ad config:', error)
    } finally {
      setSaving(false)
    }
  }

  const toggleZone = (zoneKey: string) => {
    if (!config) return
    
    setConfig({
      ...config,
      zones: {
        ...config.zones,
        [zoneKey]: {
          ...config.zones[zoneKey],
          mode: config.zones[zoneKey].mode === 'active' ? 'inactive' : 'active'
        }
      }
    })
  }

  const updateZoneSlotId = (zoneKey: string, slotId: string) => {
    if (!config) return
    
    setConfig({
      ...config,
      zones: {
        ...config.zones,
        [zoneKey]: {
          ...config.zones[zoneKey],
          slotId
        }
      }
    })
  }

  const updateZoneCustomHtml = (zoneKey: string, customHtml: string) => {
    if (!config) return
    
    setConfig({
      ...config,
      zones: {
        ...config.zones,
        [zoneKey]: {
          ...config.zones[zoneKey],
          customHtml,
          mode: customHtml.length > 0 ? 'active' : config.zones[zoneKey].mode
        }
      }
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!config) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-700 dark:text-red-400">
          {error || 'Nu s-a putut încărca configurația publicității'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2 flex items-center">
          <Globe className="h-5 w-5 mr-2" />
          📢 Gestionare Publicitate & Parteneri
        </h3>
        <p className="text-green-700 dark:text-green-300 text-sm">
          Configurează Google AdSense, banere personalizate pentru parteneri și controlează afișarea publicității pe site.
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
            <XCircle className="h-5 w-5" />
            <span className="font-medium">Eroare</span>
          </div>
          <p className="text-red-700 dark:text-red-300 mt-2">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {saved && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Configurația a fost salvată cu succes!</span>
          </div>
        </div>
      )}

      {/* Global Settings */}
      <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-6">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Settings className="h-5 w-5 mr-2" />
          Setări Globale
        </h4>
        
        <div className="space-y-4">
          {/* Publisher ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Google AdSense Publisher ID
            </label>
            <input
              type="text"
              value={publisherId}
              onChange={(e) => setPublisherId(e.target.value)}
              placeholder="ca-pub-xxxxxxxxxxxxxxxxx"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              ID-ul de publisher din contul Google AdSense
            </p>
          </div>
        </div>
      </div>

      {/* Ad Zones Configuration */}
      <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-6">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
          Zone Publicitare
        </h4>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Object.entries(config.zones).map(([zoneKey, zone]) => {
            const zoneInfo = zoneDescriptions[zoneKey as keyof typeof zoneDescriptions] || { 
              name: zoneKey, 
              description: 'Zone publicitară', 
              icon: Monitor, 
              size: zone.size 
            }
            const IconComponent = zoneInfo.icon

            return (
              <div key={zoneKey} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <IconComponent className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-white">
                        {zoneInfo.name}
                      </h5>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {zoneInfo.description} ({zoneInfo.size})
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleZone(zoneKey)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      zone.mode === 'active'
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {zone.mode === 'active' ? 'Activ' : 'Inactiv'}
                  </button>
                </div>

                <div className="space-y-3">
                  {/* Slot ID for AdSense zones */}
                  {!zoneKey.includes('partner') && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        AdSense Slot ID
                      </label>
                      <input
                        type="text"
                        value={zone.slotId}
                        onChange={(e) => updateZoneSlotId(zoneKey, e.target.value)}
                        placeholder="1234567890"
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono"
                      />
                    </div>
                  )}

                  {/* Custom HTML for partner zones */}
                  {zoneKey.includes('partner') && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        HTML Personalizat
                      </label>
                      <textarea
                        value={zone.customHtml || ''}
                        onChange={(e) => updateZoneCustomHtml(zoneKey, e.target.value)}
                        placeholder="<div>Banner HTML personalizat...</div>"
                        rows={3}
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono"
                      />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={saveConfig}
          disabled={saving}
          className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Save className="h-4 w-4" />
          <span>{saving ? 'Salvare...' : 'Salvează Configurația'}</span>
        </button>
      </div>
    </div>
  )
}