import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper to convert Blob/File to Base64
async function fileToBase64(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return `data:${file.type};base64,${buffer.toString('base64')}`;
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const createdById = formData.get('createdById') as string | null;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // 1. Convert to Base64 (MVP approach)
        const base64Image = await fileToBase64(file);

        // 2. Mock OCR Processing (Simulate 2s delay)
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 3. Insert into Database as OCR_DONE
        const receipt = await prisma.receipt.create({
            data: {
                imageUrl: base64Image,
                contentType: file.type,
                fileName: file.name,
                fileSize: file.size,
                status: 'UPLOADED', // UPLOADED means not yet confirmed and no OCR
                createdById: createdById || null,
            }
        });

        return NextResponse.json({ success: true, receiptId: receipt.id });

    } catch (error: any) {
        console.error('Upload Error:', error);
        return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
    } finally {
        // Disconnect to avoid exhausting connections in serverless environment
        await prisma.$disconnect();
    }
}
