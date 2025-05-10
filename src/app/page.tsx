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
            <div className="flex h-screen w-full overflow-hidden dark:bg-dark-primary">
                <Authenticated>
                    <div className="w-64 h-full flex-shrink-0  flex min-h-screen font-[family:var(--font-geist-sans)]">
                        <Folders />
                    </div>

                    <div className="flex-1 overflow-y-auto flex min-h-screen relative font-[family:var(--font-geist-sans)]">
                        <div className="w-full relative">
                            <BookmarkList />
                            <BookmarkDetailsDialog />
                        </div>
                    </div>
                </Authenticated>

                <Unauthenticated>
                    <SignIn />
                </Unauthenticated>
            </div>
        </ThemeContext.Provider>
    )
}
