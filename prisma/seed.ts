import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type ExerciseSeed = {
    name: string;
    muscleGroup: string;
    gender: string;
    equipment: string;
    defaultSets?: number;
    defaultReps?: number;
    defaultWeight?: number;
    isCardio?: boolean;
    defaultSpeed?: number;
    defaultIncline?: number;
    defaultDuration?: number;
    orderIndex?: number;
};

const exercises: ExerciseSeed[] = [
    // ===================== РАЗМИНКА (unisex) =====================
    { name: "Беговая дорожка", muscleGroup: "Разминка", gender: "unisex", equipment: "cardio", isCardio: true, defaultSpeed: 6.0, defaultIncline: 1.0, defaultDuration: 5, defaultSets: 1, defaultReps: 1, defaultWeight: 0, orderIndex: 0 },
    { name: "Эллиптический тренажер", muscleGroup: "Разминка", gender: "unisex", equipment: "cardio", isCardio: true, defaultSpeed: 0, defaultIncline: 0, defaultDuration: 5, defaultSets: 1, defaultReps: 1, defaultWeight: 0, orderIndex: 1 },
    { name: "Разминка на коврике", muscleGroup: "Разминка", gender: "unisex", equipment: "bodyweight", isCardio: false, defaultDuration: 5, defaultSets: 1, defaultReps: 1, defaultWeight: 0, orderIndex: 2 },
    { name: "Велотренажер", muscleGroup: "Разминка", gender: "unisex", equipment: "cardio", isCardio: true, defaultSpeed: 0, defaultIncline: 0, defaultDuration: 5, defaultSets: 1, defaultReps: 1, defaultWeight: 0, orderIndex: 3 },
    { name: "Бассейн", muscleGroup: "Разминка", gender: "unisex", equipment: "cardio", isCardio: true, defaultSpeed: 0, defaultIncline: 0, defaultDuration: 30, defaultSets: 1, defaultReps: 1, defaultWeight: 0, orderIndex: 4 },

    // ===================== МУЖСКИЕ =====================

    // --- Грудь ---
    { name: "Отжимания от пола", muscleGroup: "Грудь", gender: "male", equipment: "bodyweight", defaultWeight: 0, orderIndex: 0 },
    { name: "Отжимания на брусьях (наклон вперед)", muscleGroup: "Грудь", gender: "male", equipment: "bodyweight", defaultWeight: 0, orderIndex: 1 },
    { name: "Жим штанги лежа", muscleGroup: "Грудь", gender: "male", equipment: "barbell", defaultWeight: 40, orderIndex: 2 },
    { name: "Жим штанги на наклонной скамье", muscleGroup: "Грудь", gender: "male", equipment: "barbell", defaultWeight: 30, orderIndex: 3 },
    { name: "Жим гантелей лежа", muscleGroup: "Грудь", gender: "male", equipment: "dumbbell", defaultWeight: 16, orderIndex: 4 },
    { name: "Разведение гантелей лежа", muscleGroup: "Грудь", gender: "male", equipment: "dumbbell", defaultWeight: 10, orderIndex: 5 },
    { name: "Сведение рук в кроссовере", muscleGroup: "Грудь", gender: "male", equipment: "machine", defaultWeight: 15, orderIndex: 6 },
    { name: "Жим в Хаммере сидя", muscleGroup: "Грудь", gender: "male", equipment: "machine", defaultWeight: 20, orderIndex: 7 },

    // --- Спина ---
    { name: "Подтягивания", muscleGroup: "Спина", gender: "male", equipment: "bodyweight", defaultWeight: 0, defaultReps: 8, orderIndex: 0 },
    { name: "Гиперэкстензия", muscleGroup: "Спина", gender: "male", equipment: "bodyweight", defaultWeight: 0, defaultReps: 15, orderIndex: 1 },
    { name: "Тяга штанги в наклоне", muscleGroup: "Спина", gender: "male", equipment: "barbell", defaultWeight: 40, orderIndex: 2 },
    { name: "Тяга Т-грифа", muscleGroup: "Спина", gender: "male", equipment: "barbell", defaultWeight: 25, orderIndex: 3 },
    { name: "Шраги со штангой", muscleGroup: "Спина", gender: "male", equipment: "barbell", defaultWeight: 40, defaultReps: 12, orderIndex: 4 },
    { name: "Тяга гантели одной рукой", muscleGroup: "Спина", gender: "male", equipment: "dumbbell", defaultWeight: 16, orderIndex: 5 },
    { name: "Пуловер с гантелей", muscleGroup: "Спина", gender: "male", equipment: "dumbbell", defaultWeight: 14, orderIndex: 6 },
    { name: "Тяга верхнего блока", muscleGroup: "Спина", gender: "male", equipment: "machine", defaultWeight: 40, orderIndex: 7 },
    { name: "Тяга горизонтального блока", muscleGroup: "Спина", gender: "male", equipment: "machine", defaultWeight: 35, orderIndex: 8 },
    { name: "Рычажная тяга", muscleGroup: "Спина", gender: "male", equipment: "machine", defaultWeight: 30, orderIndex: 9 },

    // --- Ноги ---
    { name: "Приседания классические", muscleGroup: "Ноги", gender: "male", equipment: "bodyweight", defaultWeight: 0, defaultReps: 15, orderIndex: 0 },
    { name: "Выпады", muscleGroup: "Ноги", gender: "male", equipment: "bodyweight", defaultWeight: 0, defaultReps: 12, orderIndex: 1 },
    { name: "Приседания со штангой", muscleGroup: "Ноги", gender: "male", equipment: "barbell", defaultWeight: 40, defaultReps: 8, orderIndex: 2 },
    { name: "Фронтальные приседания", muscleGroup: "Ноги", gender: "male", equipment: "barbell", defaultWeight: 30, defaultReps: 8, orderIndex: 3 },
    { name: "Становая тяга", muscleGroup: "Ноги", gender: "male", equipment: "barbell", defaultWeight: 50, defaultReps: 6, orderIndex: 4 },
    { name: "Выпады со штангой", muscleGroup: "Ноги", gender: "male", equipment: "barbell", defaultWeight: 20, orderIndex: 5 },
    { name: "Кубковые приседания", muscleGroup: "Ноги", gender: "male", equipment: "dumbbell", defaultWeight: 16, orderIndex: 6 },
    { name: "Жим ногами", muscleGroup: "Ноги", gender: "male", equipment: "machine", defaultWeight: 80, defaultReps: 12, orderIndex: 7 },
    { name: "Гакк-приседания", muscleGroup: "Ноги", gender: "male", equipment: "machine", defaultWeight: 40, orderIndex: 8 },
    { name: "Разгибание ног сидя", muscleGroup: "Ноги", gender: "male", equipment: "machine", defaultWeight: 30, defaultReps: 12, orderIndex: 9 },
    { name: "Сгибание ног", muscleGroup: "Ноги", gender: "male", equipment: "machine", defaultWeight: 25, defaultReps: 12, orderIndex: 10 },

    // --- Плечи ---
    { name: "Армейский жим", muscleGroup: "Плечи", gender: "male", equipment: "barbell", defaultWeight: 25, defaultReps: 8, orderIndex: 0 },
    { name: "Тяга штанги к подбородку", muscleGroup: "Плечи", gender: "male", equipment: "barbell", defaultWeight: 20, orderIndex: 1 },
    { name: "Жим гантелей сидя", muscleGroup: "Плечи", gender: "male", equipment: "dumbbell", defaultWeight: 12, orderIndex: 2 },
    { name: "Махи гантелей в стороны", muscleGroup: "Плечи", gender: "male", equipment: "dumbbell", defaultWeight: 6, defaultReps: 15, orderIndex: 3 },
    { name: "Махи гантелей перед собой", muscleGroup: "Плечи", gender: "male", equipment: "dumbbell", defaultWeight: 6, defaultReps: 12, orderIndex: 4 },
    { name: "Махи гантелей в наклоне", muscleGroup: "Плечи", gender: "male", equipment: "dumbbell", defaultWeight: 5, defaultReps: 15, orderIndex: 5 },
    { name: "Жим сидя в тренажере", muscleGroup: "Плечи", gender: "male", equipment: "machine", defaultWeight: 25, orderIndex: 6 },
    { name: "Обратная бабочка", muscleGroup: "Плечи", gender: "male", equipment: "machine", defaultWeight: 20, defaultReps: 15, orderIndex: 7 },

    // --- Руки ---
    { name: "Отжимания на брусьях", muscleGroup: "Руки", gender: "male", equipment: "bodyweight", defaultWeight: 0, defaultReps: 10, orderIndex: 0 },
    { name: "Отжимания узким хватом", muscleGroup: "Руки", gender: "male", equipment: "bodyweight", defaultWeight: 0, defaultReps: 12, orderIndex: 1 },
    { name: "Подъем штанги на бицепс", muscleGroup: "Руки", gender: "male", equipment: "barbell", defaultWeight: 15, defaultReps: 12, orderIndex: 2 },
    { name: "Французский жим", muscleGroup: "Руки", gender: "male", equipment: "barbell", defaultWeight: 15, orderIndex: 3 },
    { name: "Жим узким хватом", muscleGroup: "Руки", gender: "male", equipment: "barbell", defaultWeight: 30, defaultReps: 8, orderIndex: 4 },
    { name: "Молотки", muscleGroup: "Руки", gender: "male", equipment: "dumbbell", defaultWeight: 10, defaultReps: 12, orderIndex: 5 },
    { name: "Концентрированный подъем", muscleGroup: "Руки", gender: "male", equipment: "dumbbell", defaultWeight: 8, defaultReps: 12, orderIndex: 6 },
    { name: "Разгибание руки из-за головы", muscleGroup: "Руки", gender: "male", equipment: "dumbbell", defaultWeight: 10, orderIndex: 7 },
    { name: "Разгибание рук в кроссовере", muscleGroup: "Руки", gender: "male", equipment: "machine", defaultWeight: 20, defaultReps: 12, orderIndex: 8 },
    { name: "Сгибание рук в кроссовере", muscleGroup: "Руки", gender: "male", equipment: "machine", defaultWeight: 15, defaultReps: 12, orderIndex: 9 },
    { name: "Тренажер Скотта", muscleGroup: "Руки", gender: "male", equipment: "machine", defaultWeight: 15, defaultReps: 12, orderIndex: 10 },

    // --- Пресс ---
    { name: "Скручивания", muscleGroup: "Пресс", gender: "male", equipment: "bodyweight", defaultWeight: 0, defaultReps: 20, orderIndex: 0 },
    { name: "Планка", muscleGroup: "Пресс", gender: "male", equipment: "bodyweight", defaultWeight: 0, defaultReps: 1, defaultSets: 3, orderIndex: 1 },
    { name: "Подъем ног в висе", muscleGroup: "Пресс", gender: "male", equipment: "bodyweight", defaultWeight: 0, defaultReps: 15, orderIndex: 2 },
    { name: "Скручивания в блоке", muscleGroup: "Пресс", gender: "male", equipment: "machine", defaultWeight: 20, defaultReps: 15, orderIndex: 3 },
    { name: "Ролик для пресса", muscleGroup: "Пресс", gender: "male", equipment: "bodyweight", defaultWeight: 0, defaultReps: 12, orderIndex: 4 },
    { name: "Русские скручивания", muscleGroup: "Пресс", gender: "male", equipment: "bodyweight", defaultWeight: 5, defaultReps: 20, orderIndex: 5 },

    // ===================== ЖЕНСКИЕ =====================

    // --- Ноги и Ягодицы ---
    { name: "Ягодичный мостик", muscleGroup: "Ноги и Ягодицы", gender: "female", equipment: "bodyweight", defaultWeight: 0, defaultReps: 15, orderIndex: 0 },
    { name: "Махи ногой назад", muscleGroup: "Ноги и Ягодицы", gender: "female", equipment: "bodyweight", defaultWeight: 0, defaultReps: 15, orderIndex: 1 },
    { name: "Махи ногой в сторону", muscleGroup: "Ноги и Ягодицы", gender: "female", equipment: "bodyweight", defaultWeight: 0, defaultReps: 15, orderIndex: 2 },
    { name: "Отведение ноги лежа на боку", muscleGroup: "Ноги и Ягодицы", gender: "female", equipment: "bodyweight", defaultWeight: 0, defaultReps: 15, orderIndex: 3 },
    { name: "Приседания", muscleGroup: "Ноги и Ягодицы", gender: "female", equipment: "bodyweight", defaultWeight: 0, defaultReps: 15, orderIndex: 4 },
    { name: "Выпады", muscleGroup: "Ноги и Ягодицы", gender: "female", equipment: "bodyweight", defaultWeight: 0, defaultReps: 12, orderIndex: 5 },
    { name: "Румынская тяга", muscleGroup: "Ноги и Ягодицы", gender: "female", equipment: "barbell", defaultWeight: 20, defaultReps: 12, orderIndex: 6 },
    { name: "Ягодичный мостик со штангой", muscleGroup: "Ноги и Ягодицы", gender: "female", equipment: "barbell", defaultWeight: 20, defaultReps: 12, orderIndex: 7 },
    { name: "Выпады со штангой", muscleGroup: "Ноги и Ягодицы", gender: "female", equipment: "barbell", defaultWeight: 15, defaultReps: 12, orderIndex: 8 },
    { name: "Приседания со штангой (лёгкие)", muscleGroup: "Ноги и Ягодицы", gender: "female", equipment: "barbell", defaultWeight: 15, defaultReps: 12, orderIndex: 9 },
    { name: "Болгарские сплит-приседания", muscleGroup: "Ноги и Ягодицы", gender: "female", equipment: "dumbbell", defaultWeight: 6, defaultReps: 10, orderIndex: 10 },
    { name: "Кубковые приседания", muscleGroup: "Ноги и Ягодицы", gender: "female", equipment: "dumbbell", defaultWeight: 8, defaultReps: 12, orderIndex: 11 },
    { name: "Зашагивания на скамью", muscleGroup: "Ноги и Ягодицы", gender: "female", equipment: "dumbbell", defaultWeight: 5, defaultReps: 12, orderIndex: 12 },
    { name: "Жим ногами (высокая постановка)", muscleGroup: "Ноги и Ягодицы", gender: "female", equipment: "machine", defaultWeight: 40, defaultReps: 12, orderIndex: 13 },
    { name: "Сведение ног в тренажере", muscleGroup: "Ноги и Ягодицы", gender: "female", equipment: "machine", defaultWeight: 25, defaultReps: 15, orderIndex: 14 },
    { name: "Разведение ног в тренажере", muscleGroup: "Ноги и Ягодицы", gender: "female", equipment: "machine", defaultWeight: 25, defaultReps: 15, orderIndex: 15 },
    { name: "Отведение ноги в кроссовере", muscleGroup: "Ноги и Ягодицы", gender: "female", equipment: "machine", defaultWeight: 10, defaultReps: 15, orderIndex: 16 },
    { name: "Сгибание ног сидя", muscleGroup: "Ноги и Ягодицы", gender: "female", equipment: "machine", defaultWeight: 20, defaultReps: 12, orderIndex: 17 },

    // --- Спина (Осанка) ---
    { name: "Гиперэкстензия на полу", muscleGroup: "Спина", gender: "female", equipment: "bodyweight", defaultWeight: 0, defaultReps: 15, orderIndex: 0 },
    { name: "Подтягивания в гравитроне", muscleGroup: "Спина", gender: "female", equipment: "machine", defaultWeight: 0, defaultReps: 10, orderIndex: 1 },
    { name: "Тяга гантели одной рукой", muscleGroup: "Спина", gender: "female", equipment: "dumbbell", defaultWeight: 6, orderIndex: 2 },
    { name: "Пуловер с гантелей", muscleGroup: "Спина", gender: "female", equipment: "dumbbell", defaultWeight: 6, orderIndex: 3 },
    { name: "Тяга верхнего блока", muscleGroup: "Спина", gender: "female", equipment: "machine", defaultWeight: 25, orderIndex: 4 },
    { name: "Тяга горизонтального блока", muscleGroup: "Спина", gender: "female", equipment: "machine", defaultWeight: 20, orderIndex: 5 },
    { name: "Гиперэкстензия в тренажере", muscleGroup: "Спина", gender: "female", equipment: "machine", defaultWeight: 0, defaultReps: 15, orderIndex: 6 },

    // --- Грудь (Тонус) ---
    { name: "Отжимания от пола", muscleGroup: "Грудь", gender: "female", equipment: "bodyweight", defaultWeight: 0, defaultReps: 10, orderIndex: 0 },
    { name: "Жим гантелей лежа", muscleGroup: "Грудь", gender: "female", equipment: "dumbbell", defaultWeight: 4, orderIndex: 1 },
    { name: "Разведение гантелей лежа", muscleGroup: "Грудь", gender: "female", equipment: "dumbbell", defaultWeight: 3, orderIndex: 2 },
    { name: "Сведение рук в Бабочке", muscleGroup: "Грудь", gender: "female", equipment: "machine", defaultWeight: 10, orderIndex: 3 },

    // --- Плечи и Руки ---
    { name: "Обратные отжимания от скамьи", muscleGroup: "Плечи и Руки", gender: "female", equipment: "bodyweight", defaultWeight: 0, defaultReps: 12, orderIndex: 0 },
    { name: "Жим гантелей сидя", muscleGroup: "Плечи и Руки", gender: "female", equipment: "dumbbell", defaultWeight: 4, orderIndex: 1 },
    { name: "Махи гантелей в стороны", muscleGroup: "Плечи и Руки", gender: "female", equipment: "dumbbell", defaultWeight: 2, defaultReps: 15, orderIndex: 2 },
    { name: "Разгибание руки в наклоне", muscleGroup: "Плечи и Руки", gender: "female", equipment: "dumbbell", defaultWeight: 3, defaultReps: 12, orderIndex: 3 },
    { name: "Разгибание рук в кроссовере", muscleGroup: "Плечи и Руки", gender: "female", equipment: "machine", defaultWeight: 10, defaultReps: 12, orderIndex: 4 },
    { name: "Сгибание рук в кроссовере", muscleGroup: "Плечи и Руки", gender: "female", equipment: "machine", defaultWeight: 8, defaultReps: 12, orderIndex: 5 },

    // --- Пресс ---
    { name: "Скручивания", muscleGroup: "Пресс", gender: "female", equipment: "bodyweight", defaultWeight: 0, defaultReps: 20, orderIndex: 0 },
    { name: "Планка", muscleGroup: "Пресс", gender: "female", equipment: "bodyweight", defaultWeight: 0, defaultReps: 1, orderIndex: 1 },
    { name: "Велосипед", muscleGroup: "Пресс", gender: "female", equipment: "bodyweight", defaultWeight: 0, defaultReps: 20, orderIndex: 2 },
    { name: "Скалолаз", muscleGroup: "Пресс", gender: "female", equipment: "bodyweight", defaultWeight: 0, defaultReps: 20, orderIndex: 3 },
    { name: "Мертвый жук", muscleGroup: "Пресс", gender: "female", equipment: "bodyweight", defaultWeight: 0, defaultReps: 12, orderIndex: 4 },
    { name: "Вакуум живота", muscleGroup: "Пресс", gender: "female", equipment: "bodyweight", defaultWeight: 0, defaultReps: 5, orderIndex: 5 },
    { name: "Подъем ног в упоре", muscleGroup: "Пресс", gender: "female", equipment: "bodyweight", defaultWeight: 0, defaultReps: 12, orderIndex: 6 },
];

async function seed() {
    console.log("🌱 Начинаем сидирование упражнений...");

    // Очищаем старые упражнения
    await prisma.exercise.deleteMany();

    // Создаём все упражнения
    for (const ex of exercises) {
        await prisma.exercise.create({
            data: {
                name: ex.name,
                muscleGroup: ex.muscleGroup,
                gender: ex.gender,
                equipment: ex.equipment,
                defaultSets: ex.defaultSets ?? 3,
                defaultReps: ex.defaultReps ?? 10,
                defaultWeight: ex.defaultWeight ?? 0,
                isCardio: ex.isCardio ?? false,
                defaultSpeed: ex.defaultSpeed ?? null,
                defaultIncline: ex.defaultIncline ?? null,
                defaultDuration: ex.defaultDuration ?? null,
                orderIndex: ex.orderIndex ?? 0,
            },
        });
    }

    console.log(`✅ Создано ${exercises.length} упражнений!`);
}

seed()
    .catch((e) => {
        console.error("Ошибка при seedировании:", e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
