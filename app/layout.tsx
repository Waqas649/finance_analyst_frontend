import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Aimax AI — Market Reports",
  description:
    "Generate and review AI-powered quarterly market reports for S&P 500, ACWI, and Federal Reserve decisions.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} scroll-smooth`}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <div className="h-screen overflow-hidden">{children}</div>
      </body>
    </html>
  );
}
