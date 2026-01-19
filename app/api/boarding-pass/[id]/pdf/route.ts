import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data', 'boarding-passes');
const PDF_DIR = path.join(DATA_DIR, 'pdfs');

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

    // Read boarding pass data to get PDF filename
    const dataPath = path.join(DATA_DIR, `${id}.json`);
    if (!fs.existsSync(dataPath)) {
      return NextResponse.json(
        { success: false, error: 'Boarding pass not found' },
        { status: 404 }
      );
    }

    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    
    if (!data.pdfFileName) {
      return NextResponse.json(
        { success: false, error: 'PDF not available for this boarding pass' },
        { status: 404 }
      );
    }

    const pdfPath = path.join(PDF_DIR, data.pdfFileName);
    if (!fs.existsSync(pdfPath)) {
      return NextResponse.json(
        { success: false, error: 'PDF file not found' },
        { status: 404 }
      );
    }

    const pdfBuffer = fs.readFileSync(pdfPath);
    
    // Generate a nice filename for download
    const downloadName = `BoardingPass_${data.carrierCode}${data.flightNumber}_${data.passengerName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${downloadName}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Error serving PDF:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to serve PDF' },
      { status: 500 }
    );
  }
}
