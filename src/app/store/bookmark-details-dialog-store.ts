import { create } from 'zustand'
import type { Id } from '../../../convex/_generated/dataModel'

interface BookmarkDetailDialogStore {
    open: boolean
    setOpen: () => void
    openDialog: (bookmarkId: Id<'bookmarks'>) => void
    bookmarkId: Id<'bookmarks'> | undefined
}

const useBookmarkDetailDialogStore = create<BookmarkDetailDialogStore>()((set) => ({
    open: false,
    bookmarkId: undefined,
    setOpen: () =>
        set((state) => {
            return { ...state, bookmarkId: undefined, open: !open }
        }),
    openDialog: (bookmarkId) =>
        set((state) => {
            return { ...state, bookmarkId, open: true }
        }),
}))

export { useBookmarkDetailDialogStore }
