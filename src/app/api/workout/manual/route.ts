import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST: Создать тренировку из выбранных упражнений вручную
export async function POST(request: Request) {
    try {
        const tgIdStr = request.headers.get("x-telegram-id");
        const { workoutName, selectedExercises } = await request.json();

        if (!tgIdStr || !selectedExercises || !selectedExercises.length) {
            return NextResponse.json({ error: "Missing data" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { telegramId: BigInt(tgIdStr) },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // --- АВТО-ДОБАВЛЕНИЕ БАССЕЙНА ---
        const u = user as any;
        const finalExercises = [...selectedExercises];

        // Создаем тренировку с транзакцией
        const result = await prisma.$transaction(async (tx) => {
            const workout = await tx.workout.create({
                data: {
                    userId: user.id,
                    name: workoutName || "Моя тренировка",
                    isCompleted: false,
                    date: new Date(),
                },
            });

            if (u.alwaysAddPool && !finalExercises.some((e: any) => e.name === "Бассейн")) {
                const poolEx = await tx.exercise.findFirst({ where: { name: "Бассейн" } });
                finalExercises.push({
                    name: "Бассейн",
                    isCardio: true,
                    duration: 30,
                    photoUrl: poolEx?.photoUrl || null
                });
            }

            // Создаем ExerciseLog для каждого выбранного упражнения
            const exercisePromises = finalExercises.map((ex: any, index: number) => {
                // Формируем sets из дефолтных данных, или кастомных
                const sets = ex.isCardio
                    ? [{ reps: 1, weight: 0, duration: (ex.duration || ex.defaultDuration || 5).toString() + " мин", speed: ex.speed || ex.defaultSpeed || 6, incline: ex.incline || ex.defaultIncline || 1 }]
                    : Array.from({ length: ex.sets || ex.defaultSets || 3 }, () => ({
                        reps: ex.reps || ex.defaultReps || 10,
                        weight: ex.weight || ex.defaultWeight || 0,
                    }));

                return tx.exerciseLog.create({
                    data: {
                        workoutId: workout.id,
                        name: ex.name,
                        sets: sets,
                        photoUrl: ex.photoUrl || null,
                        orderIndex: index,
                    },
                });
            });

            await Promise.all(exercisePromises);

            return tx.workout.findUnique({
                where: { id: workout.id },
                include: { exercises: { orderBy: { orderIndex: "asc" } } },
            });
        });

        return NextResponse.json({ workout: result }, { status: 200 });
    } catch (error) {
        console.error("Manual Workout Error:", error);
        return NextResponse.json({ error: "Failed to create workout" }, { status: 500 });
    }
}
