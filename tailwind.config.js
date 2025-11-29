/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			fontFamily: {
				sans: ['Montserrat', 'sans-serif']
			},
			colors: {
				primary: '#0693ad', // Teal/cyan from MLG logo gradient (main brand color)
				'primary-dark': '#0a9ea5',
				'primary-light': '#00a79d',
				'brand-blue': '#1384b6', // Blue from MLG logo gradient
				'brand-teal': '#0693ad', // Teal from MLG logo gradient
				'brand-cyan': '#00a79d', // Cyan from MLG logo gradient
				'brand-blue-dark': '#1e76bc', // Darker blue from MLG logo gradient
				'brand-green': '#0693ad', // Using teal as green alternative
				'brand-yellow': '#E6A324',
				'brand-red': '#A62524',
				'dark-gray': '#252525',
				'medium-gray': '#353535',
				'light-gray': '#757575'
			}
		}
	},
	plugins: []
};

