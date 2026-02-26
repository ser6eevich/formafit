import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    const logs = await prisma.nutritionLog.findMany({
        orderBy: { date: "desc" },
        take: 10,
        include: { user: true }
    });

    console.log("Latest 10 nutrition logs:");
    logs.forEach(log => {
        console.log(`[${log.date.toISOString()}] User: ${log.user.telegramId} - Food: ${log.foodName} (${log.calories} kcal)`);
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
