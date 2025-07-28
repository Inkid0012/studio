
import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from "@/components/ui/toaster";
import { I18nProvider } from '@/contexts/i18n';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'FIZU',
  description: 'A premium dating experience.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400..700;1,400..700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap" rel="stylesheet" />
        <script src="https://download.agora.io/sdk/release/AgoraRTC_N.js"></script>
      </head>
      <body className="font-body antialiased">
        <I18nProvider>
            <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            >
                <div id="screenshot-blocker" style={{ visibility: 'hidden' }}></div>
                {children}
                <Toaster />
            </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}

    