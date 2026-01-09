import { createWorker } from 'tesseract.js';

interface ProcessingResult {
  success: boolean;
  bcbpData?: string;
  method: string;
  confidence?: number;
  error?: string;
}

export class UltimatePDFProcessor {
  
  /**
   * Process PDF with Tesseract OCR only (simplified for deployment)
   */
  async processPDF(pdfBuffer: Buffer): Promise<ProcessingResult> {
    console.log('🚀 Starting Ultimate PDF Processing (OCR only)');
    
    try {
      // Use Tesseract OCR directly on PDF
      const worker = await createWorker('eng');
      
      const { data: { text } } = await worker.recognize(pdfBuffer);
      await worker.terminate();
      
      console.log('📄 OCR extracted text:', text.substring(0, 200) + '...');
      
      // Extract BCBP from OCR text
      const bcbpData = this.extractBCBPFromText(text);
      
      if (bcbpData) {
        return {
          success: true,
          bcbpData,
          method: 'tesseract-ocr',
          confidence: 0.8
        };
      }
      
      return {
        success: false,
        method: 'tesseract-ocr',
        error: 'No BCBP data found in OCR text'
      };
      
    } catch (error) {
      console.error('❌ OCR processing failed:', error);
      return {
        success: false,
        method: 'tesseract-ocr',
        error: `OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
  
  /**
   * Extract BCBP data from text
   */
  private extractBCBPFromText(text: string): string | null {
    // Clean the text
    const cleanText = text.replace(/\s+/g, ' ').trim();
    
    // BCBP patterns
    const patterns = [
      // Standard BCBP format
      /M1[A-Z\/\s]{1,30}[A-Z]{2}\d{3,4}[A-Z]{6}[A-Z0-9\s]{10,50}/gi,
      // Relaxed pattern
      /M1[^\n\r]{40,120}/gi,
      // Very specific pattern
      /M1[A-Z\/]+\s+[A-Z]{2}\d{3,4}\s+[A-Z]{6}/gi
    ];
    
    for (const pattern of patterns) {
      const matches = cleanText.match(pattern);
      if (matches) {
        for (const match of matches) {
          const cleaned = this.cleanBCBPData(match);
          if (this.validateBCBP(cleaned)) {
            console.log('✅ Found valid BCBP:', cleaned);
            return cleaned;
          }
        }
      }
    }
    
    // Try to find any M1 pattern
    const m1Pattern = /M1[^\n\r]{30,}/gi;
    const m1Matches = cleanText.match(m1Pattern);
    if (m1Matches) {
      const cleaned = this.cleanBCBPData(m1Matches[0]);
      console.log('⚠️ Found M1 pattern (unvalidated):', cleaned);
      return cleaned;
    }
    
    return null;
  }
  
  /**
   * Clean BCBP data
   */
  private cleanBCBPData(bcbp: string): string {
    return bcbp
      .replace(/\s+/g, ' ')
      .replace(/[^\x20-\x7E]/g, '')
      .trim()
      .substring(0, 158); // BCBP max length
  }
  
  /**
   * Basic BCBP validation
   */
  private validateBCBP(bcbp: string): boolean {
    if (!bcbp || bcbp.length < 30) return false;
    if (!bcbp.startsWith('M1')) return false;
    
    // Check for basic structure
    const hasAirportCodes = /[A-Z]{3}[A-Z]{3}/.test(bcbp);
    const hasFlightNumber = /[A-Z]{2}\d{3,4}/.test(bcbp);
    
    return hasAirportCodes && hasFlightNumber;
  }
}