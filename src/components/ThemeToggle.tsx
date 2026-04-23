import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * Lightweight light/dark theme toggle. Persisted via next-themes (storageKey
 * configured in App.tsx). Renders a placeholder on first paint to avoid
 * hydration mismatch flicker.
 */
export const ThemeToggle = ({ className = '' }: { className?: string }) => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className={`h-9 w-9 ${className}`} aria-hidden="true" disabled>
        <Sun className="h-4 w-4 opacity-0" />
      </Button>
    );
  }

  const isDark = (theme ?? resolvedTheme) === 'dark';
  const next = isDark ? 'light' : 'dark';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(next)}
            className={`h-9 w-9 text-muted-foreground hover:text-foreground active:scale-95 transition-all ${className}`}
            aria-label={`Switch to ${next} mode`}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{`Switch to ${next} mode`}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ThemeToggle;
