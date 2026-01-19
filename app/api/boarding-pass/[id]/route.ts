import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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

    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    return NextResponse.json({
      success: true,
      boardingPass: data
    });

  } catch (error) {
    console.error('Error fetching boarding pass:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch boarding pass' },
      { status: 500 }
    );
  }
}
