const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findUnique({ where: { telegramId: BigInt("123456789") } });
    if (!user) {
        console.error("User 123456789 not found");
        return;
    }

    const log = await prisma.nutritionLog.create({
        data: {
            userId: user.id,
            mealType: "Обед",
            foodName: "Тестовая еда " + new Date().toLocaleTimeString(),
            calories: 500,
            protein: 20,
            carbs: 50,
            fats: 10,
        }
    });

    console.log("Created test log:", log.id, "at", log.date.toISOString());
}

main().catch(console.error).finally(() => prisma.$disconnect());
