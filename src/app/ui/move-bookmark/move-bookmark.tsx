'use client'
import { useState, useCallback } from 'react'
import { Folder } from 'lucide-react'

import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

import { usePaginatedQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import type { Id } from '../../../../convex/_generated/dataModel'

interface MoveBookmarkProps {
    selectionIds: Array<Id<'bookmarks'>>
}

const MoveBookmark = (props: MoveBookmarkProps) => {
    const [open, setOpen] = useState(false)
    const { results: folders } = usePaginatedQuery(
        api.folders.getFolders,
        {},
        { initialNumItems: 10 },
    )

    const bulkMoveToFolder = useMutation(api.bookmarks.bulkAddBookmarksToFolder)

    const handleSelect = useCallback(
        (folderId: string) => {
            const folder = folders.find((f) => f._id === folderId)

            if (folder) {
                const filteredIds = []
                for (let i = 0; i < props.selectionIds.length; i++) {
                    const id = props.selectionIds[i]
                    if (folder.allBookmarkIds.includes(id)) {
                        continue
                    }
                    filteredIds.push(id)
                }

                bulkMoveToFolder({
                    folderId: folderId as Id<'folders'>,
                    bookmarkIds: filteredIds,
                })
            }

            setOpen(false)
        },
        [props.selectionIds, folders, bulkMoveToFolder],
    )

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger disabled={Object.keys(props.selectionIds).length === 0} asChild>
                <button
                    className={`flex items-center ml-4 rounded-sm  ${Object.keys(props.selectionIds).length === 0 ? 'opacity-50' : 'hover:opacity-70'} `}>
                    <Folder size={12} />
                    <span className="text-[10px] px-[2px]">Move</span>
                </button>
            </PopoverTrigger>

            <PopoverContent className="bg-[#f7f7f7] dark:bg-dark-modal mx-8 border w-[200px] border-[#cecece] dark:border-dark-border relative">
                <Command className="dark:bg-dark-modal ">
                    <CommandInput className="text-[12px]" placeholder="Search folder..." />
                    <CommandList>
                        <CommandEmpty className="text-[12px] text-center py-4">
                            No folder found.
                        </CommandEmpty>
                        <CommandGroup heading="Folders">
                            {folders.map((folder) => {
                                return (
                                    <CommandItem
                                        key={folder._id}
                                        value={folder._id}
                                        onSelect={handleSelect}
                                        className="hover:!bg-[#e0e0e0] dark:hover:!bg-dark-menu-hover  cursor-pointer ">
                                        <Folder size={15} />
                                        <span className="text-[12px]">{folder.name}</span>
                                    </CommandItem>
                                )
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

export default MoveBookmark
