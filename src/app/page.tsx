"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Dumbbell, Target, Activity, Send, ChevronRight, ChevronLeft, X, CalendarDays, Clock, Flame, Utensils, Apple, Settings, Bell, BellDot } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type UserData = {
  telegramId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
  birthDate?: string;
  weight?: number;
  height?: number;
  goal?: string;
  injuries?: string;
  experience?: string;
  gender?: string;
  notificationsEnabled: boolean;
  alwaysAddPool: boolean;
};
const fetchUser = async (telegramId: string): Promise<UserData | null> => {
  const res = await fetch("/api/user", { headers: { "x-telegram-id": telegramId } });
  if (!res.ok) { if (res.status === 404) return null; throw new Error("Failed"); }
  return (await res.json()).user;
};

const fetchNotifications = async (telegramId: string) => {
  const res = await fetch("/api/notifications", { headers: { "x-telegram-id": telegramId } });
  if (!res.ok) throw new Error("Failed");
  return (await res.json()).notifications;
};

const markAsRead = async ({ notificationId, telegramId }: { notificationId: string; telegramId: string }) => {
  const res = await fetch("/api/notifications", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-telegram-id": telegramId },
    body: JSON.stringify({ notificationId }),
  });
  if (!res.ok) throw new Error("Failed");
  return await res.json();
};

const saveUser = async ({ formData, telegramId }: { formData: Partial<UserData>; telegramId: string }) => {
  const res = await fetch("/api/user", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-telegram-id": telegramId },
    body: JSON.stringify({ ...formData, telegramId }),
  });
  if (!res.ok) throw new Error("Failed");
  return (await res.json()).user;
};

