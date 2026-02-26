import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";
import fs from "fs";
import path from "path";

const logFile = path.join(process.cwd(), "api_logs.txt");
const apiLog = (msg: string) => fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: Request) {
    try {
        const tgIdStr = request.headers.get("x-telegram-id");
        const body = await request.json();
        const { imageBase64, text, mealType } = body;

        apiLog(`POST /api/nutrition/analyze - User: ${tgIdStr} - Text: ${text?.slice(0, 30)} - HasImg: ${!!imageBase64}`);

        if (!tgIdStr || (!imageBase64 && !text)) {
            apiLog(`POST /api/nutrition/analyze - Error: Missing data`);
            return NextResponse.json({ error: "Missing data" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { telegramId: BigInt(tgIdStr) } });
        apiLog(`POST /api/nutrition/analyze - User Found: ${!!user}`);

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const systemPrompt = `Ты профессиональный нутрициолог. Оцени еду на фото или по описанию.
Верни СТРОГО JSON:
{
  "foodName": "Название блюда",
  "calories": 400,
  "protein": 30,
  "carbs": 40,
  "fats": 15
}`;

        let content: any[] = [{ type: "text", text: systemPrompt }];

        if (text) {
            content.push({ type: "text", text: `Описание еды: ${text}` });
        }

        if (imageBase64) {
            content.push({ type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}`, detail: "low" } });
        }

        apiLog(`POST /api/nutrition/analyze - Calling OpenAI...`);
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content }],
            response_format: { type: "json_object" },
        });

        const aiRes = completion.choices[0].message.content;
        apiLog(`POST /api/nutrition/analyze - AI Response received`);

        if (!aiRes) throw new Error("No response from OpenAI");

        const parsed = JSON.parse(aiRes);

        const nutritionLog = await prisma.nutritionLog.create({
            data: {
                userId: user.id,
                mealType: mealType || "Перекус",
                foodName: parsed.foodName || "Неизвестное блюдо",
                calories: Math.round(Number(parsed.calories)) || 0,
                protein: Math.round(Number(parsed.protein)) || 0,
                carbs: Math.round(Number(parsed.carbs)) || 0,
                fats: Math.round(Number(parsed.fats)) || 0,
            },
        });

        apiLog(`POST /api/nutrition/analyze - SUCCESS! Log ID: ${nutritionLog.id}`);

        return NextResponse.json({ success: true, log: nutritionLog }, { status: 200 });
    } catch (error: any) {
        apiLog(`POST /api/nutrition/analyze - CRITICAL ERROR: ${error.message}`);
        return NextResponse.json({ error: "Failed to analyze nutrition" }, { status: 500 });
    }
}
