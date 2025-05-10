'use client'
import _ from 'lodash'
import {
    useState,
    useCallback,
    useRef,
    type KeyboardEvent,
    useEffect,
    type ChangeEvent,
} from 'react'
import { Input } from '@/components/ui/input'
import { Search, SquareCheckBig, Trash2, Upload } from 'lucide-react'
import AddBookmarkDialog from '../add-bookmark-dialog/add-bookmark-dialog'
import BookmarkItem from './bookmark-item'
import MoveBookmark from '../move-bookmark/move-bookmark'
import TagBookmark from '../tag-bookmark/tag-bookmark'
import { usePaginatedQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import type { Id, Doc } from '../../../../convex/_generated/dataModel'
import { useToast } from '@/hooks/use-toast'
import { ScrollArea } from '@/components/ui/scroll-area'
interface ParsedBookmark {
    url: string
    title: string
    hostname: string
    favicon?: string
}

enum FilterMode {
    TAGS = 'tags',
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
    const [filterMode, setFilterMode] = useState<FilterMode | undefined>(undefined)
    const inputRef = useRef<HTMLInputElement | null>(null)
    const { toast } = useToast()

    const debouncedSearch = useCallback(
        _.debounce((term, filterMode) => {
            let filterTerm = term
            if (filterMode === FilterMode.TAGS) {
                filterTerm = `tags:${term}`
            }
            setDebouncedSearchTerm(filterTerm)
        }, 150),
        [],
    )

    const { results: bookmarks } = usePaginatedQuery(
        api.bookmarks.getBookmarks,
        { searchTerm: debouncedSearchTerm ?? '' },
        { initialNumItems: 20 },
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
                    toast({
                        description: 'Uploading bookmark...',
                    })
                    await Promise.all(
                        res.map((b) =>
                            createBookmark({
                                title: b.title,
                                hostname: b.hostname,
                                url: b.url,
                            }),
                        ),
                    )
                    toast({
                        description: 'Successfully uploaded bookmarks.',
                    })
                }
                reader.readAsText(file)
            }
            return
        },
        [createBookmark, toast],
    )

    useEffect(() => {
        debouncedSearch(searchTerm, filterMode)
    }, [searchTerm, filterMode, debouncedSearch])

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

    const handleOnKeyDown = useCallback((event: KeyboardEvent<HTMLInputElement>) => {
        if (event.code === 'Backspace' && (inputRef.current?.value.length ?? 0) === 0) {
            setFilterMode(undefined)
        }
        if (event.code === 'Semicolon' && inputRef.current?.value === 'tags') {
            event.preventDefault()
            inputRef.current.value = ''
            setSearchTerm('')
            setFilterMode(FilterMode.TAGS)
        }
    }, [])

    return (
        <div className="w-full md:w-2/3  p-2 h-full  relative">
            <div className="absolute left-0 top-0 bg-white dark:bg-dark-primary z-30 h-[100px] p-2 w-full">
                <div className="flex  items-center">
                    <div className="flex flex-grow items-center border border-[#d2d1d1] bg-[#e0e0e0] dark:bg-dark-input dark:border-dark-input-border rounded-sm">
                        <Search color="#909090" className="mx-1" size={13} />
                        {filterMode === FilterMode.TAGS ? (
                            <span className="text-[10px] p-[2px] rounded-[2px] bg-[#2e5331]">
                                tags
                            </span>
                        ) : null}
                        <Input
                            ref={inputRef}
                            onKeyDown={handleOnKeyDown}
                            className="!text-[12px] h-7 w-full  focus-visible:ring-0 p-0 m-0 px-1 outline-none rounded-none rounded-r-sm !border-none bg-[#e0e0e0] dark:bg-dark-input"
                            placeholder="search..."
                            onChange={(evt) => setSearchTerm(evt.target.value)}
                            value={searchTerm ?? ''}
                        />
                    </div>

                    <div className="ml-2">
                        <input
                            type="file"
                            id="file-upload"
                            style={{ display: 'none' }}
                            onChange={handleFileChange}
                        />
                        <label
                            htmlFor="file-upload"
                            className="text-[10px] cursor-pointer p-[5px] px-[8px] rounded-sm flex items-center text-white  bg-dark-secondary">
                            <Upload className="mr-1" size={10} />
                            Import
                        </label>
                    </div>
                </div>

                <div className="my-4 flex items-center justify-between">
                    <AddBookmarkDialog />
                    <div
                        onClick={handleSelectMultiple}
                        className="flex cursor-pointer items-center">
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
                        <MoveBookmark
                            selectionIds={Object.keys(selection) as Array<Id<'bookmarks'>>}
                        />
                        <TagBookmark
                            selectionIds={Object.keys(selection) as Array<Id<'bookmarks'>>}
                        />
                        <button
                            onClick={handleDeleteBookmarks}
                            className={`flex items-center  ml-2 rounded-sm  ${Object.keys(selection).length === 0 ? 'opacity-50' : 'hover:opacity-70'} `}>
                            <Trash2 size={12} />
                            <span className="text-[10px] px-[2px]">Delete</span>
                        </button>
                    </div>
                ) : null}
            </div>
            <ScrollArea className="h-[calc(100%-140px)]  mt-[100px] py-4 w-full">
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
            </ScrollArea>
            {/* <div className="h-[40px] dark:bg-dark-primary z-30 sticky bottom-0 "></div> */}
        </div>
    )
}

export default BookmarkList
