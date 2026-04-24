import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getSession();
        
        const lines = await prisma.vendorOrderLine.findMany({
            orderBy: { id: 'desc' },
            take: 5
        });

        const users = await prisma.user.findMany({
            where: { role: 'store' },
            take: 5
        });

        return NextResponse.json({
            session,
            latestLines: lines,
            sampleStoreUsers: users.map(u => ({ username: u.username, locationId: u.locationId }))
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
