/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Unslop Graphite neutral ramp
        graphite: {
          deep: '#0c0d0e',
          bg: '#111214',
          card: '#16171a',
          raised: '#1e2024',
          surface: '#26292e',
          border: 'rgba(237, 237, 237, 0.08)',
          'border-strong': 'rgba(237, 237, 237, 0.14)',
          text: '#ededed',
          secondary: '#a1a1a6',
          muted: '#85858b',
        },
        emergency: {
          accent: '#e5484d',
          'accent-hover': '#dc2626',
          'accent-active': '#b91c1c',
          subtle: 'rgba(229, 72, 77, 0.12)',
          border: 'rgba(229, 72, 77, 0.3)',
        },
        responder: {
          accent: '#3b82f6',
          'accent-hover': '#2563eb',
          subtle: 'rgba(59, 130, 246, 0.12)',
        },
      },
      borderRadius: {
        control: '8px',
        card: '12px',
        panel: '16px',
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      transitionTimingFunction: {
        unslop: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      transitionDuration: {
        unslop: '160ms',
      },
    },
  },
  plugins: [],
};
