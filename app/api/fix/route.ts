import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const suppliers = [
            { id: 'F001', name: '本社工場', officialName: 'いしだクリーニング 本社工場', type: '工場', method: 'システム' },
            { id: 'F002', name: '駅家工場', officialName: 'パステルクリーニング 駅家工場', type: '工場', method: 'システム' },
        ];

        for (const sup of suppliers) {
            await prisma.supplier.upsert({
                where: { id: sup.id },
                update: { ...sup },
                create: { ...sup },
            });
        }
        return NextResponse.json({ success: true, message: 'Factories added to suppliers table.' });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
