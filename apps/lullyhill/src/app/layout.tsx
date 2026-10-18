import type { Metadata } from "next";
import { CMSAuthProvider } from "@next-booking/cms-core";
import "./globals.css";

export const metadata: Metadata = {
  title: "Villa Lullyhill",
  description: "Gotlandic Luxury Boende",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sv">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <CMSAuthProvider>{children}</CMSAuthProvider>
      </body>
    </html>
  );
}
