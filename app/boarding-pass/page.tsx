'use client';

import React, { useState, useEffect } from 'react';
import ColibriLogin from '../../components/ColibriLogin';

// Known carriers for airline name lookup
const KNOWN_CARRIERS: Record<string, string> = {
  '5F': 'FlyOne', 'RO': 'TAROM', 'W4': 'Wizz Air', 'W6': 'Wizz Air', 'WZ': 'Wizz Air',
  'H4': 'HiSky', '0B': 'Blue Air', '9U': 'Air Moldova',
  'LH': 'Lufthansa', 'FR': 'Ryanair', 'BA': 'British Airways', 'KL': 'KLM', 'AF': 'Air France',
  'LX': 'Swiss', 'OS': 'Austrian', 'AZ': 'ITA Airways', 'IB': 'Iberia', 'VY': 'Vueling',
  'U2': 'easyJet', 'EW': 'Eurowings', 'EI': 'Aer Lingus', 'SK': 'SAS', 'AY': 'Finnair',
  'SN': 'Brussels Airlines', 'TP': 'TAP Portugal', 'TK': 'Turkish Airlines', 'EK': 'Emirates',
  'QR': 'Qatar Airways', 'AA': 'American Airlines', 'DL': 'Delta', 'UA': 'United',
  'PC': 'Pegasus', 'A3': 'Aegean', 'JU': 'Air Serbia', 'OU': 'Croatia Airlines',
  'LO': 'LOT Polish', 'OK': 'Czech Airlines', 'BT': 'airBaltic',
  'QS': 'SmartWings', 'V7': 'Volotea', 'XR': 'Corendon', 'DE': 'Condor', 'XQ': 'SunExpress'
};

const KNOWN_AIRPORTS: Record<string, string> = {
  'OTP': 'București (Henri Coandă)', 'BBU': 'București (Aurel Vlaicu)',
  'CLJ': 'Cluj-Napoca', 'TSR': 'Timișoara', 'IAS': 'Iași', 'CND': 'Constanța',
  'SBZ': 'Sibiu', 'CRA': 'Craiova', 'BCM': 'Bacău', 'RMO': 'Chișinău',
  'LHR': 'London Heathrow', 'LTN': 'London Luton', 'STN': 'London Stansted',
  'CDG': 'Paris CDG', 'FRA': 'Frankfurt', 'AMS': 'Amsterdam', 'FCO': 'Roma',
  'MUC': 'München', 'VIE': 'Vienna', 'BRU': 'Brussels'
};

