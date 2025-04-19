'use client'
import { useCallback, useMemo, type KeyboardEvent, useState, useEffect, createRef } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import moment from 'moment'

import { Link, ExternalLink, X, Calendar as CalendarIcon, Plus } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@radix-ui/react-popover'
import { Calendar } from '@/components/ui/calendar'
import { strToColor } from '@/app/utils/conv'
import { useBookmarkDetailDialogStore } from '@/app/store/bookmark-details-dialog-store'

import { useMutation, useConvex } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import type { Doc } from '../../../../convex/_generated/dataModel'
import Image from 'next/image'

const BookmarkDetailsDialog = () => {
    const [newTag, setNewTag] = useState('')
    const [calenderOpen, setCalenderOpen] = useState(false)
    const [bookmarkNote, setBookmarkNote] = useState<string | undefined>('')
    const [reminderDate, setReminderDate] = useState<Date | undefined>(undefined)
    const [tags, setTags] = useState<string[]>([])
    const [bookmark, setBookmark] = useState<Doc<'bookmarks'> | null>(null)

    const { open, setOpen, bookmarkId } = useBookmarkDetailDialogStore()

    const convex = useConvex()
    const addBookmarkTag = useMutation(api.bookmarks.addBookmarkTag)
    const removeBookmarkTag = useMutation(api.bookmarks.removeBookmarkTag)
    const addBookmarkNote = useMutation(api.bookmarks.addBookmarkNote)
    const bookmarkLastVisited = useMutation(api.bookmarks.lastVisited)
    const addReminderDate = useMutation(api.bookmarks.addReminderDate)

    useEffect(() => {
        if (bookmarkId) {
            const getBookmark = async () => {
                const bookmark = await convex.query(api.bookmarks.getBookmark, {
                    id: bookmarkId,
                })
                setBookmark(bookmark)
                setTags(bookmark?.tags?.split(' ').flatMap((t) => t.split('.')) ?? [])
                setReminderDate(
                    bookmark?.reminderDate ? moment(bookmark.reminderDate).toDate() : undefined,
                )
            }
            void getBookmark()
        }
    }, [bookmarkId, convex.query])

    const ref = createRef<HTMLTextAreaElement>()

    const lastVisited = useMemo(
        () => (bookmark?.lastVisited ? moment(bookmark.lastVisited).startOf('hour').fromNow() : ''),
        [bookmark],
    )

    const handleKeyDown = useCallback(
        (evt: KeyboardEvent<HTMLTextAreaElement>) => {
            if (evt.key === 'Tab' && ref.current && bookmark?.note) {
                evt.preventDefault()
                evt.stopPropagation()
                setBookmarkNote(bookmark?.note)
                ref.current.selectionStart = bookmark.note.length
                ref.current.selectionEnd = bookmark.note.length
            }
        },
        [bookmark, ref],
    )

    const handleBookmark = useCallback(() => {
        if (bookmark) {
            bookmarkLastVisited({ lastVisited: moment().format(), id: bookmark._id })
            window.open(bookmark.url, '_blank')
        }
    }, [bookmark, bookmarkLastVisited])

    useEffect(() => {
        if (!open) {
            setBookmarkNote('')
            setReminderDate(undefined)
        }
    }, [open])

    const handleSavingBookmark = useCallback(() => {
        if (bookmark && bookmarkNote) {
            addBookmarkNote({ id: bookmark._id, note: bookmarkNote })
        }
    }, [bookmarkNote, bookmark, addBookmarkNote])

    const handleNewTag = useCallback(() => {
        const prevTags = tags
        if (bookmark) {
            const addNewTag = async () => {
                try {
                    await addBookmarkTag({ id: bookmark?._id, tags: [newTag] })
                    setTags((prevTags) => [...prevTags, newTag])
                } catch (error) {
                    // pass
                }
            }
            void addNewTag()
        }

        setNewTag('')
    }, [newTag, tags, bookmark, addBookmarkTag])

    const handleReminderDate = useCallback(
        (day: Date) => {
            if (bookmark) {
                addReminderDate({
                    id: bookmark._id,
                    reminderDate: moment(day).format(),
                })
            }
        },
        [bookmark, addReminderDate],
    )

    const handleRemoveTag = useCallback(
        (tag: string) => {
            if (bookmark) {
                const removeTag = async () => {
                    try {
                        await removeBookmarkTag({ id: bookmark._id, tag })
                        setTags((prevTags) => prevTags.filter((t) => t !== tag))
                    } catch (error) {
                        // pass
                    }
                }
                void removeTag()
            }
        },
        [bookmark, removeBookmarkTag],
    )

    const bookmarkReminderDate = useMemo(() => {
        if (!reminderDate && !bookmark?.reminderDate) {
            return <span className="text-[10px] pr-1">Set reminder date </span>
        }
        return (
            <span className="text-[10px] pr-1">
                {' '}
                {reminderDate === undefined
                    ? moment(bookmark?.reminderDate).format('ddd MMM Do YYYY')
                    : reminderDate.toDateString()}
            </span>
        )
    }, [reminderDate, bookmark])

    useEffect(() => {
        setCalenderOpen(false)
    }, [])

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[360px] dark:bg-dark-modal dark:border-dark-border">
                <DialogHeader className="space-y-0">
                    <DialogTitle className="flex items-center pb-1 text-[12px]">
                        {bookmark?.favicon ? (
                            <Image
                                src={bookmark.favicon}
                                alt={`${bookmark.hostname}-favicon`}
                                unoptimized
                                width={12}
                                height={12}
                                className="w-4 h-4 mr-[4px] rounded-md"
                            />
                        ) : null}
                        {bookmark?.title}
                        <span className="ml-4 cursor-pointer">
                            <ExternalLink onClick={handleBookmark} size={12} />
                        </span>
                    </DialogTitle>

                    <div className="flex items-center text-[#4c4c4c] dark:text-[#909090]">
                        <Link size={10} />
                        <p
                            onClick={handleBookmark}
                            className="text-[9px] cursor-pointer pl-1 hover:underline">
                            {bookmark?.url}
                        </p>
                    </div>
                </DialogHeader>
                <DialogDescription className="m-0 p-0">
                    <div className="leading-none ">
                        <div className="mb-2 flex items-center w-max p-[3px] rounded-sm border-[1px] border-[#d4d3d3] dark:border-[#363b48]">
                            {tags.map((tag) => (
                                <div
                                    key={tag}
                                    style={{ backgroundColor: strToColor(tag) }}
                                    className="flex w-max items-center text-[9px] text-[#000] p-1 mx-[2px] rounded-sm">
                                    <span>{tag}</span>
                                    <X
                                        onClick={() => handleRemoveTag(tag)}
                                        className="ml-1 cursor-pointer hover:opacity-45"
                                        size={9}
                                    />
                                </div>
                            ))}
                            {tags.length < 2 ? (
                                <div
                                    className={`flex ${tags.length > 0 ? 'ml-2' : ''} rounded-sm items-center bg-[#dedede] dark:bg-[#2b2c3b]`}>
                                    <input
                                        value={newTag}
                                        onChange={(evt) => setNewTag(evt.target.value)}
                                        placeholder="add a tag"
                                        className="h-[20px] rounded-l-sm ml-1 border-none bg-[#dedede] text-[10px] dark:bg-[#2b2c3b] w-[100px]"
                                    />

                                    <span>
                                        <Plus
                                            onClick={handleNewTag}
                                            className="ml-2 mr-1 cursor-pointer"
                                            size={12}
                                        />
                                    </span>
                                </div>
                            ) : null}
                        </div>
                        <p className="text-[8px] p-0 m-0 text-[#474747] dark:text-dark-text-primary font-semibold">
                            Added on:
                            {moment(bookmark?._creationTime).format('ddd MMM Do YYYY')}
                        </p>
                        <p className="text-[8px] py-1 m-0 text-[#474747] dark:text-dark-text-primary">
                            {lastVisited
                                ? `Last visited ${lastVisited}`
                                : 'You have not visited this bookmark yet'}
                        </p>
                        <Popover open={calenderOpen} onOpenChange={setCalenderOpen}>
                            <PopoverTrigger asChild>
                                <div className="flex items-center my-1">
                                    <span
                                        onClick={(evt) => evt.stopPropagation()}
                                        className="text-[10px] dark:text-dark-text-primary mr-2 text-[#171717]">
                                        Reminder me to use on
                                    </span>
                                    <div className="flex items-center cursor-pointer border border-[#d2d1d1] dark:border-dark-input-border w-max p-1 rounded-sm">
                                        {bookmarkReminderDate}
                                        <CalendarIcon size={12} />
                                    </div>
                                </div>
                            </PopoverTrigger>
                            <PopoverContent
                                className="w-auto p-0 bg-[#ffffff] dark:bg-dark-modal z-50 drop-shadow-md border border-[#d2d1d1] dark:border-dark-border  rounded-md"
                                align="start">
                                <Calendar
                                    mode="single"
                                    className="dark:text-dark-text-primary"
                                    selected={reminderDate}
                                    onSelect={setReminderDate}
                                    onDayClick={(day) => {
                                        handleReminderDate(day)
                                    }}
                                />
                            </PopoverContent>
                        </Popover>

                        <div className="relative">
                            <textarea
                                ref={ref}
                                onKeyDown={handleKeyDown}
                                onChange={(evt) => setBookmarkNote(evt.target.value)}
                                value={bookmarkNote}
                                className="w-full my-2 outline-none !text-[11px] text-[#393939] dark:text-dark-text-primary  focus-visible:ring-0 p-2 bg-[#e3e3e3] dark:bg-dark-input rounded-sm border border-[#cecece] dark:border-dark-input-border"
                                placeholder={bookmark?.note ?? 'Add some note'}
                            />
                            <div className="flex justify-end">
                                <button
                                    onClick={handleSavingBookmark}
                                    className="text-[10px] hover:text-[#384eda]">
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                </DialogDescription>
            </DialogContent>
        </Dialog>
    )
}

export default BookmarkDetailsDialog
