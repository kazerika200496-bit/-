import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { DocumentProcessorServiceClient } from '@google-cloud/documentai';

const prisma = new PrismaClient();

// Initialize Google Document AI dynamically using Vercel stringified JSON env var
let client: DocumentProcessorServiceClient | null = null;

function getDocumentAIClient() {
    if (client) return client;
    const rawCreds = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (!rawCreds) {
        console.warn('GOOGLE_SERVICE_ACCOUNT_JSON is missing. Will fail if OCR is executed.');
        return null;
    }
    try {
        const credentials = JSON.parse(rawCreds);
        client = new DocumentProcessorServiceClient({ credentials });
        return client;
    } catch (error) {
        console.error('Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON:', error);
        return null;
    }
}

export async function POST(request: NextRequest) {
    try {
        const { receiptId } = await request.json();
        if (!receiptId) return NextResponse.json({ error: 'Missing receiptId' }, { status: 400 });

        const receipt = await prisma.receipt.findUnique({ where: { id: receiptId } });
        if (!receipt) return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });

        // Ensure we have access to Document AI
        const docClient = getDocumentAIClient();
        let document: any = null;

        if (!docClient || !process.env.DOCUMENT_AI_PROJECT_ID) {
            console.warn('⚠️ Google Document AI not configured. Falling back to Mock data.');
            document = {
                entities: [
                    { type: 'supplier_name', mentionText: 'サンプル商店 (Mock)' },
                    { type: 'total_amount', mentionText: '2500' },
                    { type: 'receipt_date', mentionText: new Date().toISOString().split('T')[0] },
                    { type: 'currency', mentionText: 'JPY' },
                    { type: 'total_tax_amount', mentionText: '227' }
                ],
                text: "サンプル商店 (Mock)\n2026年X月X日\n合計 ¥2,500 (内消費税 ¥227)\nJPY"
            };
        } else {
            const projectId = process.env.DOCUMENT_AI_PROJECT_ID;
            const location = process.env.DOCUMENT_AI_LOCATION || 'us';
            const processorId = process.env.DOCUMENT_AI_PROCESSOR_ID;

            if (!processorId) return NextResponse.json({ error: 'DOCUMENT_AI_PROCESSOR_ID is missing.' }, { status: 500 });

            const blobResponse = await fetch(receipt.imageUrl, {
                headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` }
            });
            if (!blobResponse.ok) throw new Error('Failed to fetch image from Blob Storage');
            const arrayBuffer = await blobResponse.arrayBuffer();
            const imageBytes = Buffer.from(arrayBuffer).toString('base64');
            const mimeType = receipt.contentType || 'image/jpeg';

            const name = `projects/${projectId}/locations/${location}/processors/${processorId}`;
            const [result] = await docClient.processDocument({
                name, rawDocument: { content: imageBytes, mimeType }
            });
            document = result.document;
            if (!document) throw new Error('No document returned from OCR');
        }

        // 3. Extract Fields from Expense Parser Output
        // Expense parser returns standard entities like supplier_name, total_amount, receipt_date, currency, total_tax_amount
        let payee = null, amount = null, receiptDate = null, currency = null, taxAmount = null;

        if (document.entities) {
            for (const entity of document.entities) {
                if (!entity.type || !entity.mentionText) continue;
                const text = entity.mentionText.trim();
                switch (entity.type) {
                    case 'supplier_name': payee = text; break;
                    case 'total_amount': amount = parseInt(text.replace(/[^\d]/g, ''), 10) || null; break;
                    case 'receipt_date':
                        // Try formatting "2026-04-03" into Date
                        const dt = new Date(text);
                        if (!isNaN(dt.getTime())) receiptDate = dt;
                        break;
                    case 'currency': currency = text; break;
                    case 'total_tax_amount': taxAmount = parseInt(text.replace(/[^\d]/g, ''), 10) || null; break;
                }
            }
        }

        // 4. Update DB
        const updatedReceipt = await prisma.receipt.update({
            where: { id: receiptId },
            data: {
                payee,
                amount,
                currency,
                taxAmount,
                receiptDate,
                rawOcrData: document as any, // Save the entire raw JSON payload to Prisma Json column
                ocrProvider: "google-document-ai-expense-parser",
                ocrProcessedAt: new Date(),
                status: "OCR_DONE"
            }
        });

        return NextResponse.json({ success: true, receipt: updatedReceipt });

    } catch (error: any) {
        console.error('OCR Error:', error);

        // Fallback status if OCR fails
        const payload = await request.json().catch(() => ({}));
        if (payload.receiptId) {
            await prisma.receipt.update({
                where: { id: payload.receiptId },
                data: { status: 'NEEDS_REVIEW', reviewNote: error.message }
            }).catch(() => { }); // ignore sub-fails
        }

        return NextResponse.json({ error: error.message || 'OCR Processing Failed' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
