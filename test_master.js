const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});

async function main() {
    console.log("Testing items...");
    try {
        const items = await prisma.item.findMany();
        console.log("Items:", items.length);
    } catch(e) {
        console.error("Item error:", e.message);
    }

    console.log("Testing locations...");
    try {
        const locations = await prisma.location.findMany({ orderBy: { id: 'asc' } });
        console.log("Locations:", locations.length);
    } catch(e) {
        console.error("Location error:", e.message);
    }

    console.log("Testing suppliers...");
    try {
        const suppliers = await prisma.supplier.findMany({ orderBy: { id: 'asc' } });
        console.log("Suppliers:", suppliers.length);
    } catch(e) {
        console.error("Supplier error:", e.message);
    }
}
main().catch(console.error).finally(() => prisma.$disconnect());
