import type { Metadata, Viewport } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { cookies } from "next/headers";
import { en } from "@/lib/i18n/en";
import { fr } from "@/lib/i18n/fr";
import { I18nProvider } from "@/lib/i18n";
import { ServiceWorker } from "@/components/service-worker";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });

export const metadata: Metadata = {
  title: "Panier Recettes",
  description: fr.metaDescription,
  applicationName: "Panier Recettes",
  appleWebApp: { capable: true, title: "Panier Recettes", statusBarStyle: "default" },
  icons: { icon: "/icon-192.png", apple: "/icon-192.png" },
};

export const viewport: Viewport = {
  themeColor: "#1c4536",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  const locale = jar.get("pr_locale")?.value === "en" ? "en" : "fr";
  const messages = locale === "en" ? en : fr;
  return (
    <html lang={locale === "en" ? "en" : "fr"}>
      <body className={`${outfit.variable} ${fraunces.variable} antialiased`}>
        <I18nProvider locale={locale} messages={messages}>
          {children}
        </I18nProvider>
        <ServiceWorker />
      </body>
    </html>
  );
}
