import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

/** Segmented sun/moon toggle that swaps the entire CSS-variable theme set. */
export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const isDark = mounted ? theme !== 'light' : true

  const tile = (active: boolean) =>
    cn(
      'flex h-7 w-7 items-center justify-center rounded-lg transition-colors',
      active ? 'bg-surface text-ink dark:bg-[hsl(229_14%_24%)] dark:text-ink' : 'text-muted-foreground'
    )

  return (
    <div className="flex gap-0.5 rounded-[11px] p-[3px]" style={{ background: 'hsl(var(--toggle-track))' }}>
      <button type="button" aria-label="Light theme" onClick={() => setTheme('light')} className={tile(!isDark)}>
        <Sun className="h-[15px] w-[15px]" strokeWidth={2} />
      </button>
      <button type="button" aria-label="Dark theme" onClick={() => setTheme('dark')} className={tile(isDark)}>
        <Moon className="h-[14px] w-[14px]" fill="currentColor" strokeWidth={0} />
      </button>
    </div>
  )
}
