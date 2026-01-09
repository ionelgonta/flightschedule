import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import GoogleVisionScanner from './google-vision-scanner';

export interface ModernPDFProcessingResult {
  success: boolean;
  bcbp?: string;
  confidence?: number;
  processingSteps: string[];
  error?: string;
  debugInfo?: {
    pdfPages: number;
    imageSize: { width: number; height: number };
    processingTime: number;
    rawBarcodeData?: string;
  };
}

export class ModernPDFProcessor {
  private visionScanner: GoogleVisionScanner;
  private tempDir: string;
  
  constructor() {
    this.visionScanner = new GoogleVisionScanner();
    this.tempDir = path.join(process.cwd(), 'temp');
    this.ensureTempDir();
  }
  
  private async ensureTempDir() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.warn('Could not create temp directory:', error);
    }
  }
  
  /**
   * Procesează PDF folosind cele mai moderne și performante instrumente
   * Pipeline: PDF → pdf-poppler (300 DPI) → Sharp optimization → Google Vision/ML Kit → BCBP extraction
   */
  async processPDF(pdfBuffer: Buffer): Promise<ModernPDFProcessingResult> {
    const startTime = Date.now();
    const processingSteps: string[] = [];
    const sessionId = randomUUID();
    
    try {
      processingSteps.push('🚀 Starting MODERN PDF processing pipeline with pdf-poppler + ML Kit');
      console.log(`📋 Processing session: ${sessionId}`);
      
      // Etapa 1: Încearcă pdf-poppler pentru PDF→bitmap conversion (cel mai performant pe Windows)
      let imageBuffer: Buffer | null = null;
      
      try {
        imageBuffer = await this.convertPDFWithPoppler(pdfBuffer, sessionId, processingSteps);
      } catch (popplerError) {
        processingSteps.push(`⚠️ pdf-poppler failed: ${popplerError}`);
        console.log('pdf-poppler failed, trying alternative methods');
      }
      
      // Etapa 2: Dacă pdf-poppler nu funcționează, încearcă direct PDF text extraction
      if (!imageBuffer) {
        processingSteps.push('🔄 Using direct PDF text extraction as primary method');
        const directTextResult = await this.directPDFTextExtraction(pdfBuffer, processingSteps);
        
        if (directTextResult) {
          processingSteps.push('✅ BCBP found via direct PDF text extraction');
          return {
            success: true,
            bcbp: directTextResult,
            confidence: 0.90,
            processingSteps,
            debugInfo: {
              pdfPages: 1,
              imageSize: { width: 0, height: 0 },
              processingTime: Date.now() - startTime,
              rawBarcodeData: directTextResult
            }
          };
        }
        
        return {
          success: false,
          error: 'No BCBP found in PDF using any method',
          processingSteps
        };
      }
      
      // Etapa 3: Optimizează imaginea cu Sharp pentru ML Kit (cel mai rapid image processor)
      const optimizedBuffer = await sharp(imageBuffer)
        .png({
          quality: 100,
          compressionLevel: 0,    // Fără compresie pentru ML Kit
          adaptiveFiltering: false
        })
        .resize(2480, 3508, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .sharpen()                // Ascuțește pentru OCR mai bun
        .normalize()              // Normalizează contrastul
        .toBuffer();
      
      const imageInfo = await sharp(optimizedBuffer).metadata();
      processingSteps.push(`🖼️ Image optimized with Sharp: ${imageInfo.width}x${imageInfo.height} pixels, ${Math.round((optimizedBuffer.length / 1024))} KB`);
      
      // Etapa 4: Scanează cu Google Cloud Vision API / ML Kit pentru barcode detection
      processingSteps.push('🔍 Scanning optimized bitmap with ML Kit / Google Vision API for barcodes');
      
      const visionResult = await this.visionScanner.scanForBCBP(optimizedBuffer);
      
      if (visionResult.success && visionResult.bcbp) {
        processingSteps.push('🎯 BCBP successfully extracted from barcode via ML Kit');
        
        const processingTime = Date.now() - startTime;
        
        // Cleanup
        await this.cleanup(sessionId);
        
        return {
          success: true,
          bcbp: visionResult.bcbp,
          confidence: 0.95,
          processingSteps,
          debugInfo: {
            pdfPages: 1,
            imageSize: { width: imageInfo.width || 0, height: imageInfo.height || 0 },
            processingTime,
            rawBarcodeData: visionResult.bcbp
          }
        };
      } else {
        processingSteps.push('⚠️ No BCBP found via ML Kit, trying advanced text extraction');
        
        // Etapa 5: Fallback cu text extraction avansat
        const fallbackResult = await this.advancedTextExtraction(optimizedBuffer, processingSteps);
        
        await this.cleanup(sessionId);
        
        if (fallbackResult) {
          processingSteps.push('✅ BCBP found via advanced text extraction');
          return {
            success: true,
            bcbp: fallbackResult,
            confidence: 0.85,
            processingSteps,
            debugInfo: {
              pdfPages: 1,
              imageSize: { width: imageInfo.width || 0, height: imageInfo.height || 0 },
              processingTime: Date.now() - startTime,
              rawBarcodeData: fallbackResult
            }
          };
        }
        
        // Etapa 6: Ultimate fallback - direct PDF text extraction
        processingSteps.push('🔄 Trying direct PDF text extraction as final fallback');
        const pdfTextResult = await this.directPDFTextExtraction(pdfBuffer, processingSteps);
        
        if (pdfTextResult) {
          processingSteps.push('✅ BCBP found via direct PDF text extraction');
          return {
            success: true,
            bcbp: pdfTextResult,
            confidence: 0.75,
            processingSteps,
            debugInfo: {
              pdfPages: 1,
              imageSize: { width: imageInfo.width || 0, height: imageInfo.height || 0 },
              processingTime: Date.now() - startTime,
              rawBarcodeData: pdfTextResult
            }
          };
        }
        
        return {
          success: false,
          error: 'No BCBP found in PDF using any method',
          processingSteps
        };
      }
      
    } catch (error) {
      processingSteps.push(`💥 Error: ${error}`);
      console.error('Modern PDF processing failed:', error);
      
      return {
        success: false,
        error: `Processing failed: ${error}`,
        processingSteps
      };
    }
  }
  
  /**
   * Convert PDF using pdf-poppler (works on Windows without additional dependencies)
   */
  private async convertPDFWithPoppler(pdfBuffer: Buffer, sessionId: string, processingSteps: string[]): Promise<Buffer> {
    const pdfPoppler = require('pdf-poppler');
    
    // Salvează PDF temporar
    const tempPdfPath = path.join(this.tempDir, `${sessionId}.pdf`);
    await fs.writeFile(tempPdfPath, pdfBuffer);
    processingSteps.push('💾 PDF saved for pdf-poppler processing');
    
    const options = {
      format: 'png',
      out_dir: this.tempDir,
      out_prefix: sessionId,
      page: 1,
      single_file: true
    };
    
    processingSteps.push('🔄 Converting PDF to PNG with pdf-poppler (300 DPI)');
    
    // Convert PDF to image
    await pdfPoppler.convert(tempPdfPath, options);
    
    // Read the generated image
    const imagePath = path.join(this.tempDir, `${sessionId}-1.png`);
    const imageBuffer = await fs.readFile(imagePath);
    
    processingSteps.push(`✅ PDF converted to PNG (${imageBuffer.length} bytes)`);
    
    // Cleanup
    try {
      await fs.unlink(tempPdfPath);
      await fs.unlink(imagePath);
    } catch (e) {
      console.warn('Could not cleanup temp files:', e);
    }
    
    return imageBuffer;
  }
  
  /**
   * Advanced text extraction using multiple techniques
   */
  private async advancedTextExtraction(imageBuffer: Buffer, processingSteps: string[]): Promise<string | null> {
    try {
      processingSteps.push('🔍 Advanced text extraction: trying multiple contrast/brightness variations');
      
      // Încearcă diferite variante de procesare pentru OCR mai bun
      const variations = [
        // Original
        imageBuffer,
        // High contrast
        await sharp(imageBuffer).normalize().sharpen().toBuffer(),
        // Inverted
        await sharp(imageBuffer).negate().toBuffer(),
        // Threshold
        await sharp(imageBuffer).greyscale().threshold(128).toBuffer()
      ];
      
      for (let i = 0; i < variations.length; i++) {
        processingSteps.push(`🔄 Trying variation ${i + 1}/4`);
        
        const visionResult = await this.visionScanner.scanImageForBarcodes(variations[i]);
        
        if (visionResult.success && visionResult.textDetections.length > 0) {
          // Caută BCBP în textul detectat
          for (const text of visionResult.textDetections) {
            const bcbpMatch = this.extractBCBPFromText(text);
            if (bcbpMatch) {
              processingSteps.push(`✅ BCBP found in variation ${i + 1}`);
              return bcbpMatch;
            }
          }
        }
      }
      
      return null;
    } catch (error) {
      processingSteps.push(`❌ Advanced text extraction failed: ${error}`);
      return null;
    }
  }
  
  /**
   * Direct PDF text extraction using pdf-parse
   */
  private async directPDFTextExtraction(pdfBuffer: Buffer, processingSteps: string[]): Promise<string | null> {
    try {
      // Use require for pdf-parse (CommonJS module)
      const pdfParse = require('pdf-parse');
      
      processingSteps.push('📄 Extracting text directly from PDF structure');
      
      const data = await pdfParse(pdfBuffer);
      const text = data.text;
      
      processingSteps.push(`📊 Extracted ${text.length} characters from PDF`);
      console.log('📄 PDF Text Content:', text.substring(0, 200) + '...');
      
      // Caută BCBP în textul extras
      const bcbpMatch = this.extractBCBPFromText(text);
      if (bcbpMatch) {
        return bcbpMatch;
      }
      
      return null;
    } catch (error) {
      processingSteps.push(`❌ Direct PDF text extraction failed: ${error}`);
      console.error('PDF text extraction error:', error);
      return null;
    }
  }
  
  /**
   * Extract BCBP from text using multiple patterns
   */
  private extractBCBPFromText(text: string): string | null {
    // Multiple BCBP patterns pentru diferite formate
    const bcbpPatterns = [
      /M1[A-Z0-9\/\s]{30,}/g,
      /M1[^\n\r]{30,}/g,
      /M1[A-Z][A-Z0-9\/\s]+[A-Z]{6}[A-Z0-9\s]+/g
    ];
    
    for (const pattern of bcbpPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        for (const match of matches) {
          // Validează că este un BCBP valid
          if (match.length > 40 && match.includes('/') && /[A-Z]{3}[A-Z]{3}/.test(match)) {
            console.log(`🎯 BCBP found: ${match.substring(0, 50)}...`);
            return match.trim();
          }
        }
      }
    }
    
    return null;
  }
  
  /**
   * Curăță fișierele temporare
   */
  private async cleanup(sessionId: string) {
    try {
      const tempPdfPath = path.join(this.tempDir, `${sessionId}.pdf`);
      await fs.unlink(tempPdfPath);
      console.log('🧹 Temporary files cleaned up');
    } catch (error) {
      console.warn('Could not cleanup temp file:', error);
    }
  }
}

export default ModernPDFProcessor;