const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    const logs = await prisma.nutritionLog.findMany({
        orderBy: { date: "desc" },
        include: { user: true }
    });

    console.log("ALL Nutrition Logs in DB (" + logs.length + "):");
    logs.forEach(log => {
        console.log(`[${log.date.toISOString()}] User TG: ${log.user.telegramId} - ID: ${log.id.slice(0, 8)} - Food: ${log.foodName}`);
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
