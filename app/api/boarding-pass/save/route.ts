import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
// DISABLED: Barcode extraction until better technical solution
// import { extractBarcodeFromPdf } from '@/lib/barcode-extractor';

const DATA_DIR = path.join(process.cwd(), 'data', 'boarding-passes');
const PDF_DIR = path.join(DATA_DIR, 'pdfs');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(PDF_DIR)) {
  fs.mkdirSync(PDF_DIR, { recursive: true });
}

function generateShortId(): string {
  // Generate a short, URL-friendly ID (8 characters)
  return crypto.randomBytes(4).toString('hex');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.passengerName || !body.flightNumber || !body.carrierCode || !body.origin || !body.destination) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate unique ID
    const id = generateShortId();
    const timestamp = new Date().toISOString();

    // Save PDF if provided (base64 encoded)
    let pdfFileName: string | null = null;
    
    if (body.pdfBase64) {
      try {
        const pdfBuffer = Buffer.from(body.pdfBase64, 'base64');
        pdfFileName = `${id}.pdf`;
        const pdfPath = path.join(PDF_DIR, pdfFileName);
        fs.writeFileSync(pdfPath, pdfBuffer);
      } catch (pdfErr) {
        console.error('Error saving PDF:', pdfErr);
      }
    }

    // Create boarding pass record
    const boardingPass = {
      id,
      createdAt: timestamp,
      passengerName: body.passengerName,
      carrierCode: body.carrierCode,
      flightNumber: body.flightNumber,
      origin: body.origin,
      destination: body.destination,
      flightDate: body.flightDate || null,
      departureTime: body.departureTime || null,
      seatNumber: body.seatNumber || null,
      compartment: body.compartment || 'Y',
      confirmationCode: body.confirmationCode || null,
      gate: body.gate || null,
      boardingTime: body.boardingTime || null,
      raw: body.raw || null,
      walletLink: body.walletLink || null,
      pdfFileName: pdfFileName,
    };

    // Save to file
    const filePath = path.join(DATA_DIR, `${id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(boardingPass, null, 2));

    // Generate public URL
    const publicUrl = `https://anyway.ro/boarding-pass/${id}`;

    return NextResponse.json({
      success: true,
      id,
      publicUrl,
      boardingPass
    });

  } catch (error) {
    console.error('Error saving boarding pass:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save boarding pass' },
      { status: 500 }
    );
  }
}
