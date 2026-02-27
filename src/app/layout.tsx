import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";
import { Providers } from "@/lib/providers";

export const metadata: Metadata = {
  title: "Forma",
  description: "Forma Personal Trainer Mini App",
};

// Фиксируем масштаб для предотвращения зума при фокусе инпутов в iOS
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      </head>
      <body className="antialiased min-h-screen bg-gray-50 dark:bg-black text-black dark:text-white">
        {/* max-w-md центрирует приложение на десктопных клиентах Telegram */}
        <main className="max-w-md mx-auto min-h-[var(--tg-viewport-stable-height,100vh)] relative">
          <Providers>
            {children}
            <BottomNav />
          </Providers>
        </main>
      </body>
    </html>
  );
}
