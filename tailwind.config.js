/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
  		opacity: Object.fromEntries(Array.from({ length: 101 }, (_, i) => [i, `${i / 100}`])),
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)',
  			'shinka-sm': '12px',
  			'shinka-md': '16px',
  			'shinka-lg': '20px'
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			shinka: {
  				plum: 'rgb(var(--shinka-plum) / <alpha-value>)',
  				'plum-deep': 'rgb(var(--shinka-plum-deep) / <alpha-value>)',
  				'plum-soft': 'rgb(var(--shinka-plum-soft) / <alpha-value>)',
  				ink: 'rgb(var(--shinka-ink) / <alpha-value>)',
  				mauve: 'rgb(var(--shinka-mauve) / <alpha-value>)',
  				rose: 'rgb(var(--shinka-rose) / <alpha-value>)',
  				blush: 'rgb(var(--shinka-blush) / <alpha-value>)',
  				lavender: 'rgb(var(--shinka-lavender) / <alpha-value>)',
  				ivory: 'rgb(var(--shinka-ivory) / <alpha-value>)',
  				cream: 'rgb(var(--shinka-cream) / <alpha-value>)',
  				taupe: 'rgb(var(--shinka-taupe) / <alpha-value>)',
  				muted: 'rgb(var(--shinka-muted) / <alpha-value>)',
  				line: 'rgb(var(--shinka-line) / <alpha-value>)',
  				white: 'rgb(var(--shinka-white) / <alpha-value>)',
  				surface: 'rgb(var(--shinka-surface) / <alpha-value>)'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		fontSize: {
  			'shinka-h1': ['34px', { lineHeight: '40px' }],
  			'shinka-h2': ['28px', { lineHeight: '34px' }],
  			'shinka-h3': ['24px', { lineHeight: '30px' }],
  			'shinka-h4': ['20px', { lineHeight: '26px' }],
  			'shinka-body-lg': ['17px', { lineHeight: '25px' }],
  			'shinka-body': ['15px', { lineHeight: '22px' }],
  			'shinka-caption': ['13px', { lineHeight: '18px' }]
  		},
  		boxShadow: {
  			'shinka-card': '0 2px 10px rgba(76,38,63,.05)'
  		},
  		fontFamily: {
  			heading: ['var(--font-heading)'],
  			body: ['var(--font-body)'],
  			display: ['var(--font-display)'],
  			mono: ['var(--font-mono)']
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
