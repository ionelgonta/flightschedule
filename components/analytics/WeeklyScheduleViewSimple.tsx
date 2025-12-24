'use client'

import { useState, useEffect } from 'react'
import { Calendar } from 'lucide-react'

interface WeeklyScheduleData {
  airport: string;
  destination: string;
  airline: string;
  flightNumber: string;
  weeklyPattern: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
  };
  frequency: number;
  lastUpdated: string;
  dataSource: 'cache' | 'historical';
}

export default function WeeklyScheduleViewSimple() {
  const [scheduleData, setScheduleData] = useState<WeeklyScheduleData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('[WeeklyScheduleSimple] Loading data...')
        const response = await fetch('/api/admin/weekly-schedule?action=get')
        const data = await response.json()
        
        console.log('[WeeklyScheduleSimple] Response:', { success: data.success, count: data.count })
        
        if (data.success) {
          setScheduleData(data.data || [])
        } else {
          setError(data.error || 'Failed to load data')
        }
      } catch (err) {
        console.error('[WeeklyScheduleSimple] Error:', err)
        setError('Network error')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
          <span className="ml-2 text-gray-600">Se încarcă programul săptămânal...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-12">
          <div className="text-red-600 mb-2">⚠️ Eroare</div>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <Calendar className="h-6 w-6 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Program Săptămânal Zboruri (Test)
            </h3>
            <p className="text-sm text-gray-600">
              {scheduleData.length} rute disponibile
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {scheduleData.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Nu sunt date disponibile</p>
          </div>
        ) : (
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900">
              Primele 10 rute:
            </h4>
            <div className="space-y-2">
              {scheduleData.slice(0, 10).map((route, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">{route.airport} → {route.destination}</span>
                      <div className="text-sm text-gray-600">
                        {route.airline} {route.flightNumber}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {route.frequency} zboruri
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}