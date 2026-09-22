import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Prep Kit — AI Interview Preparation Studio',
  description: 'Research-backed interview preparation. Turn any job description into a personalised study kit with company research, targeted questions, flashcards, and a day-by-day schedule.'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
