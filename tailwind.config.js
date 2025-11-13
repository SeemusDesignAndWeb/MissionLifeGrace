/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			fontFamily: {
				sans: ['Montserrat', 'sans-serif']
			},
			colors: {
				primary: '#2d7a32',
				'primary-dark': '#1e5a22',
				'dark-gray': '#252525',
				'medium-gray': '#353535',
				'light-gray': '#757575'
			}
		}
	},
	plugins: []
};

