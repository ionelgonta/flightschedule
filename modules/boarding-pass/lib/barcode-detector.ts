import { BarcodeDetectionResult } from '../types/boarding-pass';

/**
 * Detector pentru coduri de bare din boarding pass-uri
 * Suportă multiple formate: QR Code, PDF417, Code128
 */
export class BarcodeDetector {
  
  /**
   * Detectează coduri de bare dintr-o imagine folosind Google ML Kit
   */
  static async detectFromImage(imageData: string | ArrayBuffer): Promise<BarcodeDetectionResult> {
    try {
      // Verifică dacă Google ML Kit este disponibil
      if (typeof window === 'undefined' || !window.BarcodeDetector) {
        return {
          success: false,
          error: 'Barcode detection not supported in this environment'
        };
      }

      // Creează detector pentru multiple formate
      const detector = new window.BarcodeDetector({
        formats: ['qr_code', 'pdf417', 'code_128']
      });

      let imageElement: HTMLImageElement;

      // Convertește datele în imagine
      if (typeof imageData === 'string') {
        imageElement = new Image();
        imageElement.src = imageData;
        await new Promise((resolve, reject) => {
          imageElement.onload = resolve;
          imageElement.onerror = reject;
        });
      } else {
        // Pentru ArrayBuffer, creează un blob și apoi o imagine
        const blob = new Blob([imageData]);
        const url = URL.createObjectURL(blob);
        imageElement = new Image();
        imageElement.src = url;
        await new Promise((resolve, reject) => {
          imageElement.onload = resolve;
          imageElement.onerror = reject;
        });
        URL.revokeObjectURL(url);
      }

      // Detectează codurile de bare
      const barcodes = await detector.detect(imageElement);

      if (barcodes.length > 0) {
        const barcode = barcodes[0];
        return {
          success: true,
          data: barcode.rawValue,
          format: this.normalizeFormat(barcode.format)
        };
      }

      return {
        success: false,
        error: 'No barcodes detected in image'
      };

    } catch (error) {
      console.error('Error detecting barcode:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Detectează coduri de bare dintr-un canvas
   */
  static async detectFromCanvas(canvas: HTMLCanvasElement): Promise<BarcodeDetectionResult> {
    try {
      if (typeof window === 'undefined' || !window.BarcodeDetector) {
        return {
          success: false,
          error: 'Barcode detection not supported'
        };
      }

      const detector = new window.BarcodeDetector({
        formats: ['qr_code', 'pdf417', 'code_128']
      });

      const barcodes = await detector.detect(canvas);

      if (barcodes.length > 0) {
        const barcode = barcodes[0];
        return {
          success: true,
          data: barcode.rawValue,
          format: this.normalizeFormat(barcode.format)
        };
      }

      return {
        success: false,
        error: 'No barcodes detected'
      };

    } catch (error) {
      console.error('Error detecting barcode from canvas:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Detectează coduri de bare dintr-un fișier PDF (folosind canvas)
   */
  static async detectFromPDFPage(pdfPage: any): Promise<BarcodeDetectionResult> {
    try {
      // Creează un canvas pentru pagina PDF
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) {
        return {
          success: false,
          error: 'Could not create canvas context'
        };
      }

      // Renderizează pagina PDF pe canvas
      const viewport = pdfPage.getViewport({ scale: 2.0 }); // Scale mai mare pentru detectie mai bună
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await pdfPage.render({
        canvasContext: context,
        viewport: viewport
      }).promise;

      // Detectează codurile de bare din canvas
      return await this.detectFromCanvas(canvas);

    } catch (error) {
      console.error('Error detecting barcode from PDF page:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Normalizează formatul codului de bare
   */
  private static normalizeFormat(format: string): 'QR_CODE' | 'PDF417' | 'CODE128' {
    const normalizedFormat = format.toLowerCase().replace(/[_-]/g, '');
    
    switch (normalizedFormat) {
      case 'qrcode':
      case 'qr':
        return 'QR_CODE';
      case 'pdf417':
        return 'PDF417';
      case 'code128':
      case 'code_128':
        return 'CODE128';
      default:
        return 'QR_CODE'; // Default fallback
    }
  }

  /**
   * Validează dacă datele detectate sunt un IATA BCBP valid
   */
  static validateBCBP(data: string): boolean {
    try {
      // IATA BCBP trebuie să înceapă cu M1 și să aibă cel puțin 60 de caractere
      if (!data || data.length < 60) {
        return false;
      }

      // Verifică formatul IATA BCBP
      if (!data.startsWith('M1')) {
        return false;
      }

      // Verifică că conține caractere alfanumerice și spații
      if (!/^[A-Z0-9\s\/]+$/i.test(data)) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Extrage informații de bază din BCBP fără parsing complet
   */
  static extractBasicBCBPInfo(bcbpData: string): { passengerName?: string; flightNumber?: string; route?: string } {
    try {
      if (!this.validateBCBP(bcbpData)) {
        return {};
      }

      const info: any = {};

      // Extrage numele pasagerului (pozițiile 2-22)
      const nameSection = bcbpData.substring(2, 22).trim();
      if (nameSection.includes('/')) {
        const nameParts = nameSection.split('/');
        if (nameParts.length >= 2) {
          info.passengerName = `${nameParts[1]} ${nameParts[0]}`.trim();
        }
      }

      // Extrage numărul zborului (pozițiile 24-28)
      const flightNum = bcbpData.substring(24, 28).trim();
      if (flightNum) {
        info.flightNumber = flightNum;
      }

      // Extrage ruta (pozițiile 29-35)
      const origin = bcbpData.substring(29, 32);
      const destination = bcbpData.substring(32, 35);
      if (origin && destination) {
        info.route = `${origin}-${destination}`;
      }

      return info;
    } catch (error) {
      console.error('Error extracting BCBP info:', error);
      return {};
    }
  }

  /**
   * Verifică dacă browser-ul suportă detectarea codurilor de bare
   */
  static isSupported(): boolean {
    return typeof window !== 'undefined' && 'BarcodeDetector' in window;
  }

  /**
   * Obține formatele suportate de browser
   */
  static async getSupportedFormats(): Promise<string[]> {
    try {
      if (!this.isSupported()) {
        return [];
      }

      return await window.BarcodeDetector.getSupportedFormats();
    } catch (error) {
      console.error('Error getting supported formats:', error);
      return [];
    }
  }
}

// Extinde tipurile pentru BarcodeDetector API
declare global {
  interface Window {
    BarcodeDetector: {
      new (options?: { formats: string[] }): {
        detect(source: HTMLImageElement | HTMLCanvasElement): Promise<{
          rawValue: string;
          format: string;
        }[]>;
      };
      getSupportedFormats(): Promise<string[]>;
    };
  }
}