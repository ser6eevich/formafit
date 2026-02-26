import { Bot, InlineKeyboard } from "grammy";
import * as dotenv from "dotenv";

// Загружаем переменные окружения (если запускаем локально)
dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
    console.error("❌ Ошибка: Не указан TELEGRAM_BOT_TOKEN в файле .env");
    process.exit(1);
}

const bot = new Bot(token);

// URL вашего развернутого приложения
const WEB_APP_URL = "https://formafitai.ru";

// Обработчик команды /start
bot.command("start", async (ctx) => {
    try {
        // Устанавливаем кнопку меню слева внизу от строки ввода
        await ctx.api.setChatMenuButton({
            chat_id: ctx.chat.id,
            menu_button: {
                type: "web_app",
                text: "✨ Forma",
                web_app: { url: WEB_APP_URL },
            },
        });

        // Создаем инлайн клавиатуру (кнопку под сообщением)
        const keyboard = new InlineKeyboard()
            .webApp("🚀 Открыть приложение Forma", WEB_APP_URL);

        // Отправляем приветственное видео или просто сообщение
        await ctx.reply(
            "👋 Привет! Я — **Forma AI Fitness**.\n\n" +
            "Я твой умный персональный тренер. Я помогу тебе:\n" +
            "🏋️‍♂️ Составить идеальную программу тренировок\n" +
            "🥗 Проанализировать питание по фото\n" +
            "📊 Отслеживать прогресс.\n\n" +
            "Нажми кнопку ниже, чтобы начать!",
            {
                reply_markup: keyboard,
                parse_mode: "Markdown"
            }
        );
    } catch (e) {
        console.error("Ошибка при ответе на /start:", e);
    }
});

// Глобальный перехватчик ошибок
bot.catch((err) => {
    const ctx = err.ctx;
    console.error(`[Бот] Ошибка при обработке обновления ${ctx.update.update_id}:`, err.error);
});

// Запуск бота (Long Polling)
console.log("🤖 Инициализация Forma Telegram Bot...");
bot.start({
    onStart: (botInfo) => {
        console.log(`✅ Бот успешно запущен и готов к работе! Имя пользователя: @${botInfo.username}`);
        console.log(`🔗 Web App URL установлен на: ${WEB_APP_URL}`);
    }
});
