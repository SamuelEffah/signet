'use client'

import React, { useCallback, useContext, useEffect, useState } from 'react'
import { FolderOpen, FolderClosed, Trash2, EyeOff, Sun, Moon } from 'lucide-react'
import { ThemeContext } from '@/app/context/theme-context'

const ThemeToggle = () => {
    const [darkMode, setDarkMode] = useState(false)
    const themeContext = useContext(ThemeContext)

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme')

        if (savedTheme === 'dark') {
            themeContext?.setTheme('dark')
        } else if (savedTheme === 'light') {
            themeContext?.setTheme('light')
        } else {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
            themeContext?.setTheme(prefersDark ? 'dark' : 'ligth')
        }
    }, [themeContext?.setTheme])

    const handleTheme = useCallback(() => {
        themeContext?.setTheme((prevstate) => (prevstate === 'dark' ? 'light' : 'dark'))
    }, [themeContext?.setTheme])

    return (
        <button
            onClick={handleTheme}
            className="p-2 transition-colors"
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
            {themeContext?.theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>
    )
}

export default ThemeToggle
