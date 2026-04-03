import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Start Safe Account Setup ---');
    console.log('Target Database:', process.env.DATABASE_URL?.split('@')[1] ?? 'Local');

    const csvPath = path.join(process.cwd(), 'master_stores.csv');
    if (!fs.existsSync(csvPath)) {
        console.error('Error: master_stores.csv not found in root directory.');
        process.exit(1);
    }

    // 1. Setup Admin Account safely
    const adminPassword = crypto.randomBytes(6).toString('hex');
    await prisma.user.upsert({
        where: { username: 'admin' },
        update: { password: adminPassword },
        create: {
            username: 'admin',
            password: adminPassword,
            role: 'admin'
        }
    });

    let accountLogs = `=== 新入用 認証情報対照表 ===\n作成日時: ${new Date().toLocaleString()}\n\n【管理者アカウント】\nID: admin\nPassword: ${adminPassword}\n\n【店舗アカウント】\n`;

    // 2. Setup Stores and Store Users
    const fileContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = fileContent.split(/\r?\n/).filter(line => line.trim().length > 0);
    const dataLines = lines.length > 1 ? lines.slice(1) : [];

    for (const line of dataLines) {
        const [storeName, region] = line.split(',');
        if (!storeName) continue;

        try {
            // Upsert Location
            const location = await prisma.location.upsert({
                where: { name: storeName.trim() },
                update: {},
                create: { name: storeName.trim() }
            });

            // Upsert Store User
            const storePassword = crypto.randomBytes(4).toString('hex');
            await prisma.user.upsert({
                where: { username: storeName.trim() },
                update: { password: storePassword },
                create: {
                    username: storeName.trim(),
                    password: storePassword,
                    role: 'store',
                    locationId: location.id
                }
            });

            accountLogs += `ID: ${storeName.trim()}\nPassword: ${storePassword}\n\n`;
        } catch (error) {
            console.error(`Failed to process store ${storeName}:`, error);
        }
    }

    // Write to a temporary hidden file
    const logPath = path.join(process.cwd(), 'generated_credentials.tmp.txt');
    fs.writeFileSync(logPath, accountLogs);

    console.log(`--- Setup Complete ---`);
    console.log(`[SECURE] Accounts have been upserted. Temporary credentials list saved to: ${logPath}`);
    console.log(`Please distribute passwords and immediately DELETE 'generated_credentials.tmp.txt'.`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
