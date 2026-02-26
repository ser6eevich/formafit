import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/lib/utils";

export async function GET(request: Request) {
    try {
        const tgIdStr = request.headers.get("x-telegram-id");
        if (!tgIdStr) {
            return NextResponse.json({ error: "Missing x-telegram-id" }, { status: 400 });
        }

        const tgId = BigInt(tgIdStr);

        const workouts = await prisma.workout.findMany({
            where: {
                user: { telegramId: tgId },
                isCompleted: true,
            },
            orderBy: { date: "desc" },
            take: 30,
            include: {
                exercises: {
                    orderBy: { orderIndex: "asc" },
                },
            },
        });

        return NextResponse.json({ workouts: serializeBigInt(workouts) }, { status: 200 });
    } catch (error) {
        console.error("Workout History Error:", error);
        return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
    }
}
