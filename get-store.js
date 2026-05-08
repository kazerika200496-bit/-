const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const store = await prisma.user.findFirst({ where: { username: { contains: '福山北店' } }});
    console.log('Store ID:', store?.username, 'Pass:', store?.password);
}
main().catch(console.error).finally(() => prisma.$disconnect());
