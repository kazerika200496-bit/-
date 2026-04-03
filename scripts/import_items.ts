import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// Using local simple CSV parsing to avoid extra dependencies
const prisma = new PrismaClient();

async function main() {
    console.log('--- Start Safe Master Item Import ---');
    console.log('Target Database:', process.env.DATABASE_URL?.split('@')[1] ?? 'Local');

    const csvPath = path.join(process.cwd(), 'master_items.csv');
    if (!fs.existsSync(csvPath)) {
        console.error('Error: master_items.csv found not found in root directory.');
        process.exit(1);
    }

    const fileContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = fileContent.split(/\r?\n/).filter(line => line.trim().length > 0);

    if (lines.length <= 1) {
        console.log('No data found in CSV (or only header). Exiting.');
        return;
    }

    // Skip the header
    const dataLines = lines.slice(1);
    let successCount = 0;

    for (const line of dataLines) {
        const [code, name, category, price, unit, supplierName] = line.split(',');

        if (!code || !name || !supplierName) {
            console.warn(`Skipping invalid line: ${line}`);
            continue;
        }

        try {
            // 1. Ensure supplier exists (Upsert)
            const supplier = await prisma.supplier.upsert({
                where: { name: supplierName.trim() },
                update: {}, // No updates if exists
                create: { name: supplierName.trim() }
            });

            // 2. Ensure item exists (Upsert)
            await prisma.item.upsert({
                where: { code: code.trim() },
                update: {
                    name: name.trim(),
                    category: category.trim(),
                    price: parseFloat(price) || 0,
                    unit: unit.trim(),
                    vendorId: supplier.id
                },
                create: {
                    code: code.trim(),
                    name: name.trim(),
                    category: category.trim(),
                    price: parseFloat(price) || 0,
                    unit: unit.trim(),
                    vendorId: supplier.id
                }
            });
            successCount++;
        } catch (error) {
            console.error(`Failed to import item ${code}:`, error);
        }
    }

    console.log(`--- Import Complete ---`);
    console.log(`Successfully upserted ${successCount} items.`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