export default function BoardingPassPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [result, setResult] = useState<{
    flightData?: any;
    walletLink?: string;
    error?: string;
  } | null>(null);

  useEffect(() => {
    // Verifică dacă utilizatorul este autentificat
    const checkAuth = () => {
      const authenticated = localStorage.getItem('colibri_authenticated');
      const authTime = localStorage.getItem('colibri_auth_time');
      
      if (authenticated === 'true' && authTime) {
        // Verifică dacă sesiunea nu a expirat (24 ore)
        const now = Date.now();
        const authTimestamp = parseInt(authTime);
        const twentyFourHours = 24 * 60 * 60 * 1000;
        
        if (now - authTimestamp < twentyFourHours) {
          setIsAuthenticated(true);
        } else {
          // Sesiunea a expirat
          localStorage.removeItem('colibri_authenticated');
          localStorage.removeItem('colibri_auth_time');
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('colibri_authenticated');
    localStorage.removeItem('colibri_auth_time');
    setIsAuthenticated(false);
  };

  const getAirlineName = (code: string) => KNOWN_CARRIERS[code] || code;
  const getAirportName = (code: string) => KNOWN_AIRPORTS[code] || code;

  const startEditing = () => {
    if (result?.flightData) {
      setEditData({ ...result.flightData });
      setIsEditing(true);
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditData(null);
  };

  const saveEditing = async () => {
    if (!editData) return;
    
    setRegenerating(true);
    try {
      const response = await fetch('/api/google-wallet/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      });
      
      const data = await response.json();
      
      if (data.success && data.walletLink) {
        setResult({
          flightData: editData,
          walletLink: data.walletLink
        });
        setIsEditing(false);
        setEditData(null);
      } else {
        throw new Error(data.error || 'Eroare la regenerare');
      }
    } catch (err: any) {
      alert(err.message || 'Eroare la salvarea modificărilor');
    } finally {
      setRegenerating(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setResult(null);
    
    try {
      // Pasul 1: Validare fișier
      setProcessingStep('Validating PDF file...');
      if (file.type !== 'application/pdf') {
        throw new Error('Invalid PDF file');
      }

      // Pasul 2: Procesare PDF
      setProcessingStep('Processing PDF and extracting data...');
      
      const formData = new FormData();
      formData.append('pdf', file);
      
      const response = await fetch('/api/boarding-pass/process', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Processing failed');
      }

      // Succes
      setResult({
        flightData: data.flightData,
        walletLink: data.walletLink
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setResult({ error: errorMessage });
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      // Simulează upload-ul prin input
      const input = document.createElement('input');
      input.type = 'file';
      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
      handleFileUpload({ target: input } as any);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">C</span>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Se încarcă...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <ColibriLogin onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-end mb-4">
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              🚪 Deconectare
            </button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Boarding Pass Manager
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            Procesează boarding pass-uri și adaugă-le în Google Wallet
          </p>
          <p className="text-sm text-gray-500">
            Suportă PDF-uri cu coduri IATA BCBP și detectare automată de coduri de bare
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-2xl mb-3">📄</div>
            <h3 className="font-semibold mb-2">PDF Processing</h3>
            <p className="text-sm text-gray-600">
              Extrage automat datele din PDF-uri cu boarding pass-uri folosind PDF.js și ML Kit
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-2xl mb-3">🔍</div>
            <h3 className="font-semibold mb-2">Barcode Detection</h3>
            <p className="text-sm text-gray-600">
              Detectează și parsează coduri IATA BCBP din QR codes și PDF417
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-2xl mb-3">📱</div>
            <h3 className="font-semibold mb-2">Google Wallet</h3>
            <p className="text-sm text-gray-600">
              Generează link-uri funcționale pentru adăugarea în Google Wallet
            </p>
          </div>
        </div>

        {/* Upload Area */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div 
            className="upload-area"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            style={{
              border: '2px dashed #ccc',
              borderRadius: '8px',
              padding: '2rem',
              textAlign: 'center',
              backgroundColor: isProcessing ? '#f5f5f5' : '#fafafa',
              cursor: isProcessing ? 'not-allowed' : 'pointer'
            }}
          >
            {isProcessing ? (
              <div>
                <div className="spinner" style={{ 
                  border: '4px solid #f3f3f3',
                  borderTop: '4px solid #3498db',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  animation: 'spin 2s linear infinite',
                  margin: '0 auto 1rem'
                }} />
                <p>{processingStep}</p>
              </div>
            ) : (
              <div>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                  id="pdf-upload"
                  disabled={isProcessing}
                />
                <label htmlFor="pdf-upload" style={{ cursor: 'pointer' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
                  <h3>Upload Boarding Pass PDF</h3>
                  <p>Drag and drop your boarding pass PDF here, or click to select</p>
                  <p style={{ fontSize: '0.9rem', color: '#666' }}>
                    Supports IATA BCBP format with barcode detection
                  </p>
                </label>
              </div>
            )}
          </div>

          {/* Results */}
          {result && (
            <div className="results" style={{ marginTop: '2rem' }}>
              {result.error ? (
                <div className="error" style={{
                  padding: '1rem',
                  backgroundColor: '#fee',
                  border: '1px solid #fcc',
                  borderRadius: '4px',
                  color: '#c33'
                }}>
                  <h4>❌ Error</h4>
                  <p>{result.error}</p>
                </div>
              ) : (
                <div className="success" style={{
                  padding: '1.5rem',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #86efac',
                  borderRadius: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4 style={{ margin: 0, color: '#166534' }}>✅ Boarding Pass Procesat cu Succes!</h4>
                    {!isEditing && (
                      <button
                        onClick={startEditing}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.875rem'
                        }}
                      >
                        ✏️ Editează
                      </button>
                    )}
                  </div>
                  
                  {/* Edit Mode */}
                  {isEditing && editData ? (
                    <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                      <h5 style={{ marginBottom: '1rem' }}>Editare Date Boarding Pass</h5>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>👤 Nume Pasager</label>
                          <input
                            type="text"
                            value={editData.passengerName || ''}
                            onChange={(e) => setEditData({ ...editData, passengerName: e.target.value })}
                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>✈️ Cod Companie</label>
                          <input
                            type="text"
                            value={editData.carrierCode || ''}
                            onChange={(e) => setEditData({ ...editData, carrierCode: e.target.value.toUpperCase() })}
                            maxLength={2}
                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>🔢 Număr Zbor</label>
                          <input
                            type="text"
                            value={editData.flightNumber || ''}
                            onChange={(e) => setEditData({ ...editData, flightNumber: e.target.value })}
                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>🛫 Plecare</label>
                          <input
                            type="text"
                            value={editData.origin || ''}
                            onChange={(e) => setEditData({ ...editData, origin: e.target.value.toUpperCase() })}
                            maxLength={3}
                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>🛬 Sosire</label>
                          <input
                            type="text"
                            value={editData.destination || ''}
                            onChange={(e) => setEditData({ ...editData, destination: e.target.value.toUpperCase() })}
                            maxLength={3}
                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>📅 Data Zbor</label>
                          <input
                            type="date"
                            value={editData.flightDate || ''}
                            onChange={(e) => setEditData({ ...editData, flightDate: e.target.value })}
                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>💺 Loc</label>
                          <input
                            type="text"
                            value={editData.seatNumber || ''}
                            onChange={(e) => setEditData({ ...editData, seatNumber: e.target.value.toUpperCase() })}
                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>🎫 PNR</label>
                          <input
                            type="text"
                            value={editData.confirmationCode || ''}
                            onChange={(e) => setEditData({ ...editData, confirmationCode: e.target.value.toUpperCase() })}
                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>🎟️ Clasă</label>
                          <select
                            value={editData.compartment || 'Y'}
                            onChange={(e) => setEditData({ ...editData, compartment: e.target.value })}
                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                          >
                            <option value="Y">Economy (Y)</option>
                            <option value="C">Business (C)</option>
                            <option value="F">First (F)</option>
                            <option value="W">Premium Economy (W)</option>
                          </select>
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                        <button
                          onClick={cancelEditing}
                          style={{ padding: '0.5rem 1rem', backgroundColor: '#e5e7eb', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Anulează
                        </button>
                        <button
                          onClick={saveEditing}
                          disabled={regenerating}
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#22c55e',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: regenerating ? 'not-allowed' : 'pointer',
                            opacity: regenerating ? 0.7 : 1
                          }}
                        >
                          {regenerating ? '⏳ Salvez...' : '✅ Salvează și Regenerează Link'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Boarding Pass Data */}
                      {result.flightData && (
                        <div style={{ marginBottom: '1rem', backgroundColor: 'white', padding: '1rem', borderRadius: '8px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                            <div>
                              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>👤 Pasager</div>
                              <div style={{ fontWeight: 600 }}>{result.flightData.passengerName}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>✈️ Zbor</div>
                              <div style={{ fontWeight: 600 }}>
                                {getAirlineName(result.flightData.carrierCode)} {result.flightData.carrierCode}{result.flightData.flightNumber}
                              </div>
                              {result.flightData.flightDate && (
                                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                  📅 {new Date(result.flightData.flightDate).toLocaleDateString('ro-RO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </div>
                              )}
                            </div>
                            <div>
                              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>🛫🛬 Rută</div>
                              <div style={{ fontWeight: 600 }}>
                                {getAirportName(result.flightData.origin)} → {getAirportName(result.flightData.destination)}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                {result.flightData.origin} → {result.flightData.destination}
                              </div>
                            </div>
                            {result.flightData.seatNumber && (
                              <div>
                                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>💺 Loc</div>
                                <div style={{ fontWeight: 600 }}>{result.flightData.seatNumber}</div>
                                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Clasa {result.flightData.compartment || 'Y'}</div>
                              </div>
                            )}
                            {result.flightData.confirmationCode && (
                              <div>
                                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>🎫 PNR</div>
                                <div style={{ fontWeight: 600 }}>{result.flightData.confirmationCode}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Google Wallet Link */}
                      {result.walletLink && (
                        <div style={{ textAlign: 'center' }}>
                          <a 
                            href={result.walletLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-block',
                              padding: '1rem 2rem',
                              background: 'linear-gradient(to right, #22c55e, #3b82f6)',
                              color: 'white',
                              textDecoration: 'none',
                              borderRadius: '8px',
                              fontWeight: 'bold',
                              fontSize: '1.1rem'
                            }}
                          >
                            📱 Adaugă în Google Wallet
                          </a>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Technical Details */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-3">🔧 Funcționalități Avansate</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Procesare PDF:</h4>
              <ul className="text-blue-700 space-y-1">
                <li>• Extragere text automată</li>
                <li>• Detectare coduri de bare</li>
                <li>• Parser IATA BCBP complet</li>
                <li>• Suport pentru multiple formate</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Google Wallet:</h4>
              <ul className="text-blue-700 space-y-1">
                <li>• Configurație confirmată funcțională</li>
                <li>• JWT cu algoritmul RS256</li>
                <li>• Validare aeroporturi România</li>
                <li>• Link-uri testate și verificate</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}