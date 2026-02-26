const { PrismaClient } = require("@prisma/client");
const OpenAI = require("openai");

// Manually setting env from previous read
process.env.OPENAI_API_KEY = "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";

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function simulateAnalyze() {
    const tgIdStr = "123456789";
    const text = "2 яйца и кофе";
    const mealType = "Завтрак";

    console.log("Simulating Analyze for:", text);

    try {
        const user = await prisma.user.findUnique({ where: { telegramId: BigInt(tgIdStr) } });
        if (!user) throw new Error("User not found");

        const systemPrompt = `Ты профессиональный нутрициолог. Оцени еду. Верни JSON: { "foodName": "...", "calories": 400, "protein": 30, "carbs": 40, "fats": 15 }`;

        console.log("Calling OpenAI (gpt-4o)...");
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: [{ type: "text", text: systemPrompt }, { type: "text", text: text }] }],
            response_format: { type: "json_object" },
        });

        const aiRes = completion.choices[0].message.content;
        console.log("OpenAI Response:", aiRes);
        const parsed = JSON.parse(aiRes);

        const log = await prisma.nutritionLog.create({
            data: {
                userId: user.id,
                mealType,
                foodName: parsed.foodName,
                calories: Math.round(Number(parsed.calories)),
                protein: Math.round(Number(parsed.protein)),
                carbs: Math.round(Number(parsed.carbs)),
                fats: Math.round(Number(parsed.fats)),
            }
        });

        console.log("SUCCESS! Created ID:", log.id);
    } catch (e) {
        console.error("SIMULATION FAILED:", e.message);
        if (e.stack) console.error(e.stack);
    } finally {
        prisma.$disconnect();
    }
}

simulateAnalyze();
