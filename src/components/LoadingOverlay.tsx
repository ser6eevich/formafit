"use client";

import { motion } from "framer-motion";
import { Sparkles, Dumbbell } from "lucide-react";

interface LoadingOverlayProps {
    message?: string;
    type?: "ai" | "workout";
}

export function LoadingOverlay({ message = "AI анализирует...", type = "ai" }: LoadingOverlayProps) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/60 dark:bg-black/80 backdrop-blur-2xl"
        >
            <div className="relative">
                {/* Анимированный фон (пульсация) */}
                <motion.div
                    animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.3, 0.1, 0.3]
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="absolute inset-0 bg-blue-500 rounded-full blur-[40px]"
                />

                {/* Иконка */}
                <motion.div
                    animate={{
                        y: [0, -10, 0],
                        rotate: [0, 5, -5, 0]
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="relative w-20 h-20 rounded-[28px] bg-black dark:bg-white flex items-center justify-center shadow-2xl"
                >
                    {type === "ai" ? (
                        <Sparkles className="w-10 h-10 text-white dark:text-black" />
                    ) : (
                        <Dumbbell className="w-10 h-10 text-white dark:text-black" />
                    )}
                </motion.div>
            </div>

            {/* Текст */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-10 flex flex-col items-center gap-3"
            >
                <p className="text-[17px] font-bold tracking-tight text-gray-900 dark:text-white uppercase tracking-[0.1em]">
                    {message}
                </p>
                <div className="flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                            className="w-1.5 h-1.5 rounded-full bg-blue-500"
                        />
                    ))}
                </div>
            </motion.div>
        </motion.div>
    );
}
