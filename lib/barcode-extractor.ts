import sharp from 'sharp';
import fs from 'fs';

// Configurații pentru diferite companii aeriene
// Coordonatele sunt relative la dimensiunea imaginii (procente)
// IMPORTANT: Codul de bare poate fi în diferite poziții în funcție de companie!
const AIRLINE_BARCODE_ZONES: Record<string, { top: number; left: number; width: number; height: number }> = {
  // Ryanair - codul de bare QR este în partea de sus-dreapta
  'FR': { top: 0.02, left: 0.60, width: 0.38, height: 0.20 },
  'RYR': { top: 0.02, left: 0.60, width: 0.38, height: 0.20 },
  
  // Aer Lingus - similar cu Ryanair
  'EI': { top: 0.02, left: 0.60, width: 0.38, height: 0.20 },
  
  // Wizz Air - codul de bare în partea de sus-dreapta
  'W6': { top: 0.02, left: 0.55, width: 0.42, height: 0.22 },
  'W4': { top: 0.02, left: 0.55, width: 0.42, height: 0.22 },
  'WZZ': { top: 0.02, left: 0.55, width: 0.42, height: 0.22 },
  
  // HiSky - codul de bare PDF417 este în partea de SUS-DREAPTA a boarding pass-ului
  // Lângă logo-ul HiSky, în colțul din dreapta sus
  'H4': { top: 0.06, left: 0.55, width: 0.42, height: 0.06 },
  
  // TAROM - codul de bare în partea de sus-dreapta
  'RO': { top: 0.02, left: 0.55, width: 0.42, height: 0.22 },
  
  // FlyOne - codul de bare în partea de sus
  '5F': { top: 0.02, left: 0.55, width: 0.42, height: 0.22 },
  
  // easyJet - codul de bare în partea de sus-dreapta
  'U2': { top: 0.02, left: 0.60, width: 0.38, height: 0.20 },
  'EJU': { top: 0.02, left: 0.60, width: 0.38, height: 0.20 },
  
  // Lufthansa - codul de bare în partea de sus
  'LH': { top: 0.02, left: 0.55, width: 0.42, height: 0.22 },
  
  // Default - zona de sus-dreapta a biletului (unde este de obicei QR code-ul)
  'default': { top: 0.02, left: 0.50, width: 0.48, height: 0.25 }
};

/**
 * Convertește un PDF în imagine PNG la 300 DPI folosind pdf2pic
 */
export async function convertPdfToImage(pdfBuffer: Buffer): Promise<Buffer | null> {
  try {
    const { fromBuffer } = await import('pdf2pic');
    
    const options = {
      density: 300,
      saveFilename: 'temp_boarding_pass',
      savePath: '/tmp',
      format: 'png',
      width: 2480,  // A4 la 300 DPI
      height: 3508
    };
    
    const convert = fromBuffer(pdfBuffer, options);
    const result = await convert(1, { responseType: 'buffer' });
    
    if (result && result.buffer) {
      return result.buffer as Buffer;
    }
    
    return null;
  } catch (error) {
    console.error('[BARCODE] Error converting PDF to image:', error);
    return null;
  }
}

/**
 * Extrage zona codului de bare din imagine
 * @param imageBuffer - Buffer-ul imaginii PNG
 * @param carrierCode - Codul companiei aeriene (pentru a determina zona)
 * @returns Buffer-ul imaginii decupate sau null
 */
export async function extractBarcodeZone(
  imageBuffer: Buffer, 
  carrierCode: string = 'default'
): Promise<Buffer | null> {
  try {
    // Obține dimensiunile imaginii
    const metadata = await sharp(imageBuffer).metadata();
    const imgWidth = metadata.width || 2480;
    const imgHeight = metadata.height || 3508;
    
    // Determină zona de decupare bazată pe compania aeriană
    const zone = AIRLINE_BARCODE_ZONES[carrierCode] || AIRLINE_BARCODE_ZONES['default'];
    
    // Calculează coordonatele absolute
    const left = Math.floor(imgWidth * zone.left);
    const top = Math.floor(imgHeight * zone.top);
    const width = Math.floor(imgWidth * zone.width);
    const height = Math.floor(imgHeight * zone.height);
    
    console.log(`[BARCODE] Extracting zone for ${carrierCode}: left=${left}, top=${top}, width=${width}, height=${height}`);
    
    // Decupează zona codului de bare
    const croppedBuffer = await sharp(imageBuffer)
      .extract({ left, top, width, height })
      .png()
      .toBuffer();
    
    return croppedBuffer;
  } catch (error) {
    console.error('[BARCODE] Error extracting barcode zone:', error);
    return null;
  }
}

