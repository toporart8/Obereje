/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#09090b', // Rich Black (Zinc-950)
                secondary: '#18181b', // Dark Charcoal (Zinc-900)
                surface: '#27272a', // Lighter Charcoal
                bronze: '#9F2B2B', // Noble Red (Dark)
                amber: '#DC2626', // Bright Red (for accents/stitching)
                gold: '#D4AF37', // Genuine Gold
                mystic: '#52525b', // Muted Zinc
                parchment: '#E5E5E5', // Light Grey/Silver text
                ash: '#A1A1AA', // Muted Silver
            },
            fontFamily: {
                serif: ['Balkara Free Condensed', 'Cinzel', 'serif'],
                sans: ['Inter', 'sans-serif'],
                runes: ['Balkara Free Condensed', 'sans-serif'],
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                heartbeat: {
                    '0%, 100%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.05)' },
                },
                shimmer: {
                    '0%': { transform: 'scale(0.8) opacity(0.3)', filter: 'blur(40px)' },
                    '50%': { transform: 'scale(1.2) opacity(0.6)', filter: 'blur(60px)' },
                    '100%': { transform: 'scale(0.8) opacity(0.3)', filter: 'blur(40px)' },
                },
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out forwards',
                'heartbeat': 'heartbeat 2s infinite ease-in-out',
                'shimmer': 'shimmer 4s infinite ease-in-out',
            },
        },
    },
    plugins: [],
}
