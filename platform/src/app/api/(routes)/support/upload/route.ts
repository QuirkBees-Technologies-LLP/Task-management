import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { verifyToken } from '../../../helpers';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(request: Request) {
  const { decoded, error, status } = await verifyToken(request);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file size only - allow all file types
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 50MB limit' }, { status: 400 });
    }

    // Determine the correct project root (handles monorepo setups)
    // If the NexTask app lives in a subfolder, prefer that as the base
    let projectRoot = process.cwd();
    const nestedAppRoot = join(projectRoot, 'NexTask-A-Complete-Project-Management-Solution');
    if (existsSync(join(nestedAppRoot, 'next.config.mjs'))) {
      projectRoot = nestedAppRoot;
    }

    // Create uploads directory inside the Next.js public folder if it doesn't exist
    const uploadsDir = join(projectRoot, 'public', 'uploads', 'support');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${sanitizedFileName}`;
    const filePath = join(uploadsDir, fileName);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Return file URL
    const fileUrl = `/uploads/support/${fileName}`;

    return NextResponse.json(
      {
        success: true,
        fileUrl,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload file' },
      { status: 500 }
    );
  }
}

