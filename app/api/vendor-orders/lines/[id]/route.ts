import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// 単一明細の操作
export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const id = parseInt(params.id);
        const { qty, note } = await request.json();

        // Check ownership
        const existingLine = await prisma.vendorOrderLine.findUnique({ where: { id } });
        if (!existingLine) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        if (session.role === 'store' && existingLine.locationId !== session.locationId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const line = await prisma.vendorOrderLine.update({
            where: { id },
            data: {
                qty,
                note,
                updatedAt: new Date()
            }
        });

        return NextResponse.json(line);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update line' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const id = parseInt(params.id);

        const existingLine = await prisma.vendorOrderLine.findUnique({ where: { id } });
        if (!existingLine) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        if (session.role === 'store' && existingLine.locationId !== session.locationId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await prisma.vendorOrderLine.delete({
            where: { id }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete line' }, { status: 500 });
    }
}
