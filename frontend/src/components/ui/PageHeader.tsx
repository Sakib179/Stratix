'use client';

import { motion } from 'framer-motion';
import { useThemeStore } from '@/store/themeStore';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  gradient: string;        /* e.g. 'from-violet-500 to-purple-600' */
  actions?: React.ReactNode;
  badge?: string;
}

export function PageHeader({ title, subtitle, icon: Icon, gradient, actions, badge }: PageHeaderProps) {
  const isLight = useThemeStore((s) => s.theme === 'light');

  return (
    <motion.div
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-2xl"
      style={{
        background: isLight
          ? 'rgba(255,255,255,0.88)'
          : 'var(--bg-card)',
        border: isLight
          ? '1.5px solid rgba(99,102,241,0.18)'
          : '1px solid var(--border)',
        boxShadow: isLight ? '0 4px 24px rgba(99,102,241,0.1)' : 'none',
      }}
    >
      {/* gradient accent strip */}
      <div className={`absolute inset-0 bg-gradient-to-r ${gradient} opacity-[0.07] pointer-events-none`} />
      {/* shimmer line */}
      <motion.div
        className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${gradient}`}
        initial={{ scaleX: 0, originX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      />

      <div className="relative px-5 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {Icon && (
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.35, delay: 0.1 }}
                className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg flex-shrink-0`}
              >
                <Icon size={20} className="text-white" />
              </motion.div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1
                  className="text-xl sm:text-2xl font-bold leading-tight"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {title}
                </h1>
                {badge && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-gradient-to-r ${gradient} text-white`}>
                    {badge}
                  </span>
                )}
              </div>
              {subtitle && (
                <p className="text-sm mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {actions && (
            <div className="flex items-center gap-2 flex-wrap">
              {actions}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
