"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Play, Dumbbell, Target, Clock, ChevronRight, ChevronLeft, Sparkles, X,
    CheckCircle, RefreshCcw, Layers, Waves, ListTree, History, Timer, Zap,
    Heart, Flame, Shield, CircleDot, SkipForward, Plus, List
} from "lucide-react";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

/* ─── Типы ─── */
type ExerciseSet = { reps: number; weight: number; duration?: string; speed?: number; incline?: number };
type ExerciseLog = { id: string; name: string; sets: ExerciseSet[]; rpe?: string; photoUrl?: string | null };
type Workout = { id: string; name: string; isCompleted: boolean; exercises: ExerciseLog[] };
type CatalogExercise = {
    id: string; name: string; muscleGroup: string; gender: string; equipment: string;
    defaultSets: number; defaultReps: number; defaultWeight: number;
    isCardio: boolean; defaultSpeed: number | null; defaultIncline: number | null; defaultDuration: number | null;
    photoUrl?: string | null;
};
type SelectedExercise = CatalogExercise & { sets?: number; reps?: number; weight?: number; duration?: number; speed?: number; incline?: number };

/* ─── Иконки мышечных групп (вместо эмодзи) ─── */
const MALE_MUSCLES = ["Грудь", "Спина", "Ноги", "Плечи", "Руки", "Пресс"];
const FEMALE_MUSCLES = ["Ноги и Ягодицы", "Спина", "Грудь", "Плечи и Руки", "Пресс"];

const containerPresets = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.1
        }
    }
};

const itemPresets = {
    hidden: { opacity: 0, y: 15, filter: "blur(4px)" },
    show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring", damping: 25, stiffness: 200 } }
};

function MuscleIcon({ name }: { name: string }) {
    const cls = "w-5 h-5";
    switch (name) {
        case "Грудь": return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4C8 4 4 7 4 11c0 2 1 4 3 5l1 1h8l1-1c2-1 3-3 3-5 0-4-4-7-8-7z" /><path d="M12 4v8M8 8c1 1 3 2 4 2M16 8c-1 1-3 2-4 2" /></svg>;
        case "Спина": return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v18" /><path d="M8 6c-2 1-3 3-3 5s1 4 3 5" /><path d="M16 6c2 1 3 3 3 5s-1 4-3 5" /><path d="M9 9h6M9 12h6M9 15h6" /></svg>;
        case "Ноги": return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v4c0 2-1 4-1 6s1 4 1 5v3" /><path d="M16 3v4c0 2 1 4 1 6s-1 4-1 5v3" /><path d="M6 21h4M14 21h4" /></svg>;
        case "Ноги и Ягодицы": return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v4c0 2-1 4-1 6s1 4 1 5v3" /><path d="M16 3v4c0 2 1 4 1 6s-1 4-1 5v3" /><path d="M6 21h4M14 21h4" /><circle cx="10" cy="5" r="1.5" /><circle cx="14" cy="5" r="1.5" /></svg>;
        case "Плечи": return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8a3 3 0 100-6 3 3 0 000 6z" /><path d="M5 20v-2a7 7 0 014-6M15 12a7 7 0 014 6v2" /><path d="M8 14l-2 3M16 14l2 3" /></svg>;
        case "Плечи и Руки": return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8a3 3 0 100-6 3 3 0 000 6z" /><path d="M6 14c-1 2-1 4 0 6" /><path d="M18 14c1 2 1 4 0 6" /><path d="M8 12l-2 2M16 12l2 2" /></svg>;
        case "Руки": return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 4c0 0-1 4-1 7s1 5 2 7" /><path d="M17 4c0 0 1 4 1 7s-1 5-2 7" /><path d="M9 8c1-1 2-1 3 0" /><path d="M12 8c1-1 2-1 3 0" /></svg>;
        case "Пресс": return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="7" y="3" width="10" height="18" rx="2" /><path d="M7 7h10M7 11h10M7 15h10" /><path d="M12 3v18" /></svg>;
        default: return <Dumbbell className={cls} strokeWidth={1.5} />;
    }
}

