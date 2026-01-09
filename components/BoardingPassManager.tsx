'use client';

import React, { useState, useCallback } from 'react';
import { Plane, Wallet, Download, Share2, AlertCircle, CheckCircle } from 'lucide-react';
import BarcodeScanner from './BarcodeScanner';
import { barcodeScanner, BCBPData } from '../lib/mlkit-barcode';

interface BoardingPassManagerProps {
  className?: string;
}

interface GoogleWalletLink {
  url: string;
  qrCode?: string;
  expiresAt: string;
}

export default function BoardingPassManager({ className = '' }: BoardingPassManagerProps) {
  const [scannedData, setScannedData] = useState<BCBPData | null>(null);
  const [walletLink, setWalletLink] = useState<GoogleWalletLink | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Handle barcode detection from scanner
  const handleBarcodeDetected = useCallback(async (bcbpData: BCBPData) => {
    console.log('Boarding pass detected:', bcbpData);
    setScannedData(bcbpData);
    setError(null);
    setSuccess('Boarding pass scanat cu succes!');

    // Auto-generate Google Wallet link
    await generateGoogleWalletLink(bcbpData);
  }, []);

  // Handle scanner errors
  const handleScannerError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    setSuccess(null);
  }, []);

  // Generate Google Wallet link using the confirmed working formula
  const generateGoogleWalletLink = useCallback(async (bcbpData: BCBPData) => {
    if (!bcbpData.parsedSuccessfully) {
      setError('Datele boarding pass-ului nu sunt complete.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Call our API to generate the Google Wallet link
      const response = await fetch('/api/google-wallet/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          passengerName: bcbpData.passengerName,
          flightNumber: bcbpData.flightNumber,
          carrierCode: bcbpData.carrierCode,
          airlineName: bcbpData.airlineName,
          origin: bcbpData.origin,
          destination: bcbpData.destination,
          seatNumber: bcbpData.seatNumber,
          seatClass: bcbpData.seatClass,
          boardingGroup: bcbpData.boardingGroup,
          confirmationCode: bcbpData.confirmationCode,
          rawBCBP: bcbpData.rawBCBP,
          departureTime: bcbpData.departureTime || '2026-06-01T10:00:00'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Eroare la generarea link-ului Google Wallet');
      }

      const result = await response.json();
      
      setWalletLink({
        url: result.walletLink,
        qrCode: result.qrCode,
        expiresAt: result.expiresAt
      });

      setSuccess('Link Google Wallet generat cu succes!');

    } catch (error) {
      console.error('Google Wallet generation error:', error);
      setError(error instanceof Error ? error.message : 'Eroare necunoscută');
    } finally {
      setIsGenerating(false);
    }
  }, []);

  // Add to Google Wallet
  const addToGoogleWallet = useCallback(() => {
    if (!walletLink) return;

    // Open Google Wallet link in new tab
    window.open(walletLink.url, '_blank');
  }, [walletLink]);

  // Share boarding pass
  const shareBoardingPass = useCallback(async () => {
    if (!walletLink || !scannedData) return;

    const shareData = {
      title: `Boarding Pass - ${scannedData.carrierCode}${scannedData.flightNumber}`,
      text: `${scannedData.passengerName} - ${scannedData.origin} → ${scannedData.destination}`,
      url: walletLink.url
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(walletLink.url);
        setSuccess('Link copiat în clipboard!');
      }
    } catch (error) {
      console.error('Share error:', error);
      setError('Eroare la partajare');
    }
  }, [walletLink, scannedData]);

  // Reset state
  const resetState = useCallback(() => {
    setScannedData(null);
    setWalletLink(null);
    setError(null);
    setSuccess(null);
  }, []);

  return (
    <div className={`max-w-2xl mx-auto space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-blue-100 rounded-full">
            <Plane className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Boarding Pass Manager
        </h2>
        <p className="text-gray-600">
          Scanează boarding pass-ul și adaugă-l în Google Wallet
        </p>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
          <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
          <span className="text-green-700">{success}</span>
        </div>
      )}

      {/* Barcode Scanner */}
      {!scannedData && (
        <BarcodeScanner
          onBarcodeDetected={handleBarcodeDetected}
          onError={handleScannerError}
        />
      )}

      {/* Scanned Data Display */}
      {scannedData && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Boarding Pass Detectat
            </h3>
            <button
              onClick={resetState}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Scanează din nou
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Informații Pasager</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <p><strong>Nume:</strong> {scannedData.passengerName}</p>
                {scannedData.seatNumber && (
                  <p><strong>Loc:</strong> {scannedData.seatNumber}</p>
                )}
                {scannedData.boardingGroup && (
                  <p><strong>Grup îmbarcare:</strong> {scannedData.boardingGroup}</p>
                )}
                {scannedData.confirmationCode && (
                  <p><strong>Cod confirmare:</strong> {scannedData.confirmationCode}</p>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Informații Zbor</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <p><strong>Zbor:</strong> {scannedData.carrierCode}{scannedData.flightNumber}</p>
                <p><strong>Companie:</strong> {scannedData.airlineName || scannedData.carrierCode}</p>
                <p><strong>Rută:</strong> {scannedData.origin} → {scannedData.destination}</p>
                {scannedData.seatClass && (
                  <p><strong>Clasă:</strong> {scannedData.seatClass}</p>
                )}
              </div>
            </div>
          </div>

          {/* Raw BCBP Data (for debugging) */}
          <details className="mt-4">
            <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
              Date BCBP brute (pentru debugging)
            </summary>
            <div className="mt-2 p-3 bg-gray-50 rounded text-xs font-mono text-gray-600 break-all">
              {scannedData.rawBCBP}
            </div>
          </details>
        </div>
      )}

      {/* Google Wallet Integration */}
      {scannedData && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Google Wallet
          </h3>

          {isGenerating && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Generez link-ul Google Wallet...</p>
            </div>
          )}

          {walletLink && !isGenerating && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <Wallet className="h-5 w-5 text-green-600 mr-3" />
                  <span className="text-green-700 font-medium">
                    Link Google Wallet generat!
                  </span>
                </div>
                <span className="text-xs text-green-600">
                  Expiră: {new Date(walletLink.expiresAt).toLocaleString('ro-RO')}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={addToGoogleWallet}
                  className="flex-1 flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Wallet className="h-5 w-5 mr-2" />
                  Adaugă în Google Wallet
                </button>

                <button
                  onClick={shareBoardingPass}
                  className="flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Share2 className="h-5 w-5 mr-2" />
                  Partajează
                </button>
              </div>

              {/* QR Code for easy mobile access */}
              {walletLink.qrCode && (
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">
                    Sau scanează cu telefonul:
                  </p>
                  <img
                    src={walletLink.qrCode}
                    alt="QR Code pentru Google Wallet"
                    className="mx-auto w-32 h-32 border border-gray-200 rounded"
                  />
                </div>
              )}
            </div>
          )}

          {!walletLink && !isGenerating && scannedData && (
            <button
              onClick={() => generateGoogleWalletLink(scannedData)}
              className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Wallet className="h-5 w-5 mr-2" />
              Generează Link Google Wallet
            </button>
          )}
        </div>
      )}

      {/* Instructions */}
      {!scannedData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Cum funcționează:</h4>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Scanează codul de bare de pe boarding pass-ul tău</li>
            <li>Verifică informațiile detectate</li>
            <li>Generează link-ul pentru Google Wallet</li>
            <li>Adaugă boarding pass-ul în Google Wallet</li>
          </ol>
        </div>
      )}
    </div>
  );
}