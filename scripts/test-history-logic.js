const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function testHistoryLogic() {
    const tgIdStr = "123456789";
    const user = await prisma.user.findUnique({ where: { telegramId: BigInt(tgIdStr) } });

    const logs = await prisma.nutritionLog.findMany({
        where: { userId: user.id },
        orderBy: { date: "desc" },
    });

    console.log("Total logs in DB for user:", logs.length);

    const groupedLogs = {};
    logs.forEach(log => {
        // THIS IS THE LOGIC FROM route.ts
        const dateKey = new Date(log.date).toISOString().split("T")[0];
        if (!groupedLogs[dateKey]) {
            groupedLogs[dateKey] = {
                date: log.date,
                totalCalories: 0,
                itemsCount: 0,
            };
        }
        groupedLogs[dateKey].totalCalories += log.calories;
        groupedLogs[dateKey].itemsCount++;
    });

    console.log("Grouped History (Keys):", Object.keys(groupedLogs));
    Object.keys(groupedLogs).forEach(k => {
        console.log(` - ${k}: ${groupedLogs[k].totalCalories} kcal, ${groupedLogs[k].itemsCount} items`);
    });

    prisma.$disconnect();
}

testHistoryLogic();
