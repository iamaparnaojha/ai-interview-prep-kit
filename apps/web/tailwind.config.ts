import type { Config } from 'tailwindcss';
const config: Config = { content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'], theme: { extend: { colors: { ink: '#12211d', paper: '#f3f0e8', moss: '#526b55', coral: '#d7654a', gold: '#d9a441' }, fontFamily: { sans: ['var(--font-geist-sans)'] } } }, plugins: [] };
export default config;
