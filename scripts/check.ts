import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

let databaseUrl = process.env.DATABASE_URL;
if (databaseUrl) {
    databaseUrl = databaseUrl.replace('-pooler', '');
}

const prisma = new PrismaClient({
    datasources: { db: { url: databaseUrl } }
});

async function main() {
    const lines = await prisma.vendorOrderLine.findMany({
        orderBy: { id: 'desc' },
        take: 3
    });
    console.log("Lines:", lines);

    const user = await prisma.user.findFirst({
        where: { username: 'パステルクリーニング エブリイ駅家店' }
    });
    console.log("User:", user);
}
main().finally(() => prisma.$disconnect());
