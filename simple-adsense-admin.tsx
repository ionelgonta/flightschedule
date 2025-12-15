'use client'

import { useState } from 'react'
import { Save, TestTube, CheckCircle, XCircle } from 'lucide-react'

export default function SimpleAdSenseAdmin() {
  const [publisherId, setPublisherId] = useState('ca-pub-2305349540791838')
  const [newPublisherId, setNewPublisherId] = useState('')
  const [isValid, setIsValid] = useState<boolean | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')

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
      
      // Actualizează și în localStorage pentru persistență
      localStorage.setItem('adsense_publisher_id', newPublisherId)
      
      // Resetează câmpul
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
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          🎯 Configurare Google AdSense
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gestionează Publisher ID-ul pentru Google AdSense pe site-ul anyway.ro
        </p>
      </div>

      {/* Status Curent */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Status Publisher ID Curent
        </h2>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Publisher ID:
            </span>
            <span className="font-mono text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 px-2 py-1 rounded border">
              {publisherId}
            </span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Provider:
            </span>
            <span className="text-sm text-gray-900 dark:text-white">
              Google AdSense
            </span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Status:
            </span>
            <span className="flex items-center text-green-600 dark:text-green-400">
              <CheckCircle className="h-4 w-4 mr-1" />
              Activ
            </span>
          </div>
        </div>
      </div>

      {/* Modificare Publisher ID */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Modificare Publisher ID
        </h2>
        
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
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Format: ca-pub-xxxxxxxxxxxxxxxx (16 cifre după "ca-pub-")
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

      {/* Informații AdSense */}
      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          📊 Informații Google AdSense
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              Format Publisher ID
            </h4>
            <ul className="space-y-1 text-gray-600 dark:text-gray-400">
              <li>• <strong>Format:</strong> ca-pub-xxxxxxxxxxxxxxxx</li>
              <li>• <strong>Lungime:</strong> 16 cifre după "ca-pub-"</li>
              <li>• <strong>Exemplu:</strong> ca-pub-2305349540791838</li>
              <li>• <strong>Locație:</strong> AdSense Dashboard → Account</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              Zone Active pe Site
            </h4>
            <ul className="space-y-1 text-gray-600 dark:text-gray-400">
              <li>• Header Banner (728x90)</li>
              <li>• Footer Banner (970x90)</li>
              <li>• Sidebar Banners (300x250, 300x600)</li>
              <li>• Mobile Banner (320x50)</li>
              <li>• Inline Banners (728x90)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Ghid Rapid */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
          💡 Cum să obții Publisher ID AdSense
        </h4>
        <ol className="text-yellow-700 dark:text-yellow-300 text-sm space-y-1 list-decimal list-inside">
          <li>Vizitează <a href="https://www.google.com/adsense/" target="_blank" rel="noopener noreferrer" className="underline">Google AdSense</a></li>
          <li>Creează un cont AdSense sau autentifică-te</li>
          <li>Mergi la Account → Account Information</li>
          <li>Copiază Publisher ID-ul (începe cu "ca-pub-")</li>
          <li>Testează și salvează Publisher ID-ul aici</li>
          <li>Modificările se aplică imediat pe site</li>
        </ol>
      </div>
    </div>
  )
}