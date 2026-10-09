import type { Metadata } from 'next';
import { Instrument_Sans, JetBrains_Mono, Fraunces, Noto_Sans_Oriya, Noto_Sans_Devanagari } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const notoSansOriya = Noto_Sans_Oriya({
  subsets: ['oriya'],
  weight: ['400', '600', '700'],
  variable: '--font-odia',
  display: 'swap',
});

const notoSansDevanagari = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '600', '700'],
  variable: '--font-devanagari',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Sevansh — Frontline AI-Assisted Clinical Triage',
  description: 'AI-assisted, strictly non-diagnostic clinical triage decision support for frontline health workers in rural Odisha.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`h-full ${instrumentSans.variable} ${jetbrainsMono.variable} ${fraunces.variable} ${notoSansOriya.variable} ${notoSansDevanagari.variable}`}
    >
      <body className="font-sans antialiased h-full text-foreground bg-background selection:bg-accent/20">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
