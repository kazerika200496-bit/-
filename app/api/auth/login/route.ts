import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        console.log('[LOGIN_API] Starting login request processing...');
        console.log('[LOGIN_API] DATABASE_URL Check:', process.env.DATABASE_URL ? 'Set' : 'Missing');
        console.log('[LOGIN_API] JWT_SECRET Check:', process.env.JWT_SECRET ? 'Set' : 'Missing');

        const { username, password } = await request.json();
        if (!username || !password) {
            console.log('[LOGIN_API] Missing credentials');
            return NextResponse.json({ error: 'Missing username or password' }, { status: 400 });
        }

        console.log(`[LOGIN_API] Attempting to find unique user: ${username}`);
        let user;
        try {
            user = await prisma.user.findUnique({ where: { username } });
        } catch (dbError) {
            console.error('[LOGIN_API: CRITICAL] Prisma findUnique threw an error:', dbError);
            throw dbError; // rethrow to be caught by outer catch
        }

        if (!user || user.password !== password) {
            console.log(`[LOGIN_API] Invalid credentials for user: ${username}`);
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        console.log(`[LOGIN_API] User ${username} authenticated successfully. Signing JWT...`);
        // Create session token
        const token = await signToken({
            sub: user.id,
            username: user.username,
            role: user.role,
            locationId: user.locationId
        });

        console.log('[LOGIN_API] JWT signed successfully. Setting cookies...');
        // Set cookie
        cookies().set('session', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 30 // 30 days
        });

        console.log('[LOGIN_API] Cookies set. Returning success payload.');
        return NextResponse.json({
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                locationId: user.locationId
            }
        });
    } catch (error: any) {
        console.error('[LOGIN_API: FATAL] Uncaught Login error:', error.message || error);
        console.error('[LOGIN_API: FATAL STACK]', error.stack || 'No stack trace');
        return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
    }
}
