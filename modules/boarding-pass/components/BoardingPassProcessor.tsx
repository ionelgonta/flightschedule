'use client';

import React, { useState, useCallback } from 'react';
import { BoardingPassData, PDFProcessingResult, WalletLinkResult } from '../types/boarding-pass';
import { PDFProcessor } from '../lib/pdf-processor';
import { WalletService } from '../core/WalletService';

interface BoardingPassProcessorProps {
  onSuccess?: (data: BoardingPassData, walletLink: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

/**
 * Componenta principală pentru procesarea boarding pass-urilor
 * Modul independent care poate fi folosit în orice aplicație
 */
export const BoardingPassProcessor: React.FC<BoardingPassProcessorProps> = ({
  onSuccess,
  onError,
  className = ''
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [result, setResult] = useState<{
    boardingPassData?: BoardingPassData;
    walletLink?: string;
    error?: string;
  } | null>(null);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setResult(null);
    
    try {
      // Pasul 1: Validare fișier
      setProcessingStep('Validating PDF file...');
      const isValidPDF = await PDFProcessor.validatePDF(file);
      if (!isValidPDF) {
        throw new Error('Invalid PDF file');
      }

      // Pasul 2: Procesare PDF
      setProcessingStep('Processing PDF and extracting data...');
      const pdfResult: PDFProcessingResult = await PDFProcessor.processPDF(file);
      
      if (!pdfResult.success || !pdfResult.boardingPassData) {
        throw new Error(pdfResult.error || 'Could not extract boarding pass data');
      }

      // Pasul 3: Generare link Google Wallet
      setProcessingStep('Generating Google Wallet link...');
      const walletResult: WalletLinkResult = await WalletService.generateWalletLink(pdfResult.boardingPassData);
      
      if (!walletResult.success || !walletResult.walletLink) {
        throw new Error(walletResult.error || 'Could not generate wallet link');
      }

      // Succes
      const finalResult = {
        boardingPassData: pdfResult.boardingPassData,
        walletLink: walletResult.walletLink
      };

      setResult(finalResult);
      onSuccess?.(pdfResult.boardingPassData, walletResult.walletLink);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setResult({ error: errorMessage });
      onError?.(errorMessage);
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  }, [onSuccess, onError]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      // Simulează upload-ul prin input
      const input = document.createElement('input');
      input.type = 'file';
      input.files = event.dataTransfer.files;
      handleFileUpload({ target: input } as any);
    }
  }, [handleFileUpload]);

  return (
    <div className={`boarding-pass-processor ${className}`}>
      {/* Upload Area */}
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
              padding: '1rem',
              backgroundColor: '#efe',
              border: '1px solid #cfc',
              borderRadius: '4px',
              color: '#363'
            }}>
              <h4>✅ Success</h4>
              
              {/* Boarding Pass Data */}
              {result.boardingPassData && (
                <div style={{ marginBottom: '1rem' }}>
                  <h5>Boarding Pass Details:</h5>
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    <li><strong>Passenger:</strong> {result.boardingPassData.passengerName}</li>
                    <li><strong>Flight:</strong> {result.boardingPassData.carrierCode}{result.boardingPassData.flightNumber}</li>
                    <li><strong>Route:</strong> {result.boardingPassData.origin} → {result.boardingPassData.destination}</li>
                    {result.boardingPassData.confirmationCode && (
                      <li><strong>Confirmation:</strong> {result.boardingPassData.confirmationCode}</li>
                    )}
                    {result.boardingPassData.seatNumber && (
                      <li><strong>Seat:</strong> {result.boardingPassData.seatNumber}</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Google Wallet Link */}
              {result.walletLink && (
                <div>
                  <h5>Google Wallet:</h5>
                  <a 
                    href={result.walletLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-block',
                      padding: '0.5rem 1rem',
                      backgroundColor: '#4285f4',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '4px',
                      fontWeight: 'bold'
                    }}
                  >
                    📱 Add to Google Wallet
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default BoardingPassProcessor;