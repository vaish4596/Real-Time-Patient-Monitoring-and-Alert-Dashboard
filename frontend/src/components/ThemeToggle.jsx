import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function ThemeToggle({ className = '' }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex items-center justify-center rounded-xl border border-slate-200/80 bg-white/90 p-2.5 text-slate-700 shadow-sm backdrop-blur-sm transition hover:bg-slate-50 dark:border-cyan-400/40 dark:bg-black dark:text-cyan-200 dark:shadow-[0_0_20px_-5px_rgba(34,211,238,0.35)] dark:hover:border-cyan-300/55 dark:hover:bg-zinc-950 ${className}`}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
