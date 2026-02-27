"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dumbbell, Utensils, Home, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function BottomNav() {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const check = () => {
      const hasWorkout = !!localStorage.getItem("activeWorkout");
      // Скрываем меню нижнего бара только если мы находимся на странице /workouts и есть активная тренировка
      setHidden(hasWorkout);
    };
    check();
    window.addEventListener("storage", check);
    const interval = setInterval(check, 500);
    return () => { window.removeEventListener("storage", check); clearInterval(interval); };
  }, []);

  const shouldHide = (hidden && pathname === "/workouts") || pathname?.startsWith("/chat");
  if (shouldHide) return null;

  const navItems = [
    { label: "Профиль", icon: Home, path: "/" },
    { label: "Спорт", icon: Dumbbell, path: "/workouts" },
    { label: "Питание", icon: Utensils, path: "/nutrition" },
    { label: "AI Чат", icon: MessageCircle, path: "/chat" },
  ];

  return (
    <div
      className="shrink-0 w-full left-0 right-0 bg-white/80 dark:bg-black/90 backdrop-blur-xl border-t border-gray-200 dark:border-white/10 z-[90] transition-colors"
      style={{ paddingBottom: "var(--safe-bottom)" }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-around items-center px-4 py-2.5 max-w-md mx-auto relative">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              href={item.path}
              onClick={(e) => e.stopPropagation()}
              className="relative flex flex-col items-center gap-1 py-1 px-3 group"
            >
              <div className="relative z-10 flex flex-col items-center gap-1 group-active:scale-90 transition-transform duration-200">
                <div className={`p-1.5 rounded-xl transition-colors duration-300 ${isActive ? "text-blue-500" : "text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"}`}>
                  <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-[10px] font-semibold tracking-tight transition-colors duration-300 ${isActive ? "text-blue-500" : "text-gray-400"}`}>
                  {item.label}
                </span>
              </div>

              {isActive && (
                <motion.div
                  layoutId="nav-pill"
                  transition={{ type: "spring", bounce: 0.25, duration: 0.6 }}
                  className="absolute inset-0 bg-blue-50 dark:bg-blue-500/10 rounded-2xl z-0"
                />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
