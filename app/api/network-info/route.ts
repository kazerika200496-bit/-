import { NextResponse } from 'next/server';
import os from 'os';

export async function GET() {
    const interfaces = os.networkInterfaces();
    const addresses: string[] = [];

    Object.values(interfaces).forEach((iface) => {
        if (iface) {
            iface.forEach((details) => {
                if (details.family === 'IPv4' && !details.internal) {
                    addresses.push(details.address);
                }
            });
        }
    });

    return NextResponse.json({ addresses });
}
