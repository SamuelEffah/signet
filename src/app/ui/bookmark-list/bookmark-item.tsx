import moment from 'moment'
import { MoreVertical, Trash2, ExternalLink, AlarmClock, Globe } from 'lucide-react'
import { useCallback, useContext, useMemo } from 'react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuPortal,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { strToColor } from '@/app/utils/conv'
import { ThemeContext } from '@/app/context/theme-context'
import type { Doc, Id } from '../../../../convex/_generated/dataModel'
import { useMutation, usePaginatedQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { useBookmarkDetailDialogStore } from '@/app/store/bookmark-details-dialog-store'
import Image from 'next/image'

interface BookmarkItemProps {
    bookmark: Doc<'bookmarks'>
    isSelectable?: boolean
    isChecked: boolean
    onSelect?: (bookmarkId: Id<'bookmarks'>, value: boolean) => void
    isFolder?: boolean
}

export function BookmarkDropdownMenu({
    bookmark,
    isFolder,
}: { bookmark: Doc<'bookmarks'>; isFolder?: boolean }) {
    const deleteBookmark = useMutation(api.bookmarks.bulkDelete)
    const removeBookmarkFromFolder = useMutation(api.bookmarks.removeBookmarkFromFolder)

    const addBookmarkToFolder = useMutation(api.bookmarks.addBookmarkToFolder)
    const { results: folders } = usePaginatedQuery(
        api.folders.getFolders,
        {},
        { initialNumItems: 10 },
    )

    const handleAddToFolder = useCallback(
        (folderId: string) => {
            addBookmarkToFolder({
                id: bookmark._id,
                folderId: folderId as Id<'folders'>,
            })
        },
        [bookmark, addBookmarkToFolder],
    )

    const handleDeleteBookmark = useCallback(() => {
        if (!isFolder) {
            deleteBookmark({ ids: [bookmark._id] })
        } else if (isFolder && bookmark.folderId) {
            removeBookmarkFromFolder({
                bookmarkId: bookmark._id,
            })
        }
    }, [isFolder, bookmark, removeBookmarkFromFolder, deleteBookmark])

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <div onClick={(evt) => evt.stopPropagation()} className="p-1 rounded-sm">
                    <MoreVertical size={13} />
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-40 dark:bg-dark-menu">
                {!isFolder ? (
                    <>
                        <DropdownMenuLabel className="text-[11px]">Edit Bookmark</DropdownMenuLabel>
                    </>
                ) : null}
                <DropdownMenuGroup>
                    {!isFolder ? (
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger className="text-[10px] dark:hover:bg-dark-menu-hover">
                                Add to folder
                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                                <DropdownMenuSubContent className="dark:bg-dark-menu">
                                    {folders.map((folder) => (
                                        <DropdownMenuItem
                                            className="text-[10px] dark:hover:bg-dark-menu-hover"
                                            onClick={() => handleAddToFolder(folder._id)}
                                            key={folder._id}>
                                            {folder.name}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                        </DropdownMenuSub>
                    ) : null}
                </DropdownMenuGroup>
                <DropdownMenuItem
                    className="dark:hover:bg-dark-menu-hover"
                    onClick={handleDeleteBookmark}>
                    <div className="flex text-xs items-center">
                        <Trash2 size={12} />
                        <span className="pl-1 text-[10px]">
                            {isFolder ? 'Remove from folder' : 'Delete'}
                        </span>
                    </div>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

const BookmarkItem = ({
    bookmark,
    isFolder,
    isChecked,
    onSelect,
    isSelectable,
}: BookmarkItemProps) => {
    const themeContext = useContext(ThemeContext)

    const { openDialog } = useBookmarkDetailDialogStore()
    const bookmarkLastVisited = useMutation(api.bookmarks.lastVisited)

    const lastVisited = useMemo(
        () => (bookmark?.lastVisited ? moment(bookmark.lastVisited).startOf('hour').fromNow() : ''),
        [bookmark],
    )

    const handleBookmark = useCallback(() => {
        bookmarkLastVisited({ lastVisited: moment().format(), id: bookmark._id })
        window.open(bookmark.url, '_blank')
    }, [bookmark, bookmarkLastVisited])

    const handleViewDetails = useCallback(() => {
        openDialog(bookmark._id)
    }, [bookmark, openDialog])

    const isDarkTheme = useMemo(() => themeContext?.theme === 'dark', [themeContext?.theme])

    return (
        <div className="flex items-center w-full relative px-3 py-[2px]">
            {isSelectable ? (
                <input
                    checked={isChecked}
                    onChange={(evt) => onSelect?.(bookmark._id, evt.target.checked)}
                    type="checkbox"
                    className="mr-2  outline-none dark:checked:bg-[#3152d8] dark:bg-dark-input w-[12px] h-[12px] "
                />
            ) : null}
            <div
                onClick={handleViewDetails}
                className="flex w-full relative items-center cursor-pointer mb-[4px] rounded-md hover:bg-[#e1e1e1] dark:hover:bg-dark-hover">
                {bookmark.favicon ? (
                    <Image
                        src={bookmark.favicon}
                        alt={`${bookmark.hostname}-favicon`}
                        unoptimized
                        width={16}
                        height={16}
                        className="w-6 h-6 rounded-md"
                    />
                ) : (
                    <div className="w-6 h-6 flex items-center justify-center rounded-md bg-[#d6e0ff] dark:bg-[#2d2f41]">
                        <Globe className="text-[#525884] dark:text-[#757ebd]" size={15} />
                    </div>
                )}

                <div className="ml-[5px] flex flex-col leading-none">
                    <div className="flex items-center justify-between">
                        <p className="m-0 p-0 py-[2px] text-[10px] font-medium">
                            {bookmark?.title}
                        </p>
                        {bookmark?.reminderDate ? (
                            <span
                                title={`Reminder to use this bookmark ${moment(bookmark?.reminderDate).endOf('day').fromNow()}`}
                                className="text-[8px] bg-[#dedede] dark:bg-[#3a3b3d] p-[2px] rounded-full flex items-center ml-3">
                                <AlarmClock className="mx-[2px]" size={10} />
                                <span className="mt-[2px]">
                                    {moment(bookmark.reminderDate).endOf('day').fromNow()}
                                </span>
                            </span>
                        ) : null}
                        <div className="flex items-center ml-1">
                            {bookmark?.tags?.split(' ').map((tag) =>
                                tag.split('.').map((t) => (
                                    <span
                                        key={t}
                                        style={{
                                            backgroundColor: strToColor(
                                                t,
                                                isDarkTheme ? 0.4 : 0.6,
                                                isDarkTheme ? 0.3 : 0.8,
                                            ),
                                        }}
                                        className="text-[9px] mx-[2px] py-[1px] px-[4px] rounded-[2px]">
                                        {t}
                                    </span>
                                )),
                            )}
                        </div>
                    </div>
                    <div className="flex text-xs pt-[2px]leading-none m-0 p-0 items-center">
                        <span className="text-[9px]">{bookmark?.hostname}</span>
                    </div>
                    {bookmark?.lastVisited ? (
                        <span className="text-[8px] py-[1px] text-[#474747] dark:text-dark-text-primary">
                            Last visited {lastVisited}
                        </span>
                    ) : null}
                </div>
                <div
                    className="absolute right-3 flex items-center"
                    onClick={(evt) => evt.stopPropagation()}>
                    <div onClick={handleBookmark} className="mr-3">
                        <ExternalLink size={14} />
                    </div>
                    <BookmarkDropdownMenu isFolder={isFolder} bookmark={bookmark} />
                </div>
            </div>
        </div>
    )
}

export default BookmarkItem
