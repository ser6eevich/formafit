import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function main() {
    const exercisesDir = path.join(process.cwd(), "public", "exercises");
    const files = fs.readdirSync(exercisesDir).filter(f => f.endsWith(".png"));

    const exercises = await (prisma as any).exercise.findMany();

    console.log(`Found ${exercises.length} exercises in DB and ${files.length} photos.`);

    let updatedCount = 0;

    for (const ex of exercises) {
        // Упрощенный поиск соответствия: убираем лишние пробелы и приводим к нижнему регистру
        const cleanExName = ex.name.toLowerCase().trim();

        const match = files.find(f => {
            const fileName = path.basename(f, ".png").toLowerCase().trim();
            // Точное совпадение или частичное (например "Подтягивания" и "Подтягивания прямым хватом")
            return fileName === cleanExName || cleanExName.includes(fileName) || fileName.includes(cleanExName);
        });

        if (match) {
            const photoUrl = `/exercises/${match}`;
            await (prisma as any).exercise.update({
                where: { id: ex.id },
                data: { photoUrl }
            });
            // Обновляем и в логах существующих тренировок
            await (prisma as any).exerciseLog.updateMany({
                where: { name: ex.name },
                data: { photoUrl }
            });
            console.log(`Matched: ${ex.name} -> ${match}`);
            updatedCount++;
        } else {
            // Специфичные маппинги, если имена сильно отличаются
            const manualMap: Record<string, string> = {
                "Жим штанги лежа (горизонталь)": "Жим штанги лежа.png",
                "Жим гантелей лежа (горизонталь и наклон)": "Жим гантелей лежа.png",
                "Подтягивания прямым/обратным хватом": "Подтягивания.png",
                "Жим штанги стоя/сидя": "Армейский жим.png",
                "Армейский жим стоя/сидя": "Армейский жим.png",
                "Жим сидя в тренажере": "Жим сидя в тренажере.png",
                "Скручивания классические": "Скручивание.png",
                "Подъем ног/коленей в висе на турнике": "Подъем ног в висе.png",
                "Ягодичный мостик на полу": "Разминка на коврике.png",
                "Разминка": "Разминка на коврике.png",
                "Беговая дорожка": "Беговая дорожка.png"
            };

            if (manualMap[ex.name]) {
                const photoUrl = `/exercises/${manualMap[ex.name]}`;
                await (prisma as any).exercise.update({
                    where: { id: ex.id },
                    data: { photoUrl }
                });
                await (prisma as any).exerciseLog.updateMany({
                    where: { name: ex.name },
                    data: { photoUrl }
                });
                console.log(`Manual Match: ${ex.name} -> ${manualMap[ex.name]}`);
                updatedCount++;
            } else {
                console.log(`No match for: ${ex.name}`);
            }
        }
    }

    console.log(`Done! Updated ${updatedCount} exercises.`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
