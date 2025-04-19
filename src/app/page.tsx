'use client'
import { useCallback, useMemo, useEffect, useState } from 'react'
import BookmarkList from './ui/bookmark-list/bookmark-list'
import Folders from './ui/folders/folders'
import { ThemeContext } from './context/theme-context'
import { Authenticated, Unauthenticated, useQuery } from 'convex/react'
import SignIn from './auth/sign-in'
import BookmarkDetailsDialog from './ui/bookmark-details/bookmark-details'

export default function Home() {
    const [theme, setTheme] = useState<string>('dark')

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add(theme)
            localStorage.setItem('theme', theme)
        } else {
            document.documentElement.classList.remove('dark')
            localStorage.setItem('theme', theme)
        }
    }, [theme])

    const contextValue = useMemo(
        () => ({
            theme,
            setTheme,
        }),
        [theme],
    )

    return (
        <ThemeContext.Provider value={contextValue}>
            <div className="dark:bg-dark-primary">
                <Authenticated>
                    <div className="grid dark:bg-dark-primary grid-cols-[310px_minmax(800px,1fr)_300px] min-h-screen font-[family-name:var(--font-geist-sans)]">
                        <Folders />
                        <BookmarkList />
                    </div>
                    <BookmarkDetailsDialog />
                </Authenticated>

                <Unauthenticated>
                    <SignIn />
                </Unauthenticated>
            </div>
        </ThemeContext.Provider>
    )
}
