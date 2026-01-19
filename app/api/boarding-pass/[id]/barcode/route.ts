import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { generateUniversalBarcode, detectBarcodeType, validateBarcodeData, BarcodeType } from '@/lib/universal-barcode-generator';

const DATA_DIR = path.join(process.cwd(), 'data', 'boarding-passes');

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing boarding pass ID' },
        { status: 400 }
      );
    }

    const filePath = path.join(DATA_DIR, `${id}.json`);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { success: false, error: 'Boarding pass not found' },
        { status: 404 }
      );
    }

    const boardingPass = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    // Verifică dacă avem date raw pentru barcode
    const rawData = boardingPass.raw || boardingPass.bcbpData || boardingPass.barcodeData;

    if (!rawData) {
      return NextResponse.json(
        { success: false, error: 'No barcode data available for this boarding pass' },
        { status: 404 }
      );
    }

    // Validează datele
    const validation = validateBarcodeData(rawData);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.reason },
        { status: 400 }
      );
    }

    // Detectează tipul de barcode sau folosește cel specificat în query
    const url = new URL(request.url);
    const forceType = url.searchParams.get('type') as BarcodeType | null;
    const detectedType = detectBarcodeType(rawData);
    const barcodeType = forceType || detectedType;

    // Generează barcode-ul
    const result = await generateUniversalBarcode(rawData, barcodeType);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      barcode: {
        image: result.base64Image,
        type: result.type,
        detectedType,
        dataLength: rawData.length
      }
    });

  } catch (error) {
    console.error('Error generating barcode:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate barcode' },
      { status: 500 }
    );
  }
}
