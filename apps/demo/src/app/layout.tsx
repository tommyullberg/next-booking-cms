import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NextBooking Demo",
  description: "NextBooking CMS Starter Demo",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
