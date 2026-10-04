import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const WATCHPAY_FAVICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect width='24' height='24' rx='6' fill='%2300B978'/%3E%3Cpath d='M9.2 7.2v9.6a.7.7 0 0 0 1.06.6l7.9-4.8a.7.7 0 0 0 0-1.2l-7.9-4.8a.7.7 0 0 0-1.06.6Z' fill='white'/%3E%3C/svg%3E";

export const metadata: Metadata = {
  title: "WatchPay — Create Your Account",
  description:
    "Create your WatchPay account & start earning. Watch • Earn • Grow.",
  keywords: ["WatchPay", "register", "signup", "earn", "watch and earn"],
  icons: {
    icon: WATCHPAY_FAVICON,
  },
  openGraph: {
    title: "WatchPay — Create Your Account",
    description: "Create your WatchPay account & start earning.",
    siteName: "WatchPay",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#05070B",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${geistMono.variable} font-sans antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
