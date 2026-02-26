import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BOT_TOKEN = process.env.BOT_TOKEN;

async function sendTelegramMessage(chatId: string, text: string) {
    if (!BOT_TOKEN) return;
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    try {
        await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text }),
        });
    } catch (e) {
        console.error("TG Error:", e);
    }
}

async function checkWorkoutReminders() {
    console.log("Checking workout reminders...");
    const users = await prisma.user.findMany({
        where: { notificationsEnabled: true },
        include: { workouts: { orderBy: { date: "desc" }, take: 1 } }
    });

    const now = new Date();
    const oneDayMs = 24 * 60 * 60 * 1000;

    for (const user of users) {
        let lastWorkoutDate = user.workouts[0]?.date || (user as any).createdAt || new Date();
        const diff = now.getTime() - new Date(lastWorkoutDate).getTime();

        if (diff > oneDayMs) {
            // Проверяем, не отправляли ли уже сегодня такое уведомление
            const alreadyNotified = await prisma.notification.findFirst({
                where: {
                    userId: user.id,
                    type: "workout_reminder",
                    createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) }
                }
            });

            if (!alreadyNotified) {
                console.log(`Sending workout reminder to ${user.firstName}`);
                const msg = "Пора бы сходить в зал! Твои мышцы скучают. 🏋️‍♂️";

                // В приложение
                await prisma.notification.create({
                    data: {
                        userId: user.id,
                        title: "Пора тренироваться!",
                        message: msg,
                        type: "workout_reminder"
                    }
                });

                // В телеграм
                await sendTelegramMessage(user.telegramId.toString(), msg);
            }
        }
    }
}

async function checkNutritionReminders() {
    console.log("Checking nutrition reminders...");
    const now = new Date();
    // Только если сейчас вечер (после 20:00)
    if (now.getHours() < 20) {
        console.log("Too early for nutrition reminders. Current hour:", now.getHours());
        return;
    }

    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const users = await prisma.user.findMany({
        where: { notificationsEnabled: true },
        include: {
            nutritionLogs: {
                where: { date: { gte: startOfDay } }
            }
        }
    });

    for (const user of users) {
        if (user.nutritionLogs.length === 0) {
            // Проверяем, не отправляли ли уже сегодня
            const alreadyNotified = await prisma.notification.findFirst({
                where: {
                    userId: user.id,
                    type: "nutrition_reminder",
                    createdAt: { gte: startOfDay }
                }
            });

            if (!alreadyNotified) {
                console.log(`Sending nutrition reminder to ${user.firstName}`);
                const msg = "Ты сегодня еще ничего не съел? Заполни дневник питания! 🍎";

                await prisma.notification.create({
                    data: {
                        userId: user.id,
                        title: "Дневник питания пуст",
                        message: msg,
                        type: "nutrition_reminder"
                    }
                });

                await sendTelegramMessage(user.telegramId.toString(), msg);
            }
        }
    }
}

async function main() {
    await checkWorkoutReminders();
    await checkNutritionReminders();
    console.log("Checks completed.");
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
