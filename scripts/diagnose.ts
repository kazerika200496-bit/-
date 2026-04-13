import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("=== 資材発注アプリ 現状診断 ===");

    const userCount = await prisma.user.count();
    const itemCount = await prisma.item.count();
    const orderCount = await prisma.vendorOrder.count();

    console.log(`👤 Users: ${userCount}`);
    console.log(`📦 Items: ${itemCount}`);
    console.log(`📝 Orders: ${orderCount}`);

    if (userCount > 0) {
        const users = await prisma.user.findMany({ select: { id: true, username: true, role: true, locationId: true } });
        console.log("Users available for login:");
        users.forEach(u => console.log(`  - ${u.username} (Role: ${u.role}, Location: ${u.locationId || 'None'})`));
    } else {
        console.log("❌ No users found. Login impossible.");
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
