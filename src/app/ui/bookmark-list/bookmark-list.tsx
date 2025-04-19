'use client'
import _ from 'lodash'
import { useState, useCallback, useEffect, type ChangeEvent } from 'react'
import { Input } from '@/components/ui/input'
import { Search, SquareCheckBig, Trash2 } from 'lucide-react'
import AddBookmarkDialog from '../add-bookmark-dialog/add-bookmark-dialog'
import BookmarkItem from './bookmark-item'
import MoveBookmark from '../move-bookmark/move-bookmark'
import TagBookmark from '../tag-bookmark/tag-bookmark'

import { usePaginatedQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import type { Id, Doc } from '../../../../convex/_generated/dataModel'

interface ParsedBookmark {
    url: string
    title: string
    hostname: string
    favicon?: string
}

const parseBookmarks = (content: unknown) => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(content as string, 'text/html')

    const links = doc.querySelectorAll('a')
    const bookmarkUrls: Array<ParsedBookmark> = []

    // biome-ignore lint/complexity/noForEach: <explanation>
    links.forEach((link) => {
        const url = link.getAttribute('href')
        const title = link.textContent?.trim()
        const hostname = url ? new URL(url).hostname : ''
        if (url && title && hostname) {
            bookmarkUrls.push({
                url,
                title,
                hostname,
                favicon: link.getAttribute('icon') ?? undefined,
            })
        }
    })

    return bookmarkUrls
}

const BookmarkList = () => {
    const [searchTerm, setSearchTerm] = useState<undefined | string>(undefined)
    const [IsShowSelection, setIsShowSelection] = useState(true)
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<undefined | string>(undefined)
    const [selection, setSelection] = useState<Record<Id<'bookmarks'>, boolean>>({})

    const debouncedSearch = useCallback(
        _.debounce((term) => {
            setDebouncedSearchTerm(term)
        }, 150),
        [],
    )

    const { results: bookmarks } = usePaginatedQuery(
        api.bookmarks.getBookmarks,
        { searchTerm: debouncedSearchTerm ?? '' },
        { initialNumItems: 100 },
    )

    const deleteBookmarks = useMutation(api.bookmarks.bulkDelete)
    const createBookmark = useMutation(api.bookmarks.createBookmark)
    const handleSelectMultiple = useCallback(() => {
        setIsShowSelection((prevState) => !prevState)
    }, [])

    const handleFileChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0]
            const bookmarks: Array<ParsedBookmark> = []
            if (file) {
                const reader = new FileReader()
                reader.onload = async (e) => {
                    const content = e.target?.result
                    const res = parseBookmarks(content)
                    await Promise.all(
                        res.map((b) =>
                            createBookmark({
                                title: b.title,
                                hostname: b.hostname,
                                url: b.url,
                            }),
                        ),
                    )
                }
                reader.readAsText(file)
            }
            return
        },
        [createBookmark],
    )

    useEffect(() => {
        debouncedSearch(searchTerm)
    }, [searchTerm, debouncedSearch])

    const handleSelect = useCallback((bookmarkId: Id<'bookmarks'>, value: boolean) => {
        setSelection((prevState) => {
            let tempPrevState = { ...prevState }
            if (tempPrevState[bookmarkId]) {
                delete tempPrevState[bookmarkId]
            } else {
                tempPrevState = {
                    ...prevState,
                    [bookmarkId]: value,
                }
            }

            return tempPrevState
        })
    }, [])

    const handleDeleteBookmarks = useCallback(() => {
        const ids = Object.keys(selection) as Array<Id<'bookmarks'>>
        deleteBookmarks({ ids })
        setSelection({})
    }, [selection, deleteBookmarks])

    return (
        <div className="w-3/6 p-2">
            <div className="flex items-center">
                <div className="flex items-center border border-[#d2d1d1] bg-[#e0e0e0] dark:bg-dark-input dark:border-dark-input-border rounded-sm">
                    <Search color="#909090" className="mx-1" size={13} />
                    <Input
                        className="!text-[12px] h-7 w-full  focus-visible:ring-0 p-0 m-0 px-1 outline-none rounded-none rounded-r-sm !border-none bg-[#e0e0e0] dark:bg-dark-input"
                        placeholder="search..."
                        onChange={(evt) => setSearchTerm(evt.target.value)}
                        value={searchTerm ?? ''}
                    />
                </div>

                <div>
                    <input
                        type="file"
                        id="file-upload"
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                    />
                    <label
                        htmlFor="file-upload"
                        className="text-[10px] p-[2px] rounded-sm  bg-dark-secondary">
                        Import
                    </label>
                </div>
            </div>

            <div className="my-4 flex items-center justify-between">
                <AddBookmarkDialog />
                <div onClick={handleSelectMultiple} className="flex cursor-pointer items-center">
                    <SquareCheckBig size={12} />
                    <span className="text-[10px] pl-[2px]">
                        {IsShowSelection ? '  Hide Selection' : 'Select Multiple'}
                    </span>
                </div>
            </div>
            {IsShowSelection ? (
                <div className="flex items-center">
                    <span className="text-[9px]">
                        {Object.keys(selection).length} bookmarks selected
                    </span>
                    <MoveBookmark selectionIds={Object.keys(selection) as Array<Id<'bookmarks'>>} />
                    <TagBookmark selectionIds={Object.keys(selection) as Array<Id<'bookmarks'>>} />
                    <button
                        onClick={handleDeleteBookmarks}
                        className={`flex items-center  ml-2 rounded-sm  ${Object.keys(selection).length === 0 ? 'opacity-50' : 'hover:opacity-70'} `}>
                        <Trash2 size={12} />
                        <span className="text-[10px] px-[2px]">Delete</span>
                    </button>
                </div>
            ) : null}
            <div className="mt-4 w-full">
                {bookmarks.length === 0 ? (
                    <div className="w-full flex items-center text-[#787878] justify-center mt-10">
                        <Search size={12} />
                        <span className="text-xs pl-1">No bookmark found</span>
                    </div>
                ) : null}

                {bookmarks.map((bookmark) => (
                    <BookmarkItem
                        isSelectable={IsShowSelection}
                        onSelect={handleSelect}
                        key={bookmark._id}
                        bookmark={bookmark}
                    />
                ))}
            </div>
        </div>
    )
}

export default BookmarkList
