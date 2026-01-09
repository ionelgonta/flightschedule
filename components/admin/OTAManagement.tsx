'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Upload, 
  FileText, 
  Wallet, 
  Mail, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Download,
  Eye,
  Send,
  RefreshCw,
  AlertTriangle,
  Plane,
  QrCode
} from 'lucide-react'

interface BoardingPass {
  id: string
  passengerName: string
  pnr: string
  flightNumber: string
  airline: string
  departureAirport: string
  arrivalAirport: string
  departureDate: string
  processingStatus: 'uploaded' | 'processing' | 'decoded' | 'failed'
  walletLinkGenerated: boolean
  brandedPdfGenerated: boolean
  emailSent: boolean
  uploadedAt: string
  errorMessage?: string
}

interface Passenger {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  createdAt: string
}

interface OTAStats {
  totalPassengers: number
  totalBoardingPasses: number
  walletLinksGenerated: number
  emailsSent: number
  processingSuccessRate: number
}

export function OTAManagement() {
  const [activeSubTab, setActiveSubTab] = useState('dashboard')
  const [otaToken, setOtaToken] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Dashboard State
  const [stats, setStats] = useState<OTAStats | null>(null)
  const [recentBoardingPasses, setRecentBoardingPasses] = useState<BoardingPass[]>([])
  
  // Boarding Passes State
  const [boardingPasses, setBoardingPasses] = useState<BoardingPass[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  
  // Passengers State
  const [passengers, setPassengers] = useState<Passenger[]>([])
  
  // Email State
  const [emailRecipient, setEmailRecipient] = useState('')
  const [customMessage, setCustomMessage] = useState('')
  const [sendingEmail, setSendingEmail] = useState(false)
  
  // System Health State
  const [systemHealth, setSystemHealth] = useState<any>(null)

  // Authentication with OTA module
  const authenticateOTA = useCallback(async () => {
    try {
      const response = await fetch('/api/ota/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: 'admin',
          password: 'FlightSchedule2024!'
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setOtaToken(data.data.token)
        setIsAuthenticated(true)
        localStorage.setItem('ota_token', data.data.token)
        return true
      } else {
        setError('Autentificare OTA eșuată')
        return false
      }
    } catch (error) {
      setError('Eroare de conexiune la modulul OTA')
      return false
    }
  }, [])

  // Load dashboard data
  const loadDashboard = useCallback(async () => {
    if (!otaToken) return

    try {
      setLoading(true)
      
      // Load stats
      const statsResponse = await fetch('/api/ota/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${otaToken}`
        }
      })
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        if (statsData.success) {
          setStats({
            totalPassengers: statsData.data.overview.totalPassengers,
            totalBoardingPasses: statsData.data.overview.totalBoardingPasses,
            walletLinksGenerated: 0, // Will be calculated from boarding passes
            emailsSent: 0, // Will be calculated from boarding passes
            processingSuccessRate: 0
          })
        }
      }
      
      // Load recent boarding passes
      const bpResponse = await fetch('/api/ota/boarding-passes?limit=5', {
        headers: {
          'Authorization': `Bearer ${otaToken}`
        }
      })
      
      if (bpResponse.ok) {
        const bpData = await bpResponse.json()
        if (bpData.success) {
          setRecentBoardingPasses(bpData.data)
          
          // Calculate additional stats
          const walletLinks = bpData.data.filter((bp: BoardingPass) => bp.walletLinkGenerated).length
          const emails = bpData.data.filter((bp: BoardingPass) => bp.emailSent).length
          const successRate = bpData.data.length > 0 
            ? Math.round((bpData.data.filter((bp: BoardingPass) => bp.processingStatus === 'decoded').length / bpData.data.length) * 100)
            : 0
          
          setStats(prev => prev ? {
            ...prev,
            walletLinksGenerated: walletLinks,
            emailsSent: emails,
            processingSuccessRate: successRate
          } : null)
        }
      }
      
    } catch (error) {
      setError('Eroare la încărcarea datelor dashboard')
    } finally {
      setLoading(false)
    }
  }, [otaToken])

  // Load boarding passes
  const loadBoardingPasses = useCallback(async () => {
    if (!otaToken) return

    try {
      setLoading(true)
      const response = await fetch('/api/ota/boarding-passes?limit=50', {
        headers: {
          'Authorization': `Bearer ${otaToken}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setBoardingPasses(data.data)
        }
      }
    } catch (error) {
      setError('Eroare la încărcarea boarding pass-urilor')
    } finally {
      setLoading(false)
    }
  }, [otaToken])

  // Load passengers
  const loadPassengers = useCallback(async () => {
    if (!otaToken) return

    try {
      setLoading(true)
      const response = await fetch('/api/ota/passengers?limit=50', {
        headers: {
          'Authorization': `Bearer ${otaToken}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setPassengers(data.data)
        }
      }
    } catch (error) {
      setError('Eroare la încărcarea pasagerilor')
    } finally {
      setLoading(false)
    }
  }, [otaToken])

  // Load system health
  const loadSystemHealth = useCallback(async () => {
    if (!otaToken) return

    try {
      const response = await fetch('/api/ota/admin/health', {
        headers: {
          'Authorization': `Bearer ${otaToken}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setSystemHealth(data.data)
        }
      }
    } catch (error) {
      console.error('Eroare la încărcarea stării sistemului')
    }
  }, [otaToken])

  // Upload boarding pass
  const uploadBoardingPass = async () => {
    if (!selectedFile || !otaToken) return

    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch('/api/ota/boarding-passes/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${otaToken}`
        },
        body: formData
      })

      const data = await response.json()
      
      if (data.success) {
        setSelectedFile(null)
        await loadBoardingPasses()
        await loadDashboard()
      } else {
        setError(data.error || 'Eroare la încărcarea fișierului')
      }
    } catch (error) {
      setError('Eroare la încărcarea boarding pass-ului')
    } finally {
      setUploading(false)
    }
  }

  // Generate wallet link
  const generateWalletLink = async (boardingPassId: string) => {
    if (!otaToken) return

    try {
      const response = await fetch(`/api/ota/wallet/generate/${boardingPassId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${otaToken}`
        }
      })

      const data = await response.json()
      
      if (data.success) {
        await loadBoardingPasses()
        await loadDashboard()
      } else {
        setError(data.error || 'Eroare la generarea link-ului Google Wallet')
      }
    } catch (error) {
      setError('Eroare la generarea link-ului Google Wallet')
    }
  }

  // Send email
  const sendEmail = async (boardingPassId: string) => {
    if (!otaToken || !emailRecipient) return

    try {
      setSendingEmail(true)
      const response = await fetch(`/api/ota/email/send/${boardingPassId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${otaToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipientEmail: emailRecipient,
          includeWalletLink: true,
          customMessage: customMessage || undefined
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setEmailRecipient('')
        setCustomMessage('')
        await loadBoardingPasses()
        await loadDashboard()
      } else {
        setError(data.error || 'Eroare la trimiterea email-ului')
      }
    } catch (error) {
      setError('Eroare la trimiterea email-ului')
    } finally {
      setSendingEmail(false)
    }
  }

  // Initialize OTA connection
  useEffect(() => {
    const initOTA = async () => {
      // Check for existing token
      const existingToken = localStorage.getItem('ota_token')
      if (existingToken) {
        setOtaToken(existingToken)
        setIsAuthenticated(true)
      } else {
        await authenticateOTA()
      }
    }

    initOTA()
  }, [authenticateOTA])

  // Load data when authenticated and tab changes
  useEffect(() => {
    if (isAuthenticated && otaToken) {
      switch (activeSubTab) {
        case 'dashboard':
          loadDashboard()
          loadSystemHealth()
          break
        case 'boarding-passes':
          loadBoardingPasses()
          break
        case 'passengers':
          loadPassengers()
          break
      }
    }
  }, [isAuthenticated, otaToken, activeSubTab, loadDashboard, loadBoardingPasses, loadPassengers, loadSystemHealth])

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Conectare la modulul OTA...</p>
          {error && (
            <p className="text-red-600 dark:text-red-400 mt-2">{error}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* OTA Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center">
              <Plane className="h-6 w-6 mr-3" />
              ✈️ Boarding Pass & Google Wallet Management
            </h3>
            <p className="text-blue-700 dark:text-blue-300 text-sm">
              Sistem complet pentru digitizarea boarding pass-urilor și integrarea cu Google Wallet
            </p>
          </div>
          {systemHealth && (
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 ${systemHealth.services.email === 'healthy' ? 'text-green-600' : 'text-red-600'}`}>
                <div className={`w-2 h-2 rounded-full ${systemHealth.services.email === 'healthy' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm">Email</span>
              </div>
              <div className={`flex items-center space-x-2 ${systemHealth.services.googleWallet === 'healthy' ? 'text-green-600' : 'text-red-600'}`}>
                <div className={`w-2 h-2 rounded-full ${systemHealth.services.googleWallet === 'healthy' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm">Google Wallet</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveSubTab('dashboard')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeSubTab === 'dashboard'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <CheckCircle className="h-4 w-4 inline mr-2" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveSubTab('boarding-passes')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeSubTab === 'boarding-passes'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <FileText className="h-4 w-4 inline mr-2" />
            Boarding Passes
          </button>
          <button
            onClick={() => setActiveSubTab('passengers')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeSubTab === 'passengers'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <Users className="h-4 w-4 inline mr-2" />
            Pasageri
          </button>
        </nav>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">Eroare</span>
          </div>
          <p className="text-red-700 dark:text-red-300 mt-2">{error}</p>
          <button
            onClick={() => setError('')}
            className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
          >
            Închide
          </button>
        </div>
      )}

      {/* Dashboard Tab */}
      {activeSubTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Pasageri</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats?.totalPassengers || 0}
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Boarding Passes</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats?.totalBoardingPasses || 0}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Google Wallet</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats?.walletLinksGenerated || 0}
                  </p>
                </div>
                <Wallet className="h-8 w-8 text-purple-600" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Email-uri Trimise</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats?.emailsSent || 0}
                  </p>
                </div>
                <Mail className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Activitate Recentă
            </h4>
            
            {recentBoardingPasses.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Pasager
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Zbor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Google Wallet
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Email
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                    {recentBoardingPasses.map((bp) => (
                      <tr key={bp.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {bp.passengerName || 'Procesare...'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {bp.airline}{bp.flightNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            bp.processingStatus === 'decoded' ? 'bg-green-100 text-green-800' :
                            bp.processingStatus === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                            bp.processingStatus === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {bp.processingStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {bp.walletLinkGenerated ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-gray-400" />
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {bp.emailSent ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-gray-400" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                Nu există boarding pass-uri recente
              </p>
            )}
          </div>
        </div>
      )}

      {/* Boarding Passes Tab */}
      {activeSubTab === 'boarding-passes' && (
        <div className="space-y-6">
          {/* Upload Section */}
          <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Încărcare Boarding Pass
            </h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Selectează fișier (PDF sau imagine)
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              
              <button
                onClick={uploadBoardingPass}
                disabled={!selectedFile || uploading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="h-4 w-4" />
                <span>{uploading ? 'Se încarcă...' : 'Încarcă Boarding Pass'}</span>
              </button>
            </div>
          </div>

          {/* Boarding Passes List */}
          <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                Boarding Passes ({boardingPasses.length})
              </h4>
              <button
                onClick={loadBoardingPasses}
                className="flex items-center space-x-2 px-3 py-1 text-sm bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Reîmprospătează</span>
              </button>
            </div>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500 dark:text-gray-400">Se încarcă...</p>
              </div>
            ) : boardingPasses.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Pasager
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Zbor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Rută
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Acțiuni
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                    {boardingPasses.map((bp) => (
                      <tr key={bp.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {bp.passengerName || 'Procesare...'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {bp.airline}{bp.flightNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {bp.departureAirport} → {bp.arrivalAirport}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              bp.processingStatus === 'decoded' ? 'bg-green-100 text-green-800' :
                              bp.processingStatus === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                              bp.processingStatus === 'failed' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {bp.processingStatus}
                            </span>
                            {bp.walletLinkGenerated && <Wallet className="h-4 w-4 text-purple-600" />}
                            {bp.emailSent && <Mail className="h-4 w-4 text-green-600" />}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          {bp.processingStatus === 'decoded' && !bp.walletLinkGenerated && (
                            <button
                              onClick={() => generateWalletLink(bp.id)}
                              className="text-purple-600 hover:text-purple-900 flex items-center space-x-1"
                            >
                              <QrCode className="h-4 w-4" />
                              <span>Wallet</span>
                            </button>
                          )}
                          {bp.processingStatus === 'decoded' && (
                            <button
                              onClick={() => {
                                setEmailRecipient('')
                                // Open email modal for this boarding pass
                                const email = prompt('Adresa de email pentru trimitere:')
                                if (email) {
                                  setEmailRecipient(email)
                                  sendEmail(bp.id)
                                }
                              }}
                              className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                            >
                              <Send className="h-4 w-4" />
                              <span>Email</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                Nu există boarding pass-uri încărcate
              </p>
            )}
          </div>
        </div>
      )}

      {/* Passengers Tab */}
      {activeSubTab === 'passengers' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                Pasageri ({passengers.length})
              </h4>
              <button
                onClick={loadPassengers}
                className="flex items-center space-x-2 px-3 py-1 text-sm bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Reîmprospătează</span>
              </button>
            </div>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500 dark:text-gray-400">Se încarcă...</p>
              </div>
            ) : passengers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Nume
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Telefon
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Creat
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                    {passengers.map((passenger) => (
                      <tr key={passenger.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {passenger.firstName} {passenger.lastName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {passenger.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {passenger.phone || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(passenger.createdAt).toLocaleDateString('ro-RO')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                Nu există pasageri înregistrați
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}