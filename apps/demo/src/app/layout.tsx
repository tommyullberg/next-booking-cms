import type { Metadata } from "next";
import { CMSAuthProvider } from "@next-booking/cms-core";
import "./globals.css";

export const metadata: Metadata = {
  title: "NextBooking Demo",
  description: "NextBooking CMS Starter Demo",
};

const themeScript = `
  (function() {
    try {
      var stored = localStorage.getItem('theme');
      var prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
      if (stored === 'light' || (!stored && prefersLight)) {
        document.documentElement.classList.remove('dark');
      } else {
        document.documentElement.classList.add('dark');
      }
    } catch (e) {
      document.documentElement.classList.add('dark');
    }
  })();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased transition-colors duration-200">
        <CMSAuthProvider>{children}</CMSAuthProvider>
      </body>
    </html>
  );
}