const containerPresets = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const itemPresets = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", damping: 25, stiffness: 200 } }
};

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const [tgUser, setTgUser] = useState<any>(null);
  const [step, setStep] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [formData, setFormData] = useState<Partial<UserData>>({});

  useEffect(() => {
    let currentUser = { id: 123456789, first_name: "Иван", last_name: "Иванов", username: "testuser", photo_url: "" };
    if (typeof window !== "undefined") {
      const WebApp = require("@twa-dev/sdk").default;
      WebApp.ready();
      WebApp.expand();
      if (WebApp.initDataUnsafe?.user) currentUser = WebApp.initDataUnsafe.user;
    }
    setTgUser(currentUser);
    setFormData({ firstName: currentUser.first_name, lastName: currentUser.last_name, username: currentUser.username, photoUrl: currentUser.photo_url });
  }, []);

  const telegramId = tgUser?.id?.toString() || "";

  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: ["user", telegramId],
    queryFn: () => fetchUser(telegramId),
    enabled: !!telegramId,
  });

  const { data: notifications, refetch: refetchNotifications } = useQuery({
    queryKey: ["notifications", telegramId],
    queryFn: () => fetchNotifications(telegramId),
    enabled: !!telegramId,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (telegramId && !isUserLoading && !user && step === 0) setStep(1);
  }, [telegramId, isUserLoading, user, step]);

  const mutation = useMutation({
    mutationFn: saveUser,
    onSuccess: (data) => { queryClient.setQueryData(["user", telegramId], data); setStep(0); },
  });

  const markMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["notifications", telegramId] }); },
  });

  const hasUnread = notifications?.some((n: any) => !n.isRead);

  const handleSave = () => { if (!telegramId) return; mutation.mutate({ formData, telegramId }); };
  const isScreenLoading = !telegramId || isUserLoading || mutation.isPending;

  const renderOnboarding = () => (
    <AnimatePresence mode="wait">
      <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.25 }} className="flex flex-col h-full px-6 pt-14 pb-28">

        {step === 1 && (
          <div className="flex flex-col gap-6">
            <h1 className="text-[28px] font-bold tracking-tight">Ваша цель?</h1>
            <p className="text-gray-400 text-[14px]">Поможет AI составить программу</p>
            <div className="flex flex-col gap-2 mt-2">
              {["Похудение", "Набор мышечной массы", "Поддержание формы"].map((goal) => (
                <button key={goal} onClick={() => { setFormData({ ...formData, goal }); setStep(2); }}
                  className="p-4 rounded-2xl bg-white dark:bg-[#1c1c1e] border border-gray-100 dark:border-gray-800 active:scale-[0.98] transition-all text-left font-medium text-[15px]">
                  {goal}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-6">
            <button onClick={() => setStep(1)} className="flex items-center gap-1.5 text-blue-500 text-[15px] font-medium self-start active:opacity-60 transition-opacity">
              <ChevronLeft className="w-5 h-5" /> Назад
            </button>
            <h1 className="text-[28px] font-bold tracking-tight">Ваш пол?</h1>
            <p className="text-gray-400 text-[14px]">Для расчета нагрузок и питания</p>
            <div className="flex flex-col gap-2 mt-2">
              {["Мужской", "Женский"].map((gender) => (
                <button key={gender} onClick={() => { setFormData({ ...formData, gender }); setStep(3); }}
                  className="p-4 rounded-2xl bg-white dark:bg-[#1c1c1e] border border-gray-100 dark:border-gray-800 active:scale-[0.98] transition-all text-left font-medium text-[15px]">
                  {gender}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-5">
            <button onClick={() => setStep(2)} className="flex items-center gap-1.5 text-blue-500 text-[15px] font-medium self-start active:opacity-60 transition-opacity">
              <ChevronLeft className="w-5 h-5" /> Назад
            </button>
            <h1 className="text-[28px] font-bold tracking-tight">Параметры</h1>

            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] uppercase font-semibold text-gray-400 tracking-widest">Дата рождения</span>
                <input type="date" onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#1c1c1e] border border-gray-100 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-[14px]" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5">
                  <span className="text-[12px] uppercase font-semibold text-gray-400 tracking-widest">Вес (кг)</span>
                  <input type="number" placeholder="75" onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })}
                    className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#1c1c1e] border border-gray-100 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-[14px]" />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[12px] uppercase font-semibold text-gray-400 tracking-widest">Рост (см)</span>
                  <input type="number" placeholder="180" onChange={(e) => setFormData({ ...formData, height: Number(e.target.value) })}
                    className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#1c1c1e] border border-gray-100 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-[14px]" />
                </label>
              </div>
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] uppercase font-semibold text-gray-400 tracking-widest">Травмы или ограничения</span>
                <textarea placeholder="Болят колени, грыжа, или оставьте пустым" onChange={(e) => setFormData({ ...formData, injuries: e.target.value })}
                  className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#1c1c1e] border border-gray-100 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-[14px] min-h-[90px] resize-none" />
              </label>

              <button disabled={mutation.isPending} onClick={handleSave}
                className="mt-4 w-full p-4 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-semibold text-[16px] flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50">
                {mutation.isPending ? "Сохраняем..." : "Готово"} <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );

  if (user && step === 0) {
    const age = user.birthDate ? (() => {
      const b = new Date(user.birthDate), t = new Date();
      let a = t.getFullYear() - b.getFullYear();
      if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) a--;
      return a;
    })() : null;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="px-6 pt-12 pb-28 flex flex-col gap-6"
      >
        <AnimatePresence>
          {(isUserLoading || mutation.isPending) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed top-4 right-6 z-50"
            >
              <div className="w-4 h-4 rounded-full border-2 border-gray-200 border-t-black dark:border-t-white animate-spin" />
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden border border-gray-100 dark:border-gray-800">
              {user.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.photoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-7 h-7 text-gray-400" strokeWidth={1.5} />
              )}
            </div>
            <div>
              <h1 className="text-[22px] font-bold tracking-tight leading-tight">{user.firstName} {user.lastName}</h1>
              <p className="text-gray-400 text-[13px]">@{user.username || "athlete"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNotifications(true)}
              className="w-10 h-10 rounded-2xl bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center border border-gray-100 dark:border-gray-800 active:scale-95 transition-all relative"
            >
              <Bell className="w-5 h-5 text-gray-400" strokeWidth={1.5} />
              {hasUnread && (
                <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-[#1c1c1e]" />
              )}
            </button>
            <button
              onClick={() => {
                setFormData({ ...user });
                setShowSettings(true);
              }}
              className="w-10 h-10 rounded-2xl bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center border border-gray-100 dark:border-gray-800 active:scale-95 transition-all"
            >
              <Settings className="w-5 h-5 text-gray-400" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1c1c1e] border border-gray-100 dark:border-gray-800 text-center">
            <p className="text-[11px] uppercase font-semibold text-gray-400 tracking-widest mb-1">Рост</p>
            <p className="text-[20px] font-bold tabular-nums">{user.height || "—"}</p>
            <p className="text-[11px] text-gray-400">см</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1c1c1e] border border-gray-100 dark:border-gray-800 text-center">
            <p className="text-[11px] uppercase font-semibold text-gray-400 tracking-widest mb-1">Вес</p>
            <p className="text-[20px] font-bold tabular-nums">{user.weight || "—"}</p>
            <p className="text-[11px] text-gray-400">кг</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1c1c1e] border border-gray-100 dark:border-gray-800 text-center">
            <p className="text-[11px] uppercase font-semibold text-gray-400 tracking-widest mb-1">Возраст</p>
            <p className="text-[20px] font-bold tabular-nums">{age ?? "—"}</p>
            <p className="text-[11px] text-gray-400">лет</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="p-4 rounded-2xl bg-white dark:bg-[#1c1c1e] border border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2 mb-1.5">
              <Target className="w-4 h-4 text-blue-500" strokeWidth={1.5} />
              <span className="text-[11px] uppercase font-semibold text-gray-400 tracking-widest">Цель</span>
            </div>
            <p className="font-semibold text-[14px]">{user.goal || "Не указана"}</p>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-[#1c1c1e] border border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2 mb-1.5">
              <User className="w-4 h-4 text-purple-500" strokeWidth={1.5} />
              <span className="text-[11px] uppercase font-semibold text-gray-400 tracking-widest">Пол</span>
            </div>
            <p className="font-semibold text-[14px]">{user.gender || "Не указан"}</p>
          </div>
        </div>

        <WorkoutJournal telegramId={telegramId} />
        <NutritionJournal telegramId={telegramId} />

        <AnimatePresence>
          {showSettings && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm flex items-end"
              onClick={() => setShowSettings(false)}>
              <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="w-full bg-white dark:bg-[#1c1c1e] rounded-t-[32px] px-6 pt-4 pb-12 max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}>
                <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full mx-auto mb-6" />

                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-[22px] font-bold">Профиль</h2>
                  <button onClick={() => setShowSettings(false)} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>

                <div className="flex flex-col gap-5">
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex flex-col gap-1.5">
                      <span className="text-[11px] uppercase font-bold text-gray-400 tracking-widest pl-1">Имя</span>
                      <input type="text" value={formData.firstName || ""} onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                        className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-transparent focus:border-blue-500/30 text-[15px] transition-all" />
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-[11px] uppercase font-bold text-gray-400 tracking-widest pl-1">Пол</span>
                      <select value={formData.gender || ""} onChange={e => setFormData({ ...formData, gender: e.target.value })}
                        className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-transparent focus:border-blue-500/30 text-[15px] transition-all appearance-none">
                        <option value="Мужской">Мужской</option>
                        <option value="Женский">Женский</option>
                      </select>
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex flex-col gap-1.5">
                      <span className="text-[11px] uppercase font-bold text-gray-400 tracking-widest pl-1">Вес (кг)</span>
                      <input type="number" value={formData.weight || ""} onChange={e => setFormData({ ...formData, weight: +e.target.value })}
                        className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-transparent focus:border-blue-500/30 text-[15px] transition-all" />
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-[11px] uppercase font-bold text-gray-400 tracking-widest pl-1">Рост (см)</span>
                      <input type="number" value={formData.height || ""} onChange={e => setFormData({ ...formData, height: +e.target.value })}
                        className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-transparent focus:border-blue-500/30 text-[15px] transition-all" />
                    </label>
                  </div>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-[11px] uppercase font-bold text-gray-400 tracking-widest pl-1">Цель</span>
                    <select value={formData.goal || ""} onChange={e => setFormData({ ...formData, goal: e.target.value })}
                      className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-transparent focus:border-blue-500/30 text-[15px] transition-all appearance-none">
                      <option value="Похудение">Похудение</option>
                      <option value="Набор мышечной массы">Набор мышечной массы</option>
                      <option value="Поддержание формы">Поддержание формы</option>
                    </select>
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-[11px] uppercase font-bold text-gray-400 tracking-widest pl-1">Травмы / Ограничения</span>
                    <textarea value={formData.injuries || ""} onChange={e => setFormData({ ...formData, injuries: e.target.value })}
                      className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-transparent focus:border-blue-500/30 text-[15px] min-h-[80px] resize-none transition-all" />
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-[11px] uppercase font-bold text-gray-400 tracking-widest pl-1">Опыт тренировок</span>
                    <select value={formData.experience || ""} onChange={e => setFormData({ ...formData, experience: e.target.value })}
                      className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-transparent focus:border-blue-500/30 text-[15px] transition-all appearance-none">
                      <option value="Новичок">Новичок</option>
                      <option value="Средний">Средний</option>
                      <option value="Продвинутый">Продвинутый</option>
                    </select>
                  </label>

                  <div className="flex flex-col gap-3 mt-2">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-transparent">
                      <div className="flex flex-col">
                        <span className="text-[14px] font-semibold">Уведомления</span>
                        <span className="text-[11px] text-gray-400">Напоминания о тренировках и еде</span>
                      </div>
                      <button
                        onClick={() => setFormData({ ...formData, notificationsEnabled: !formData.notificationsEnabled })}
                        className={`w-12 h-6 rounded-full transition-colors relative ${formData.notificationsEnabled ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-700"}`}
                      >
                        <motion.div
                          animate={{ x: formData.notificationsEnabled ? 26 : 2 }}
                          className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-transparent">
                      <div className="flex flex-col text-left">
                        <span className="text-[14px] font-semibold">Всегда бассейн</span>
                        <span className="text-[11px] text-gray-400">Добавлять бассейн в конец тренировки</span>
                      </div>
                      <button
                        onClick={() => setFormData({ ...formData, alwaysAddPool: !formData.alwaysAddPool })}
                        className={`w-12 h-6 rounded-full transition-colors relative ${formData.alwaysAddPool ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-700"}`}
                      >
                        <motion.div
                          animate={{ x: formData.alwaysAddPool ? 26 : 2 }}
                          className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                        />
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      mutation.mutate({ formData: formData as UserData, telegramId });
                      setShowSettings(false);
                    }}
                    className="mt-4 w-full p-4 rounded-2xl bg-blue-600 text-white font-bold text-[16px] shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all"
                  >
                    Сохранить изменения
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showNotifications && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm flex items-end"
              onClick={() => setShowNotifications(false)}>
              <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="w-full bg-white dark:bg-[#1c1c1e] rounded-t-[32px] px-6 pt-4 pb-12 h-[80vh] flex flex-col"
                onClick={e => e.stopPropagation()}>
                <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full mx-auto mb-6" />

                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-[22px] font-bold">Уведомления</h2>
                  <button onClick={() => setShowNotifications(false)} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>

                <motion.div
                  variants={containerPresets as any}
                  initial="hidden"
                  animate="show"
                  className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1"
                >
                  {notifications && notifications.length > 0 ? (
                    notifications.map((n: any) => (
                      <motion.div
                        key={n.id}
                        variants={itemPresets as any}
                        onClick={() => !n.isRead && markMutation.mutate({ notificationId: n.id, telegramId })}
                        className={`p-4 rounded-2xl border transition-all active:scale-[0.98] ${n.isRead ? "bg-white dark:bg-[#1c1c1e] border-gray-100 dark:border-gray-800 opacity-60" : "bg-blue-50/50 dark:bg-blue-500/5 border-blue-100/50 dark:border-blue-500/20"}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-col gap-1">
                            <span className="text-[15px] font-bold">{n.title}</span>
                            <span className="text-[13px] text-gray-500 dark:text-gray-400 leading-tight">{n.message}</span>
                            <span className="text-[10px] text-gray-400 mt-1 uppercase font-semibold">
                              {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          {!n.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 shrink-0" />}
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                      <Bell className="w-12 h-12 mb-4" strokeWidth={1} />
                      <p className="text-[15px] font-medium">Пока нет уведомлений</p>
                      <p className="text-[13px] px-10">Тут будут напоминания о тренировках и питании</p>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  return renderOnboarding();
}

/* ═══════════════════ ВСПОМОГАТЕЛЬНЫЕ КОМПОНЕНТЫ ═══════════════════ */
const formatDate = (val: any) => {
  if (!val) return "—";
  const d = new Date(val);
  if (isNaN(d.getTime())) return "—";
  const today = new Date();
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Сегодня";
  if (d.toDateString() === yesterday.toDateString()) return "Вчера";
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
};

const formatTime = (val: any) => {
  if (!val) return "";
  const d = new Date(val);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
};

const WorkoutCard = ({ w, onClick }: { w: any; onClick: () => void }) => {
  const isEarly = w.isEarlyFinish;
  return (
    <button onClick={onClick}
      className={`w-full p-4 rounded-2xl bg-white dark:bg-[#1c1c1e] border flex items-center gap-3 active:scale-[0.98] transition-all text-left ${isEarly ? "border-red-100 dark:border-red-900/30" : "border-gray-100 dark:border-gray-800"}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isEarly ? "bg-red-50 dark:bg-red-500/10 text-red-500" : "bg-green-50 dark:bg-green-500/10 text-green-500"}`}>
        <Dumbbell className="w-5 h-5" strokeWidth={1.5} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-[14px] truncate ${isEarly ? "text-red-600 dark:text-red-400" : ""}`}>{w.name}</p>
        <p className="text-[12px] text-gray-400">{formatDate(w.date)} · {formatTime(w.date)} · {w.exercises?.length || 0} упр.</p>
      </div>
      <ChevronRight className={`w-4 h-4 flex-shrink-0 ${isEarly ? "text-red-300" : "text-gray-300"}`} />
    </button>
  );
};

const DayCard = ({ day, onClick }: { day: any; onClick: () => void }) => (
  <button onClick={onClick}
    className="w-full p-4 rounded-2xl bg-white dark:bg-[#1c1c1e] border border-gray-100 dark:border-gray-800 flex items-center gap-3 active:scale-[0.98] transition-all text-left">
    <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-orange-500">
      <Utensils className="w-5 h-5" strokeWidth={1.5} />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold text-[14px] truncate">{formatDate(day.date)}</p>
        <p className="text-[14px] font-bold tabular-nums text-blue-500">{Math.round(day.totalCalories)} ккал</p>
      </div>
      <p className="text-[12px] text-gray-400 mt-0.5">
        Б: {Math.round(day.totalProtein)}г · У: {Math.round(day.totalCarbs)}г · Ж: {Math.round(day.totalFats)}г
      </p>
    </div>
    <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
  </button>
);

/* ═══════════════════ ЖУРНАЛ ТРЕНИРОВОК ═══════════════════ */
function WorkoutJournal({ telegramId }: { telegramId: string }) {
  const [showAll, setShowAll] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<any>(null);

  const { data: history, isLoading } = useQuery({
    queryKey: ["workoutHistory", telegramId],
    queryFn: async () => {
      const res = await fetch("/api/workout/history", { headers: { "x-telegram-id": telegramId } });
      if (!res.ok) return [];
      return (await res.json()).workouts || [];
    },
    enabled: !!telegramId,
  });

  const preview = history?.slice(0, 3) || [];

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
            <h2 className="text-[16px] font-bold tracking-tight">Журнал тренировок</h2>
          </div>
          {history && history.length > 3 && (
            <button onClick={() => setShowAll(true)} className="text-blue-500 text-[13px] font-medium active:opacity-60 transition-opacity">
              Показать все
            </button>
          )}
        </div>

        {isLoading && (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-black dark:border-t-white animate-spin" />
          </div>
        )}

        {!isLoading && (!history || history.length === 0) && (
          <div className="text-center py-10">
            <Dumbbell className="w-8 h-8 mx-auto mb-2 text-gray-200 dark:text-gray-700" strokeWidth={1} />
            <p className="text-[13px] text-gray-400">Пока нет завершённых тренировок</p>
          </div>
        )}

        {!isLoading && preview.length > 0 && (
          <motion.div
            variants={containerPresets as any}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-2"
          >
            {preview.map((w: any) => (
              <motion.div key={w.id} variants={itemPresets as any}>
                <WorkoutCard w={w} onClick={() => setSelectedWorkout(w)} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {showAll && (
          <motion.div
            key="all-workouts-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-black/40 backdrop-blur-sm flex items-end"
            onClick={(e) => { e.stopPropagation(); setShowAll(false); }}>
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full bg-white dark:bg-[#1c1c1e] rounded-t-3xl px-6 pt-6 pb-10 max-h-[80vh] flex flex-col shadow-2xl"
              onClick={e => e.stopPropagation()}>
              <div className="w-10 h-1 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-4" />
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[20px] font-bold">Все тренировки</h3>
                <button onClick={(e) => { e.stopPropagation(); setShowAll(false); }} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center active:scale-95 transition-transform">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              <motion.div
                variants={containerPresets as any}
                initial="hidden"
                animate="show"
                className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1"
              >
                {history?.map((w: any) => (
                  <motion.div key={w.id} variants={itemPresets as any}>
                    <WorkoutCard w={w} onClick={() => { setSelectedWorkout(w); setShowAll(false); }} />
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedWorkout && (
          <motion.div
            key="workout-detail-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[130] bg-black/40 backdrop-blur-sm flex items-end"
            onClick={(e) => { e.stopPropagation(); setSelectedWorkout(null); }}>
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full bg-white dark:bg-[#1c1c1e] rounded-t-3xl px-6 pt-6 pb-10 max-h-[85vh] flex flex-col shadow-2xl"
              onClick={e => e.stopPropagation()}>
              <div className="w-10 h-1 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-4" />

              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-[20px] font-bold">{selectedWorkout.name}</h3>
                  <p className="text-[13px] text-gray-400 mt-0.5">{formatDate(selectedWorkout.date)} · {formatTime(selectedWorkout.date)}</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); setSelectedWorkout(null); }} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center active:scale-95 transition-transform">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-5">
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-center">
                  <p className="text-[11px] uppercase font-semibold text-gray-400 tracking-widest">Упражнений</p>
                  <p className="text-[20px] font-bold mt-0.5">{selectedWorkout.exercises?.length || 0}</p>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-center">
                  <p className="text-[11px] uppercase font-semibold text-gray-400 tracking-widest">Статус</p>
                  {selectedWorkout.isEarlyFinish ? (
                    <p className="text-[14px] font-semibold mt-1 text-red-500">Досрочно ×</p>
                  ) : (
                    <p className="text-[14px] font-semibold mt-1 text-green-500">Выполнено ✓</p>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pb-8">
                <p className="text-[11px] uppercase font-semibold text-gray-400 tracking-widest mb-3">Упражнения</p>
                <div className="flex flex-col gap-2">
                  {selectedWorkout.exercises?.map((ex: any, i: number) => {
                    const sets = typeof ex.sets === "string" ? JSON.parse(ex.sets) : ex.sets;
                    const isCardio = sets?.[0]?.duration;
                    const isNotDone = !ex.rpe || ex.rpe === "none" || ex.rpe === "";

                    return (
                      <div key={ex.id || i} className={`p-4 rounded-2xl border transition-all ${isNotDone ? "bg-red-50/30 dark:bg-red-500/5 border-red-100 dark:border-red-900/40" : "bg-gray-50 dark:bg-gray-800/50 border-transparent"}`}>
                        <div className="flex items-center gap-3 mb-2.5">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-sm ${isNotDone ? "bg-red-500 text-white" : "bg-white dark:bg-gray-700 text-gray-400"}`}>
                            {isNotDone ? <X className="w-4 h-4" /> : <span className="text-[12px] font-bold tabular-nums">{i + 1}</span>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-semibold text-[15px] leading-tight ${isNotDone ? "text-red-700 dark:text-red-400" : ""}`}>{ex.name}</p>
                            {isNotDone && <p className="text-[11px] font-bold text-red-500/80 uppercase tracking-wider mt-0.5">Не выполнено</p>}
                          </div>
                          {ex.photoUrl && (
                            <div className="w-12 h-12 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden flex-shrink-0">
                              <img src={encodeURI(ex.photoUrl)} alt={ex.name} className="w-full h-full object-cover" />
                            </div>
                          )}
                        </div>
                        {isCardio ? (
                          <div className="flex items-center gap-2 pl-11">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-[13px] text-gray-500">{sets[0].duration}</span>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1.5 pl-11">
                            {sets?.map((s: any, j: number) => (
                              <span key={j} className="px-2.5 py-1 rounded-lg bg-white dark:bg-gray-700 text-[12px] font-medium tabular-nums text-gray-600 dark:text-gray-300">
                                {s.reps}×{s.weight}кг
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ═══════════════════ ЖУРНАЛ ПИТАНИЯ ═══════════════════ */
function NutritionJournal({ telegramId }: { telegramId: string }) {
  const [showAll, setShowAll] = useState(false);
  const [selectedDay, setSelectedDay] = useState<any>(null);

  const { data: history, isLoading } = useQuery({
    queryKey: ["nutritionHistory", telegramId],
    queryFn: async () => {
      const res = await fetch("/api/nutrition/history", {
        headers: {
          "x-telegram-id": telegramId,
          "x-timezone-offset": new Date().getTimezoneOffset().toString()
        }
      });
      if (!res.ok) return [];
      return (await res.json()).history || [];
    },
    enabled: !!telegramId,
  });

  const preview = history?.slice(0, 3) || [];

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Utensils className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
            <h2 className="text-[16px] font-bold tracking-tight">Журнал питания</h2>
          </div>
          {history && history.length > 3 && (
            <button onClick={() => setShowAll(true)} className="text-blue-500 text-[13px] font-medium active:opacity-60 transition-opacity">
              Показать все
            </button>
          )}
        </div>

        {isLoading && (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-black dark:border-t-white animate-spin" />
          </div>
        )}

        {!isLoading && (!history || history.length === 0) && (
          <div className="text-center py-10">
            <Apple className="w-8 h-8 mx-auto mb-2 text-gray-200 dark:text-gray-700" strokeWidth={1} />
            <p className="text-[13px] text-gray-400">Пока нет записей о питании</p>
          </div>
        )}

        {!isLoading && preview.length > 0 && (
          <motion.div
            variants={containerPresets as any}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-2"
          >
            {preview.map((day: any, i: number) => (
              <motion.div key={i} variants={itemPresets as any}>
                <DayCard day={day} onClick={() => setSelectedDay(day)} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {showAll && (
          <motion.div
            key="all-nutrition-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-black/40 backdrop-blur-sm flex items-end"
            onClick={(e) => { e.stopPropagation(); setShowAll(false); }}>
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full bg-white dark:bg-[#1c1c1e] rounded-t-3xl px-6 pt-6 pb-10 max-h-[80vh] flex flex-col shadow-2xl"
              onClick={e => e.stopPropagation()}>
              <div className="w-10 h-1 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-4" />
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[20px] font-bold">История питания</h3>
                <button onClick={(e) => { e.stopPropagation(); setShowAll(false); }} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center active:scale-95 transition-transform">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto flex flex-col gap-2">
                {history?.map((day: any, i: number) => (
                  <DayCard key={i} day={day} onClick={() => { setSelectedDay(day); setShowAll(false); }} />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedDay && (
          <motion.div
            key="nutrition-detail-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[130] bg-black/40 backdrop-blur-sm flex items-end"
            onClick={(e) => { e.stopPropagation(); setSelectedDay(null); }}>
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full bg-white dark:bg-[#1c1c1e] rounded-t-3xl px-6 pt-6 pb-10 max-h-[85vh] flex flex-col shadow-2xl"
              onClick={e => e.stopPropagation()}>
              <div className="w-10 h-1 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-4" />
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-[20px] font-bold">{formatDate(selectedDay.date)}</h3>
                  <p className="text-[13px] text-gray-400 mt-0.5">Всего за день</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); setSelectedDay(null); }} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center active:scale-95 transition-transform">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-6">
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-center col-span-4 border border-blue-100 dark:border-blue-500/10">
                  <p className="text-[11px] uppercase font-bold text-blue-500 tracking-widest mb-1">Калории</p>
                  <p className="text-[24px] font-black text-blue-600 dark:text-blue-400">{Math.round(selectedDay.totalCalories)}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-center">
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-tighter">Белки</p>
                  <p className="text-[15px] font-bold mt-1 text-red-400">{Math.round(selectedDay.totalProtein)}г</p>
                </div>
                <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-center">
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-tighter">Углев</p>
                  <p className="text-[15px] font-bold mt-1 text-green-400">{Math.round(selectedDay.totalCarbs)}г</p>
                </div>
                <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-center">
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-tighter">Жиры</p>
                  <p className="text-[15px] font-bold mt-1 text-orange-400">{Math.round(selectedDay.totalFats)}г</p>
                </div>
                <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-center">
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-tighter">Приемов</p>
                  <p className="text-[15px] font-bold mt-1 text-purple-400">{selectedDay.items.length}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pb-8">
                <p className="text-[11px] uppercase font-semibold text-gray-400 tracking-widest mb-3">Приемы пищи</p>
                <div className="flex flex-col gap-2">
                  {selectedDay.items.map((log: any, i: number) => (
                    <div key={log.id || i} className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between border border-gray-100 dark:border-gray-800">
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-100/50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold uppercase">{log.mealType || "Еда"}</span>
                          <span className="text-[11px] text-gray-400 font-medium tabular-nums flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {formatTime(log.date)}
                          </span>
                        </div>
                        <p className="font-semibold text-[15px] dark:text-gray-100 mb-0.5">{log.foodName}</p>
                        <p className="text-[12px] text-gray-400">
                          Б: {Math.round(log.protein)} · У: {Math.round(log.carbs)} · Ж: {Math.round(log.fats)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-[16px] dark:text-gray-100">{Math.round(log.calories)}</p>
                        <p className="text-[10px] text-gray-400 uppercase font-bold">ккал</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
