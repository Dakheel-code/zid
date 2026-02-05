import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ============================================
        // BASE - الخلفيات
        // ============================================
        'bg-main': 'var(--bg-main)',
        'bg-card': 'var(--bg-card)',
        'bg-card-hover': 'var(--bg-card-hover)',
        'border-soft': 'var(--border-soft)',

        // ============================================
        // TEXT - النصوص
        // ============================================
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',

        // ============================================
        // ACCENT - مصدر الحياة
        // ❗ ممنوع استخدام Accent في الخلفيات الكبيرة
        // ============================================
        accent: {
          primary: 'var(--accent-primary)',
          'primary-hover': 'var(--accent-primary-hover)',
          success: 'var(--accent-success)',
          warning: 'var(--accent-warning)',
          info: 'var(--accent-info)',
          danger: 'var(--accent-danger)',
          DEFAULT: 'var(--accent-primary)',
        },

        // Legacy support
        background: 'var(--bg-main)',
        foreground: 'var(--text-primary)',
        card: 'var(--bg-card)',
        border: 'var(--border-soft)',
        ring: 'var(--accent-primary)',
      },
      backgroundColor: {
        page: 'var(--bg-page)',
        section: 'var(--bg-section)',
        card: 'var(--bg-card)',
        sidebar: 'var(--bg-sidebar)',
        hover: 'var(--bg-hover)',
        active: 'var(--bg-active)',
        muted: 'var(--bg-muted)',
        disabled: 'var(--bg-disabled)',
      },
      textColor: {
        heading: 'var(--text-heading)',
        body: 'var(--text-body)',
        muted: 'var(--text-muted)',
        placeholder: 'var(--text-placeholder)',
        disabled: 'var(--text-disabled)',
        inverse: 'var(--text-inverse)',
        link: 'var(--text-link)',
        'link-hover': 'var(--text-link-hover)',
      },
      borderColor: {
        DEFAULT: 'var(--border-default)',
        light: 'var(--border-light)',
        hover: 'var(--border-hover)',
        focus: 'var(--border-focus)',
        input: 'var(--border-input)',
      },
      fontFamily: {
        sans: ['var(--font-body)'],
        heading: ['var(--font-heading)'],
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius-md)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        full: 'var(--radius-full)',
      },
      boxShadow: {
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        card: 'var(--shadow-card)',
      },
      fontSize: {
        // العناوين - ثقيلة جداً + كبيرة
        'heading-1': ['2.5rem', { lineHeight: '1.2', fontWeight: '800' }],
        'heading-2': ['2rem', { lineHeight: '1.25', fontWeight: '800' }],
        'heading-3': ['1.5rem', { lineHeight: '1.3', fontWeight: '700' }],
        'heading-4': ['1.25rem', { lineHeight: '1.35', fontWeight: '700' }],
        'heading-5': ['1.125rem', { lineHeight: '1.4', fontWeight: '600' }],
        'body-lg': ['1rem', { lineHeight: '1.6', fontWeight: '400' }],
        'body': ['0.875rem', { lineHeight: '1.6', fontWeight: '400' }],
        'body-sm': ['0.8125rem', { lineHeight: '1.5', fontWeight: '400' }],
        'caption': ['0.75rem', { lineHeight: '1.4', fontWeight: '400' }],
      },
      spacing: {
        '1': 'var(--space-1)',
        '2': 'var(--space-2)',
        '3': 'var(--space-3)',
        '4': 'var(--space-4)',
        '5': 'var(--space-5)',
        '6': 'var(--space-6)',
        '8': 'var(--space-8)',
        '10': 'var(--space-10)',
        '12': 'var(--space-12)',
      },
    },
  },
  plugins: [],
}
export default config
