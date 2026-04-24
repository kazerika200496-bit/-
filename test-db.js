const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
    datasourceUrl: 'postgresql://neondb_owner:npg_5gBxeMOqS1JY@ep-rapid-butterfly-a1ga5akz-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require&pgbouncer=true'
});

async function main() {
    try {
        const user = await prisma.user.findFirst();
        console.log('User found:', user);
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
