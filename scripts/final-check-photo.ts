import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const log = await (prisma as any).exerciseLog.findFirst({
        where: { name: "Беговая дорожка" }
    });
    console.log("ExerciseLog in DB:", JSON.stringify(log, null, 2));

    const ex = await (prisma as any).exercise.findFirst({
        where: { name: "Беговая дорожка" }
    });
    console.log("Exercise definition in DB:", JSON.stringify(ex, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
