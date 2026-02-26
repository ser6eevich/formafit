import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: Request) {
  try {
    const tgIdStr = request.headers.get("x-telegram-id");
    const body = await request.json();
    const { targetMuscles, userWishes } = body;
    const targetMusclesList: string[] = targetMuscles || [];
    if (!tgIdStr) {
      return NextResponse.json({ error: "Missing x-telegram-id header" }, { status: 400 });
    }

    const tgId = BigInt(tgIdStr);

    // 1. Достаем юзера
    const user = await prisma.user.findUnique({
      where: { telegramId: tgId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 2. Ищем последние логи для прогрессии (опционально)
    const pastLogs = await prisma.exerciseLog.findMany({
      where: { workout: { userId: user.id } },
      take: 5,
      orderBy: { id: "desc" },
    });

    const pastWorkoutsContext = pastLogs
      .map((l) => `${l.name} - RPE: ${l.rpe || "N/A"}`)
      .join("\n");

    // --- ГЕНДЕРНЫЕ ПРЕСЕТЫ УПРАЖНЕНИЙ ---
    const u = user as any;
    const isFemale = u.gender === "Женский";

    const maleExercises = `ДОПУСТИМЫЕ УПРАЖНЕНИЯ (МУЖСКИЕ):
Грудь: Отжимания от пола, Отжимания на брусьях, Жим штанги лежа, Жим штанги на наклонной скамье, Жим гантелей лежа, Разведение гантелей лежа, Сведение рук в кроссовере, Жим в Хаммере сидя.
Спина: Подтягивания прямым/обратным хватом, Гиперэкстензия, Тяга штанги в наклоне, Тяга Т-грифа, Шраги со штангой, Тяга гантели одной рукой, Пуловер с гантелей, Тяга верхнего блока, Тяга горизонтального блока, Рычажная тяга.
Ноги: Приседания классические, Выпады, Приседания со штангой, Фронтальные приседания, Становая тяга, Кубковые приседания, Жим ногами, Гакк-приседания, Разгибание ног сидя, Сгибание ног.
Плечи: Армейский жим, Тяга штанги к подбородку, Жим гантелей сидя, Махи гантелей в стороны/перед собой/в наклоне, Жим сидя в тренажере, Обратная бабочка.
Руки: Отжимания на брусьях, Подъем штанги на бицепс, Французский жим, Жим узким хватом, Молотки, Концентрированный подъем, Разгибание рук в кроссовере, Тренажер Скотта.
Пресс: Скручивания, Планка, Подъем ног в висе, Скручивания в блоке, Ролик для пресса, Русские скручивания.`;

    const femaleExercises = `ДОПУСТИМЫЕ УПРАЖНЕНИЯ (ЖЕНСКИЕ):
Ноги и Ягодицы (ПРИОРИТЕТ): Ягодичный мостик, Махи ногой назад/в сторону, Приседания, Выпады, Румынская тяга, Ягодичный мостик со штангой, Болгарские сплит-приседания, Кубковые приседания, Зашагивания на скамью, Жим ногами (высокая постановка), Сведение/Разведение ног, Отведение ноги в кроссовере, Сгибание ног.
Спина (Осанка): Гиперэкстензия, Подтягивания в гравитроне, Тяга гантели одной рукой, Пуловер с гантелей, Тяга верхнего блока, Тяга горизонтального блока, Гиперэкстензия в тренажере.
Грудь (Тонус): Отжимания от пола, Жим гантелей лежа, Разведение гантелей лежа, Сведение рук в Бабочке.
Плечи и Руки: Обратные отжимания от скамьи, Жим гантелей сидя, Махи гантелей в стороны, Разгибание руки в наклоне, Разгибание рук в кроссовере, Сгибание рук в кроссовере.
Пресс: Скручивания, Планка, Велосипед, Подъем ног в упоре.`;

    const exercisePreset = isFemale ? femaleExercises : maleExercises;
    const exerciseLimit = isFemale ? "6-8" : "5-7";
    const restTime = isFemale ? "1–1.5 минуты" : "2–3 минуты";
    const structureHint = isFemale
      ? "2-3 базовых упражнения на низ тела + 4-5 изолирующих на ягодицы, пресс и спину."
      : "2-3 тяжелых многосуставных (база) + 3-4 изолирующих (добивка).";

    const targetMusclesHint = targetMusclesList.length > 0
      ? `\nЦЕЛЕВЫЕ МЫШЕЧНЫЕ ГРУППЫ НА СЕГОДНЯ: ${targetMusclesList.join(", ")}.\nСоставь тренировку ИМЕННО на эти группы мышц. Выбирай упражнения только из соответствующих разделов.`
      : "\nВыбери мышечные группы сам, учитывая разнообразие и баланс.";

    const systemPrompt = `Ты — профессиональный фитнес-тренер. Составь 1 тренировку на сегодня.

ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ:
- Пол: ${u.gender || "Не указан"}
- Цель: ${u.goal || "Не указана"}
- Опыт: ${u.experience || "Новичок"}
- Дата рождения: ${u.birthDate || "Не указана"}
- Вес: ${u.weight || "?"} кг, Рост: ${u.height || "?"} см
- Травмы/Ограничения: ${u.injuries || "Нет"}
${targetMusclesHint}

ДОПОЛНИТЕЛЬНЫЕ ПОЖЕЛАНИЯ ПОЛЬЗОВАТЕЛЯ:
${userWishes || "Нет особых пожеланий. Составь сбалансированный план."}

${exercisePreset}

ПРОШЛЫЕ УПРАЖНЕНИЯ (для авто-прогрессии весов):
${pastWorkoutsContext || "Нет данных. Используй начальные веса для новичка."}

ЖЁСТКИЕ ПРАВИЛА:
1. Используй ТОЛЬКО упражнения из списка выше. Не придумывай свои.
2. Количество упражнений: СТРОГО ${exerciseLimit} штук.
3. Структура: ${structureHint}
4. Общий объем: не более 20-25 рабочих подходов за тренировку.
5. Первое упражнение ВСЕГДА — разминка (беговая дорожка, коврик, эллипс и т.д.), 5-10 минут.
6. Рекомендуемое время отдыха между подходами: ${restTime}.
7. Если есть травмы — ИСКЛЮЧИ упражнения, затрагивающие больную зону.
8. Если есть прошлые данные — увеличь вес на 2.5-5 кг для прогрессии.
9. Тщательно учитывай "ДОПОЛНИТЕЛЬНЫЕ ПОЖЕЛАНИЯ ПОЛЬЗОВАТЕЛЯ" при выборе упражнений и объема тренировки.

Верни СТРОГО JSON-объект:
{
  "workoutName": "Название тренировки",
  "exercises": [
    {
      "name": "Разминка: беговая дорожка",
      "sets": [{ "reps": 1, "weight": 0, "duration": "5 мин" }]
    },
    {
      "name": "Жим штанги лежа",
      "sets": [
        { "reps": 10, "weight": 40 },
        { "reps": 10, "weight": 40 },
        { "reps": 10, "weight": 40 }
      ]
    }
  ]
}`;

    // 3. Запрос к AI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: systemPrompt }],
      response_format: { type: "json_object" },
    });

    const aiRes = completion.choices[0].message.content;
    if (!aiRes) throw new Error("No response from OpenAI");

    const parsedWorkout = JSON.parse(aiRes);

    // 4. АТОМАРНАЯ ТРАНЗАКЦИЯ (Сохранение Workout + ExerciseLog)
    const result = await prisma.$transaction(async (tx) => {
      // Создаем Тренировку
      const workout = await tx.workout.create({
        data: {
          userId: user.id,
          name: parsedWorkout.workoutName,
          isCompleted: false,
          date: new Date(),
        },
      });

      // --- АВТО-ДОБАВЛЕНИЕ БАССЕЙНА ---
      const finalExercises = [...parsedWorkout.exercises];
      const u = user as any;
      if (u.alwaysAddPool && !finalExercises.some(e => e.name.includes("Бассейн"))) {
        finalExercises.push({
          name: "Бассейн",
          sets: [{ reps: 1, weight: 0, duration: "30 мин" }]
        });
      }

      // Создаем Логи Упражнений, привязанные к этому workoutId
      const exercisePromises = finalExercises.map(async (ex: any, index: number) => {
        // Ищем фото в библиотеке упражнений по имени
        const libraryEx = await tx.exercise.findFirst({
          where: { name: { contains: ex.name.replace("Разминка: ", "").trim() } }
        });

        return tx.exerciseLog.create({
          data: {
            workoutId: workout.id,
            name: ex.name,
            sets: ex.sets,
            photoUrl: libraryEx?.photoUrl || null,
            orderIndex: index,
          },
        });
      });

      await Promise.all(exercisePromises);

      // Возвращаем workout вместе с логами для ответа на фронт
      return tx.workout.findUnique({
        where: { id: workout.id },
        include: { exercises: { orderBy: { orderIndex: "asc" } } },
      });
    });

    return NextResponse.json({ workout: result }, { status: 200 });
  } catch (error) {
    console.error("Workout Error:", error);
    return NextResponse.json({ error: "Failed to generate workout" }, { status: 500 });
  }
}
