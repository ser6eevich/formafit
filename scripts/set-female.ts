import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany();

    if (users.length === 0) {
        console.log("No users found.");
        return;
    }

    console.log("Users in DB:");
    users.forEach(u => console.log(`- ID: ${u.id}, TG ID: ${u.telegramId}, Name: ${u.firstName} ${u.username || ""}, Gender: ${u.gender}`));

    // Предположим, обновляем того, у кого нет пола или последнего созданного, 
    // или если их мало - всех для теста (если пользователь просит "в тестовом аккаунте").
    // Обычно у разработчика один аккаунт в БД при локальной разработке.

    for (const user of users) {
        await prisma.user.update({
            where: { id: user.id },
            data: { gender: "Женский" }
        });
        console.log(`Updated user ${user.firstName || user.username} to 'Женский'`);
    }

    console.log("Done!");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
