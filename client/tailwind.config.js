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
                    red: '#F40009',
                    black: '#1E1E1E',
                    gray: '#F1F1F1',
                    darkRed: '#D10008'
                }
            }
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
    ],
}
