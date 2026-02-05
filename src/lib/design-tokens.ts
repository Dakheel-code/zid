/**
 * ============================================
 * ZID-LIKE DESIGN TOKENS
 * المصدر الوحيد للتصميم - Light Mode Only
 * ============================================
 * 
 * 🏆 القاعدة الذهبية:
 * zid.sa هو المرجع البصري الوحيد
 * إذا شككت في لون أو spacing أو أسلوب:
 * ➡ قارن مباشرة مع Zid
 * ➡ نفّذ الأقرب لها
 * 
 * ⚠️ قواعد الاستخدام:
 * - جميع الخلفيات بيضاء نظيفة
 * - Primary يستخدم فقط لـ: Buttons, Links, Active, Focus
 * - ❗ ممنوع استخدام Primary في الخلفيات الكبيرة
 * - Status colors هادئة جداً
 */

export const tokens = {
  // ============================================
  // BACKGROUND - جميعها بيضاء
  // ============================================
  background: {
    page: '#ffffff',
    section: '#ffffff',
    card: '#ffffff',
    sidebar: '#ffffff',
    input: '#ffffff',
    hover: '#f9fafb',
    active: '#f3f4f6',
    muted: '#f9fafb',
    disabled: '#f3f4f6',
  },

  // ============================================
  // BORDER - رمادي خفيف جداً
  // ============================================
  border: {
    default: '#e5e7eb',
    light: '#f3f4f6',
    hover: '#d1d5db',
    focus: '#4F46E5',
    input: '#e5e7eb',
  },

  // ============================================
  // PRIMARY (Zid-like Blue/Indigo)
  // للأزرار والروابط فقط ❗
  // ============================================
  primary: {
    50: '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',
    600: '#4F46E5',  // Main
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
  },

  // ============================================
  // TEXT
  // ============================================
  text: {
    heading: '#111827',      // أسود داكن
    body: '#374151',         // رمادي داكن
    muted: '#6b7280',        // رمادي متوسط
    placeholder: '#9ca3af',  // رمادي فاتح
    disabled: '#9ca3af',
    inverse: '#ffffff',
    link: '#4F46E5',
    linkHover: '#4338ca',
  },

  // ============================================
  // STATUS COLORS - هادئة جداً
  // ============================================
  status: {
    success: {
      bg: '#f0fdf4',
      border: '#bbf7d0',
      text: '#166534',
      icon: '#22c55e',
    },
    warning: {
      bg: '#fffbeb',
      border: '#fde68a',
      text: '#92400e',
      icon: '#f59e0b',
    },
    error: {
      bg: '#fef2f2',
      border: '#fecaca',
      text: '#991b1b',
      icon: '#ef4444',
    },
    info: {
      bg: '#eff6ff',
      border: '#bfdbfe',
      text: '#1e40af',
      icon: '#3b82f6',
    },
  },

  // ============================================
  // GRAY SCALE
  // ============================================
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },

  // ============================================
  // SHADOWS - خفيفة جداً
  // ============================================
  shadows: {
    xs: '0 1px 2px 0 rgb(0 0 0 / 0.03)',
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.05), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
    card: '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
  },

  // ============================================
  // RADIUS
  // ============================================
  radius: {
    sm: '0.375rem',   // 6px
    md: '0.5rem',     // 8px
    lg: '0.75rem',    // 12px
    xl: '1rem',       // 16px
    full: '9999px',
  },

  // ============================================
  // SPACING
  // ============================================
  spacing: {
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
  },

  // ============================================
  // TYPOGRAPHY
  // ============================================
  typography: {
    fontFamily: 'IBM Plex Sans Arabic, system-ui, -apple-system, sans-serif',
    fontSize: {
      xs: '0.75rem',     // 12px
      sm: '0.8125rem',   // 13px
      base: '0.875rem',  // 14px
      lg: '1rem',        // 16px
      xl: '1.125rem',    // 18px
      '2xl': '1.25rem',  // 20px
      '3xl': '1.5rem',   // 24px
      '4xl': '2rem',     // 32px
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },

  // ============================================
  // Z-INDEX
  // ============================================
  zIndex: {
    dropdown: 1000,
    sticky: 1100,
    modal: 1400,
    tooltip: 1600,
  },
} as const

// ============================================
// TYPE EXPORTS
// ============================================
export type DesignTokens = typeof tokens
export type BackgroundTokens = typeof tokens.background
export type TextTokens = typeof tokens.text
export type StatusTokens = typeof tokens.status
export type PrimaryTokens = typeof tokens.primary
