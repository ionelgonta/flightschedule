const fs = require('fs').promises;
const path = require('path');
const http = require('http');

// Service account credentials pentru Google Cloud Vision - loaded from environment variables
// IMPORTANT: Set GOOGLE_VISION_CLIENT_EMAIL and GOOGLE_VISION_PRIVATE_KEY in .env.local
const serviceAccountCredentials = {
  client_email: process.env.GOOGLE_VISION_CLIENT_EMAIL || process.env.GOOGLE_WALLET_CLIENT_EMAIL || '',
  private_key: (process.env.GOOGLE_VISION_PRIVATE_KEY || process.env.GOOGLE_WALLET_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
};

// Lista de aeroporturi IATA cunoscute pentru validare
const KNOWN_IATA_AIRPORTS = [
  // România și Moldova
  'OTP', 'BBU', 'CLJ', 'TSR', 'IAS', 'CND', 'SBZ', 'CRA', 'BCM', 'BAY', 'OMR', 'SCV', 'TGM', 'ARW', 'SUJ', 'GHV', 'RMO',
  // Europa de Vest
  'LHR', 'LGW', 'STN', 'LTN', 'MAN', 'BHX', 'EDI', 'GLA', 'BRS', 'NCL', 'LPL', 'EMA', 'SOU', 'ABZ', 'BFS', 'BHD',
  'CDG', 'ORY', 'BVA', 'LYS', 'NCE', 'MRS', 'TLS', 'BOD', 'NTE', 'LIL', 'MPL', 'STR',
  'FRA', 'MUC', 'DUS', 'TXL', 'BER', 'HAM', 'CGN', 'STR', 'HAJ', 'NUE', 'LEJ', 'DRS', 'DTM', 'FMO', 'PAD',
  'AMS', 'RTM', 'EIN', 'MST', 'GRQ',
  'BRU', 'CRL', 'ANR', 'LGG', 'OST',
  'ZRH', 'GVA', 'BSL', 'BRN',
  'VIE', 'SZG', 'INN', 'GRZ', 'LNZ', 'KLU',
  // Europa de Sud
  'FCO', 'MXP', 'LIN', 'BGY', 'VCE', 'NAP', 'BLQ', 'PSA', 'FLR', 'CTA', 'PMO', 'BRI', 'CAG', 'OLB', 'TRN', 'GOA', 'VRN', 'TRS', 'SUF',
  'MAD', 'BCN', 'PMI', 'AGP', 'ALC', 'VLC', 'SVQ', 'BIO', 'IBZ', 'TFS', 'LPA', 'ACE', 'FUE', 'GRX', 'ZAZ', 'SCQ', 'OVD', 'SDR', 'REU',
  'LIS', 'OPO', 'FAO', 'FNC', 'PDL', 'TER',
  'ATH', 'SKG', 'HER', 'RHO', 'CFU', 'CHQ', 'KGS', 'JTR', 'JMK', 'ZTH', 'EFL', 'PVK', 'VOL', 'KVA',
  // Europa de Est și Nordică
  'WAW', 'KRK', 'GDN', 'WRO', 'POZ', 'KTW', 'RZE', 'SZZ', 'LUZ', 'BZG',
  'PRG', 'BRQ', 'OSR',
  'BUD', 'DEB',
  'BTS', 'KSC', 'TAT', 'PED', 'SLD',
  'ZAG', 'SPU', 'DBV', 'PUY', 'ZAD', 'RJK', 'OSI',
  'LJU', 'MBX',
  'BEG', 'INI', 'PRN',
  'SOF', 'VAR', 'BOJ', 'PDV',
  'CPH', 'BLL', 'AAL', 'AAR',
  'OSL', 'BGO', 'TRD', 'SVG', 'TOS', 'BOO', 'AES', 'KRS', 'HAU', 'MOL', 'TRF',
  'ARN', 'GOT', 'MMX', 'BMA', 'NYO', 'VST', 'LLA', 'UME', 'OSD', 'VBY', 'RNB',
  'HEL', 'TMP', 'TKU', 'OUL', 'RVN', 'KUO', 'JYV', 'VAA', 'KTT', 'IVL',
  'TLL', 'TRT',
  'RIX', 'LPX',
  'VNO', 'KUN', 'PLQ', 'SQQ',
  // Turcia și Orientul Mijlociu
  'IST', 'SAW', 'ESB', 'AYT', 'ADB', 'DLM', 'BJV', 'GZT', 'TZX', 'ERZ', 'VAN', 'DIY', 'MLX', 'KYA', 'ASR', 'SZF',
  'TLV', 'SDV', 'ETH', 'VDA', 'HFA',
  'DXB', 'AUH', 'SHJ', 'DWC',
  'DOH', 'HIA',
  'BAH', 'KWI', 'MCT', 'SLL',
  'AMM', 'AQJ',
  'BEY', 'KWI',
  'CAI', 'HRG', 'SSH', 'LXR', 'ASW', 'ALY', 'HBE',
  'CMN', 'RAK', 'AGA', 'FEZ', 'TNG', 'NDR', 'OUD', 'ESU', 'RBA',
  'TUN', 'DJE', 'MIR', 'SFA', 'NBE',
  'ALG', 'ORN', 'CZL', 'AAE', 'TLM', 'BJA', 'GHA', 'TMR',
  // Irlanda
  'DUB', 'SNN', 'ORK', 'KIR', 'NOC', 'GWY', 'CFN', 'WAT',
  // Alte
  'JFK', 'LAX', 'ORD', 'ATL', 'DFW', 'DEN', 'SFO', 'SEA', 'MIA', 'BOS', 'EWR', 'IAD', 'PHL', 'CLT', 'PHX', 'IAH', 'LAS', 'MCO', 'MSP', 'DTW',
  'YYZ', 'YVR', 'YUL', 'YYC', 'YOW', 'YEG', 'YHZ', 'YWG',
  'SIN', 'HKG', 'BKK', 'KUL', 'NRT', 'HND', 'ICN', 'PEK', 'PVG', 'CAN', 'SZX', 'TPE', 'MNL', 'CGK', 'DEL', 'BOM', 'MAA', 'BLR', 'HYD', 'CCU',
  'SYD', 'MEL', 'BNE', 'PER', 'ADL', 'AKL', 'WLG', 'CHC', 'ZQN',
  'JNB', 'CPT', 'DUR', 'NBO', 'ADD', 'LOS', 'ACC', 'ABJ', 'DSS', 'CMN',
  'GRU', 'GIG', 'BSB', 'CNF', 'SSA', 'REC', 'FOR', 'POA', 'CWB', 'VCP',
  'EZE', 'AEP', 'SCL', 'LIM', 'BOG', 'MDE', 'CTG', 'UIO', 'GYE', 'CCS', 'PTY', 'SJO', 'SAL', 'GUA', 'MEX', 'CUN', 'GDL', 'MTY', 'TIJ', 'SJD'
];

class ModernPDFProcessor {
  constructor() {
    this.tempDir = '/tmp/pdf-processing';
    this.ensureTempDir();
    console.log('🚀 Modern PDF Processor initialized with Google Cloud Vision + Airline-Specific OCR');
  }

  async ensureTempDir() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.log('Temp dir ready');
    }
  }

  // Validează codul IATA
  isValidIATACode(code) {
    if (!code || code.length !== 3) return false;
    return KNOWN_IATA_AIRPORTS.includes(code.toUpperCase());
  }

  async processPDF(pdfBuffer) {
    const processingSteps = [];
    const startTime = Date.now();
    
    try {
      console.log('🚀 Starting MAXIMUM PERFORMANCE PDF processing...');
      processingSteps.push('PDF buffer received - size: ' + pdfBuffer.length + ' bytes');
      
      // Step 1: Convert PDF to MAXIMUM QUALITY bitmap
      processingSteps.push('Converting PDF to MAXIMUM QUALITY bitmap');
      const bitmapPath = await this.convertPDFToMaxQualityBitmap(pdfBuffer);
      
      if (bitmapPath) {
        processingSteps.push('MAXIMUM QUALITY bitmap created: ' + bitmapPath);
        
        // Step 2: Use BUILT-IN barcode detection methods
        processingSteps.push('Analyzing with BUILT-IN barcode detection methods');
        const bcbp = await this.analyzeWithBuiltInBarcodeDetection(bitmapPath);
        
        if (bcbp) {
          processingSteps.push('BCBP extracted from REAL barcode via BUILT-IN detection');
          
          // Cleanup
          try {
            await fs.unlink(bitmapPath);
          } catch (cleanupError) {
            console.log('Cleanup warning:', cleanupError.message);
          }
          
          return {
            success: true,
            bcbp,
            processingSteps,
            debugInfo: {
              processingTime: Date.now() - startTime,
              method: 'built-in-barcode-detection',
              bitmapPath: bitmapPath
            }
          };
        }
        
        // Cleanup bitmap if no success
        try {
          await fs.unlink(bitmapPath);
        } catch (cleanupError) {
          console.log('Cleanup warning:', cleanupError.message);
        }
      }

      // FALLBACK: Try airline-specific OCR parsing (Ryanair, Aer Lingus)
      processingSteps.push('Barcode detection failed - trying airline-specific OCR parsing');
      
      // Convert all pages to images for OCR
      const allPageImages = await this.convertAllPagesToImages(pdfBuffer);
      
      if (allPageImages && allPageImages.length > 0) {
        processingSteps.push(`Converted ${allPageImages.length} pages for OCR analysis`);
        
        // Try OCR on each page
        const ocrResults = [];
        for (let i = 0; i < allPageImages.length; i++) {
          const imagePath = allPageImages[i];
          processingSteps.push(`Running OCR on page ${i + 1}...`);
          
          const ocrText = await this.extractTextWithOCR(imagePath);
          if (ocrText) {
            ocrResults.push({ page: i + 1, text: ocrText, imagePath });
            console.log(`📄 Page ${i + 1} OCR text length: ${ocrText.length}`);
          }
          
          // Cleanup image
          try { await fs.unlink(imagePath); } catch (e) {}
        }
        
        if (ocrResults.length > 0) {
          // Check for airline-specific formats
          const combinedText = ocrResults.map(r => r.text).join('\n');
          
          // Try Ryanair parser
          if (combinedText.toUpperCase().includes('RYANAIR')) {
            processingSteps.push('Detected RYANAIR boarding pass - using specific parser');
            const ryanairData = this.parseRyanairOCR(combinedText);
            if (ryanairData) {
              return {
                success: true,
                bcbp: null,
                airlineSpecific: true,
                airline: 'RYANAIR',
                flightData: ryanairData,
                processingSteps,
                debugInfo: {
                  processingTime: Date.now() - startTime,
                  method: 'ryanair-ocr-parser',
                  ocrTextLength: combinedText.length
                }
              };
            }
          }
          
          // Try Aer Lingus parser (multi-passenger support)
          if (combinedText.toUpperCase().includes('AER LINGUS') || combinedText.toUpperCase().includes('AERLINGUS')) {
            processingSteps.push('Detected AER LINGUS boarding pass - using specific parser');
            const aerLingusData = this.parseAerLingusOCR(ocrResults);
            if (aerLingusData && aerLingusData.length > 0) {
              return {
                success: true,
                bcbp: null,
                airlineSpecific: true,
                airline: 'AER_LINGUS',
                flightData: aerLingusData, // Array of passengers
                multiPassenger: aerLingusData.length > 1,
                processingSteps,
                debugInfo: {
                  processingTime: Date.now() - startTime,
                  method: 'aer-lingus-ocr-parser',
                  passengerCount: aerLingusData.length
                }
              };
            }
          }
          
          // Generic OCR fallback - try to extract any flight info
          processingSteps.push('Trying generic OCR flight extraction');
          const genericData = this.parseGenericOCR(combinedText);
          if (genericData) {
            return {
              success: true,
              bcbp: null,
              airlineSpecific: true,
              airline: genericData.carrierCode || 'UNKNOWN',
              flightData: genericData,
              processingSteps,
              debugInfo: {
                processingTime: Date.now() - startTime,
                method: 'generic-ocr-parser'
              }
            };
          }
        }
      }
      
      processingSteps.push('All methods failed - PDF may not contain valid boarding pass');
      return {
        success: false,
        error: 'Nu s-a găsit barcode valid sau text lizibil în PDF. PDF-ul trebuie să conțină un boarding pass cu barcode QR/PDF417 sau text clar vizibil.',
        processingSteps,
        debugInfo: {
          processingTime: Date.now() - startTime,
          pdfSize: pdfBuffer.length,
          reason: 'no-barcode-or-text-detected'
        }
      };

    } catch (error) {
      console.error('MAXIMUM PERFORMANCE PDF processing error:', error);
      processingSteps.push(`CRITICAL ERROR: ${error.message}`);
      
      return {
        success: false,
        error: `Eroare critică la procesarea PDF-ului: ${error.message}`,
        processingSteps,
        debugInfo: {
          processingTime: Date.now() - startTime,
          error: error.message,
          stack: error.stack
        }
      };
    }
  }

  async convertPDFToMaxQualityBitmap(pdfBuffer) {
    try {
      console.log('📄 Converting PDF to MAXIMUM QUALITY bitmap...');
      
      const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
      
      // Method 1: poppler-utils pdftoppm (MOST STABLE - use first)
      try {
        const { execSync } = require('child_process');
        const outputBase = path.join(this.tempDir, `bp-poppler-${uniqueId}`);
        const outputPath = `${outputBase}.png`;
        
        // Write PDF to temp file first (more reliable than stdin)
        const tempPdfPath = path.join(this.tempDir, `temp-${uniqueId}.pdf`);
        await fs.writeFile(tempPdfPath, pdfBuffer);
        
        // Use pdftoppm for OPTIMIZED quality conversion (300 DPI sweet spot)
        const command = `pdftoppm -png -r 300 -singlefile -f 1 -l 1 "${tempPdfPath}" "${outputBase}"`;
        
        execSync(command, { 
          timeout: 30000,
          maxBuffer: 25 * 1024 * 1024
        });
        
        // Cleanup temp PDF
        try {
          await fs.unlink(tempPdfPath);
        } catch (cleanupError) {}
        
        // Check if file was created
        try {
          const stats = await fs.stat(outputPath);
          if (stats.size > 10000) { // At least 10KB for valid image
            console.log('✅ MAXIMUM QUALITY bitmap created with poppler-utils:', outputPath);
            return outputPath;
          } else {
            console.log('❌ Poppler output too small:', stats.size, 'bytes');
            try { await fs.unlink(outputPath); } catch (e) {}
          }
        } catch (statError) {
          console.log('❌ Poppler output file not found');
        }
        
      } catch (popplerError) {
        console.log('❌ Poppler-utils failed:', popplerError.message);
      }
      
      // Method 2: ghostscript (MAXIMUM compatibility)
      try {
        const { execSync } = require('child_process');
        const outputPath = path.join(this.tempDir, `bp-gs-${uniqueId}.png`);
        
        // Write PDF to temp file first
        const tempPdfPath = path.join(this.tempDir, `temp-gs-${uniqueId}.pdf`);
        await fs.writeFile(tempPdfPath, pdfBuffer);
        
        // Use ghostscript for OPTIMIZED quality (300 DPI sweet spot)
        const gsCommand = `gs -dNOPAUSE -dBATCH -dQUIET -sDEVICE=png16m -r300 -dFirstPage=1 -dLastPage=1 -sOutputFile="${outputPath}" "${tempPdfPath}"`;
        
        execSync(gsCommand, { 
          timeout: 30000,
          stdio: 'pipe'
        });
        
        // Cleanup temp PDF
        try {
          await fs.unlink(tempPdfPath);
        } catch (cleanupError) {}
        
        // Verify output
        try {
          const stats = await fs.stat(outputPath);
          if (stats.size > 10000) {
            console.log('✅ MAXIMUM QUALITY bitmap created with ghostscript:', outputPath);
            return outputPath;
          } else {
            console.log('❌ Ghostscript output too small:', stats.size, 'bytes');
            try { await fs.unlink(outputPath); } catch (e) {}
          }
        } catch (statError) {
          console.log('❌ Ghostscript output file not found');
        }
        
      } catch (gsError) {
        console.log('❌ Ghostscript failed:', gsError.message);
      }
      
      // Method 3: pdf2pic (fallback - can be unstable)
      try {
        const pdf2pic = require('pdf2pic');
        
        const convert = pdf2pic.fromBuffer(pdfBuffer, {
          density: 300,
          saveFilename: `bp-pdf2pic-${uniqueId}`,
          savePath: this.tempDir,
          format: "png",
          width: 2480,
          height: 3508,
          quality: 100,
          preserveAspectRatio: true,
          background: "white"
        });
        
        const result = await convert(1, { responseType: "image" });
        
        if (result && result.path) {
          // Verify file exists and has content
          const stats = await fs.stat(result.path);
          if (stats.size > 10000) {
            console.log('✅ MAXIMUM QUALITY bitmap created with pdf2pic:', result.path);
            return result.path;
          } else {
            console.log('❌ pdf2pic output too small:', stats.size, 'bytes');
            try { await fs.unlink(result.path); } catch (e) {}
          }
        }
        
      } catch (pdf2picError) {
        console.log('❌ pdf2pic failed:', pdf2picError.message);
      }
      
      throw new Error('All MAXIMUM QUALITY bitmap conversion methods failed');
      
    } catch (error) {
      console.error('❌ MAXIMUM QUALITY bitmap conversion failed:', error);
      throw error;
    }
  }

  async analyzeWithBuiltInBarcodeDetection(imagePath) {
    try {
      console.log('🔍 Analyzing with BUILT-IN barcode detection...');
      
      // Method 1: Try pyzbar via Python (most reliable for BCBP)
      try {
        const { execSync } = require('child_process');
        
        // Create a simple Python script for barcode detection
        const pythonScript = `
import sys
try:
    from pyzbar import pyzbar
    from PIL import Image
    
    image = Image.open('${imagePath}')
    barcodes = pyzbar.decode(image)
    
    for barcode in barcodes:
        data = barcode.data.decode('utf-8')
        if data.startswith('M1'):
            print(data)
            sys.exit(0)
    
    print('NO_BCBP_FOUND')
except Exception as e:
    print(f'ERROR: {e}')
`;
        
        const tempPyFile = path.join(this.tempDir, `barcode_detect_${Date.now()}.py`);
        await fs.writeFile(tempPyFile, pythonScript);
        
        const result = execSync(`python3 "${tempPyFile}"`, { 
          timeout: 30000,
          encoding: 'utf8'
        }).trim();
        
        // Cleanup
        try {
          await fs.unlink(tempPyFile);
        } catch (cleanupError) {
          console.log('Python script cleanup warning:', cleanupError.message);
        }
        
        if (result && result !== 'NO_BCBP_FOUND' && !result.startsWith('ERROR:') && result.startsWith('M1')) {
          console.log('✅ BCBP found via pyzbar:', result.substring(0, 50) + '...');
          return result;
        }
        
      } catch (pyzbarError) {
        console.log('❌ pyzbar detection failed:', pyzbarError.message);
      }
      
      // Method 2: Try zbar command line (if available)
      try {
        const { execSync } = require('child_process');
        
        const result = execSync(`zbarimg --quiet --raw "${imagePath}"`, {
          timeout: 30000,
          encoding: 'utf8'
        }).trim();
        
        if (result && result.startsWith('M1')) {
          console.log('✅ BCBP found via zbar CLI:', result.substring(0, 50) + '...');
          return result;
        }
        
      } catch (zbarError) {
        console.log('❌ zbar CLI detection failed:', zbarError.message);
      }
      
      // Method 3: Try dmtx-utils for Data Matrix codes (alternative)
      try {
        const { execSync } = require('child_process');
        
        const result = execSync(`dmtxread "${imagePath}"`, {
          timeout: 30000,
          encoding: 'utf8'
        }).trim();
        
        if (result && result.startsWith('M1')) {
          console.log('✅ BCBP found via dmtxread:', result.substring(0, 50) + '...');
          return result;
        }
        
      } catch (dmtxError) {
        console.log('❌ dmtxread detection failed:', dmtxError.message);
      }
      
      // Method 3: Try ZXing for PDF417/QR/Aztec barcodes (BEST for PDF417!)
      try {
        console.log('🔍 Trying ZXing barcode decoder (PDF417/QR/Aztec)...');
        const bcbp = await this.decodeWithZXing(imagePath);
        if (bcbp) {
          console.log('✅ BCBP found via ZXing:', bcbp.substring(0, 50) + '...');
          return bcbp;
        }
      } catch (zxingError) {
        console.log('❌ ZXing detection failed:', zxingError.message);
      }
      
      // Method 4: Try Tesseract OCR (free, local - for visible BCBP text)
      try {
        const { execSync } = require('child_process');
        
        console.log('🔍 Trying Tesseract OCR...');
        const result = execSync(`tesseract "${imagePath}" stdout -l eng --psm 6`, {
          timeout: 30000,
          encoding: 'utf8'
        }).trim();
        
        if (result) {
          const bcbp = this.extractBCBPFromText(result);
          if (bcbp) {
            console.log('✅ BCBP found via Tesseract OCR:', bcbp.substring(0, 50) + '...');
            return bcbp;
          }
        }
        
      } catch (tesseractError) {
        console.log('❌ Tesseract OCR failed:', tesseractError.message);
      }
      
      // Method 5: Google Cloud Vision (paid, last resort)
      try {
        console.log('🔍 Trying Google Cloud Vision API (paid fallback)...');
        const bcbp = await this.analyzeWithGoogleVision(imagePath);
        if (bcbp) {
          console.log('✅ BCBP found via Google Cloud Vision:', bcbp.substring(0, 50) + '...');
          return bcbp;
        }
      } catch (visionError) {
        console.log('❌ Google Cloud Vision failed:', visionError.message);
      }
      
      console.log('❌ All barcode detection methods failed');
      return null;
      
    } catch (error) {
      console.error('❌ Built-in barcode detection failed:', error);
      throw error;
    }
  }

  async decodeWithZXing(imagePath) {
    try {
      const { MultiFormatReader, BarcodeFormat, DecodeHintType, RGBLuminanceSource, BinaryBitmap, HybridBinarizer } = require('@zxing/library');
      const sharp = require('sharp');
      
      // Load image with sharp and convert to raw grayscale
      const image = sharp(imagePath);
      const metadata = await image.metadata();
      const width = metadata.width;
      const height = metadata.height;
      
      console.log(`📊 ZXing: Image ${width}x${height}`);
      
      // Get raw grayscale pixels
      const { data } = await image.grayscale().raw().toBuffer({ resolveWithObject: true });
      
      // Create ZXing source and bitmap
      const luminanceSource = new RGBLuminanceSource(new Uint8ClampedArray(data), width, height);
      const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));
      
      // Configure reader for PDF417 and other formats
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.PDF_417,
        BarcodeFormat.QR_CODE,
        BarcodeFormat.AZTEC,
        BarcodeFormat.DATA_MATRIX
      ]);
      hints.set(DecodeHintType.TRY_HARDER, true);
      
      const reader = new MultiFormatReader();
      reader.setHints(hints);
      
      const result = reader.decode(binaryBitmap);
      const text = result.getText();
      
      console.log(`📊 ZXing: Decoded format ${result.getBarcodeFormat()}`);
      
      // Check if it's BCBP
      if (text && text.startsWith('M1')) {
        return text;
      }
      
      return null;
      
    } catch (error) {
      if (error.message && error.message.includes('NotFoundException')) {
        console.log('❌ ZXing: No barcode found');
      } else {
        console.log('❌ ZXing error:', error.message);
      }
      return null;
    }
  }

  async analyzeWithGoogleVision(imagePath) {
    try {
      console.log('🔍 Analyzing with Google Cloud Vision API...');
      
      const vision = require('@google-cloud/vision');
      
      // Create client with explicit credentials
      const client = new vision.ImageAnnotatorClient({
        credentials: serviceAccountCredentials
      });
      
      // Read image file
      const imageBuffer = await fs.readFile(imagePath);
      
      // Detect text
      const [textResult] = await client.textDetection({
        image: { content: imageBuffer }
      });
      
      console.log(`📊 Google Vision detected ${textResult.textAnnotations?.length || 0} text annotations`);
      
      if (textResult.textAnnotations && textResult.textAnnotations.length > 0) {
        const fullText = textResult.textAnnotations[0].description || '';
        console.log(`📊 Full detected text length: ${fullText.length} chars`);
        
        // Look for BCBP patterns
        const bcbp = this.extractBCBPFromText(fullText);
        if (bcbp) {
          console.log('✅ BCBP found in Google Vision text:', bcbp.substring(0, 50) + '...');
          return bcbp;
        }
      }
      
      return null;
      
    } catch (error) {
      console.error('❌ Google Cloud Vision failed:', error.message);
      return null;
    }
  }

  extractBCBPFromText(text) {
    if (!text) return null;
    
    console.log('🔍 Searching for BCBP in OCR text...');
    console.log(`📊 Text length: ${text.length} characters`);
    console.log(`📊 Text preview: ${text.substring(0, 200)}...`);
    
    // Pattern simplu: caută M1 urmat de text valid
    const patterns = [
      /M1[A-Z]+\/[A-Z]+\s+[A-Z0-9]{5,7}\s+[A-Z]{6}[A-Z0-9\s]{10,50}/gi,  // Format standard cu aeroporturi lipite
      /M1[A-Z]+\/[A-Z]+\s+[A-Z0-9\s]{20,100}/gi,  // Format generic
      /M1[A-Z][A-Z0-9\/\s]{30,150}/gi  // Fallback
    ];
    
    for (let i = 0; i < patterns.length; i++) {
      const pattern = patterns[i];
      console.log(`🔍 Trying pattern ${i + 1}/${patterns.length}...`);
      
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        console.log(`✅ Pattern ${i + 1} found ${matches.length} potential matches`);
        
        for (const match of matches) {
          let bcbp = match
            .replace(/\s+/g, ' ')
            .replace(/\n/g, ' ')
            .replace(/\r/g, ' ')
            .trim();
          
          console.log(`🔍 Validating: "${bcbp.substring(0, 60)}..."`);
          
          // Validare simplificată: M1 + / (pentru nume) + minim 30 caractere
          if (bcbp.startsWith('M1') && bcbp.includes('/') && bcbp.length > 30) {
            console.log('✅ VALIDATED BCBP found!');
            return bcbp;
          }
        }
      }
    }
    
    console.log('❌ No valid BCBP found in OCR text');
    return null;
  }

  // ==================== AIRLINE-SPECIFIC PARSERS ====================

  // Convert all PDF pages to images
  async convertAllPagesToImages(pdfBuffer) {
    const images = [];
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    try {
      const { execSync } = require('child_process');
      
      // Write PDF to temp file
      const tempPdfPath = path.join(this.tempDir, `temp-multi-${uniqueId}.pdf`);
      await fs.writeFile(tempPdfPath, pdfBuffer);
      
      // Get page count
      let pageCount = 1;
      try {
        const pdfInfo = execSync(`pdfinfo "${tempPdfPath}" 2>/dev/null | grep Pages`, { encoding: 'utf8' });
        const match = pdfInfo.match(/Pages:\s*(\d+)/);
        if (match) pageCount = parseInt(match[1], 10);
      } catch (e) {
        console.log('Could not get page count, assuming 1');
      }
      
      console.log(`📄 PDF has ${pageCount} pages`);
      
      // Convert each page
      for (let page = 1; page <= Math.min(pageCount, 5); page++) { // Max 5 pages
        const outputBase = path.join(this.tempDir, `bp-page${page}-${uniqueId}`);
        const outputPath = `${outputBase}.png`;
        
        try {
          execSync(`pdftoppm -png -r 300 -singlefile -f ${page} -l ${page} "${tempPdfPath}" "${outputBase}"`, {
            timeout: 30000,
            maxBuffer: 25 * 1024 * 1024
          });
          
          const stats = await fs.stat(outputPath);
          if (stats.size > 10000) {
            images.push(outputPath);
            console.log(`✅ Page ${page} converted: ${outputPath}`);
          }
        } catch (pageError) {
          console.log(`❌ Failed to convert page ${page}:`, pageError.message);
        }
      }
      
      // Cleanup temp PDF
      try { await fs.unlink(tempPdfPath); } catch (e) {}
      
    } catch (error) {
      console.error('❌ Multi-page conversion failed:', error.message);
    }
    
    return images;
  }

  // Extract text using OCR (Tesseract or Google Vision)
  async extractTextWithOCR(imagePath) {
    // Try Tesseract first (free)
    try {
      const { execSync } = require('child_process');
      const result = execSync(`tesseract "${imagePath}" stdout -l eng --psm 6`, {
        timeout: 30000,
        encoding: 'utf8'
      }).trim();
      
      if (result && result.length > 50) {
        console.log('✅ Tesseract OCR successful');
        return result;
      }
    } catch (tesseractError) {
      console.log('❌ Tesseract failed:', tesseractError.message);
    }
    
    // Fallback to Google Vision
    try {
      const vision = require('@google-cloud/vision');
      const client = new vision.ImageAnnotatorClient({
        credentials: serviceAccountCredentials
      });
      
      const imageBuffer = await fs.readFile(imagePath);
      const [result] = await client.textDetection({ image: { content: imageBuffer } });
      
      if (result.textAnnotations && result.textAnnotations.length > 0) {
        console.log('✅ Google Vision OCR successful');
        return result.textAnnotations[0].description || '';
      }
    } catch (visionError) {
      console.log('❌ Google Vision failed:', visionError.message);
    }
    
    return null;
  }

  // ==================== RYANAIR PARSER ====================
  // NO DEFAULT VALUES - return null for fields that cannot be extracted
  // IMPROVED RYANAIR PARSER - Based on actual boarding pass structure:
  // - Passenger name under "Passenger" label
  // - Seat like "34F" under "Seat" label  
  // - Reference like "B5N3KE" under "Reference" label
  // - Flight "FR 2643" between origin and destination IATA codes
  // - Route: "Riga RIX" on left, "London (Stansted) STN" on right
  // - Date: "30 Dec - 19:00" at bottom
  parseRyanairOCR(text) {
    console.log('🔍 Parsing RYANAIR boarding pass from OCR (IMPROVED)...');
    console.log('📄 OCR Text (full):', text);
    
    try {
      const upperText = text.toUpperCase();
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      
      // NO DEFAULTS - all start as null
      let passengerName = null;
      let flightNumber = null;
      let carrierCode = 'FR'; // This is known since we detected Ryanair
      let origin = null;
      let destination = null;
      let seatNumber = null;
      let confirmationCode = null;
      let departureDate = null;
      let flightDate = null;
      
      // === EXTRACT PASSENGER NAME ===
      // Pattern 1: Line after "Passenger" label
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (/^passenger$/i.test(line)) {
          if (i + 1 < lines.length) {
            const nameLine = lines[i + 1].trim();
            if (nameLine.length > 3 && /^[A-Za-z\s]+$/.test(nameLine)) {
              passengerName = nameLine;
              console.log(`✅ Ryanair passenger (label): "${passengerName}"`);
              break;
            }
          }
        }
      }
      
      // Pattern 2: Two capitalized words together (First Last)
      if (!passengerName) {
        const nameMatch = text.match(/\b([A-Z][a-z]+)\s+([A-Z][a-z]+)\b/);
        if (nameMatch && nameMatch[0].length > 5) {
          const candidate = nameMatch[0];
          // Exclude common false positives
          if (!/^(Non Priority|Small Bag|Back Door|Apple Wallet|Gate Closes|Document Verified)/i.test(candidate)) {
            passengerName = candidate;
            console.log(`✅ Ryanair passenger (pattern): "${passengerName}"`);
          }
        }
      }
      
      // Pattern 3: LASTNAME/FIRSTNAME format
      if (!passengerName) {
        const slashMatch = text.match(/([A-Z]{2,})\/([A-Z]{2,})/);
        if (slashMatch) {
          passengerName = `${slashMatch[2]} ${slashMatch[1]}`;
          console.log(`✅ Ryanair passenger (slash): "${passengerName}"`);
        }
      }
      
      // === EXTRACT FLIGHT NUMBER ===
      // Pattern: "FR 2643" or "FR2643" - anywhere in text
      const flightPatterns = [
        /FR\s*(\d{4})/gi,           // FR 2643 or FR2643 (4 digits)
        /FR\s*(\d{3})/gi,           // FR 123 (3 digits)
      ];
      
      for (const pattern of flightPatterns) {
        const matches = [...text.matchAll(pattern)];
        if (matches.length > 0) {
          flightNumber = matches[0][1];
          console.log(`✅ Ryanair flight: FR${flightNumber}`);
          break;
        }
      }
      
      // === EXTRACT IATA CODES (AIRPORTS) ===
      // Look for 3-letter IATA codes - they appear as standalone or after city names
      // Pattern: "Riga\nRIX" or "London (Stansted)\nSTN"
      const iataPattern = /\b([A-Z]{3})\b/g;
      const foundIATACodes = [];
      let match;
      
      while ((match = iataPattern.exec(upperText)) !== null) {
        const code = match[1];
        // Validate it's a real IATA code
        if (this.isValidIATACode(code)) {
          // Avoid duplicates
          if (!foundIATACodes.includes(code)) {
            foundIATACodes.push(code);
          }
        }
      }
      
      console.log(`🔍 Found IATA codes: ${foundIATACodes.join(', ')}`);
      
      // First two valid IATA codes are origin and destination
      if (foundIATACodes.length >= 2) {
        origin = foundIATACodes[0];
        destination = foundIATACodes[1];
        console.log(`✅ Ryanair route: ${origin} → ${destination}`);
      } else if (foundIATACodes.length === 1) {
        origin = foundIATACodes[0];
        console.log(`✅ Ryanair origin only: ${origin}`);
      }
      
      // === EXTRACT SEAT NUMBER ===
      // Pattern 1: Line after "Seat" label
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim().toLowerCase();
        if (line === 'seat') {
          if (i + 1 < lines.length) {
            const seatLine = lines[i + 1].trim().toUpperCase();
            const seatMatch = seatLine.match(/^(\d{1,2}[A-K])$/);
            if (seatMatch) {
              seatNumber = seatMatch[1];
              console.log(`✅ Ryanair seat (label): ${seatNumber}`);
              break;
            }
          }
        }
      }
      
      // Pattern 2: Standalone seat pattern (e.g., "34F" on its own line)
      if (!seatNumber) {
        for (const line of lines) {
          const trimmed = line.trim().toUpperCase();
          if (/^\d{1,2}[A-K]$/.test(trimmed)) {
            seatNumber = trimmed;
            console.log(`✅ Ryanair seat (standalone): ${seatNumber}`);
            break;
          }
        }
      }
      
      // Pattern 3: Seat anywhere in text
      if (!seatNumber) {
        const seatMatch = text.match(/\b(\d{1,2}[A-K])\b/);
        if (seatMatch) {
          seatNumber = seatMatch[1].toUpperCase();
          console.log(`✅ Ryanair seat (pattern): ${seatNumber}`);
        }
      }
      
      // === EXTRACT BOOKING REFERENCE (PNR) ===
      // Pattern 1: Line after "Reference" label
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim().toLowerCase();
        if (line === 'reference' || line === 'ref' || line === 'booking reference') {
          if (i + 1 < lines.length) {
            const refLine = lines[i + 1].trim().toUpperCase();
            if (/^[A-Z0-9]{6}$/.test(refLine)) {
              confirmationCode = refLine;
              console.log(`✅ Ryanair PNR (label): ${confirmationCode}`);
              break;
            }
          }
        }
      }
      
      // Pattern 2: Standalone 6-char alphanumeric (starts with letter)
      if (!confirmationCode) {
        for (const line of lines) {
          const trimmed = line.trim().toUpperCase();
          if (/^[A-Z][A-Z0-9]{5}$/.test(trimmed)) {
            // Exclude common false positives
            if (!/^(RYANAIR|FLIGHT|VERIFY|DOCUME)$/i.test(trimmed)) {
              confirmationCode = trimmed;
              console.log(`✅ Ryanair PNR (standalone): ${confirmationCode}`);
              break;
            }
          }
        }
      }
      
      // Pattern 3: After keywords
      if (!confirmationCode) {
        const pnrMatch = text.match(/(?:REFERENCE|BOOKING|PNR|CONF)[:\s]*([A-Z][A-Z0-9]{5})/i);
        if (pnrMatch) {
          confirmationCode = pnrMatch[1].toUpperCase();
          console.log(`✅ Ryanair PNR (keyword): ${confirmationCode}`);
        }
      }
      
      // === EXTRACT DATE ===
      // Pattern: "30 Dec - 19:00" or "30 Dec"
      const datePatterns = [
        /(\d{1,2})\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s*[-–]\s*(\d{1,2}:\d{2})/i,
        /(\d{1,2})\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i,
        /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/
      ];
      
      for (const pattern of datePatterns) {
        const dateMatch = text.match(pattern);
        if (dateMatch) {
          departureDate = dateMatch[0];
          
          // Convert to ISO date format for flightDate
          const monthMap = {
            'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
            'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
            'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
          };
          
          if (dateMatch[2]) {
            const day = dateMatch[1].padStart(2, '0');
            const month = monthMap[dateMatch[2].toLowerCase()];
            const year = new Date().getFullYear();
            // If month is in the past, use next year
            const currentMonth = new Date().getMonth() + 1;
            const flightYear = (parseInt(month) < currentMonth - 1) ? year + 1 : year;
            flightDate = `${flightYear}-${month}-${day}`;
          }
          
          console.log(`✅ Ryanair date: ${departureDate} -> ${flightDate}`);
          break;
        }
      }
      
      // === VALIDATION ===
      const missingFields = [];
      if (!origin) missingFields.push('origin');
      if (!destination) missingFields.push('destination');
      if (!flightNumber) missingFields.push('flight number');
      
      if (missingFields.length > 0) {
        console.log(`⚠️ Ryanair parser: Missing fields: ${missingFields.join(', ')}`);
      }
      
      // Log final results
      console.log('📊 Ryanair parsing result:');
      console.log(`   Passenger: ${passengerName || 'NOT FOUND'}`);
      console.log(`   Flight: FR${flightNumber || '????'}`);
      console.log(`   Route: ${origin || '???'} → ${destination || '???'}`);
      console.log(`   Seat: ${seatNumber || 'NOT FOUND'}`);
      console.log(`   PNR: ${confirmationCode || 'NOT FOUND'}`);
      console.log(`   Date: ${flightDate || departureDate || 'NOT FOUND'}`);
      
      // Return result - NO DEFAULT VALUES
      return {
        passengerName,
        flightNumber,
        carrierCode,
        origin,
        destination,
        seatNumber,
        confirmationCode,
        compartment: 'Y',
        departureDate,
        flightDate,
        raw: `RYANAIR-OCR:${passengerName || 'UNKNOWN'}:FR${flightNumber || '0000'}:${origin || 'XXX'}${destination || 'XXX'}`
      };
      
    } catch (error) {
      console.error('❌ Ryanair parser error:', error.message);
      return null;
    }
  }

  // ==================== AER LINGUS PARSER ====================
  // NO DEFAULT VALUES - return null for fields that cannot be extracted
  parseAerLingusOCR(ocrResults) {
    console.log('🔍 Parsing AER LINGUS boarding pass from OCR (multi-passenger)...');
    
    const passengers = [];
    
    // Common flight info (shared across passengers) - NO DEFAULTS
    let sharedFlightNumber = null;
    let sharedOrigin = null;
    let sharedDestination = null;
    let sharedDepartureDate = null;
    let sharedDepartureTime = null;
    let sharedConfirmationCode = null;
    
    // First pass: extract shared flight info from all text
    const allText = ocrResults.map(r => r.text).join('\n');
    const upperAllText = allText.toUpperCase();
    const allLines = allText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    console.log('📄 Aer Lingus OCR Text preview:', allText.substring(0, 800));
    
    // === EXTRACT FLIGHT NUMBER ===
    // Aer Lingus format: "Flight Number\nEI440" or "E1440" (OCR might read EI as E1)
    // Look for line after "Flight Number" label
    for (let i = 0; i < allLines.length; i++) {
      const line = allLines[i].toLowerCase().trim();
      if (line === 'flight number' || line === 'flight no' || line === 'flight') {
        if (i + 1 < allLines.length) {
          const flightLine = allLines[i + 1].trim().toUpperCase();
          // Match EI440, E1440, EI 440, etc.
          const flightMatch = flightLine.match(/^(?:EI|E1)\s*(\d{3,4})$/i);
          if (flightMatch) {
            sharedFlightNumber = flightMatch[1].replace(/^0+/, '') || flightMatch[1];
            console.log(`✅ Aer Lingus flight: EI${sharedFlightNumber}`);
            break;
          }
        }
      }
    }
    
    // Fallback: search for EI/E1 pattern anywhere
    if (!sharedFlightNumber) {
      const flightPatterns = [
        /(?:EI|E1)\s*(\d{3,4})/i,
        /FLIGHT[:\s]*(?:EI|E1)\s*(\d{3,4})/i
      ];
      for (const pattern of flightPatterns) {
        const match = allText.match(pattern);
        if (match) {
          sharedFlightNumber = match[1].replace(/^0+/, '') || match[1];
          console.log(`✅ Aer Lingus flight (fallback): EI${sharedFlightNumber}`);
          break;
        }
      }
    }
    
    // === EXTRACT AIRPORTS ===
    // Aer Lingus format: "From\nDUBLIN\nto\nATHENS" with IATA codes nearby
    // Look for "From" and "to" labels
    let foundFrom = null;
    let foundTo = null;
    
    // City to IATA mapping for Aer Lingus destinations
    const cityToIATA = {
      'DUBLIN': 'DUB', 'ATHENS': 'ATH', 'LONDON': 'LHR', 'HEATHROW': 'LHR',
      'GATWICK': 'LGW', 'PARIS': 'CDG', 'AMSTERDAM': 'AMS', 'FRANKFURT': 'FRA',
      'MUNICH': 'MUC', 'ROME': 'FCO', 'MILAN': 'MXP', 'BARCELONA': 'BCN',
      'MADRID': 'MAD', 'LISBON': 'LIS', 'BRUSSELS': 'BRU', 'ZURICH': 'ZRH',
      'VIENNA': 'VIE', 'BERLIN': 'BER', 'DUSSELDORF': 'DUS', 'DÜSSELDORF': 'DUS',
      'MANCHESTER': 'MAN', 'BIRMINGHAM': 'BHX', 'EDINBURGH': 'EDI', 'GLASGOW': 'GLA',
      'CORK': 'ORK', 'SHANNON': 'SNN', 'BELFAST': 'BFS', 'KNOCK': 'NOC',
      'NEW YORK': 'JFK', 'BOSTON': 'BOS', 'CHICAGO': 'ORD', 'LOS ANGELES': 'LAX',
      'SAN FRANCISCO': 'SFO', 'WASHINGTON': 'IAD', 'SEATTLE': 'SEA', 'MIAMI': 'MIA',
      'TORONTO': 'YYZ', 'MONTREAL': 'YUL', 'MALAGA': 'AGP', 'ALICANTE': 'ALC',
      'FARO': 'FAO', 'NICE': 'NCE', 'LYON': 'LYS', 'BORDEAUX': 'BOD',
      'TOULOUSE': 'TLS', 'MARSEILLE': 'MRS', 'GENEVA': 'GVA', 'COPENHAGEN': 'CPH',
      'STOCKHOLM': 'ARN', 'OSLO': 'OSL', 'HELSINKI': 'HEL', 'PRAGUE': 'PRG',
      'BUDAPEST': 'BUD', 'WARSAW': 'WAW', 'KRAKOW': 'KRK', 'KRAKÓW': 'KRK',
      'BUCHAREST': 'OTP', 'BUCURESTI': 'OTP', 'BUCUREȘTI': 'OTP', 'IASI': 'IAS', 'IAȘI': 'IAS'
    };
    
    for (let i = 0; i < allLines.length; i++) {
      const line = allLines[i].toLowerCase().trim();
      
      // Look for "From" label
      if (line === 'from' && !foundFrom) {
        // Next line(s) should have city name and/or IATA code
        for (let j = i + 1; j < Math.min(i + 4, allLines.length); j++) {
          const nextLine = allLines[j].toUpperCase().trim();
          
          // Check if it's an IATA code
          if (nextLine.length === 3 && this.isValidIATACode(nextLine)) {
            foundFrom = nextLine;
            console.log(`✅ Aer Lingus origin (IATA): ${foundFrom}`);
            break;
          }
          
          // Check if it's a city name
          if (cityToIATA[nextLine]) {
            foundFrom = cityToIATA[nextLine];
            console.log(`✅ Aer Lingus origin (city): ${nextLine} -> ${foundFrom}`);
            break;
          }
        }
      }
      
      // Look for "to" label
      if (line === 'to' && !foundTo) {
        for (let j = i + 1; j < Math.min(i + 4, allLines.length); j++) {
          const nextLine = allLines[j].toUpperCase().trim();
          
          if (nextLine.length === 3 && this.isValidIATACode(nextLine)) {
            foundTo = nextLine;
            console.log(`✅ Aer Lingus destination (IATA): ${foundTo}`);
            break;
          }
          
          if (cityToIATA[nextLine]) {
            foundTo = cityToIATA[nextLine];
            console.log(`✅ Aer Lingus destination (city): ${nextLine} -> ${foundTo}`);
            break;
          }
        }
      }
    }
    
    sharedOrigin = foundFrom;
    sharedDestination = foundTo;
    
    // Fallback: look for standalone IATA codes
    if (!sharedOrigin || !sharedDestination) {
      const iataCodesFound = [];
      for (const line of allLines) {
        const upperLine = line.toUpperCase().trim();
        if (upperLine.length === 3 && this.isValidIATACode(upperLine)) {
          if (!iataCodesFound.includes(upperLine)) {
            iataCodesFound.push(upperLine);
          }
        }
      }
      console.log(`🔍 Found IATA codes: ${iataCodesFound.join(', ')}`);
      
      // DUB is almost always origin for Aer Lingus
      if (iataCodesFound.includes('DUB')) {
        if (!sharedOrigin) sharedOrigin = 'DUB';
        if (!sharedDestination) {
          sharedDestination = iataCodesFound.find(c => c !== 'DUB') || null;
        }
      } else if (iataCodesFound.length >= 2) {
        if (!sharedOrigin) sharedOrigin = iataCodesFound[0];
        if (!sharedDestination) sharedDestination = iataCodesFound[1];
      }
    }
    
    // === EXTRACT BOOKING REFERENCE ===
    // Look for "Booking Reference:" pattern
    for (let i = 0; i < allLines.length; i++) {
      const line = allLines[i];
      const bookingMatch = line.match(/(?:BOOKING\s*REFERENCE|CONFIRMATION|PNR)[:\s]+([A-Z0-9]{6})/i);
      if (bookingMatch) {
        sharedConfirmationCode = bookingMatch[1].toUpperCase();
        console.log(`✅ Aer Lingus PNR: ${sharedConfirmationCode}`);
        break;
      }
    }
    
    // Fallback: look for 6-char alphanumeric after "Reference"
    if (!sharedConfirmationCode) {
      for (let i = 0; i < allLines.length; i++) {
        const line = allLines[i].toLowerCase().trim();
        if (line.includes('reference') || line.includes('booking')) {
          // Check same line for PNR
          const sameLineMatch = allLines[i].match(/([A-Z0-9]{6})/i);
          if (sameLineMatch && /^[A-Z0-9]{6}$/.test(sameLineMatch[1])) {
            sharedConfirmationCode = sameLineMatch[1].toUpperCase();
            console.log(`✅ Aer Lingus PNR (same line): ${sharedConfirmationCode}`);
            break;
          }
          // Check next line
          if (i + 1 < allLines.length) {
            const nextLine = allLines[i + 1].trim().toUpperCase();
            if (/^[A-Z0-9]{6}$/.test(nextLine)) {
              sharedConfirmationCode = nextLine;
              console.log(`✅ Aer Lingus PNR (next line): ${sharedConfirmationCode}`);
              break;
            }
          }
        }
      }
    }
    
    // === EXTRACT DATE AND TIME ===
    const dateMatch = allText.match(/(\d{1,2})\s*(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)/i);
    if (dateMatch) {
      sharedDepartureDate = `${dateMatch[1]} ${dateMatch[2]}`;
      console.log(`✅ Aer Lingus date: ${sharedDepartureDate}`);
    }
    
    const timeMatch = allText.match(/(?:DEPART(?:ING|URE)?|TIME)[:\s]+(\d{1,2}:\d{2})/i);
    if (timeMatch) {
      sharedDepartureTime = timeMatch[1];
      console.log(`✅ Aer Lingus time: ${sharedDepartureTime}`);
    }
    
    // === EXTRACT PASSENGERS (per page) ===
    for (const result of ocrResults) {
      const pageText = result.text;
      const pageLines = pageText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      
      let passengerName = null;
      let seatNumber = null;
      
      // === EXTRACT PASSENGER NAME ===
      // Aer Lingus format: "Passenger\nCATANA/CONSTANTIN" or "CATANA/CONSTANTIN"
      
      // First, look for LASTNAME/FIRSTNAME format
      const slashMatch = pageText.match(/([A-Z]{2,})\/([A-Z]{2,})/);
      if (slashMatch) {
        // Convert CATANA/CONSTANTIN to CONSTANTIN CATANA
        passengerName = `${slashMatch[2]} ${slashMatch[1]}`;
        console.log(`✅ Aer Lingus passenger (page ${result.page}): "${passengerName}"`);
      }
      
      // Fallback: look for line after "Passenger" label
      if (!passengerName) {
        for (let i = 0; i < pageLines.length; i++) {
          const line = pageLines[i].toLowerCase().trim();
          if (line === 'passenger' || line === 'name') {
            if (i + 1 < pageLines.length) {
              const nameLine = pageLines[i + 1].trim();
              // Check for LASTNAME/FIRSTNAME format
              const nameSlashMatch = nameLine.match(/([A-Z]{2,})\/([A-Z]{2,})/i);
              if (nameSlashMatch) {
                passengerName = `${nameSlashMatch[2]} ${nameSlashMatch[1]}`;
                console.log(`✅ Aer Lingus passenger (label, page ${result.page}): "${passengerName}"`);
                break;
              }
              // Check for regular name
              if (nameLine.length > 3 && /^[A-Za-z\s]+$/.test(nameLine)) {
                // Skip common labels
                if (!/^(from|to|dublin|athens|flight|seat|gate|date|time|boarding)/i.test(nameLine)) {
                  passengerName = nameLine;
                  console.log(`✅ Aer Lingus passenger (regular, page ${result.page}): "${passengerName}"`);
                  break;
                }
              }
            }
          }
        }
      }
      
      // === EXTRACT SEAT ===
      // Look for line after "Seat" label
      for (let i = 0; i < pageLines.length; i++) {
        const line = pageLines[i].toLowerCase().trim();
        if (line === 'seat') {
          if (i + 1 < pageLines.length) {
            const seatLine = pageLines[i + 1].trim().toUpperCase();
            const seatMatch = seatLine.match(/^(\d{1,2}[A-K])$/);
            if (seatMatch) {
              seatNumber = seatMatch[1];
              console.log(`✅ Aer Lingus seat (page ${result.page}): ${seatNumber}`);
              break;
            }
          }
        }
      }
      
      // Fallback: look for seat pattern
      if (!seatNumber) {
        const seatMatch = pageText.match(/SEAT[:\s]+(\d{1,2}[A-K])/i);
        if (seatMatch) {
          seatNumber = seatMatch[1].toUpperCase();
          console.log(`✅ Aer Lingus seat (fallback, page ${result.page}): ${seatNumber}`);
        }
      }
      
      // Only add passenger if we found a name
      if (passengerName && passengerName.length > 2) {
        passengers.push({
          passengerName,
          flightNumber: sharedFlightNumber,
          carrierCode: 'EI',
          origin: sharedOrigin,
          destination: sharedDestination,
          seatNumber,
          confirmationCode: sharedConfirmationCode,
          compartment: sharedFlightNumber ? 'Y' : null,
          departureDate: sharedDepartureDate,
          departureTime: sharedDepartureTime,
          page: result.page,
          raw: `AERLINGUS-OCR:${passengerName}:EI${sharedFlightNumber || '0000'}:${sharedOrigin || 'XXX'}${sharedDestination || 'XXX'}`
        });
      }
    }
    
    // If no passengers found from pages, try combined extraction
    if (passengers.length === 0) {
      console.log('🔄 No passengers found per page, trying combined extraction...');
      
      // Look for all LASTNAME/FIRSTNAME patterns
      const nameMatches = allText.match(/([A-Z]{2,})\/([A-Z]{2,})/g);
      if (nameMatches) {
        for (const nameMatch of nameMatches) {
          const parts = nameMatch.match(/([A-Z]{2,})\/([A-Z]{2,})/);
          if (parts) {
            const name = `${parts[2]} ${parts[1]}`;
            // Avoid duplicates
            if (!passengers.find(p => p.passengerName === name)) {
              passengers.push({
                passengerName: name,
                flightNumber: sharedFlightNumber,
                carrierCode: 'EI',
                origin: sharedOrigin,
                destination: sharedDestination,
                seatNumber: null,
                confirmationCode: sharedConfirmationCode,
                compartment: sharedFlightNumber ? 'Y' : null,
                departureDate: sharedDepartureDate,
                departureTime: sharedDepartureTime,
                raw: `AERLINGUS-OCR:${name}:EI${sharedFlightNumber || '0000'}:${sharedOrigin || 'XXX'}${sharedDestination || 'XXX'}`
              });
              console.log(`✅ Aer Lingus passenger (combined): "${name}"`);
            }
          }
        }
      }
    }
    
    // Log final results
    console.log('📊 Aer Lingus parsing result:');
    console.log(`   Flight: EI${sharedFlightNumber || '????'}`);
    console.log(`   Route: ${sharedOrigin || '???'} → ${sharedDestination || '???'}`);
    console.log(`   PNR: ${sharedConfirmationCode || 'NOT FOUND'}`);
    console.log(`   Passengers: ${passengers.length}`);
    for (const p of passengers) {
      console.log(`     - ${p.passengerName} (seat: ${p.seatNumber || 'N/A'})`);
    }
    
    if (passengers.length > 0) {
      console.log(`✅ Aer Lingus parsing successful: ${passengers.length} passenger(s)`);
      return passengers;
    } else {
      console.log('❌ Aer Lingus parser: Could not extract passenger info');
      return null;
    }
  }

  // ==================== GENERIC OCR PARSER ====================
  // NO DEFAULT VALUES - return null for fields that cannot be extracted
  parseGenericOCR(text) {
    console.log('🔍 Parsing generic boarding pass from OCR...');
    console.log('📄 OCR Text preview:', text.substring(0, 500));
    
    try {
      const upperText = text.toUpperCase();
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      
      // NO DEFAULTS - all start as null
      let passengerName = null;
      let flightNumber = null;
      let carrierCode = null;
      let origin = null;
      let destination = null;
      let seatNumber = null;
      let confirmationCode = null;
      
      // Known airline codes
      const airlineCodes = ['5F', 'RO', 'W4', 'W6', 'WZ', 'LH', 'FR', 'BA', 'KL', 'AF', 'LX', 'OS', 'AZ', 'IB', 'VY', 'U2', 'EW', 'EI', 'SK', 'AY', 'SN', 'TP', 'TK', 'EK', 'QR', 'AA', 'DL', 'UA', 'WN', 'B6', 'AS', 'NK', 'AC', 'AM', 'AV', 'LA', 'QF', 'NZ', 'SQ', 'CX', 'TG', 'MH', 'GA', 'PR', 'VN', 'CI', 'BR', 'CA', 'MU', 'CZ', 'AI', 'ET', 'MS', 'TU', 'PC', 'UC', 'IE'];
      
      // === EXTRACT AIRLINE AND FLIGHT NUMBER ===
      for (const code of airlineCodes) {
        const pattern = new RegExp(`${code}\\s*(\\d{3,4})`, 'i');
        const match = text.match(pattern);
        if (match) {
          carrierCode = code;
          flightNumber = match[1];
          console.log(`✅ Generic flight: ${carrierCode}${flightNumber}`);
          break;
        }
      }
      
      // === EXTRACT AIRPORTS ===
      // Look for IATA codes in context
      const iataCodesFound = [];
      for (const line of lines) {
        const upperLine = line.toUpperCase().trim();
        if (upperLine.length === 3 && this.isValidIATACode(upperLine)) {
          if (!iataCodesFound.includes(upperLine)) {
            iataCodesFound.push(upperLine);
          }
        }
      }
      
      // Also search for IATA codes in text
      const airportMatches = upperText.match(/\b([A-Z]{3})\b/g);
      if (airportMatches) {
        for (const code of airportMatches) {
          if (this.isValidIATACode(code) && !iataCodesFound.includes(code)) {
            iataCodesFound.push(code);
          }
        }
      }
      
      console.log(`🔍 Found IATA codes: ${iataCodesFound.join(', ')}`);
      
      if (iataCodesFound.length >= 2) {
        origin = iataCodesFound[0];
        destination = iataCodesFound[1];
        console.log(`✅ Generic route: ${origin} → ${destination}`);
      } else if (iataCodesFound.length === 1) {
        origin = iataCodesFound[0];
      }
      
      // === EXTRACT PASSENGER NAME ===
      // Look for LASTNAME/FIRSTNAME format first
      const slashMatch = text.match(/([A-Z]{2,})\/([A-Z]{2,})/);
      if (slashMatch) {
        passengerName = `${slashMatch[2]} ${slashMatch[1]}`; // FIRSTNAME LASTNAME
        console.log(`✅ Generic passenger (slash): "${passengerName}"`);
      }
      
      // Fallback: look for line after "Passenger" label
      if (!passengerName) {
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].toLowerCase().trim();
          if (line === 'passenger' || line === 'name') {
            if (i + 1 < lines.length) {
              const nameLine = lines[i + 1].trim();
              if (nameLine.length > 3 && /^[A-Za-z\s\/]+$/.test(nameLine)) {
                // Check for slash format
                const nameSlashMatch = nameLine.match(/([A-Z]{2,})\/([A-Z]{2,})/i);
                if (nameSlashMatch) {
                  passengerName = `${nameSlashMatch[2]} ${nameSlashMatch[1]}`;
                } else {
                  passengerName = nameLine;
                }
                console.log(`✅ Generic passenger (label): "${passengerName}"`);
                break;
              }
            }
          }
        }
      }
      
      // === EXTRACT SEAT ===
      // Look for line after "Seat" label
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toLowerCase().trim();
        if (line === 'seat') {
          if (i + 1 < lines.length) {
            const seatLine = lines[i + 1].trim().toUpperCase();
            const seatMatch = seatLine.match(/^(\d{1,2}[A-K])$/);
            if (seatMatch) {
              seatNumber = seatMatch[1];
              console.log(`✅ Generic seat: ${seatNumber}`);
              break;
            }
          }
        }
      }
      
      // Fallback: look for seat pattern
      if (!seatNumber) {
        const seatMatch = text.match(/SEAT[:\s]+(\d{1,2}[A-K])/i);
        if (seatMatch) {
          seatNumber = seatMatch[1].toUpperCase();
          console.log(`✅ Generic seat (fallback): ${seatNumber}`);
        }
      }
      
      // === EXTRACT PNR ===
      const pnrPatterns = [
        /(?:BOOKING|CONFIRMATION|PNR|REFERENCE)[:\s]+([A-Z0-9]{6})/i,
        /\b([A-Z][A-Z0-9]{5})\b/  // 6 chars starting with letter
      ];
      
      for (const pattern of pnrPatterns) {
        const match = text.match(pattern);
        if (match && match[1].length === 6) {
          // Exclude common false positives
          if (!/^(FLIGHT|BOARDING|PASS|SEAT|GATE|DATE)$/i.test(match[1])) {
            confirmationCode = match[1].toUpperCase();
            console.log(`✅ Generic PNR: ${confirmationCode}`);
            break;
          }
        }
      }
      
      // === VALIDATION ===
      const missingFields = [];
      if (!origin) missingFields.push('origin');
      if (!destination) missingFields.push('destination');
      if (!carrierCode) missingFields.push('carrier');
      if (!flightNumber) missingFields.push('flight number');
      
      if (missingFields.length > 0) {
        console.log(`⚠️ Generic parser: Missing fields: ${missingFields.join(', ')}`);
      }
      
      // Log final results
      console.log('📊 Generic parsing result:');
      console.log(`   Passenger: ${passengerName || 'NOT FOUND'}`);
      console.log(`   Flight: ${carrierCode || '??'}${flightNumber || '????'}`);
      console.log(`   Route: ${origin || '???'} → ${destination || '???'}`);
      console.log(`   Seat: ${seatNumber || 'NOT FOUND'}`);
      console.log(`   PNR: ${confirmationCode || 'NOT FOUND'}`);
      
      // Return result - NO DEFAULT VALUES
      return {
        passengerName,
        flightNumber,
        carrierCode,
        origin,
        destination,
        seatNumber,
        confirmationCode,
        compartment: flightNumber ? 'Y' : null,
        raw: `GENERIC-OCR:${passengerName || 'UNKNOWN'}:${carrierCode || 'XX'}${flightNumber || '0000'}:${origin || 'XXX'}${destination || 'XXX'}`
      };
      
    } catch (error) {
      console.error('❌ Generic parser error:', error.message);
      return null;
    }
  }
}


module.exports = { ModernPDFProcessor };
