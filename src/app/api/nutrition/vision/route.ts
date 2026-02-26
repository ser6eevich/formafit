import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: Request) {
  try {
    const tgIdStr = request.headers.get("x-telegram-id");
    const { imageBase64 } = await request.json();

    if (!tgIdStr || !imageBase64) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { telegramId: BigInt(tgIdStr) } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const systemPrompt = `Ты профессиональный нутрициолог. Оцени фото еды.
Верни СТРОГО JSON:
{
  "foodName": "Название блюда",
  "calories": 400,
  "protein": 30,
  "carbs": 40,
  "fats": 15
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: systemPrompt },
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}`, detail: "low" } },
          ],
        },
      ],
      response_format: { type: "json_object" },
    });

    const aiRes = completion.choices[0].message.content;
    if (!aiRes) throw new Error("No response from OpenAI");

    const parsed = JSON.parse(aiRes);

    const log = await prisma.nutritionLog.create({
      data: {
        userId: user.id,
        mealType: "Перекус", // В будущем можно определять по времени суток
        foodName: parsed.foodName || "Неизвестное блюдо",
        calories: Number(parsed.calories) || 0,
        protein: Number(parsed.protein) || 0,
        carbs: Number(parsed.carbs) || 0,
        fats: Number(parsed.fats) || 0,
      },
    });

    return NextResponse.json({ success: true, log }, { status: 200 });
  } catch (error) {
    console.error("Vision API Error:", error);
    return NextResponse.json({ error: "Failed to analyze image" }, { status: 500 });
  }
}
