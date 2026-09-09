/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                brand: {
                    red: '#E10600',
                    'red-dark': '#C50005',
                },
            },
            boxShadow: {
                'card':      '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
                'card-hover':'0 4px 16px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)',
                'card-dark': 'inset 0 1px 0 rgba(255,255,255,0.06)',
            },
            borderRadius: {
                'card': '10px',
            },
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
    ],
}
