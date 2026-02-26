import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const exercisesToDelete = ["Скалолаз", "Мертвый жук", "Вакуум живота"];

    for (const name of exercisesToDelete) {
        try {
            const deleted = await prisma.exercise.deleteMany({
                where: {
                    name: {
                        contains: name,
                    },
                },
            });
            console.log(`Deleted ${deleted.count} records for exercise: ${name}`);
        } catch (error) {
            console.error(`Error deleting ${name}:`, error);
        }
    }
}

main()
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
