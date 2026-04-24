import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

let databaseUrl = process.env.DATABASE_URL;
if (databaseUrl) {
    databaseUrl = databaseUrl.replace('-pooler', '');
}

const prisma = new PrismaClient({
    datasources: {
        db: { url: databaseUrl }
    }
});

async function main() {
    const suppliers = [
        { id: 'F001', name: '本社工場', officialName: 'いしだクリーニング 本社工場', type: '工場', method: 'システム' },
        { id: 'F002', name: '駅家工場', officialName: 'パステルクリーニング 駅家工場', type: '工場', method: 'システム' },
    ];

    for (const sup of suppliers) {
        await prisma.supplier.upsert({
            where: { id: sup.id },
            update: { ...sup },
            create: { ...sup },
        });
        console.log(`Upserted supplier: ${sup.id} - ${sup.name}`);
    }

    console.log('Supplier fix completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
