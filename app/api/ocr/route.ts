import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
    try {
        const { receiptId } = await request.json();

        if (!receiptId) {
            return NextResponse.json({ error: 'Missing receiptId' }, { status: 400 });
        }

        // 1. Get receipt from DB
        const receipt = await prisma.receipt.findUnique({ where: { id: receiptId } });
        if (!receipt) {
            return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
        }

        // 2. Mocking Google Document AI Expense Parser Call
        // Requires: @google-cloud/documentai, GOOGLE_APPLICATION_CREDENTIALS, DOCUMENT_AI_PROCESSOR_ID, etc.
        /*
          const client = new DocumentProcessorServiceClient();
          const name = `projects/${ projectId }/locations/${ location }/processors/${ processorId }`;
          // Fetch private blob image bytes here and pass to Google API
          const requestPayload = { name, rawDocument: { content: imageBytes, mimeType: receipt.contentType } };
          const [result] = await client.processDocument(requestPayload);
          
          // Parse Document AI Entities ...
          const entities = result.document.entities;
          let payee = null, amount = null, receiptDate = null;
          // loop entities to assign values ...
        */

        // Simulated Response for MVP Initial Scaffolding
        const mockJsonOcrData = {
            entities: [
                { type: "supplier_name", mentionText: "サンプルマート" },
                { type: "total_amount", mentionText: "1500" },
                { type: "receipt_date", mentionText: "2026-04-03" },
                { type: "currency", mentionText: "JPY" },
                { type: "total_tax_amount", mentionText: "136" }
            ],
            text: "サンプルマート\n2026年4月3日\n合計 ¥1,500 (内消費税 ¥136)\nJPY"
        };

        // 3. Update DB with OCR Results
        const updatedReceipt = await prisma.receipt.update({
            where: { id: receiptId },
            data: {
                payee: "サンプルマート",
                amount: 1500,
                currency: "JPY",
                taxAmount: 136,
                receiptDate: new Date("2026-04-03T00:00:00.000Z"),
                rawOcrData: mockJsonOcrData,
                ocrProvider: "google-document-ai-expense-parser-mock",
                ocrProcessedAt: new Date(),
                status: "OCR_DONE"
            }
        });

        return NextResponse.json({ success: true, receipt: updatedReceipt });

    } catch (error: any) {
        console.error('OCR Error:', error);
        return NextResponse.json({ error: error.message || 'OCR Processing Failed' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
