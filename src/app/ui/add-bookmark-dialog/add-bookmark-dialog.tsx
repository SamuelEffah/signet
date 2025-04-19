'use client'
import { useCallback, useState } from 'react'
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

const AddBookmarkDialog = () => {
    const [title, setTitle] = useState('')
    const [url, setUrl] = useState('')
    const [open, setOpen] = useState(false)

    const createBookmark = useMutation(api.bookmarks.createBookmark)

    const clearInputs = useCallback(() => {
        setTitle('')
        setUrl('')
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
            })
        }
        clearInputs()
        handleDialogOnClose()
    }, [title, url, createBookmark, handleDialogOnClose, clearInputs])

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
                    <DialogDescription className="text-xs">
                        Make changes to your profile here. Click save when you are done.
                    </DialogDescription>
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
