'use client'
import { useCallback, useEffect, useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { Plus } from 'lucide-react'
import { strToColor } from '@/app/utils/conv'
import { X } from 'lucide-react'

const AddBookmarkDialog = () => {
    const [title, setTitle] = useState('')
    const [url, setUrl] = useState('')
    const [open, setOpen] = useState(false)
    const [newTag, setNewTag] = useState('')
    const [tags, setTags] = useState<string[]>([])
    const createBookmark = useMutation(api.bookmarks.createBookmark)

    const clearInputs = useCallback(() => {
        setTitle('')
        setUrl('')
        setTags([])
    }, [])

    const handleDialogOnClose = useCallback(() => {
        setOpen(false)
    }, [])

    const handleAddBookmark = useCallback(async () => {
        const hostname = new URL(url).hostname
        if (hostname) {
            await createBookmark({
                title,
                url,
                hostname,
                tags,
            })
        }
        clearInputs()
        handleDialogOnClose()
    }, [title, url, tags, createBookmark, handleDialogOnClose, clearInputs])

    const handleNewTag = useCallback(() => {
        if (newTag.trim().length === 0) return
        setTags((prevTags) => [...prevTags, newTag])
        setNewTag('')
    }, [newTag])

    useEffect(() => {
        if (!open) {
            clearInputs()
        }
    }, [open, clearInputs])

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <div className="flex cursor-pointer items-center">
                    <Plus size={13} />
                    <span className="text-[10px] pl-1 font-bold">Add new bookmark</span>
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] dark:bg-dark-modal">
                <DialogHeader>
                    <DialogTitle className="text-sm">Add a new bookmark</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Input
                            id="link"
                            onChange={(evt) => setUrl(evt.target.value)}
                            placeholder="add url here"
                            value={url}
                            className="col-span-full !text-[12px] focus-visible:ring-0  dark:bg-dark-input dark:border-dark-input-border border border border-[#cecece]"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Input
                            id="link-title"
                            onChange={(evt) => setTitle(evt.target.value)}
                            placeholder="title"
                            value={title}
                            className="col-span-full !text-[12px] dark:bg-dark-input dark:border-dark-input-border   border border-[#cecece] focus-visible:ring-0"
                        />
                    </div>

                    <div className="mb-2 flex items-center w-max p-[3px] rounded-sm border-[1px] border-[#d4d3d3] dark:border-[#363b48]">
                        {tags.map((tag) => (
                            <div
                                key={tag}
                                style={{ backgroundColor: strToColor(tag) }}
                                className="flex w-max items-center text-[9px] text-[#000] p-1 mx-[2px] rounded-sm">
                                <span>{tag}</span>
                                <X
                                    onClick={() =>
                                        setTags((prevTags) => prevTags.filter((t) => t !== tag))
                                    }
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
                </div>
                <DialogFooter>
                    <button
                        type="button"
                        onClick={handleAddBookmark}
                        className="text-[11px] px-4 font-medium text-white p-1 rounded-sm bg-dark-secondary">
                        Add new bookmark
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default AddBookmarkDialog
