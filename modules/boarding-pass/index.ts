/**
 * Boarding Pass Module - Entry Point
 * Modul independent pentru procesarea boarding pass-urilor și integrarea cu Google Wallet
 */

// Core exports
export { BoardingPassParser } from './core/BoardingPassParser';
export { WalletJsonFactory } from './core/WalletJsonFactory';
export { WalletService } from './core/WalletService';

// Library exports
export { BarcodeDetector } from './lib/barcode-detector';
export { PDFProcessor } from './lib/pdf-processor';

// Component exports
export { BoardingPassProcessor } from './components/BoardingPassProcessor';

// Type exports
export type {
  BoardingPassData,
  BarcodeDetectionResult,
  PDFProcessingResult,
  GoogleWalletConfig,
  WalletLinkResult,
  FlightClass,
  FlightObject,
  GoogleWalletPayload
} from './types/boarding-pass';

// Configuration exports
export { 
  GOOGLE_WALLET_CONFIG,
  validateWalletConfig,
  WALLET_SCOPES,
  WALLET_ENDPOINTS,
  JWT_CONFIG
} from './config/wallet-config';

// Utility functions
export const BoardingPassModule = {
  // Quick processing function
  async processFile(file: File) {
    const { PDFProcessor } = await import('./lib/pdf-processor');
    const { WalletService } = await import('./core/WalletService');
    
    const pdfResult = await PDFProcessor.processPDF(file);
    if (!pdfResult.success || !pdfResult.boardingPassData) {
      throw new Error(pdfResult.error || 'Failed to process PDF');
    }
    
    const walletResult = await WalletService.generateWalletLink(pdfResult.boardingPassData);
    if (!walletResult.success) {
      throw new Error(walletResult.error || 'Failed to generate wallet link');
    }
    
    return {
      boardingPassData: pdfResult.boardingPassData,
      walletLink: walletResult.walletLink,
      extractedText: pdfResult.text,
      barcodeData: pdfResult.barcodeData
    };
  },

  // Quick wallet link generation
  async generateWalletLink(boardingPassData: any) {
    const { WalletService } = await import('./core/WalletService');
    return WalletService.generateWalletLink(boardingPassData);
  },

  // Test configuration
  async testConfiguration() {
    const { WalletService } = await import('./core/WalletService');
    return WalletService.testWalletConnection();
  },

  // Validate boarding pass data
  validateBoardingPassData(data: any) {
    const { BoardingPassParser } = require('./core/BoardingPassParser');
    return BoardingPassParser.validateBoardingPassData(data);
  },

  // Check browser support
  checkBrowserSupport() {
    const { BarcodeDetector } = require('./lib/barcode-detector');
    return {
      barcodeDetection: BarcodeDetector.isSupported(),
      pdfProcessing: typeof window !== 'undefined' && 'FileReader' in window,
      fileUpload: typeof window !== 'undefined' && 'File' in window
    };
  }
};

// Default export
export default BoardingPassModule;