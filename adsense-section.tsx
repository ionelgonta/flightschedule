'use client'

import { useState, useEffect } from 'react'
import { Save, TestTube, CheckCircle, XCircle, Settings } from 'lucide-react'

export default function AdSenseSection() {
  const [publisherId, setPublisherId] = useState('ca-pub-2305349540791838')
  const [newPublisherId, setNewPublisherId] = useState('')
  const [isValid, setIsValid] = useState<boolean | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')

  // Încarcă Publisher ID din localStorage la pornire
  useEffect(() => {
    const saved = localStorage.getItem('adsense_publisher_id')
    if (saved) {
      setPublisherId(saved)
    }
  }, [])

  // Validează Publisher ID
  const validatePublisherId = (id: string) => {
    const regex = /^ca-pub-\d{16}$/
    return regex.test(id)
  }

  // Testează Publisher ID
  const testPublisherId = () => {
    if (!newPublisherId.trim()) {
      setMessage('Introduceți un Publisher ID')
      setIsValid(false)
      return
    }

    const valid = validatePublisherId(newPublisherId)
    setIsValid(valid)
    
    if (valid) {
      setMessage('Publisher ID valid!')
    } else {
      setMessage('Format invalid. Exemplu: ca-pub-1234567890123456')
    }
  }

  // Salvează Publisher ID
  const savePublisherId = async () => {
    if (!newPublisherId.trim()) {
      setMessage('Introduceți un Publisher ID')
      return
    }

    if (!validatePublisherId(newPublisherId)) {
      setMessage('Format Publisher ID invalid')
      return
    }

    setIsSaving(true)
    
    try {
      // Simulează salvarea în baza de date
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Actualizează Publisher ID-ul curent
      setPublisherId(newPublisherId)
      setMessage('Publisher ID salvat cu succes!')
      setIsValid(true)
      
      // Salvează în localStorage pentru persistență
      localStorage.setItem('adsense_publisher_id', newPublisherId)
      
      // Actualizează și în configurația site-ului (simulat)
      // În realitate, aici ai face un request la server pentru a actualiza baza de date
      
      // Resetează câmpul după 3 secunde
      setTimeout(() => {
        setNewPublisherId('')
        setMessage('')
        setIsValid(null)
      }, 3000)
      
    } catch (error) {
      setMessage('Eroare la salvare')
      setIsValid(false)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-center mb-2">
          <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
            Configurare Google AdSense Publisher ID
          </h3>
        </div>
        <p className="text-blue-700 dark:text-blue-300 text-sm">
          Gestionează Publisher ID-ul pentru Google AdSense. Cheia curentă: <strong>{publisherId}</strong>
        </p>
      </div>

      {/* Status și Modificare */}
      <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-6">
        <h4 className="font-medium text-gray-900 dark:text-white mb-4">
          Modificare Publisher ID
        </h4>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Noul Publisher ID
            </label>
            <input
              type="text"
              value={newPublisherId}
              onChange={(e) => {
                setNewPublisherId(e.target.value)
                setIsValid(null)
                setMessage('')
              }}
              placeholder="ca-pub-2305349540791838"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Găsiți Publisher ID-ul în: <a href="https://www.google.com/adsense/" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Google AdSense Dashboard</a>
            </p>
          </div>

          {/* Status Validare */}
          {message && (
            <div className={`p-3 rounded-lg border ${
              isValid === true 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
            }`}>
              <div className="flex items-center">
                {isValid === true ? (
                  <CheckCircle className="h-4 w-4 mr-2" />
                ) : (
                  <XCircle className="h-4 w-4 mr-2" />
                )}
                <span className="text-sm">{message}</span>
              </div>
            </div>
          )}

          {/* Butoane */}
          <div className="flex space-x-3">
            <button
              onClick={testPublisherId}
              disabled={!newPublisherId.trim()}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <TestTube className="h-4 w-4 mr-2" />
              Testează Format
            </button>
            
            <button
              onClick={savePublisherId}
              disabled={!newPublisherId.trim() || isSaving || isValid !== true}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Salvez...' : 'Salvează Publisher ID'}
            </button>
          </div>
        </div>
      </div>

      {/* Informații */}
      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 dark:text-white mb-3">
          📊 Informații AdSense
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h5 className="font-medium text-gray-900 dark:text-white mb-2">Format</h5>
            <ul className="space-y-1 text-gray-600 dark:text-gray-400">
              <li>• Format: ca-pub-xxxxxxxxxxxxxxxx</li>
              <li>• Lungime: 16 cifre după "ca-pub-"</li>
              <li>• Exemplu: ca-pub-2305349540791838</li>
            </ul>
          </div>
          
          <div>
            <h5 className="font-medium text-gray-900 dark:text-white mb-2">Zone Active</h5>
            <ul className="space-y-1 text-gray-600 dark:text-gray-400">
              <li>• Header Banner (728x90)</li>
              <li>• Footer Banner (970x90)</li>
              <li>• Sidebar Banners (300x250)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}