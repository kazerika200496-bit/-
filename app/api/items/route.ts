import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    // DATABASE_URL がない場合はビルド時とみなして空配列を返す
    if (!process.env.DATABASE_URL && process.env.NODE_ENV === 'production') {
        return NextResponse.json([]);
    }
    const items = await prisma.item.findMany();

    const session = await getSession();
    if (session?.role === 'store') {
        return NextResponse.json(items.map(item => ({ ...item, price: null })));
    }

    return NextResponse.json(items);
}

export async function PATCH(request: Request) {
    const session = await getSession();
    if (session?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    try {
        const { id, ...data } = await request.json();
        const item = await prisma.item.update({
            where: { id },
            data,
        });
        return NextResponse.json(item);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
    }
}
