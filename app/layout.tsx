import type { Metadata, Viewport } from "next";
import { Onest, Unbounded } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/Toast";

const onest = Onest({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "700"], variable: "--font-body" });
const unbounded = Unbounded({ subsets: ["latin", "cyrillic"], weight: ["500", "700", "900"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "SHO ZA MEM — усі меми України",
  description: "Усі меми України в одному місці. Звук і відео окремо, в один тап.",
  applicationName: "SHO ZA MEM",
  appleWebApp: { capable: true, title: "SHO ZA MEM", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#0E0E10",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk" className={`${onest.variable} ${unbounded.variable}`}>
      <body>
        <ToastProvider>
          <div className="app">{children}</div>
        </ToastProvider>
      </body>
    </html>
  );
}
