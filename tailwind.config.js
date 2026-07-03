/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    fontFamily: {
      // 古风卷轴设计系统字体（见 design-system/MASTER.md 第 3 节）
      title: ['var(--font-title)', 'serif'],
      body: ['var(--font-body)', 'serif'],
      caption: ['var(--font-caption)', 'sans-serif'],
      // 兼容旧组件（已不再渲染，保留以防回滚）
      display: ['var(--font-title)', 'serif'],
    },
    extend: {
      colors: {
        // Chapter · Ink · Vermilion 色板
        paper: {
          bg: 'var(--paper-bg)',
          warm: 'var(--paper-warm)',
          fold: 'var(--paper-fold)',
        },
        ink: {
          900: 'var(--ink-900)',
          700: 'var(--ink-700)',
          500: 'var(--ink-500)',
        },
        kraft: {
          brown: 'var(--kraft-brown)',
          dark: 'var(--kraft-dark)',
        },
        vermilion: {
          DEFAULT: 'var(--vermilion)',
          soft: 'var(--vermilion-soft)',
        },
        jade: 'var(--jade)',
        umber: 'var(--umber)',
        // 旧色板（兼容遗留、未渲染组件）
        brown: {
          100: '#FFFFFF',
          200: '#EAD4AA',
          300: '#E4A672',
          500: '#B86F50',
          700: '#743F39',
          800: '#3F2832',
          900: '#181425',
        },
        clay: {
          100: '#C0CBDC',
          300: '#8B9BB4',
          500: '#5A6988',
          700: '#3A4466',
          900: '#181425',
        },
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
