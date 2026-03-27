import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

// In production, you would use a secure environment variable
const secretKey = process.env.JWT_SECRET || 'ishida-ordering-app-super-secret-key-12345';
const key = new TextEncoder().encode(secretKey);

export async function signToken(payload: any) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('30d') // Valid for 30 days
        .sign(key);
}

export async function verifyToken(input: string) {
    try {
        const { payload } = await jwtVerify(input, key, {
            algorithms: ['HS256'],
        });
        return payload;
    } catch (error) {
        return null;
    }
}

export async function getSession() {
    const session = cookies().get('session')?.value;
    if (!session) return null;
    return await verifyToken(session);
}

export async function requireAuth() {
    const session = await getSession();
    if (!session) {
        throw new Error('Unauthorized');
    }
    return session;
}
