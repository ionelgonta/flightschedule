import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const LEARNING_DIR = '/opt/anyway-flight-schedule/data/learning-boarding-passes';

// Ensure learning directory exists
async function ensureLearningDir() {
  try {
    await fs.mkdir(LEARNING_DIR, { recursive: true });
  } catch (error) {
    console.log('Learning dir ready');
  }
}

/**
 * POST - Upload boarding pass for learning
 */
export async function POST(request: NextRequest) {
  try {
    await ensureLearningDir();
    
    const formData = await request.formData();
    const file = formData.get('pdf') as File;
    
    if (!file) {
      return NextResponse.json({ 
        success: false, 
        error: 'No PDF file provided' 
      }, { status: 400 });
    }
    
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Save with timestamp
    const timestamp = Date.now();
    const filename = `boarding-pass-${timestamp}.pdf`;
    const filepath = path.join(LEARNING_DIR, filename);
    
    await fs.writeFile(filepath, buffer);
    
    console.log(`📚 Learning boarding pass saved: ${filename} (${buffer.length} bytes)`);
    
    return NextResponse.json({
      success: true,
      message: 'Boarding pass saved for learning',
      filename,
      size: buffer.length,
      path: filepath
    });
    
  } catch (error: any) {
    console.error('Learning upload error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

/**
 * GET - List all learning boarding passes
 */
export async function GET() {
  try {
    await ensureLearningDir();
    
    const files = await fs.readdir(LEARNING_DIR);
    const pdfFiles = files.filter(f => f.endsWith('.pdf'));
    
    const fileDetails = await Promise.all(
      pdfFiles.map(async (filename) => {
        const filepath = path.join(LEARNING_DIR, filename);
        const stats = await fs.stat(filepath);
        return {
          filename,
          size: stats.size,
          created: stats.birthtime
        };
      })
    );
    
    return NextResponse.json({
      success: true,
      count: fileDetails.length,
      files: fileDetails
    });
    
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
