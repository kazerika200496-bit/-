import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST() {
    try {
        // 全ての「出力済」ステータスを「確定済（未出力）」に戻す（QA/テスト用機能）
        const result = await prisma.receipt.updateMany({
            where: { status: 'EXPORT_READY' },
            data: { status: 'CONFIRMED' }
        });

        return NextResponse.json({
            success: true,
            message: `${result.count} 件の領収書を「未出力」にリセットしました！`
        });

    } catch (error: any) {
        console.error('Reset Error:', error);
        return NextResponse.json({ error: '内部サーバーエラーが発生しました。' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
