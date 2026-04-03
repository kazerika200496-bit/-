import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
// In a real Vercel environment you don't actually proxy it manually if you don't want to. 
// However, since `imageUrl` is private, we can just return a 302 redirect with a temporary token, 
// or fetch the blob from URL using the BLOB_READ_WRITE_TOKEN and return the stream.
// Actually Vercel doesn't block server-side fetch from the `imageUrl` if you pass the token.

const prisma = new PrismaClient();

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const receipt = await prisma.receipt.findUnique({
            where: { id: params.id }
        });

        if (!receipt || !receipt.imageUrl) {
            return new NextResponse('Not Found', { status: 404 });
        }

        // Proxy the image bytes securely from Vercel Private Blob
        // This requires passing the access token in the headers
        const blobResponse = await fetch(receipt.imageUrl, {
            headers: {
                Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`
            }
        });

        if (!blobResponse.ok) {
            throw new Error('Failed to fetch from private blob storage');
        }

        const arrayBuffer = await blobResponse.arrayBuffer();

        // Return image to the browser
        return new NextResponse(arrayBuffer, {
            headers: {
                'Content-Type': receipt.contentType || 'image/jpeg',
                'Cache-Control': 'public, max-age=86400'
            }
        });

    } catch (err: any) {
        console.error('Image Proxy Error:', err);
        return new NextResponse('Internal Server Error', { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
