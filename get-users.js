const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
    datasourceUrl: 'postgresql://neondb_owner:npg_5gBxeMOqS1JY@ep-rapid-butterfly-a1ga5akz-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require&pgbouncer=true'
});

async function main() {
    try {
        const admin = await prisma.user.findFirst({where: {role: 'admin'}});
        const factory = await prisma.user.findFirst({where: {role: 'store', username: {contains: '工場'}}});
        const store = await prisma.user.findFirst({where: {role: 'store', username: {contains: 'アクロス'}}});
        
        console.log('Admin:', admin);
        console.log('Factory:', factory);
        console.log('Store:', store);
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
