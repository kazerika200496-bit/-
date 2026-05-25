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
        
        if (!data.name || data.name.trim() === '') {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        // Ensure new IDs are created properly if they come from the frontend as 'new-...'
        const isNew = id.startsWith('new-');
        const finalId = isNew ? `item-${Date.now()}-${Math.floor(Math.random() * 1000)}` : id;

        const item = await prisma.item.upsert({
            where: { id: finalId },
            update: data,
            create: {
                id: finalId,
                ...data
            }
        });
        return NextResponse.json(item);
    } catch (error) {
        console.error('Item update error:', error);
        return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const session = await getSession();
    if (session?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        
        await prisma.item.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Item delete error:', error);
        return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
    }
}
