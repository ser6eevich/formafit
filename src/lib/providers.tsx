"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 60 * 1000, // Данные свежие одну минуту
                        refetchOnWindowFocus: false,
                    },
                },
            })
    );

    const [isTelegram, setIsTelegram] = useState<boolean | null>(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const WebApp = require("@twa-dev/sdk").default;
            // В режиме разработки разрешаем заходить из браузера (для тестирования)
            if (process.env.NODE_ENV === "development") {
                setIsTelegram(true);
            } else {
                // Если данные инициализации пустые - значит открыто из обычного мобильного браузера
                setIsTelegram(!!WebApp.initData);
            }
        }
    }, []);

    // Если еще не определили (чтобы избежать моргания UI)
    if (isTelegram === null) {
        return <div className="min-h-screen bg-black" />;
    }

    if (isTelegram === false) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-black px-6 text-center">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                    <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h1 className="text-[22px] font-bold text-white mb-2">Доступ запрещен</h1>
                <p className="text-gray-400 text-[15px]">Пожалуйста, откройте это приложение внутри Telegram.</p>
            </div>
        );
    }

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}
