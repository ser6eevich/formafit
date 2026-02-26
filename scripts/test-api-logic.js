async function testAPI() {
    const telegramId = "123456789";
    const tzOffset = -180; // Moscow

    console.log("Testing API /api/nutrition for TG:", telegramId, "TZ Offset:", tzOffset);

    // Note: We can't easily fetch from localhost inside this environment without a full server URL,
    // but we can simulate the logic here precisely using the code from route.ts

    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient();

    const user = await prisma.user.findUnique({ where: { telegramId: BigInt(telegramId) } });

    // COPIED FROM route.ts
    const now = new Date();
    const userTime = new Date(now.getTime() - (tzOffset * 60000));
    const startOfUserDay = new Date(userTime);
    startOfUserDay.setUTCHours(0, 0, 0, 0);
    const startOfDayUTC = new Date(startOfUserDay.getTime() + (tzOffset * 60000));

    console.log("Filter: date >= ", startOfDayUTC.toISOString());

    const logs = await prisma.nutritionLog.findMany({
        where: {
            userId: user.id,
            date: { gte: startOfDayUTC },
        },
    });

    console.log("Logs found:", logs.length);
    logs.forEach(l => console.log(` - ${l.foodName} at ${l.date.toISOString()}`));

    prisma.$disconnect();
}

testAPI();
