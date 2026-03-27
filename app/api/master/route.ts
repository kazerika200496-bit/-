import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic'; // Force dynamic execution for Vercel build

export async function GET() {
    // DATABASE_URL がない場合はビルド時とみなして空情報を返す
    if (!process.env.DATABASE_URL && process.env.NODE_ENV === 'production') {
        return NextResponse.json({ items: [], locations: [], suppliers: [] });
    }
    try {
        const items = await prisma.item.findMany();
        const locations = await prisma.location.findMany({ orderBy: { id: 'asc' } });
        const suppliers = await prisma.supplier.findMany({ orderBy: { id: 'asc' } });

        // Session Role Filter
        const session = await getSession();
        const isStore = session?.role === 'store';

        const safeItems = items.map(item => ({
            ...item,
            price: isStore ? null : item.price
        }));

        return NextResponse.json({
            items: safeItems,
            locations,
            suppliers
        });
    } catch (error) {
        console.error('Failed to fetch master data:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