export default function WorkoutsPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [workout, setWorkout] = useState<Workout | null>(null);
    const [currentExIndex, setCurrentExIndex] = useState(0);
    const [tgUser, setTgUser] = useState<any>(null);
    const [screen, setScreen] = useState<"start" | "muscleSelect" | "constructor" | "workout" | "rest" | "done">("start");
    const [selectedExercises, setSelectedExercises] = useState<SelectedExercise[]>([]);
    const [workoutName, setWorkoutName] = useState("");
    const [activeGroup, setActiveGroup] = useState<string | null>(null);
    const [catalog, setCatalog] = useState<Record<string, CatalogExercise[]>>({});
    const [catalogLoading, setCatalogLoading] = useState(false);
    const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);
    const [userGender, setUserGender] = useState("Мужской");
    const [restTime, setRestTime] = useState(0);
    const [addPool, setAddPool] = useState(false);
    const [poolMinutes, setPoolMinutes] = useState(30);
    const [showAddExercise, setShowAddExercise] = useState(false);
    const [showEarlyFinish, setShowEarlyFinish] = useState(false);
    const [duplicateToast, setDuplicateToast] = useState("");
    const [userWishes, setUserWishes] = useState("");
    const [showExerciseList, setShowExerciseList] = useState(false);
    const [replacingIndex, setReplacingIndex] = useState<number | null>(null);

    const showDuplicate = (name: string) => {
        setDuplicateToast(name);
        setTimeout(() => setDuplicateToast(""), 2000);
    };
    const REST_DURATION = 90;

    useEffect(() => {
        if (typeof window !== "undefined") {
            const WebApp = require("@twa-dev/sdk").default;
            setTgUser(WebApp.initDataUnsafe?.user || { id: 123456789 });
            // Восстанавливаем тренировку из localStorage
            try {
                const saved = localStorage.getItem("activeWorkout");
                if (saved) {
                    const { workout: w, index } = JSON.parse(saved);
                    setWorkout(w);
                    setCurrentExIndex(index || 0);
                    setScreen("workout");
                }
            } catch (e) { localStorage.removeItem("activeWorkout"); }
        }
    }, []);
    const telegramIdStr = tgUser?.id?.toString();

    useEffect(() => {
        if (!telegramIdStr) return;
        fetch("/api/user", { headers: { "x-telegram-id": telegramIdStr } })
            .then(r => r.json()).then(d => { if (d.user?.gender) setUserGender(d.user.gender); }).catch(() => { });
    }, [telegramIdStr]);


    const loadCatalog = async () => {
        if (Object.keys(catalog).length > 0) return;
        setCatalogLoading(true);
        try {
            const res = await fetch(`/api/exercises?gender=${encodeURIComponent(userGender || "Мужской")}`);
            if (res.ok) { const data = await res.json(); setCatalog(data.grouped || {}); }
        } catch (e) { console.error(e); }
        setCatalogLoading(false);
    };

    useEffect(() => {
        if (screen !== "rest" || restTime <= 0) return;
        const t = setTimeout(() => setRestTime(restTime - 1), 1000);
        return () => clearTimeout(t);
    }, [restTime, screen]);

    useEffect(() => {
        if (screen === "rest" && restTime <= 0 && workout) {
            setCurrentExIndex(i => i + 1);
            setScreen("workout");
        }
    }, [restTime, screen]);

    // Сохраняем состояние тренировки в localStorage
    useEffect(() => {
        if (workout && (screen === "workout" || screen === "rest")) {
            localStorage.setItem("activeWorkout", JSON.stringify({ workout, index: currentExIndex }));
        }
    }, [workout, currentExIndex, screen]);

    const clearWorkoutStorage = () => {
        localStorage.removeItem("activeWorkout");
    };

    /* ─── Мутации ─── */
    const generateMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch("/api/workout/generate", {
                method: "POST", headers: { "Content-Type": "application/json", "x-telegram-id": telegramIdStr },
                body: JSON.stringify({ targetMuscles: selectedMuscles, userWishes }),
            });
            if (!res.ok) throw new Error("Failed");
            return (await res.json()).workout;
        },
        onSuccess: (data) => {
            // Если бассейн включён — добавляем его в конец списка упражнений
            if (addPool) {
                data.exercises.push({
                    id: "pool-" + Date.now(),
                    name: "Бассейн",
                    sets: [{ reps: 1, weight: 0, duration: `${poolMinutes} мин` }],
                });
            }
            setWorkout(data); setScreen("workout"); setCurrentExIndex(0); setSelectedMuscles([]); setAddPool(false);
            localStorage.setItem("activeWorkout", JSON.stringify({ workout: data, index: 0 }));
        },
    });

    const manualMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch("/api/workout/manual", {
                method: "POST", headers: { "Content-Type": "application/json", "x-telegram-id": telegramIdStr },
                body: JSON.stringify({ workoutName: workoutName || "Моя тренировка", selectedExercises }),
            });
            if (!res.ok) throw new Error("Failed");
            return (await res.json()).workout;
        },
        onSuccess: (data) => {
            setWorkout(data); setScreen("workout"); setCurrentExIndex(0); setSelectedExercises([]);
            localStorage.setItem("activeWorkout", JSON.stringify({ workout: data, index: 0 }));
        },
    });

    const finishMutation = useMutation({
        mutationFn: async (isEarly?: boolean) => {
            if (!workout) return;
            const res = await fetch("/api/workout/complete", {
                method: "POST", headers: { "Content-Type": "application/json", "x-telegram-id": telegramIdStr },
                body: JSON.stringify({ workoutId: workout.id, exercises: workout.exercises, isEarlyFinish: !!isEarly }),
            });
            if (!res.ok) throw new Error("Failed");
        },
        onSuccess: () => {
            setScreen("done");
            clearWorkoutStorage();
            queryClient.invalidateQueries({ queryKey: ["user", telegramIdStr] });
            queryClient.invalidateQueries({ queryKey: ["workoutHistory"] });
        },
        onError: () => {
            // Если API упал (например, из-за плохой сети), всё равно сбрасываем тренировку, чтобы она не "зависла" навечно.
            setWorkout(null);
            clearWorkoutStorage();
            setScreen("start");
            alert("Тренировка завершена, но не удалось сохранить логи в базу.");
        }
    });

    const handleRpeAndNext = (exerciseId: string, rpe: string) => {
        if (!workout) return;
        const updated = workout.exercises.map(ex => ex.id === exerciseId ? { ...ex, rpe } : ex);
        setWorkout({ ...workout, exercises: updated });
        if (currentExIndex >= workout.exercises.length - 1) return;
        setRestTime(REST_DURATION);
        setScreen("rest");
    };

    const toggleExercise = (ex: CatalogExercise) => {
        const exists = selectedExercises.find(s => s.id === ex.id);
        if (exists) setSelectedExercises(selectedExercises.filter(s => s.id !== ex.id));
        else setSelectedExercises([...selectedExercises, { ...ex }]);
    };
    const updateSelected = (id: string, field: string, value: number) => {
        setSelectedExercises(selectedExercises.map(ex => ex.id === id ? { ...ex, [field]: value } : ex));
    };

    const muscleGroups = userGender === "Женский" ? FEMALE_MUSCLES : MALE_MUSCLES;

    /* ═══════════════════ СТАРТОВЫЙ ЭКРАН ═══════════════════ */
    return (
        <>
            <AnimatePresence>
                {generateMutation.isPending && (
                    <LoadingOverlay message="AI составляет план..." type="workout" />
                )}
            </AnimatePresence>

            {screen === "start" && (
                <div className="flex flex-col h-full px-6 pt-16 pb-28 items-center justify-center gap-10">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                        <div className="w-20 h-20 rounded-[22px] bg-black dark:bg-white flex items-center justify-center mx-auto">
                            <Dumbbell className="w-9 h-9 text-white dark:text-black" strokeWidth={1.5} />
                        </div>
                        <h1 className="text-center text-[28px] font-bold tracking-tight mt-6">Тренировка</h1>
                        <p className="text-center text-gray-400 text-[15px] mt-1">Начните новую сессию</p>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }}
                        className="flex flex-col gap-3 w-full max-w-sm">

                        <button onClick={() => { setScreen("muscleSelect"); setSelectedMuscles([]); }} disabled={!telegramIdStr}
                            className="group w-full p-5 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-medium text-[16px] flex items-center justify-between active:scale-[0.98] transition-all disabled:opacity-40">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white/15 dark:bg-black/10 flex items-center justify-center">
                                    <Sparkles className="w-5 h-5" strokeWidth={1.5} />
                                </div>
                                <div className="text-left">
                                    <span className="block font-semibold">AI генерация</span>
                                    <span className="block text-[12px] opacity-60">Подберём план под вас</span>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 opacity-40 group-hover:opacity-80 transition-opacity" />
                        </button>

                        <button onClick={() => { setScreen("constructor"); loadCatalog(); }} disabled={!telegramIdStr}
                            className="group w-full p-5 rounded-2xl bg-gray-50 dark:bg-[#1c1c1e] font-medium text-[16px] flex items-center justify-between active:scale-[0.98] transition-all border border-gray-100 dark:border-gray-800 disabled:opacity-40">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                    <Dumbbell className="w-5 h-5 text-gray-500" strokeWidth={1.5} />
                                </div>
                                <div className="text-left">
                                    <span className="block font-semibold">Собрать вручную</span>
                                    <span className="block text-[12px] text-gray-400">Выберите упражнения сами</span>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors" />
                        </button>
                    </motion.div>
                </div>
            )}

            {screen === "muscleSelect" && (
                <div className="flex flex-col h-full px-6 pt-4 pb-28">
                    <button onClick={() => setScreen("start")} className="flex items-center gap-1.5 text-blue-500 text-[15px] font-medium mb-6 active:opacity-60 transition-opacity self-start">
                        <ChevronLeft className="w-5 h-5" /> Назад
                    </button>
                    <h1 className="text-[28px] font-bold tracking-tight mb-1">Группы мышц</h1>
                    <p className="text-gray-400 text-[14px] mb-6">Выберите одну или несколько</p>

                    <motion.div
                        variants={containerPresets as any}
                        initial="hidden"
                        animate="show"
                        className="flex flex-col gap-2 flex-1"
                    >
                        {muscleGroups.map((muscle) => {
                            const isSelected = selectedMuscles.includes(muscle);
                            return (
                                <motion.div key={muscle} variants={itemPresets as any}>
                                    <button
                                        onClick={() => setSelectedMuscles(prev => prev.includes(muscle) ? prev.filter(m => m !== muscle) : [...prev, muscle])}
                                        className={`w-full p-4 rounded-2xl text-left flex items-center gap-4 active:scale-[0.98] transition-all border ${isSelected ? "bg-blue-50 dark:bg-blue-500/8 border-blue-200 dark:border-blue-800" : "bg-white dark:bg-[#1c1c1e] border-gray-100 dark:border-gray-800"}`}>
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isSelected ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-400"}`}>
                                            <MuscleIcon name={muscle} />
                                        </div>
                                        <span className="font-medium flex-1 text-[15px]">{muscle}</span>
                                        <div className={`w-[22px] h-[22px] rounded-full border-[1.5px] flex items-center justify-center transition-all ${isSelected ? "border-blue-500 bg-blue-500" : "border-gray-300 dark:border-gray-600"}`}>
                                            {isSelected && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                                        </div>
                                    </button>
                                </motion.div>
                            );
                        })}
                    </motion.div>

                    {/* Бассейн — отдельный тоггл */}
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                        <button onClick={() => setAddPool(!addPool)}
                            className={`w-full p-4 rounded-2xl text-left flex items-center gap-4 active:scale-[0.98] transition-all border ${addPool ? "bg-blue-50 dark:bg-blue-500/8 border-blue-200 dark:border-blue-800" : "bg-white dark:bg-[#1c1c1e] border-gray-100 dark:border-gray-800"}`}>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${addPool ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-400"}`}>
                                <Waves className="w-5 h-5" strokeWidth={1.5} />
                            </div>
                            <div className="flex-1">
                                <span className="font-medium text-[15px] block">Бассейн</span>
                                <span className="text-[12px] text-gray-400">Добавится в конце тренировки</span>
                            </div>
                            <div className={`w-[22px] h-[22px] rounded-full border-[1.5px] flex items-center justify-center transition-all ${addPool ? "border-blue-500 bg-blue-500" : "border-gray-300 dark:border-gray-600"}`}>
                                {addPool && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                            </div>
                        </button>
                        {addPool && (
                            <div className="mt-2 px-4 flex items-center gap-3">
                                <span className="text-[13px] text-gray-400">Время (мин)</span>
                                <input type="number" value={poolMinutes} onChange={e => setPoolMinutes(+e.target.value)}
                                    className="w-20 p-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-center text-[14px] font-semibold border border-gray-100 dark:border-gray-700 focus:outline-none" />
                            </div>
                        )}
                    </div>

                    {/* Пожелания пользователя */}
                    <div className="mt-4 px-1">
                        <label className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-gray-400">
                                <Sparkles className="w-4 h-4" strokeWidth={1.5} />
                                <span className="text-[12px] uppercase font-semibold tracking-widest">Ваши пожелания</span>
                            </div>
                            <textarea
                                value={userWishes}
                                onChange={(e) => setUserWishes(e.target.value)}
                                placeholder="Например: хочу тренировку побыстрее или упор на бицепс..."
                                className="w-full p-4 rounded-2xl bg-white dark:bg-[#1c1c1e] border border-gray-100 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-[14px] min-h-[100px] resize-none placeholder:text-gray-300"
                            />
                        </label>
                    </div>

                    <AnimatePresence>
                        {(selectedMuscles.length > 0 || addPool) && (
                            <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                                onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}
                                className="mt-4 w-full p-4 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-semibold text-[16px] flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50">
                                {generateMutation.isPending ? (<><div className="w-5 h-5 rounded-full border-2 border-white/30 dark:border-black/30 border-t-white dark:border-t-black animate-spin" /> Генерируем...</>) : (<>Создать тренировку <Play className="w-4 h-4 fill-current" /></>)}
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {screen === "constructor" && (() => {
                const groupNames = Object.keys(catalog);
                const exercisesInView = activeGroup
                    ? (catalog[activeGroup] || [])
                    : Object.values(catalog).flat();

                const allSelectedInView = exercisesInView.length > 0 &&
                    exercisesInView.every(ex => selectedExercises.some(s => s.id === ex.id));

                const handleSelectAll = () => {
                    if (allSelectedInView) {
                        const idsToRemove = exercisesInView.map(ex => ex.id);
                        setSelectedExercises(prev => prev.filter(s => !idsToRemove.includes(s.id)));
                    } else {
                        setSelectedExercises(prev => {
                            const newOnes = exercisesInView.filter(ex => !prev.some(s => s.id === ex.id));
                            return [...prev, ...newOnes];
                        });
                    }
                };

                return (
                    <div className="flex flex-col h-full px-6 pt-4 pb-[180px]">
                        <button onClick={() => { setScreen("start"); setSelectedExercises([]); }}
                            className="flex items-center gap-1.5 text-blue-500 text-[15px] font-medium mb-5 active:opacity-60 transition-opacity self-start">
                            <ChevronLeft className="w-5 h-5" /> Назад
                        </button>
                        <div className="flex items-center justify-between mb-4">
                            <h1 className="text-[28px] font-bold tracking-tight">Конструктор</h1>
                            <button onClick={handleSelectAll} className="px-3 py-1.5 rounded-xl bg-blue-500/10 text-blue-500 text-[12px] font-bold active:scale-95 transition-all">
                                {allSelectedInView ? "Снять все" : "Выбрать все"}
                            </button>
                        </div>

                        <input type="text" placeholder="Название тренировки" value={workoutName} onChange={e => setWorkoutName(e.target.value)}
                            className="mb-4 p-3.5 rounded-xl bg-gray-50 dark:bg-[#1c1c1e] border border-gray-100 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-[14px] placeholder:text-gray-300" />

                        {catalogLoading && <div className="flex justify-center py-20"><div className="w-7 h-7 rounded-full border-2 border-gray-200 border-t-black dark:border-t-white animate-spin" /></div>}

                        {!catalogLoading && groupNames.length > 0 && (
                            <>
                                <div className="flex gap-2 overflow-x-auto pb-3 mb-3 scrollbar-none">
                                    {groupNames.map(g => (
                                        <button key={g} onClick={() => setActiveGroup(activeGroup === g ? null : g)}
                                            className={`whitespace-nowrap px-3.5 py-[7px] rounded-full text-[13px] font-medium transition-all ${activeGroup === g ? "bg-black dark:bg-white text-white dark:text-black" : "bg-gray-100 dark:bg-[#1c1c1e] text-gray-500"}`}>
                                            {g}
                                        </button>
                                    ))}
                                </div>
                                <motion.div
                                    variants={containerPresets as any}
                                    initial="hidden"
                                    animate="show"
                                    className="flex-1 overflow-y-auto pr-1"
                                >
                                    {(activeGroup ? [activeGroup] : groupNames).map(group => (
                                        <div key={group}>
                                            {!activeGroup && <div className="text-[11px] uppercase font-semibold text-gray-400 tracking-widest mt-5 mb-2 px-0.5">{group}</div>}
                                            {catalog[group]?.map(ex => {
                                                const isSel = !!selectedExercises.find(s => s.id === ex.id);
                                                return (
                                                    <motion.div key={ex.id} variants={itemPresets as any} className={`mb-2 rounded-2xl border p-3.5 transition-all ${isSel ? "bg-blue-50/50 dark:bg-blue-500/5 border-blue-200 dark:border-blue-900" : "bg-white dark:bg-[#1c1c1e] border-gray-100 dark:border-gray-800"}`}>
                                                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => toggleExercise(ex)}>
                                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isSel ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-400"}`}>
                                                                {isSel ? <CheckCircle className="w-4 h-4" /> : ex.isCardio ? <Waves className="w-4 h-4" /> : <Dumbbell className="w-4 h-4" />}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-medium text-[14px] truncate">{ex.name}</p>
                                                                <p className="text-[12px] text-gray-400">{ex.isCardio ? `${ex.defaultDuration} мин` : `${ex.defaultSets} × ${ex.defaultReps} · ${ex.defaultWeight} кг`}</p>
                                                            </div>
                                                        </div>
                                                        {isSel && (
                                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                                                                <div className="grid grid-cols-3 gap-2">
                                                                    {ex.isCardio ? (<>
                                                                        <label className="flex flex-col gap-1"><span className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide">Мин</span><input type="number" defaultValue={ex.defaultDuration || 5} onChange={e => updateSelected(ex.id, "duration", +e.target.value)} className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-center text-[14px] font-semibold border border-gray-100 dark:border-gray-700 focus:outline-none" /></label>
                                                                        {ex.name !== "Бассейн" && (
                                                                            <>
                                                                                <label className="flex flex-col gap-1"><span className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide">Скорость</span><input type="number" step="0.5" defaultValue={ex.defaultSpeed || 6} onChange={e => updateSelected(ex.id, "speed", +e.target.value)} className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-center text-[14px] font-semibold border border-gray-100 dark:border-gray-700 focus:outline-none" /></label>
                                                                                <label className="flex flex-col gap-1"><span className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide">Наклон</span><input type="number" step="0.5" defaultValue={ex.defaultIncline || 0} onChange={e => updateSelected(ex.id, "incline", +e.target.value)} className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-center text-[14px] font-semibold border border-gray-100 dark:border-gray-700 focus:outline-none" /></label>
                                                                            </>
                                                                        )}
                                                                    </>) : (<>
                                                                        <label className="flex flex-col gap-1"><span className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide">Подходы</span><input type="number" defaultValue={ex.defaultSets} onChange={e => updateSelected(ex.id, "sets", +e.target.value)} className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-center text-[14px] font-semibold border border-gray-100 dark:border-gray-700 focus:outline-none" /></label>
                                                                        <label className="flex flex-col gap-1"><span className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide">Повторы</span><input type="number" defaultValue={ex.defaultReps} onChange={e => updateSelected(ex.id, "reps", +e.target.value)} className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-center text-[14px] font-semibold border border-gray-100 dark:border-gray-700 focus:outline-none" /></label>
                                                                        <label className="flex flex-col gap-1"><span className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide">Вес (кг)</span><input type="number" step="2.5" defaultValue={ex.defaultWeight} onChange={e => updateSelected(ex.id, "weight", +e.target.value)} className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-center text-[14px] font-semibold border border-gray-100 dark:border-gray-700 focus:outline-none" /></label>
                                                                    </>)}
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </motion.div>
                            </>
                        )}

                    </div>
                );
            })()}

            {screen === "rest" && (() => {
                const progress = REST_DURATION > 0 ? (restTime / REST_DURATION) * 100 : 0;
                const C = 2 * Math.PI * 90;
                return (
                    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center gap-10">
                        <div className="text-center">
                            <p className="text-[13px] uppercase tracking-[0.2em] text-white/40 font-medium">Отдых</p>
                        </div>
                        <div className="relative w-56 h-56 flex items-center justify-center">
                            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 200 200">
                                <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
                                <circle cx="100" cy="100" r="90" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round"
                                    strokeDasharray={C} strokeDashoffset={C - (C * progress) / 100}
                                    style={{ transition: "stroke-dashoffset 1s linear" }} />
                            </svg>
                            <span className="text-[72px] font-extralight text-white tabular-nums tracking-tight">{restTime}</span>
                        </div>
                        <div className="text-center">
                            <p className="text-[13px] text-white/30">Следующее</p>
                            <p className="text-[15px] text-white/70 font-medium mt-1">{workout?.exercises[currentExIndex + 1]?.name || "—"}</p>
                        </div>
                        <button onClick={() => { setCurrentExIndex(i => i + 1); setScreen("workout"); }}
                            className="flex items-center gap-2 text-white/40 text-[14px] font-medium active:text-white/80 transition-colors mt-4">
                            Пропустить <SkipForward className="w-4 h-4" />
                        </button>
                    </div>
                );
            })()}

            {screen === "done" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex flex-col h-full px-6 pt-32 items-center gap-6">
                    <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                        className="w-20 h-20 rounded-[22px] bg-green-500 flex items-center justify-center">
                        <CheckCircle className="w-10 h-10 text-white" strokeWidth={1.5} />
                    </motion.div>
                    <div className="text-center">
                        <h1 className="text-[28px] font-bold tracking-tight">Готово</h1>
                        <p className="text-gray-400 text-[15px] mt-1.5">Тренировка сохранена в журнал</p>
                    </div>
                    <button onClick={() => { setWorkout(null); clearWorkoutStorage(); router.push("/"); }}
                        className="mt-6 px-8 py-3.5 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-semibold text-[15px] active:scale-[0.98] transition-all">
                        Готово
                    </button>
                </motion.div>
            )}

            {/* ═══════════════════ ПОЛНОЭКРАННОЕ УПРАЖНЕНИЕ ═══════════════════ */}
            {workout && workout.exercises[currentExIndex] && (
                (() => {
                    const exercise = workout.exercises[currentExIndex];
                    const isLast = currentExIndex >= workout.exercises.length - 1;
                    const isCardioEx = !!exercise.sets[0]?.duration;

                    return (
                        <motion.div key={currentExIndex} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }}
                            className="flex flex-col h-screen pb-4">

                            {/* Toast дубликата */}
                            <AnimatePresence>
                                {duplicateToast && (
                                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                                        className="fixed top-12 left-6 right-6 z-[100] bg-black/90 dark:bg-white/90 backdrop-blur-md text-white dark:text-black rounded-2xl p-4 text-center shadow-lg">
                                        <p className="text-[14px] font-medium">«{duplicateToast}» уже в тренировке</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <div className="px-6 pt-4 pb-3">
                                <div className="flex items-center justify-between mb-2.5">
                                    <button onClick={() => setShowExerciseList(true)} className="flex items-center gap-1.5 text-black/40 dark:text-white/40 text-[13px] font-medium active:text-black dark:active:text-white transition-colors">
                                        <List className="w-4 h-4" /> План
                                    </button>

                                    <button onClick={() => { setWorkout(null); clearWorkoutStorage(); setScreen("start"); }}
                                        className="text-[11px] font-bold text-red-500/50 uppercase tracking-widest active:opacity-60 transition-opacity">
                                        Сброс
                                    </button>

                                    <button onClick={() => { setShowAddExercise(true); loadCatalog(); }} className="flex items-center gap-1 text-blue-500 text-[13px] font-medium active:opacity-60 transition-opacity">
                                        <Plus className="w-4 h-4" /> Добавить
                                    </button>
                                </div>
                                <div className="flex gap-1">
                                    {workout.exercises.map((_, i) => (
                                        <div key={i} className={`h-[3px] flex-1 rounded-full transition-colors ${i < currentExIndex ? "bg-black dark:bg-white" : i === currentExIndex ? "bg-black/60 dark:bg-white/60" : "bg-gray-200 dark:bg-gray-800"}`} />
                                    ))}
                                </div>
                            </div>

                            {/* Кнопка досрочного завершения */}
                            <div className="px-6 mb-2">
                                <button onClick={() => setShowEarlyFinish(true)}
                                    className="text-red-500 text-[13px] font-medium active:opacity-60 transition-opacity">
                                    Завершить досрочно
                                </button>
                            </div>

                            {/* Модалка подтверждения */}
                            <AnimatePresence>
                                {showEarlyFinish && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center px-8"
                                        onClick={(e) => { e.stopPropagation(); setShowEarlyFinish(false); }}>
                                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                                            className="w-full max-w-sm bg-white dark:bg-[#1c1c1e] rounded-3xl p-6 text-center" onClick={e => e.stopPropagation()}>
                                            <h3 className="text-[18px] font-bold mb-2">Завершить тренировку?</h3>
                                            <p className="text-gray-400 text-[14px] mb-6">Оставшиеся упражнения не будут сохранены</p>
                                            <div className="flex gap-3">
                                                <button onClick={(e) => { e.stopPropagation(); setShowEarlyFinish(false); }}
                                                    className="flex-1 p-3 rounded-2xl bg-gray-100 dark:bg-gray-800 font-semibold text-[15px] active:scale-[0.98] transition-all">
                                                    Отмена
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); setShowEarlyFinish(false); finishMutation.mutate(true); }} disabled={finishMutation.isPending}
                                                    className="flex-1 p-3 rounded-2xl bg-red-500 text-white font-semibold text-[15px] active:scale-[0.98] transition-all disabled:opacity-50">
                                                    Завершить
                                                </button>
                                            </div>
                                        </motion.div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Модалка Плана тренировки */}
                            <AnimatePresence>
                                {showExerciseList && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-end"
                                        onClick={(e) => { e.stopPropagation(); setShowExerciseList(false); }}>
                                        <motion.div initial={{ y: 400 }} animate={{ y: 0 }} exit={{ y: 400 }} transition={{ type: "spring", damping: 25 }}
                                            className="w-full bg-white dark:bg-[#1c1c1e] rounded-t-3xl px-6 pt-6 pb-12 max-h-[75vh] flex flex-col"
                                            onClick={e => e.stopPropagation()}>
                                            <div className="w-10 h-1 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-4" />
                                            <div className="flex items-center justify-between mb-4 text-center px-4">
                                                <p className="text-[13px] uppercase tracking-[0.2em] text-gray-400 font-bold w-full pl-6">План тренировки</p>
                                                <button onClick={(e) => { e.stopPropagation(); setShowExerciseList(false); }} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                                                    <X className="w-4 h-4 text-gray-400" />
                                                </button>
                                            </div>
                                            <div className="flex-1 overflow-y-auto px-1 flex flex-col gap-2">
                                                {workout.exercises.map((ex, i) => {
                                                    const isCurrent = i === currentExIndex;
                                                    const isCompleted = !!ex.rpe;
                                                    return (
                                                        <div key={ex.id || i} className={`p-4 rounded-2xl flex items-center gap-4 border transition-all ${isCurrent ? "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-900" : "bg-gray-50 dark:bg-gray-800/50 border-transparent"} ${isCompleted ? "opacity-40" : ""}`}>
                                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[12px] ${isCurrent ? "bg-blue-500 text-white" : "bg-white dark:bg-gray-700 text-gray-400 shadow-sm"}`}>
                                                                {isCompleted ? <CheckCircle className="w-3.5 h-3.5" /> : (i + 1)}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className={`text-[15px] font-semibold truncate ${isCurrent ? "text-blue-600 dark:text-blue-400" : ""}`}>{ex.name}</p>
                                                                <p className="text-[12px] text-gray-400 mt-0.5">
                                                                    {(ex.sets as any[]).length} {(ex.sets as any[])[0]?.duration ? "мин" : "подх."}
                                                                </p>
                                                            </div>
                                                            {!isCompleted && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setReplacingIndex(i);
                                                                        setShowAddExercise(true);
                                                                        loadCatalog();
                                                                    }}
                                                                    className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center border border-gray-100 dark:border-gray-700 active:scale-90 transition-all shadow-sm"
                                                                    title="Заменить упражнение"
                                                                >
                                                                    <Sparkles className="w-4 h-4 text-blue-500" />
                                                                </button>
                                                            )}
                                                            {isCurrent && <div className="text-[10px] uppercase font-bold text-blue-500 tracking-wider">Сейчас</div>}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <button onClick={(e) => { e.stopPropagation(); setShowExerciseList(false); }}
                                                className="w-full mt-4 p-4 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-semibold text-[15px] active:scale-[0.98] transition-all">
                                                Закрыть
                                            </button>
                                        </motion.div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Модалка добавления упражнения */}
                            <AnimatePresence>
                                {showAddExercise && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-end" onClick={() => setShowAddExercise(false)}>
                                        <motion.div initial={{ y: 400 }} animate={{ y: 0 }} exit={{ y: 400 }} transition={{ type: "spring", damping: 25 }}
                                            className="w-full bg-white dark:bg-[#1c1c1e] rounded-t-3xl px-6 pt-6 pb-12 max-h-[75vh] flex flex-col" onClick={e => e.stopPropagation()}>
                                            <div className="w-10 h-1 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-4" />
                                            <h3 className="text-[20px] font-bold mb-4">Добавить в тренировку</h3>

                                            {/* Быстрая опция — Бассейн */}
                                            <button onClick={() => {
                                                setWorkout(w => {
                                                    if (!w) return w;
                                                    if (w.exercises.some(e => e.name === "Бассейн")) { showDuplicate("Бассейн"); return w; }
                                                    return { ...w, exercises: [...w.exercises, { id: "pool-" + Date.now(), name: "Бассейн", sets: [{ reps: 1, weight: 0, duration: "30 мин" }] }] };
                                                });
                                                setShowAddExercise(false);
                                            }}
                                                className="w-full p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center gap-3 active:scale-[0.98] transition-all mb-3 border border-blue-100 dark:border-blue-900/30">
                                                <div className="w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center text-white">
                                                    <Waves className="w-4 h-4" strokeWidth={1.5} />
                                                </div>
                                                <div className="text-left">
                                                    <span className="font-medium text-[14px] block">Бассейн</span>
                                                    <span className="text-[11px] text-gray-400">30 мин · в конце</span>
                                                </div>
                                            </button>

                                            {/* Каталог упражнений */}
                                            <div className="flex-1 overflow-y-auto -mx-6 px-6">
                                                {Object.keys(catalog).length === 0 ? (
                                                    <div className="flex justify-center py-8">
                                                        <div className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-black dark:border-t-white animate-spin" />
                                                    </div>
                                                ) : (
                                                    Object.entries(catalog).map(([group, exs]) => (
                                                        <div key={group}>
                                                            <div className="text-[11px] uppercase font-semibold text-gray-400 tracking-widest mt-3 mb-1.5">{group}</div>
                                                            {exs.map(ex => (
                                                                <button key={ex.id} onClick={() => {
                                                                    setWorkout(w => {
                                                                        if (!w) return w;

                                                                        const newEx: ExerciseLog = {
                                                                            id: (replacingIndex !== null ? "replaced-" : "added-") + Date.now() + "-" + ex.id,
                                                                            name: ex.name,
                                                                            sets: ex.isCardio
                                                                                ? [{ reps: 1, weight: 0, duration: `${ex.defaultDuration || 5} мин` }]
                                                                                : Array.from({ length: ex.defaultSets }, () => ({ reps: ex.defaultReps, weight: ex.defaultWeight })),
                                                                            photoUrl: ex.photoUrl || null,
                                                                        };

                                                                        if (replacingIndex !== null) {
                                                                            const updated = [...w.exercises];
                                                                            updated[replacingIndex] = newEx;
                                                                            return { ...w, exercises: updated };
                                                                        }

                                                                        if (w.exercises.some(e => e.name === ex.name)) { showDuplicate(ex.name); return w; }

                                                                        // Вставляем перед бассейном, если он есть в конце
                                                                        const poolIdx = w.exercises.findIndex(e => e.name === "Бассейн");
                                                                        if (poolIdx >= 0) {
                                                                            const updated = [...w.exercises];
                                                                            updated.splice(poolIdx, 0, newEx);
                                                                            return { ...w, exercises: updated };
                                                                        }
                                                                        return { ...w, exercises: [...w.exercises, newEx] };
                                                                    });
                                                                    setShowAddExercise(false);
                                                                    setReplacingIndex(null);
                                                                }}
                                                                    className="w-full p-3 rounded-xl flex items-center gap-3 active:bg-gray-50 dark:active:bg-gray-800 transition-colors">
                                                                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                                                                        {ex.isCardio ? <Waves className="w-3.5 h-3.5" /> : <Dumbbell className="w-3.5 h-3.5" />}
                                                                    </div>
                                                                    <div className="text-left flex-1 min-w-0">
                                                                        <span className="font-medium text-[14px] block truncate">{ex.name}</span>
                                                                        <span className="text-[11px] text-gray-400">{ex.isCardio ? `${ex.defaultDuration} мин` : `${ex.defaultSets}×${ex.defaultReps} · ${ex.defaultWeight} кг`}</span>
                                                                    </div>
                                                                    <Plus className="w-4 h-4 text-gray-300" />
                                                                </button>
                                                            ))}
                                                        </div>
                                                    ))
                                                )}
                                            </div>

                                            <button onClick={() => setShowAddExercise(false)}
                                                className="w-full p-3 text-center text-gray-400 text-[14px] font-medium active:opacity-60 transition-opacity mt-3 border-t border-gray-100 dark:border-gray-800 pt-3">
                                                Отмена
                                            </button>
                                        </motion.div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Видео-зона (теперь фото) */}
                            <div className="mx-auto w-[65%] mt-2 rounded-3xl bg-gray-50/50 dark:bg-[#1c1c1e] min-h-[130px] flex items-center justify-center overflow-hidden relative border border-gray-100 dark:border-gray-800/50">
                                {exercise.photoUrl ? (
                                    <motion.img
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        key={exercise.photoUrl}
                                        src={encodeURI(exercise.photoUrl)}
                                        alt={exercise.name}
                                        fetchPriority="high"
                                        loading="eager"
                                        className="w-full h-auto block"
                                    />
                                ) : (
                                    <div className="text-center">
                                        <Dumbbell className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto" strokeWidth={1} />
                                        <p className="text-[11px] text-gray-300 dark:text-gray-600 mt-2 uppercase tracking-widest font-medium">Нет фото</p>
                                    </div>
                                )}
                            </div>

                            {/* Информация */}
                            <div className="px-6 mt-4 flex-1 flex flex-col">
                                <h2 className="text-[24px] font-bold tracking-tight leading-tight">{exercise.name}</h2>

                                {isCardioEx ? (
                                    <div className="mt-5 flex gap-3">
                                        <div className="flex-1 p-3 rounded-2xl bg-gray-50 dark:bg-[#1c1c1e] text-center border border-gray-100 dark:border-gray-800">
                                            <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide">Время</p>
                                            <p className="text-[22px] font-bold mt-0.5">{exercise.sets[0].duration}</p>
                                        </div>
                                        {exercise.sets[0].speed && exercise.name !== "Бассейн" ? (
                                            <div className="flex-1 p-3 rounded-2xl bg-gray-50 dark:bg-[#1c1c1e] text-center border border-gray-100 dark:border-gray-800">
                                                <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide">км/ч</p>
                                                <p className="text-[22px] font-bold mt-0.5">{exercise.sets[0].speed}</p>
                                            </div>
                                        ) : null}
                                        {exercise.sets[0].incline && exercise.name !== "Бассейн" ? (
                                            <div className="flex-1 p-3 rounded-2xl bg-gray-50 dark:bg-[#1c1c1e] text-center border border-gray-100 dark:border-gray-800">
                                                <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide">Наклон</p>
                                                <p className="text-[22px] font-bold mt-0.5">{exercise.sets[0].incline}%</p>
                                            </div>
                                        ) : null}
                                    </div>
                                ) : (
                                    <div className="mt-3 flex flex-col gap-1.5">
                                        {exercise.sets.map((set, i) => (
                                            <div key={i} className="flex justify-between items-center py-3 px-4 rounded-xl bg-gray-50 dark:bg-[#1c1c1e]">
                                                <span className="text-[14px] text-gray-400 font-medium tabular-nums">Подход {i + 1}</span>
                                                <span className="text-[14px] font-semibold tabular-nums">{set.reps} × {set.weight} кг</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* RPE */}
                                {!exercise.rpe && (
                                    <div className="mt-8 mb-6">
                                        <button onClick={() => handleRpeAndNext(exercise.id, "done")}
                                            className="w-full p-4 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-semibold text-[16px] flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
                                            <CheckCircle className="w-5 h-5" strokeWidth={1.5} /> Выполнено
                                        </button>
                                    </div>
                                )}

                                {/* Кнопка завершения */}
                                {exercise.rpe && isLast && (
                                    <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                        onClick={() => finishMutation.mutate(false)} disabled={finishMutation.isPending}
                                        className="mt-auto mb-4 w-full p-4 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-semibold text-[16px] flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50">
                                        {finishMutation.isPending ? "Сохраняем..." : "Завершить тренировку"}
                                    </motion.button>
                                )}
                            </div>
                        </motion.div>
                    );
                })()
            )}
        </>
    );
}
