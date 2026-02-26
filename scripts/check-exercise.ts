import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const ex = await prisma.exercise.findFirst({
        where: { name: "Беговая дорожка" }
    });
    console.log("Exercise in DB:", JSON.stringify(ex, null, 2));

    const ex2 = await prisma.exercise.findFirst({
        where: { name: { contains: "дорожка" } }
    });
    console.log("Partial match 'дорожка':", JSON.stringify(ex2, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
