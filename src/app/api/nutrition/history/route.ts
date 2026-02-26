import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/lib/utils";
import fs from "fs";
import path from "path";

const logFile = path.join(process.cwd(), "api_logs.txt");
const apiLog = (msg: string) => fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`);

export async function GET(request: Request) {
    const tgIdStr = request.headers.get("x-telegram-id");

    if (!tgIdStr) {
        apiLog("GET /api/nutrition/history - Error: Missing x-telegram-id");
        return NextResponse.json({ error: "Missing x-telegram-id header" }, { status: 400 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { telegramId: BigInt(tgIdStr) },
        });

        apiLog(`GET /api/nutrition/history - User: ${tgIdStr} - Found: ${!!user}`);

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const logs = await prisma.nutritionLog.findMany({
            where: { userId: user.id },
            orderBy: { date: "desc" },
            take: 100,
        });

        // Группируем логи по датам (YYYY-MM-DD)
        const groupedLogs: Record<string, any> = {};

        logs.forEach(log => {
            const dateKey = new Date(log.date).toISOString().split("T")[0];
            if (!groupedLogs[dateKey]) {
                groupedLogs[dateKey] = {
                    date: log.date,
                    totalCalories: 0,
                    totalProtein: 0,
                    totalCarbs: 0,
                    totalFats: 0,
                    items: [],
                };
            }
            groupedLogs[dateKey].totalCalories += log.calories || 0;
            groupedLogs[dateKey].totalProtein += log.protein || 0;
            groupedLogs[dateKey].totalCarbs += log.carbs || 0;
            groupedLogs[dateKey].totalFats += log.fats || 0;

            // Важно: возвращаем все поля, включая date для фронтенда
            groupedLogs[dateKey].items.push({
                ...log,
                date: log.date.toISOString() // Принудительно в строку для JSON
            });
        });

        const history = Object.values(groupedLogs).sort((a: any, b: any) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        return NextResponse.json({ history: serializeBigInt(history) }, { status: 200 });
    } catch (error: any) {
        apiLog(`GET /api/nutrition/history - Error: ${error.message}`);
        console.error("Error fetching nutrition history:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
