'use client';

import { useTheme } from '@/context/AppContext';
import { Sun, Moon, Monitor } from 'lucide-react';

interface ThemeToggleProps {
  showLabel?: boolean;
}

export function ThemeToggle({ showLabel = false }: ThemeToggleProps) {
  const { theme, setTheme, effectiveTheme } = useTheme();

  const themes: Array<{ value: 'light' | 'dark' | 'system'; icon: any; label: string }> = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'system', icon: Monitor, label: 'System' },
  ];

  return (
    <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
      {themes.map(({ value, icon: Icon, label }) => {
        const isActive = theme === value;

        return (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
              isActive
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            }`}
            aria-label={`${label} theme`}
            title={`${label} theme`}
          >
            <Icon className="h-4 w-4" />
            {showLabel && <span className="text-sm font-medium">{label}</span>}
          </button>
        );
      })}
    </div>
  );
}
