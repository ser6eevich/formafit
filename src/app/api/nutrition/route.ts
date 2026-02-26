import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

const logFile = path.join(process.cwd(), "api_logs.txt");
const log = (msg: string) => fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`);

export async function GET(request: Request) {
    const tgIdStr = request.headers.get("x-telegram-id");

    if (!tgIdStr) return NextResponse.json({ error: "Missing x-telegram-id" }, { status: 400 });

    try {
        const user = await prisma.user.findUnique({ where: { telegramId: BigInt(tgIdStr) } });
        log(`GET /api/nutrition - User: ${tgIdStr} - Found: ${!!user}`);
        if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

        // Получаем смещение часового пояса из заголовка (в минутах) или используем +3 (МСК) по умолчанию
        const tzOffset = Number(request.headers.get("x-timezone-offset")) || -180; // -180 min = +3h
        log(`GET /api/nutrition - TZ Offset: ${tzOffset}`);

        // Вычисляем начало дня в часовом поясе пользователя
        const now = new Date();
        const userTime = new Date(now.getTime() - (tzOffset * 60000));
        const startOfUserDay = new Date(userTime);
        startOfUserDay.setUTCHours(0, 0, 0, 0);

        // Конвертируем обратно в UTC для запроса к БД
        const startOfDayUTC = new Date(startOfUserDay.getTime() + (tzOffset * 60000));

        const logs = await prisma.nutritionLog.findMany({
            where: {
                userId: user.id,
                date: { gte: startOfDayUTC },
            },
        });

        let totalCalories = 0;
        let totalProtein = 0;
        let totalCarbs = 0;
        let totalFats = 0;

        const itemsList = logs.map(log => {
            totalCalories += log.calories || 0;
            totalProtein += log.protein || 0;
            totalCarbs += log.carbs || 0;
            totalFats += log.fats || 0;

            return {
                id: log.id,
                name: log.foodName,
                calories: log.calories,
                protein: log.protein,
                carbs: log.carbs,
                fats: log.fats,
                mealType: log.mealType,
                date: log.date.toISOString(),
            };
        });

        // Расчет целей на основе профиля пользователя (упрощенно)
        const weight = user.weight || 75;
        const isCut = user.goal === "Похудение";
        const goalCalories = isCut ? weight * 24 * 0.8 : weight * 24 * 1.2;

        const goals = {
            calories: Math.round(goalCalories),
            protein: Math.round(weight * 2),
            carbs: Math.round(weight * 3),
            fats: Math.round(weight * 1)
        };

        return NextResponse.json({
            totals: { calories: totalCalories, protein: totalProtein, carbs: totalCarbs, fats: totalFats },
            goals,
            items: itemsList
        }, { status: 200 });

    } catch (e) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
