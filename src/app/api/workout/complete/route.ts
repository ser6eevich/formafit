import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const tgIdStr = request.headers.get("x-telegram-id");
        const { workoutId, exercises, isEarlyFinish } = await request.json();

        if (!tgIdStr || !workoutId || !exercises) {
            return NextResponse.json({ error: "Missing x-telegram-id, workoutId or exercises" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { telegramId: BigInt(tgIdStr) },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Сохраняем RPE и закрываем Workout
        const result = await prisma.$transaction(async (tx) => {
            // Разделяем: существующие обновляем, динамические создаём
            for (const log of exercises as any[]) {
                const finalRpe = log.rpe || (isEarlyFinish ? "none" : "done");
                if (log.id && !log.id.startsWith("pool-") && !log.id.startsWith("added-")) {
                    await tx.exerciseLog.update({
                        where: { id: log.id },
                        data: { rpe: finalRpe },
                    });
                } else {
                    await tx.exerciseLog.create({
                        data: {
                            workoutId,
                            name: log.name,
                            sets: log.sets || [],
                            rpe: finalRpe,
                            orderIndex: 999,
                        },
                    });
                }
            }

            // Закрываем тренировку
            return tx.workout.update({
                where: { id: workoutId },
                data: {
                    isCompleted: true,
                    isEarlyFinish: !!isEarlyFinish
                },
                include: { exercises: true }
            });
        });

        return NextResponse.json({ success: true, workout: result }, { status: 200 });
    } catch (error) {
        console.error("Complete workout error:", error);
        return NextResponse.json({ error: "Failed to complete workout" }, { status: 500 });
    }
}
