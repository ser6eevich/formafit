import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const gender = searchParams.get("gender") || "male";

        // Получаем разминку (unisex) + упражнения для нужного пола
        const exercises = await prisma.exercise.findMany({
            where: {
                OR: [
                    { gender: "unisex" },
                    { gender: gender === "Женский" ? "female" : "male" },
                ],
            },
            orderBy: [
                { muscleGroup: "asc" },
                { orderIndex: "asc" },
            ],
        });

        // Группируем по мышечной группе для фронтенда
        const grouped: Record<string, typeof exercises> = {};
        for (const ex of exercises) {
            if (!grouped[ex.muscleGroup]) {
                grouped[ex.muscleGroup] = [];
            }
            grouped[ex.muscleGroup].push(ex);
        }

        return NextResponse.json({ exercises, grouped }, { status: 200 });
    } catch (error) {
        console.error("Exercises GET Error:", error);
        return NextResponse.json({ error: "Failed to fetch exercises" }, { status: 500 });
    }
}
