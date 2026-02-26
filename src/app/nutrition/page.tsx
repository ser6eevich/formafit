"use client";

import { useEffect, useState, useRef } from "react";
import { Camera, RefreshCw, Layers, ChevronRight, Apple, Zap, Droplet, Plus, X, Search, Coffee, Utensils, UtensilsCrossed, Cookie } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type NutritionData = {
  totals: { calories: number; protein: number; carbs: number; fats: number };
  goals: { calories: number; protein: number; carbs: number; fats: number };
  items: any[];
};

const containerPresets = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemPresets = {
  hidden: { opacity: 0, y: 15, filter: "blur(4px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring", damping: 25, stiffness: 200 } }
};

const MacroCard = ({ value, max, label, icon: Icon, color }: { value: number; max: number; label: string; icon: any; color: { bg: string; text: string; marker: string } }) => {
  const percent = Math.min((value / max) * 100, 100);
  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-[#1c1c1e] border border-gray-100 dark:border-gray-800 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${color.bg} ${color.text}`}>
            <Icon className="w-3.5 h-3.5" strokeWidth={2} />
          </div>
          <span className="text-[11px] uppercase font-semibold text-gray-400 tracking-widest">{label}</span>
        </div>
        <span className="text-[14px] font-bold tabular-nums">{value}<span className="text-[10px] text-gray-400 font-normal ml-0.5">г</span></span>
      </div>
      <div className="h-1.5 w-full bg-gray-50 dark:bg-gray-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full rounded-full ${color.marker}`}
        />
      </div>
    </div>
  );
};

