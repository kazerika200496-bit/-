const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const admin = await prisma.user.findUnique({ where: { username: 'admin' }});
    console.log('Admin pass:', admin.password);
    const factory = await prisma.user.findFirst({ where: { locationId: 'F001' }});
    console.log('Factory ID:', factory.username, 'Pass:', factory.password);
}
main().catch(console.error).finally(() => prisma.$disconnect());
