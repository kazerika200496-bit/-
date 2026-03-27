import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const secretKey = process.env.JWT_SECRET || 'ishida-ordering-app-super-secret-key-12345';
const key = new TextEncoder().encode(secretKey);

export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;

    // Public paths
    if (path.startsWith('/login') || path.startsWith('/api/auth') || path.startsWith('/_next') || path === '/favicon.ico') {
        return NextResponse.next();
    }

    const session = request.cookies.get('session')?.value;

    if (!session) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
        const { payload } = await jwtVerify(session, key, {
            algorithms: ['HS256'],
        });

        // Check admin routes
        if (path.startsWith('/admin') && payload.role !== 'admin') {
            return NextResponse.redirect(new URL('/', request.url));
        }

        return NextResponse.next();
    } catch (error) {
        // Invalid token
        request.cookies.delete('session');
        return NextResponse.redirect(new URL('/login', request.url));
    }
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
