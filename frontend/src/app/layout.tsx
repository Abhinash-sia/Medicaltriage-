import type { Metadata } from 'next';
import { Instrument_Sans, JetBrains_Mono } from 'next/font/google';
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

export const metadata: Metadata = {
  title: 'Healthcare Triage Assistant',
  description: 'Human-in-the-loop healthcare triage decision-support platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full ${instrumentSans.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased h-full text-foreground bg-background selection:bg-accent/20">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
