import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    if (!process.env.DATABASE_URL && process.env.NODE_ENV === 'production') {
        return NextResponse.json([]);
    }
    const suppliers = await prisma.supplier.findMany({ orderBy: { id: 'asc' } });
    return NextResponse.json(suppliers);
}

export async function PATCH(request: Request) {
    const session = await getSession();
    if (session?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    try {
        const { id, ...data } = await request.json();
        
        const isNew = id.startsWith('new-');
        const finalId = isNew ? `sup-${Date.now()}-${Math.floor(Math.random() * 1000)}` : id;

        const supplier = await prisma.supplier.upsert({
            where: { id: finalId },
            update: data,
            create: {
                id: finalId,
                ...data
            }
        });
        return NextResponse.json(supplier);
    } catch (error) {
        console.error('Supplier update error:', error);
        return NextResponse.json({ error: 'Failed to update supplier' }, { status: 500 });
    }
}
