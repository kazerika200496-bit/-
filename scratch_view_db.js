const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Locations:', await prisma.location.findMany());
    console.log('Suppliers:', await prisma.supplier.findMany());
}

main().catch(console.error).finally(() => prisma.$disconnect());
