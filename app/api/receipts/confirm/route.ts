import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
    try {
        const data = await request.json();
        const { receiptId, payee, amount, currency, taxAmount, receiptDate, paymentMethod, accountCode, memo } = data;

        if (!receiptId) return NextResponse.json({ error: 'Missing receiptId' }, { status: 400 });

        const updatedReceipt = await prisma.receipt.update({
            where: { id: receiptId },
            data: {
                payee,
                amount: amount ? parseInt(amount, 10) : null,
                currency,
                taxAmount: taxAmount ? parseInt(taxAmount, 10) : null,
                receiptDate: receiptDate ? new Date(receiptDate) : null,
                paymentMethod,
                accountCode,
                memo,
                status: "CONFIRMED"
            }
        });

        return NextResponse.json({ success: true, receipt: updatedReceipt });

    } catch (error: any) {
        console.error('Confirm Error:', error);
        return NextResponse.json({ error: error.message || 'Confirmation Failed' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
