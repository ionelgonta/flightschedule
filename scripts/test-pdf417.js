const { MultiFormatReader, BarcodeFormat, DecodeHintType, RGBLuminanceSource, BinaryBitmap, HybridBinarizer } = require('@zxing/library');
const sharp = require('sharp');

async function decodePDF417(imagePath) {
  console.log('Testing PDF417 decoding with ZXing...');
  console.log('Image:', imagePath);
  
  try {
    // Load image with sharp and convert to raw grayscale
    const image = sharp(imagePath);
    const metadata = await image.metadata();
    const width = metadata.width;
    const height = metadata.height;
    
    console.log('Image dimensions:', width, 'x', height);
    
    // Get raw grayscale pixels
    const { data } = await image.grayscale().raw().toBuffer({ resolveWithObject: true });
    
    console.log('Grayscale buffer size:', data.length);
    
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
    
    console.log('Attempting to decode...');
    
    const result = reader.decode(binaryBitmap);
    
    console.log('\n=== SUCCESS ===');
    console.log('Format:', result.getBarcodeFormat());
    console.log('Text:', result.getText());
    
    // Check if it's BCBP
    const text = result.getText();
    if (text.startsWith('M1')) {
      console.log('\n=== BCBP DETECTED ===');
      console.log('BCBP:', text.substring(0, 100) + '...');
    }
    
    return result.getText();
    
  } catch (err) {
    console.log('ERROR:', err.message);
    if (err.message && err.message.includes('NotFoundException')) {
      console.log('No barcode found in image.');
    }
    return null;
  }
}

const imagePath = process.argv[2] || '/tmp/test-easyjet.png';
decodePDF417(imagePath);
