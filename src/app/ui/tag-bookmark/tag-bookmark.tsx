'use client'
import { useState, useCallback, useContext, useMemo } from 'react'
import { Tag, X, Command } from 'lucide-react'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { strToColor } from '@/app/utils/conv'
import { Input } from '@/components/ui/input'
import { ThemeContext } from '@/app/context/theme-context'

import { useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import type { Id } from '../../../../convex/_generated/dataModel'

interface TagBookmarkProps {
    selectionIds: Array<Id<'bookmarks'>>
}

const TagBookmark = (props: TagBookmarkProps) => {
    const themeContext = useContext(ThemeContext)

    const [open, setOpen] = useState(false)
    const [value, setValue] = useState('')
    const [tags, setTags] = useState<string[]>([])

    const tagsBookmarks = useMutation(api.bookmarks.bulkTags)

    const handleRemoveTag = useCallback((tag: string) => {
        setTags((prevTags) => prevTags.filter((t) => t !== tag))
    }, [])

    const handleBulkTags = useCallback(() => {
        const allTags = [...tags]
        if (value.trim().length > 0) {
            allTags.push(value)
        }
        tagsBookmarks({ tags: allTags, ids: props.selectionIds })
        setValue('')
        setTags([])
        setOpen(false)
    }, [props.selectionIds, tagsBookmarks, value, tags])

    const handleKeyDown = useCallback(
        (evt: React.KeyboardEvent<HTMLInputElement>) => {
            if (evt.key === 'Enter') {
                setTags((prevTags) => {
                    const isTagExist = prevTags.includes(value)
                    if (!isTagExist) {
                        return [...prevTags, value]
                    }
                    return prevTags
                })
                setValue('')
            }
            if (evt.ctrlKey && evt.code === 'KeyS') {
                handleBulkTags()
            }
        },
        [handleBulkTags, value],
    )

    const isDarkTheme = useMemo(() => themeContext?.theme === 'dark', [themeContext?.theme])

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger disabled={Object.keys(props.selectionIds).length === 0} asChild>
                <button
                    className={`flex items-center  ml-2 rounded-sm  ${Object.keys(props.selectionIds).length === 0 ? 'opacity-50' : 'hover:opacity-70'} `}>
                    <Tag size={12} />
                    <span className="text-[10px] px-[2px]">Tag</span>
                </button>
            </PopoverTrigger>
            <PopoverContent className="bg-[#f7f7f7] dark:bg-dark-modal mx-8 border border-[#cecece] dark:border-dark-input-border relative">
                <div>
                    <div>
                        <div className="py-1 flex items-center">
                            {tags.map((tag) => (
                                <div
                                    key={tag}
                                    style={{
                                        backgroundColor: strToColor(
                                            tag,
                                            isDarkTheme ? 0.4 : 0.6,
                                            isDarkTheme ? 0.3 : 0.8,
                                        ),
                                    }}
                                    className="flex w-max items-center text-[9px] p-1 mx-[2px]  rounded-sm">
                                    <span>{tag}</span>
                                    <X
                                        onClick={() => handleRemoveTag(tag)}
                                        className="ml-1 cursor-pointer hover:opacity-45"
                                        size={9}
                                    />
                                </div>
                            ))}
                        </div>
                        <Input
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="enter tags"
                            className="p-1 dark:bg-dark-input focus-visible:ring-0 dark:border-dark-input-border border rounded-sm !text-[10px] h-[28px]  border-[#cecece] w-full"
                            type="text"
                        />
                    </div>
                </div>

                <div className="flex justify-between mt-3">
                    <div className="flex items-center">
                        <span className="text-[8px] text-[#6f6f6f]  dark:text-dark-text-primary flex items-center mr-2">
                            Enter: Add Tag
                        </span>
                        <span className="text-[8px] text-[#6f6f6f] dark:text-dark-text-primary flex items-center">
                            <Command size={8} />
                            +S: Save Tag(s)
                        </span>
                    </div>
                    <button onClick={handleBulkTags} className="text-[10px] hover:text-[#384eda]">
                        Save
                    </button>
                </div>
            </PopoverContent>
        </Popover>
    )
}

export default TagBookmark