export default function NutritionPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tgUser, setTgUser] = useState<any>(null);

  // States for Add Meal Modal
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [mealType, setMealType] = useState("Завтрак");
  const [mealDescription, setMealDescription] = useState("");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const WebApp = require("@twa-dev/sdk").default;
      setTgUser(WebApp.initDataUnsafe?.user || { id: 123456789 });

      // Auto-set meal type based on hour
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 11) setMealType("Завтрак");
      else if (hour >= 11 && hour < 16) setMealType("Обед");
      else if (hour >= 16 && hour < 22) setMealType("Ужин");
      else setMealType("Перекус");
    }
  }, []);

  const telegramIdStr = tgUser?.id?.toString() || "";

  const { data, isLoading, isError, error, isRefetching } = useQuery<NutritionData>({
    queryKey: ["nutrition", telegramIdStr],
    queryFn: async () => {
      const res = await fetch("/api/nutrition", {
        headers: {
          "x-telegram-id": telegramIdStr,
          "x-timezone-offset": new Date().getTimezoneOffset().toString()
        },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to fetch nutrition data");
      }
      return res.json();
    },
    enabled: !!telegramIdStr,
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const analyzeMutation = useMutation({
    mutationFn: async (payload: { imageBase64?: string; text?: string; mealType: string }) => {
      const res = await fetch("/api/nutrition/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-telegram-id": telegramIdStr },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nutrition", telegramIdStr] });
      queryClient.invalidateQueries({ queryKey: ["nutritionHistory", telegramIdStr] });
      setShowAddMeal(false);
      setMealDescription("");
      setCapturedImage(null);
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 512;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL("image/jpeg", 0.7).split(",")[1];
        setCapturedImage(base64);
      };
      if (event.target?.result) img.src = event.target.result as string;
    };
    reader.readAsDataURL(file);
  };

  const nutrition = data || {
    totals: { calories: 0, protein: 0, carbs: 0, fats: 0 },
    goals: { calories: 0, protein: 0, carbs: 0, fats: 0 },
    items: [],
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="px-6 pt-12 pb-32 flex flex-col gap-6"
    >
      <AnimatePresence>
        {(isLoading || isRefetching) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed top-4 right-6 z-50 flex items-center gap-2 bg-white/80 dark:bg-black/80 px-3 py-1.5 rounded-full backdrop-blur-md border border-gray-100 dark:border-gray-800 shadow-sm"
          >
            <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-200 border-t-black dark:border-t-white animate-spin" />
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Обновляем</span>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-[28px] font-bold tracking-tight">Питание</h1>
      </div>

      {isError && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-900/30 text-center">
          <p className="text-[13px] text-red-600 dark:text-red-400 font-medium">Ошибка загрузки данных: {(error as Error).message}</p>
          <button onClick={() => queryClient.invalidateQueries({ queryKey: ["nutrition"] })} className="mt-2 text-[12px] font-bold text-blue-500 uppercase">Попробовать снова</button>
        </div>
      )}

      {/* Main Calorie Header */}
      <div className="p-6 rounded-[2.5rem] bg-black dark:bg-[#1c1c1e] text-white flex flex-col items-center gap-1 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl rounded-full -mr-16 -mt-16" />
        <span className="text-[11px] uppercase font-semibold text-gray-400 tracking-[0.2em] relative z-10">КАЛОРИИ ЗА ДЕНЬ</span>
        <div className="flex items-baseline gap-2 relative z-10">
          <span className="text-[56px] font-bold tracking-tighter leading-none">{nutrition.totals.calories}</span>
          <span className="text-[20px] text-gray-400 font-medium">/ {nutrition.goals.calories || 2000}</span>
        </div>
        <div className="w-full h-1 bg-white/10 rounded-full mt-4 overflow-hidden relative z-10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((nutrition.totals.calories / (nutrition.goals.calories || 2000)) * 100, 100)}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-white rounded-full"
          />
        </div>
      </div>

      {/* Macros Grid */}
      <motion.div
        variants={containerPresets as any}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-2"
      >
        <motion.div variants={itemPresets as any}>
          <MacroCard value={nutrition.totals.protein} max={nutrition.goals.protein || 100} label="Белки" icon={Apple} color={{ bg: "bg-blue-50 dark:bg-blue-500/10", text: "text-blue-500", marker: "bg-blue-500" }} />
        </motion.div>
        <motion.div variants={itemPresets as any}>
          <MacroCard value={nutrition.totals.carbs} max={nutrition.goals.carbs || 200} label="Углеводы" icon={Zap} color={{ bg: "bg-green-50 dark:bg-green-500/10", text: "text-green-500", marker: "bg-green-500" }} />
        </motion.div>
        <motion.div variants={itemPresets as any}>
          <MacroCard value={nutrition.totals.fats} max={nutrition.goals.fats || 60} label="Жиры" icon={Droplet} color={{ bg: "bg-yellow-50 dark:bg-yellow-500/10", text: "text-yellow-500", marker: "bg-yellow-500" }} />
        </motion.div>
      </motion.div>

      {/* Meals List */}
      <div className="mt-2 text-left">
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
            <h2 className="text-[16px] font-bold tracking-tight">Съедено сегодня</h2>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <AnimatePresence mode="popLayout">
            {nutrition.items && nutrition.items.length > 0 ? (
              nutrition.items.slice().reverse().map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 15, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, scale: 0.9, filter: "blur(4px)" }}
                  transition={{ type: "spring", damping: 25, stiffness: 200, delay: index * 0.05 }}
                >
                  <div className="p-4 rounded-2xl bg-white dark:bg-[#1c1c1e] border border-gray-100 dark:border-gray-800 flex justify-between items-center active:scale-[0.98] transition-all">
                    <div className="flex flex-col gap-0.5">
                      <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-0.5">{item.mealType}</p>
                      <p className="font-semibold text-[14px] line-clamp-1">{item.foodName || item.name}</p>
                      <p className="text-[12px] text-gray-400 font-medium">Б: {Math.round(item.protein)}г • У: {Math.round(item.carbs)}г • Ж: {Math.round(item.fats)}г</p>
                    </div>
                    <div className="font-bold text-[14px] tabular-nums">
                      {item.calories} <span className="text-[10px] text-gray-400 font-normal ml-0.5">ккал</span>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-8 rounded-3xl bg-gray-50 dark:bg-[#1c1c1e]/50 text-center border-2 border-dashed border-gray-100 dark:border-gray-800"
              >
                <Apple className="w-8 h-8 mx-auto mb-2 text-gray-200 dark:text-gray-700" strokeWidth={1} />
                <p className="text-[13px] text-gray-400 leading-relaxed font-medium">Пока нет записей.<br />Запишите прием пищи через кнопку ниже.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* FIXED BOTTOM ADD BUTTON */}
      <div className="fixed bottom-[92px] left-0 right-0 px-6 max-w-md mx-auto z-50">
        <button
          onClick={() => setShowAddMeal(true)}
          className="w-full h-[54px] rounded-[20px] bg-black dark:bg-white text-white dark:text-black font-bold flex items-center justify-center gap-2.5 shadow-2xl active:scale-[0.97] transition-all"
        >
          <Plus className="w-6 h-6" strokeWidth={2.5} />
          <span className="text-[17px]">Добавить прием пищи</span>
        </button>
      </div>

      {/* ADD MEAL BOTTOM SHEET */}
      <AnimatePresence>
        {showAddMeal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddMeal(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] overflow-hidden"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#1c1c1e] rounded-t-[2.5rem] z-[100] px-6 pt-10 pb-12 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full" />

              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold tracking-tight">Новая запись</h2>
                <button onClick={() => setShowAddMeal(false)} className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Meal Type Selection */}
              <div className="grid grid-cols-4 gap-2 mb-8">
                {[
                  { id: "Завтрак", icon: Coffee },
                  { id: "Обед", icon: Utensils },
                  { id: "Ужин", icon: UtensilsCrossed },
                  { id: "Перекус", icon: Cookie }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setMealType(t.id)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all ${mealType === t.id
                      ? "bg-black text-white dark:bg-white dark:text-black shadow-lg"
                      : "bg-gray-50 dark:bg-gray-800 text-gray-400"
                      }`}
                  >
                    <t.icon className="w-5 h-5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">{t.id}</span>
                  </button>
                ))}
              </div>

              {/* Manual Description */}
              <div className="mb-8">
                <p className="text-[11px] uppercase font-semibold text-gray-400 tracking-widest mb-3 ml-1">Что в тарелке?</p>
                <div className="relative">
                  <textarea
                    value={mealDescription}
                    onChange={(e) => setMealDescription(e.target.value)}
                    placeholder="Например: 2 яйца, а avocado toast и большой латте..."
                    className="w-full p-5 rounded-3xl bg-gray-50 dark:bg-gray-800 text-[15px] min-h-[120px] focus:outline-none border-2 border-transparent focus:border-black dark:focus:border-white transition-all resize-none"
                  />
                  <div className="absolute bottom-4 right-4 text-gray-300 pointer-events-none">
                    <Search className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Photo Upload Area */}
              <div className="mb-10">
                <p className="text-[11px] uppercase font-semibold text-gray-400 tracking-widest mb-3 ml-1">Или добавьте фото</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full overflow-hidden rounded-3xl border-2 border-dashed flex flex-col items-center justify-center transition-all ${capturedImage
                    ? "aspect-video border-black dark:border-white"
                    : "h-[100px] border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30"
                    }`}
                >
                  {capturedImage ? (
                    <img src={`data:image/jpeg;base64,${capturedImage}`} className="w-full h-full object-cover" alt="Captured" />
                  ) : (
                    <div className="flex items-center gap-3 text-gray-400">
                      <Camera className="w-5 h-5" />
                      <span className="text-[14px] font-semibold">Сфотографировать</span>
                    </div>
                  )}
                </button>
              </div>

              <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />

              {/* Submit Button */}
              <button
                disabled={(!mealDescription.trim() && !capturedImage) || analyzeMutation.isPending}
                onClick={() => analyzeMutation.mutate({ text: mealDescription, imageBase64: capturedImage || undefined, mealType })}
                className="w-full h-[64px] rounded-[22px] bg-black dark:bg-white text-white dark:text-black font-bold text-[17px] flex items-center justify-center gap-2 disabled:opacity-20 active:scale-[0.98] transition-all shadow-xl"
              >
                {analyzeMutation.isPending ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Анализируем состав...</span>
                  </>
                ) : (
                  <span>Готово</span>
                )}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
