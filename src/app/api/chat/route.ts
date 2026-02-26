import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: Request) {
    try {
        const tgIdStr = request.headers.get("x-telegram-id");
        const { message, imageBase64 } = await request.json();

        if (!tgIdStr || (!message && !imageBase64)) {
            return NextResponse.json({ error: "Missing data" }, { status: 400 });
        }

        const tgId = BigInt(tgIdStr);

        // ПАРАЛЛЕЛЬНЫЕ ЗАПРОСЫ (по спецификации V2)
        const [user, todayWorkout, recentMessages] = await Promise.all([
            prisma.user.findUnique({ where: { telegramId: tgId } }),

            // Ищем сегодняшнюю (или последнюю) тренировку
            prisma.workout.findFirst({
                where: { user: { telegramId: tgId } },
                orderBy: { date: "desc" },
                include: { exercises: true } // берем упражнения, чтобы понимать контекст зала
            }),

            // Последние сообщения
            prisma.chatMessage.findMany({
                where: { user: { telegramId: tgId } },
                take: 6,
                orderBy: { createdAt: "desc" }
            })
        ]);

        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // Сохраняем сообщение юзера через raw query (чтобы обойти заблокированный Prisma Client)
        const userMsgId = Math.random().toString(36).substring(2, 15);
        await prisma.$executeRawUnsafe(
            "INSERT INTO ChatMessage (id, userId, role, content, imageUrl, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
            userMsgId, user.id, "user", message || "", imageBase64 || null, new Date()
        );

        const isWorkingOut = todayWorkout && !todayWorkout.isCompleted;
        const workoutContext = isWorkingOut
            ? `В зале сейчас. План: ${todayWorkout.name}. Запланировано упражнений: ${todayWorkout.exercises.length}`
            : "Не в зале/Тренировка завершена.";

        const u = user as any;
        const systemPrompt = `Ты - "Карманный бро", персональный фитнес-тренер для пользователя.
Отвечай коротко, без занудства, для экрана мобильного. Тебе можно доверять.
Контекст:
- Имя: ${u.firstName || "Не указано"}
- Пол: ${u.gender || "Не указан"}
- Дата рождения: ${u.birthDate || "Не указана"}
- Вес: ${u.weight ? u.weight + " кг" : "Не указан"}
- Рост: ${u.height ? u.height + " см" : "Не указан"}
- Травмы/Ограничения: ${u.injuries || "Нет"}
- Цель: ${u.goal || "Не указана"}
- Статус: ${workoutContext}
- Текущая дата и время: ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })} (используй это для расчета возраста и контекста)
`;

        // История сообщений (в хронологическом порядке)
        // Явно указываем тип msg 
        const pastMessages = recentMessages.reverse().map((msg: any) => ({
            role: msg.role as "user" | "assistant",
            content: msg.content,
        }));

        // Формируем контент для текущего сообщения
        const userContent: any[] = [];
        if (message) {
            userContent.push({ type: "text", text: message });
        }
        if (imageBase64) {
            userContent.push({
                type: "image_url",
                image_url: { url: imageBase64 }
            });
        }

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                ...pastMessages as any,
                { role: "user", content: userContent },
            ],
        });

        const aiRes = completion.choices[0].message.content || "Извини, бро, я немного завис.";

        // Сохраняем ответ AI
        const aiMsgId = Math.random().toString(36).substring(2, 15);
        await prisma.$executeRawUnsafe(
            "INSERT INTO ChatMessage (id, userId, role, content, imageUrl, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
            aiMsgId, user.id, "assistant", aiRes || "", null, new Date()
        );

        return NextResponse.json({ reply: aiRes }, { status: 200 });
    } catch (error: any) {
        console.error("Chat API Detailed Error:", error);
        return NextResponse.json({ error: "Chat failed", details: error.message }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const tgIdStr = request.headers.get("x-telegram-id");
        if (!tgIdStr) {
            return NextResponse.json({ error: "Missing x-telegram-id header" }, { status: 400 });
        }

        const tgId = BigInt(tgIdStr);
        // Получаем сообщения через raw query, чтобы увидеть imageUrl
        const messages: any = await prisma.$queryRawUnsafe(
            "SELECT * FROM ChatMessage WHERE userId IN (SELECT id FROM User WHERE telegramId = ?) ORDER BY createdAt ASC",
            tgId.toString()
        );

        const formatted = messages.map((msg: any) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            imageUrl: msg.imageUrl
        }));

        if (formatted.length === 0) {
            formatted.push({ id: "1", role: "assistant", content: "Привет, бро! Готов порвать зал? Чем могу помочь!", imageUrl: null });
        }

        return NextResponse.json({ messages: formatted }, { status: 200 });
    } catch (error) {
        console.error("Chat GET Error:", error);
        return NextResponse.json({ error: "Chat History failed" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const tgIdStr = request.headers.get("x-telegram-id");
        if (!tgIdStr) {
            return NextResponse.json({ error: "Missing x-telegram-id header" }, { status: 400 });
        }

        const tgId = BigInt(tgIdStr);
        await (prisma.chatMessage as any).deleteMany({
            where: { user: { telegramId: tgId } },
        });

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("Chat DELETE Error:", error);
        return NextResponse.json({ error: "Chat Clear failed" }, { status: 500 });
    }
}
