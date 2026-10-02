import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";
import { BridgeProvider } from "@/components/bridge-provider";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme/theme-provider";

const geist = Geist({
  subsets: ["latin", "cyrillic"],
  variable: "--font-sans",
});

const appName = "Модератор-панель";

export const metadata: Metadata = {
  title: appName,
  description: "Закрытая панель команды модераторов Minecraft-проекта",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={cn("font-sans dark", geist.variable)}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var d=JSON.parse(localStorage.getItem("mod-panel-theme-v1")||"null");var t=d&&d.last;if(!t||["green","neon","red","gray"].indexOf(t)<0)t="green";document.documentElement.setAttribute("data-theme",t);}catch(e){document.documentElement.setAttribute("data-theme","green");}`,
          }}
        />
      </head>
      <body className="antialiased min-h-screen bg-background flex flex-col">
        <BridgeProvider />
        <ThemeProvider />
        <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
          <div className="container mx-auto px-4 h-14 flex items-center">
            <Link
              href="/"
              className="flex items-center gap-2 text-lg font-semibold tracking-tight"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Sparkles className="h-4 w-4" />
              </div>
              {appName}
            </Link>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t">
          <div className="container mx-auto px-4 py-6 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} {appName}
          </div>
        </footer>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
