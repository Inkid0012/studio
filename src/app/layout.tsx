
import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from "@/components/ui/toaster";
import { I18nProvider } from '@/contexts/i18n';

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
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Lora&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <I18nProvider>
            <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            >
                {children}
                <Toaster />
            </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
