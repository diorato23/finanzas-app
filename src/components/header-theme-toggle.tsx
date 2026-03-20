"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function HeaderThemeToggle() {
    const { setTheme, resolvedTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return (
        <div className="hidden sm:flex items-center gap-1 bg-accent/50 p-1 rounded-full border border-border/50">
            <button className="p-1.5 rounded-full bg-card shadow-sm text-foreground opacity-50"><Sun className="w-4 h-4" /></button>
            <button className="p-1.5 rounded-full hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 opacity-50"><Moon className="w-4 h-4" /></button>
        </div>
    )

    const isDark = resolvedTheme === 'dark'

    return (
        <div className="hidden sm:flex items-center gap-1 bg-accent/50 p-1 rounded-full border border-border/50">
            <button
                type="button"
                onClick={() => setTheme('light')}
                className={`p-1.5 rounded-full transition-all ${!isDark ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5'}`}
            >
                <Sun className="w-4 h-4" />
            </button>
            <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`p-1.5 rounded-full transition-all ${isDark ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5'}`}
            >
                <Moon className="w-4 h-4" />
            </button>
        </div>
    )
}
