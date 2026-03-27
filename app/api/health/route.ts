import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const testUser = await prisma.user.findFirst();
        return NextResponse.json({ status: 'ok', userFound: !!testUser });
    } catch (error: any) {
        return NextResponse.json({
            status: 'error',
            message: error.message,
            stack: error.stack,
            name: error.name
        }, { status: 500 });
    }
}
