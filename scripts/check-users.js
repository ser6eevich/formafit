const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany();
    console.log("Users in DB:");
    users.forEach(u => {
        console.log(`ID: ${u.id}, TG: ${u.telegramId}, Name: ${u.firstName} ${u.lastName}`);
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
