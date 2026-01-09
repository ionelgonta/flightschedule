import { PDFProcessingResult, BoardingPassData } from '../types/boarding-pass';
import { BoardingPassParser } from '../core/BoardingPassParser';
import { BarcodeDetector } from './barcode-detector';

/**
 * Processor pentru fișiere PDF cu boarding pass-uri
 * Extrage text și detectează coduri de bare
 */
export class PDFProcessor {
  
  /**
   * Procesează un fișier PDF și extrage datele boarding pass-ului
   */
  static async processPDF(file: File): Promise<PDFProcessingResult> {
    try {
      // Verifică că este un fișier PDF
      if (file.type !== 'application/pdf') {
        return {
          success: false,
          error: 'File is not a PDF'
        };
      }

      // Încarcă PDF.js dacă nu este disponibil
      if (typeof window !== 'undefined' && !window.pdfjsLib) {
        await this.loadPDFJS();
      }

      // Convertește fișierul în ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Încarcă documentul PDF
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let allText = '';
      let barcodeData: string | undefined;
      
      // Procesează fiecare pagină
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        
        // Extrage textul din pagină
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        
        allText += pageText + '\n';
        
        // Încearcă să detecteze coduri de bare din pagină
        if (!barcodeData) {
          const barcodeResult = await BarcodeDetector.detectFromPDFPage(page);
          if (barcodeResult.success && barcodeResult.data) {
            barcodeData = barcodeResult.data;
          }
        }
      }

      // Parsează datele boarding pass-ului
      const boardingPassData = BoardingPassParser.parseFromMultipleFormats(allText, barcodeData);
      
      if (boardingPassData) {
        return {
          success: true,
          text: allText,
          boardingPassData: boardingPassData,
          barcodeData: barcodeData ? {
            success: true,
            data: barcodeData,
            format: this.detectBarcodeFormat(barcodeData)
          } : undefined
        };
      }

      return {
        success: false,
        text: allText,
        error: 'Could not extract boarding pass data from PDF'
      };

    } catch (error) {
      console.error('Error processing PDF:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Procesează multiple fișiere PDF
   */
  static async processMultiplePDFs(files: File[]): Promise<PDFProcessingResult[]> {
    const results: PDFProcessingResult[] = [];
    
    for (const file of files) {
      const result = await this.processPDF(file);
      results.push(result);
    }
    
    return results;
  }

  /**
   * Extrage doar textul dintr-un PDF
   */
  static async extractTextFromPDF(file: File): Promise<string> {
    try {
      if (typeof window !== 'undefined' && !window.pdfjsLib) {
        await this.loadPDFJS();
      }

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let allText = '';
      
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        
        allText += pageText + '\n';
      }
      
      return allText;
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      return '';
    }
  }

  /**
   * Detectează coduri de bare dintr-un PDF
   */
  static async detectBarcodesFromPDF(file: File): Promise<string[]> {
    try {
      if (typeof window !== 'undefined' && !window.pdfjsLib) {
        await this.loadPDFJS();
      }

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      const barcodes: string[] = [];
      
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const barcodeResult = await BarcodeDetector.detectFromPDFPage(page);
        
        if (barcodeResult.success && barcodeResult.data) {
          barcodes.push(barcodeResult.data);
        }
      }
      
      return barcodes;
    } catch (error) {
      console.error('Error detecting barcodes from PDF:', error);
      return [];
    }
  }

  /**
   * Validează că un fișier este un PDF valid
   */
  static async validatePDF(file: File): Promise<boolean> {
    try {
      if (file.type !== 'application/pdf') {
        return false;
      }

      if (typeof window !== 'undefined' && !window.pdfjsLib) {
        await this.loadPDFJS();
      }

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      return pdf.numPages > 0;
    } catch (error) {
      console.error('Error validating PDF:', error);
      return false;
    }
  }

  /**
   * Obține informații despre PDF
   */
  static async getPDFInfo(file: File): Promise<{
    numPages: number;
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
  } | null> {
    try {
      if (typeof window !== 'undefined' && !window.pdfjsLib) {
        await this.loadPDFJS();
      }

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const metadata = await pdf.getMetadata();
      
      return {
        numPages: pdf.numPages,
        title: metadata.info?.Title,
        author: metadata.info?.Author,
        subject: metadata.info?.Subject,
        creator: metadata.info?.Creator
      };
    } catch (error) {
      console.error('Error getting PDF info:', error);
      return null;
    }
  }

  /**
   * Încarcă PDF.js library dacă nu este disponibilă
   */
  private static async loadPDFJS(): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }

    if (window.pdfjsLib) {
      return;
    }

    // Încarcă PDF.js din CDN
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    
    return new Promise((resolve, reject) => {
      script.onload = () => {
        // Configurează worker-ul PDF.js
        if (window.pdfjsLib) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = 
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  /**
   * Detectează formatul codului de bare pe baza conținutului
   */
  private static detectBarcodeFormat(data: string): 'QR_CODE' | 'PDF417' | 'CODE128' {
    // IATA BCBP este de obicei în format PDF417 sau QR Code
    if (data.startsWith('M1') && data.length >= 60) {
      return 'PDF417'; // IATA BCBP standard
    }
    
    // Pentru alte formate, folosește QR Code ca default
    return 'QR_CODE';
  }

  /**
   * Verifică dacă PDF.js este disponibil
   */
  static isPDFJSAvailable(): boolean {
    return typeof window !== 'undefined' && !!window.pdfjsLib;
  }

  /**
   * Obține versiunea PDF.js
   */
  static getPDFJSVersion(): string | null {
    if (typeof window !== 'undefined' && window.pdfjsLib) {
      return window.pdfjsLib.version || null;
    }
    return null;
  }
}

// Extinde tipurile pentru PDF.js
declare global {
  interface Window {
    pdfjsLib: {
      getDocument(options: { data: ArrayBuffer }): {
        promise: Promise<{
          numPages: number;
          getPage(pageNum: number): Promise<any>;
          getMetadata(): Promise<{ info?: any }>;
        }>;
      };
      GlobalWorkerOptions: {
        workerSrc: string;
      };
      version?: string;
    };
  }
}