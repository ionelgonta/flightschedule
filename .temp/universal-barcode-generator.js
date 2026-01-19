"use strict";
/**
 * Universal Barcode Generator Module
 *
 * Generează coduri de bare universale folosind bwip-js.
 * Detectează automat tipul de barcode bazat pe datele de intrare:
 * - PDF417: pentru BCBP (>100 caractere, date structurate)
 * - QR Code: pentru URL-uri sau ID-uri scurte
 * - Aztec: pentru coduri numerice și bilete pătrate
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectBarcodeType = detectBarcodeType;
exports.generateUniversalBarcode = generateUniversalBarcode;
exports.generateBoardingPassBarcode = generateBoardingPassBarcode;
exports.validateBarcodeData = validateBarcodeData;
const bwip_js_1 = __importDefault(require("bwip-js"));
/**
 * Detectează automat tipul de barcode bazat pe datele de intrare
 *
 * Logica:
 * - BCBP (>100 caractere, începe cu M1) -> PDF417
 * - URL sau ID scurt -> QR Code
 * - Numeric pur -> Aztec Code
 */
function detectBarcodeType(rawData) {
    if (!rawData || rawData.length === 0) {
        return 'qrcode'; // Default pentru date goale
    }
    const trimmedData = rawData.trim();
    // Detectare BCBP (Boarding Pass Barcode Protocol)
    // BCBP începe cu M1 și are peste 100 de caractere
    if (trimmedData.length > 100 && trimmedData.startsWith('M1')) {
        return 'pdf417';
    }
    // Detectare date structurate BCBP (chiar fără M1)
    // Pattern: conține cod aeroport (3 litere majuscule consecutive) și are >100 caractere
    const hasAirportCodes = /[A-Z]{3}[A-Z]{3}/.test(trimmedData);
    if (trimmedData.length > 100 && hasAirportCodes) {
        return 'pdf417';
    }
    // Detectare URL
    if (trimmedData.startsWith('http://') || trimmedData.startsWith('https://')) {
        return 'qrcode';
    }
    // Detectare cod numeric pur (pentru Aztec)
    // Aztec este folosit de unele companii pentru coduri numerice
    const isNumericOnly = /^\d+$/.test(trimmedData);
    if (isNumericOnly && trimmedData.length >= 8 && trimmedData.length <= 20) {
        return 'azteccode';
    }
    // Detectare ID scurt sau cod alfanumeric scurt
    if (trimmedData.length < 50) {
        return 'qrcode';
    }
    // Default pentru date lungi non-BCBP
    if (trimmedData.length > 100) {
        return 'pdf417';
    }
    // Default general
    return 'qrcode';
}
/**
 * Generează un barcode universal din date brute
 *
 * @param rawData - String-ul brut extras din biletul original
 * @param type - Tipul de barcode (opțional, se detectează automat)
 * @param options - Opțiuni suplimentare pentru generare
 * @returns Buffer Base64 pentru tag-ul <img>
 */
async function generateUniversalBarcode(rawData, type, options) {
    try {
        if (!rawData || rawData.trim().length === 0) {
            return {
                success: false,
                error: 'Date de intrare goale sau invalide'
            };
        }
        // Detectează tipul dacă nu este specificat
        const barcodeType = type || detectBarcodeType(rawData);
        // Configurare parametri standard pentru aeroport
        const defaultOptions = {
            scale: 3,
            includetext: false,
            textxalign: 'center'
        };
        const mergedOptions = { ...defaultOptions, ...options };
        // Configurare specifică pentru fiecare tip
        const bwipOptions = {
            bcid: barcodeType,
            text: rawData.trim(),
            scale: mergedOptions.scale || 3,
            includetext: mergedOptions.includetext || false,
        };
        // Configurare înălțime specifică pentru PDF417
        if (barcodeType === 'pdf417') {
            bwipOptions.height = mergedOptions.height || 12;
            // PDF417 specific options pentru lizibilitate optimă
            bwipOptions.columns = 10;
            bwipOptions.rows = 30;
        }
        // Configurare pentru QR Code
        if (barcodeType === 'qrcode') {
            bwipOptions.eclevel = 'M'; // Error correction level Medium
        }
        // Configurare pentru Aztec
        if (barcodeType === 'azteccode') {
            bwipOptions.eclevel = 23; // Error correction percentage
        }
        console.log(`[BARCODE-GEN] Generating ${barcodeType} barcode, data length: ${rawData.length}`);
        // Generează barcode-ul
        const png = await bwip_js_1.default.toBuffer(bwipOptions);
        const base64Image = `data:image/png;base64,${png.toString('base64')}`;
        console.log(`[BARCODE-GEN] Successfully generated ${barcodeType}, image size: ${png.length} bytes`);
        return {
            success: true,
            base64Image,
            type: barcodeType
        };
    }
    catch (error) {
        console.error('[BARCODE-GEN] Error generating barcode:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Eroare necunoscută la generarea barcode-ului'
        };
    }
}
/**
 * Generează barcode pentru un boarding pass specific
 * Folosește datele BCBP raw dacă sunt disponibile
 */
async function generateBoardingPassBarcode(bcbpData, forceType) {
    // Pentru boarding pass, preferăm PDF417 dacă avem date BCBP complete
    const type = forceType || (bcbpData.length > 100 ? 'pdf417' : 'qrcode');
    return generateUniversalBarcode(bcbpData, type, {
        scale: 3,
        height: type === 'pdf417' ? 12 : undefined,
        includetext: false
    });
}
/**
 * Validează dacă un string poate fi encodat ca barcode
 */
function validateBarcodeData(rawData) {
    if (!rawData || rawData.trim().length === 0) {
        return { valid: false, reason: 'Date goale' };
    }
    // Verifică caractere invalide pentru PDF417
    // PDF417 suportă ASCII extins, dar unele caractere pot cauza probleme
    const hasInvalidChars = /[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(rawData);
    if (hasInvalidChars) {
        return { valid: false, reason: 'Caractere de control invalide detectate' };
    }
    // Verifică lungimea maximă
    if (rawData.length > 2000) {
        return { valid: false, reason: 'Date prea lungi (max 2000 caractere)' };
    }
    return { valid: true };
}
exports.default = {
    generateUniversalBarcode,
    generateBoardingPassBarcode,
    detectBarcodeType,
    validateBarcodeData
};
