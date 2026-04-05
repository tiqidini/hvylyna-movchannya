import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const viewport: Viewport = {
  themeColor: "#050505",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "Хвилина Мовчання",
  description: "Загальнонаціональна хвилина мовчання о 9:00",
  manifest: "/hvylyna-movchannya/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Хвилина Мовчання",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk">
      <body className={`${inter.className} antialiased`}>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/hvylyna-movchannya/sw.js');
                });
              }
              
              // Handle ChunkLoadError (Cache Trap Fix)
              window.addEventListener('error', function(e) {
                if (e.message && (e.message.indexOf('ChunkLoadError') !== -1 || e.message.indexOf('Loading chunk') !== -1)) {
                  console.warn('ChunkLoadError detected. Reloading for update...');
                  window.location.reload(true);
                }
              }, true);
              
              // Second Line of Defense: Check for 404s in scripts
              window.addEventListener('unhandledrejection', function(e) {
                if (e.reason && e.reason.name === 'ChunkLoadError') {
                  window.location.reload(true);
                }
              });
            `,
          }}
        />
      </body>
    </html>
  );
}
