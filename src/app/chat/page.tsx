"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Bot, Zap, Trash2, ChevronLeft, MoreHorizontal, Sparkles, Camera, X as XIcon, Image as ImageIcon } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { LoadingOverlay } from "@/components/LoadingOverlay";

type Message = {
    id: string;
    role: "user" | "assistant";
    content: string;
    imageUrl?: string | null;
};

export default function ChatPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [input, setInput] = useState("");
    const endOfMessagesRef = useRef<HTMLDivElement>(null);
    const [tgUser, setTgUser] = useState<any>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (typeof window !== "undefined") {
            const WebApp = require("@twa-dev/sdk").default;
            setTgUser(WebApp.initDataUnsafe?.user || { id: 123456789 });
        }
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const telegramIdStr = tgUser?.id?.toString() || "";

    const { data: historyMessages, isLoading: isHistoryLoading } = useQuery({
        queryKey: ["chatHistory", telegramIdStr],
        queryFn: async () => {
            const res = await fetch("/api/chat", { headers: { "x-telegram-id": telegramIdStr } });
            if (!res.ok) throw new Error("Failed");
            const data = await res.json();
            return data.messages as Message[];
        },
        enabled: !!telegramIdStr,
    });

    useEffect(() => {
        if (historyMessages) setMessages(historyMessages);
    }, [historyMessages]);

    const clearMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch("/api/chat", { method: "DELETE", headers: { "x-telegram-id": telegramIdStr } });
            if (!res.ok) throw new Error("Failed");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["chatHistory", telegramIdStr] });
            setMessages([]);
            if (typeof window !== "undefined") require("@twa-dev/sdk").default.HapticFeedback.notificationOccurred("success");
        }
    });

    const chatMutation = useMutation({
        mutationFn: async ({ text, image }: { text: string; image?: string | null }) => {
            const res = await fetch("/api/chat", {
                method: "POST", headers: { "Content-Type": "application/json", "x-telegram-id": telegramIdStr },
                body: JSON.stringify({ message: text, imageBase64: image }),
            });
            if (!res.ok) throw new Error("Failed");
            return (await res.json()).reply;
        },
        onSuccess: (reply) => {
            const aiMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: reply };
            setMessages((prev) => [...prev, aiMsg]);
            if (typeof window !== "undefined") require("@twa-dev/sdk").default.HapticFeedback.impactOccurred("light");
        },
        onError: () => {
            const errorMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: "Связь потеряна, попробуй еще раз." };
            setMessages((prev) => [...prev, errorMsg]);
        }
    });

    const sendMessage = (text: string) => {
        if ((!text.trim() && !selectedImage) || !telegramIdStr || chatMutation.isPending) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: "user",
            content: text,
            imageUrl: selectedImage
        };

        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        const imgToSend = selectedImage;
        setSelectedImage(null);
        chatMutation.mutate({ text, image: imgToSend });
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setSelectedImage(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const inlineActions = ["Свело мышцу", "Занят тренажер", "Болит плечо", "Хочу пить"];

    return (
        <>
            <AnimatePresence>
                {isHistoryLoading && <LoadingOverlay message="Загружаем историю..." />}
            </AnimatePresence>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed inset-0 flex flex-col bg-white dark:bg-black overflow-hidden z-[60]"
            >
                {/* Header - Fixed at top */}
                <div className="flex items-center justify-between px-4 py-4 border-b border-white/5 dark:border-white/5 bg-white/30 dark:bg-black/30 backdrop-blur-2xl z-20">
                    <div className="flex items-center gap-2">
                        <button onClick={() => router.push("/")}
                            className="w-10 h-10 flex items-center justify-center rounded-full active:bg-gray-100 dark:active:bg-gray-800 transition-colors">
                            <ChevronLeft className="w-6 h-6 text-gray-800 dark:text-gray-200" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-black dark:bg-white flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-white dark:text-black" />
                            </div>
                            <div>
                                <h1 className="text-[17px] font-bold tracking-tight">Forma</h1>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-[11px] text-gray-400 font-medium font-mono uppercase tracking-wider">Online</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => clearMutation.mutate()} disabled={clearMutation.isPending || isHistoryLoading}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 dark:bg-[#1c1c1e] text-gray-400 active:scale-95 transition-all">
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>

                {/* Messages Area - Scrollable */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scrollbar-none">
                    {isHistoryLoading && (
                        <div className="flex justify-center items-center h-full">
                            <div className="w-6 h-6 rounded-full border-2 border-gray-100 border-t-black dark:border-t-white animate-spin" />
                        </div>
                    )}

                    <AnimatePresence initial={false}>
                        {messages.map((msg) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                                <div className={`max-w-[85%] rounded-[20px] text-[15px] leading-relaxed shadow-sm overflow-hidden ${msg.role === "user"
                                    ? "bg-blue-600 text-white rounded-br-none"
                                    : "bg-gray-100 dark:bg-[#1c1c1e] text-black dark:text-white rounded-bl-none"
                                    }`}>
                                    {msg.imageUrl && (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={msg.imageUrl} alt="Отправленное фото" className="w-full h-auto max-h-[300px] object-cover border-b border-white/10" />
                                    )}
                                    {msg.content && (
                                        <div className="px-4 py-3">
                                            {msg.content}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {chatMutation.isPending && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                            <div className="bg-gray-100 dark:bg-[#1c1c1e] rounded-[20px] rounded-bl-none px-5 py-4 flex items-center gap-1.5 shadow-sm">
                                <div className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-600 rounded-full animate-bounce" />
                                <div className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                <div className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                            </div>
                        </motion.div>
                    )}
                    <div ref={endOfMessagesRef} />
                </div>

                {/* Input & Quick Actions Area - Fixed at bottom */}
                <div className="bg-white/30 dark:bg-black/30 backdrop-blur-2xl border-t border-white/5 dark:border-white/5 px-4 pt-4 pb-12 z-20">

                    {/* Preview Image */}
                    <AnimatePresence>
                        {selectedImage && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                                className="px-4 mb-4 relative inline-block">
                                <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-blue-500 shadow-lg">
                                // eslint-disable-next-line @next/next/no-img-element
                                    <img src={selectedImage} alt="Превью" className="w-full h-full object-cover" />
                                    <button onClick={() => setSelectedImage(null)}
                                        className="absolute top-1 right-1 w-5 h-5 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white">
                                        <XIcon className="w-3 h-3" />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Input Field */}
                    <div className="relative flex items-center px-2 gap-2">
                        <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
                        <button onClick={() => fileInputRef.current?.click()} disabled={chatMutation.isPending}
                            className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-50 dark:bg-[#1c1c1e] text-gray-400 active:scale-90 transition-all">
                            <Camera className="w-5 h-5" />
                        </button>

                        <div className="relative flex-1 flex items-center">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
                                placeholder={selectedImage ? "Добавь подпись..." : "Спроси о чем угодно..."}
                                className="w-full bg-gray-50 dark:bg-[#1c1c1e] text-[15px] text-black dark:text-white rounded-[24px] py-4 pl-6 pr-14 focus:outline-none border border-gray-100 dark:border-gray-800 transition-all focus:border-gray-300 dark:focus:border-gray-600 shadow-inner"
                            />
                            <button
                                onClick={() => sendMessage(input)}
                                disabled={(!input.trim() && !selectedImage) || chatMutation.isPending}
                                className="absolute right-2 w-10 h-10 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center active:scale-90 transition-all disabled:opacity-20"
                            >
                                <Send className="w-4 h-4 ml-0.5" strokeWidth={3} />
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </>
    );
}
