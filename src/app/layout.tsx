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
  viewportFit: "cover",
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
        <Script id="tg-setup" strategy="afterInteractive">
          {`
            try {
              if (window.Telegram && window.Telegram.WebApp) {
                window.Telegram.WebApp.ready();
                window.Telegram.WebApp.expand();
              }
            } catch (e) {}
          `}
        </Script>
      </head>
      <body
        className="antialiased bg-gray-50 dark:bg-black text-black dark:text-white overflow-hidden overscroll-none"
        style={{
          height: "var(--tg-viewport-stable-height, 100vh)",
          minHeight: "var(--tg-viewport-stable-height, 100vh)",
        }}
      >
        {/* max-w-md центрирует приложение на десктопных клиентах Telegram */}
        <main
          className="max-w-md mx-auto flex flex-col w-full relative overflow-hidden"
          style={{ height: "var(--tg-viewport-stable-height, 100vh)" }}
        >
          <Providers>
            <div className="flex-1 overflow-y-auto w-full relative">
              {children}
            </div>
            <BottomNav />
          </Providers>
        </main>
      </body>
    </html>
  );
}