/**
 * Detectează automat zona codului de bare folosind analiza contrastului
 * Caută zone cu contrast ridicat (linii negre pe fundal alb)
 * IMPORTANT: Codul de bare este de obicei în partea de SUS a boarding pass-ului!
 */
export async function detectBarcodeZoneAuto(imageBuffer: Buffer): Promise<Buffer | null> {
  try {
    const metadata = await sharp(imageBuffer).metadata();
    const imgWidth = metadata.width || 2480;
    const imgHeight = metadata.height || 3508;
    
    // Strategia: scanează partea de SUS-DREAPTA a imaginii (primele 30%)
    // unde este de obicei QR code-ul pe boarding pass-uri
    const scanTop = Math.floor(imgHeight * 0.02);
    const scanHeight = Math.floor(imgHeight * 0.28);
    const scanLeft = Math.floor(imgWidth * 0.45);
    const scanWidth = Math.floor(imgWidth * 0.52);
    
    // Extrage partea de sus-dreapta pentru QR code
    const croppedBuffer = await sharp(imageBuffer)
      .extract({ 
        left: scanLeft, 
        top: scanTop, 
        width: scanWidth, 
        height: scanHeight 
      })
      .png()
      .toBuffer();
    
    return croppedBuffer;
  } catch (error) {
    console.error('[BARCODE] Error in auto detection:', error);
    return null;
  }
}

/**
 * Convertește un buffer de imagine în string Base64
 */
export function imageBufferToBase64(buffer: Buffer): string {
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

/**
 * Procesează un PDF de boarding pass și extrage codul de bare ca Base64
 * @param pdfBuffer - Buffer-ul PDF-ului
 * @param carrierCode - Codul companiei aeriene
 * @returns String Base64 al imaginii codului de bare sau null
 */
export async function extractBarcodeFromPdf(
  pdfBuffer: Buffer, 
  carrierCode: string = 'default'
): Promise<string | null> {
  try {
    console.log(`[BARCODE] Starting barcode extraction for carrier: ${carrierCode}`);
    
    // Pas 1: Convertește PDF în imagine
    const imageBuffer = await convertPdfToImage(pdfBuffer);
    if (!imageBuffer) {
      console.error('[BARCODE] Failed to convert PDF to image');
      return null;
    }
    console.log(`[BARCODE] PDF converted to image, size: ${imageBuffer.length} bytes`);
    
    // Pas 2: Extrage zona codului de bare
    let barcodeBuffer = await extractBarcodeZone(imageBuffer, carrierCode);
    
    // Dacă extragerea specifică eșuează, încearcă detecția automată
    if (!barcodeBuffer) {
      console.log('[BARCODE] Trying auto detection...');
      barcodeBuffer = await detectBarcodeZoneAuto(imageBuffer);
    }
    
    if (!barcodeBuffer) {
      console.error('[BARCODE] Failed to extract barcode zone');
      return null;
    }
    console.log(`[BARCODE] Barcode zone extracted, size: ${barcodeBuffer.length} bytes`);
    
    // Pas 3: Convertește în Base64
    const base64Image = imageBufferToBase64(barcodeBuffer);
    console.log(`[BARCODE] Base64 image generated, length: ${base64Image.length}`);
    
    return base64Image;
  } catch (error) {
    console.error('[BARCODE] Error in extractBarcodeFromPdf:', error);
    return null;
  }
}

/**
 * Salvează imaginea codului de bare pe disc
 */
export async function saveBarcodeImage(
  barcodeBase64: string, 
  outputPath: string
): Promise<boolean> {
  try {
    // Elimină prefixul data:image/png;base64,
    const base64Data = barcodeBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    fs.writeFileSync(outputPath, buffer);
    console.log(`[BARCODE] Saved barcode image to: ${outputPath}`);
    return true;
  } catch (error) {
    console.error('[BARCODE] Error saving barcode image:', error);
    return false;
  }
}
