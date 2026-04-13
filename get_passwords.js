const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getPasswords() {
    const users = await prisma.user.findMany();
    for (const u of users) {
        console.log(`Role: ${u.role} | ID: ${u.username} | Pass: ${u.password}`);
    }
}
getPasswords().finally(() => prisma.$disconnect());
