import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const missingPhotos = await prisma.exercise.findMany({
        where: {
            OR: [
                { photoUrl: null },
                { photoUrl: "" }
            ]
        },
        orderBy: {
            muscleGroup: "asc"
        }
    });

    if (missingPhotos.length === 0) {
        console.log(" Все упражнения имеют фотографии! 🎉");
        return;
    }

    console.log(` Найдено ${missingPhotos.length} упражнений без фото:\n`);

    const grouped: Record<string, string[]> = {};
    missingPhotos.forEach(ex => {
        if (!grouped[ex.muscleGroup]) grouped[ex.muscleGroup] = [];
        grouped[ex.muscleGroup].push(ex.name);
    });

    for (const [group, names] of Object.entries(grouped)) {
        console.log(`[${group}]`);
        names.forEach(name => console.log(` - ${name}`));
        console.log("");
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
