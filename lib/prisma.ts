import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

function getClient(): PrismaClient {
    if (!globalForPrisma.prisma) {
        globalForPrisma.prisma = new PrismaClient({
            log: ['query', 'error', 'warn'],
        });
    }
    return globalForPrisma.prisma;
}

/**
 * Prisma Client の lazy getter。
 * インポートしただけでは PrismaClient が初期化されないため、
 * ビルド時の DATABASE_URL 未設定によるエラーを回避しつつ、
 * 実行時には安定した接続を提供します。
 */
export const prisma = {
    get item() { return getClient().item; },
    get location() { return getClient().location; },
    get supplier() { return getClient().supplier; },
    get vendorOrder() { return getClient().vendorOrder; },
    get vendorOrderLine() { return getClient().vendorOrderLine; },
    $connect() { return getClient().$connect(); },
    $disconnect() { return getClient().$disconnect(); },
    $transaction(args: any) { return getClient().$transaction(args); },
} as unknown as PrismaClient;
