import './globals.css';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Prep Kit', description: 'A research-backed interview preparation studio.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
