import { useState, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'

const CreateFolder = () => {
    const [folderName, setFolderName] = useState('')

    const createBookmark = useMutation(api.folders.createFolder)
    const handleCreateFolder = useCallback(() => {
        createBookmark({ name: folderName })
        setFolderName('')
    }, [folderName, createBookmark])

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Plus className="cursor-pointer" size={14} />
            </PopoverTrigger>
            <PopoverContent className="bg-[#f7f7f7] dark:bg-dark-modal mx-8 p-4 border border-[#cecece] dark:border-dark-input-border w-40">
                <div className="">
                    <p className="text-[10px] mb-2 font-semibold">Create a new folder</p>
                    <Input
                        onKeyDown={(evt) => {
                            if (evt.key === 'Enter') {
                                handleCreateFolder()
                            }
                        }}
                        onChange={(evt) => setFolderName(evt.target.value)}
                        value={folderName}
                        placeholder="enter folder name"
                        className="h-[25px] w-full px-[3px] rounded-[4px] focus-visible:none dark:bg-dark-input dark:border-dark-input-border border border-[#d9d9d9] !text-[10px]"
                    />
                </div>
                <div className="flex items-center mt-4">
                    <span className="text-[8px] text-[#6f6f6f] dark:text-dark-text-primary flex items-center">
                        Enter: Add Folder
                    </span>
                </div>
            </PopoverContent>
        </Popover>
    )
}

export default CreateFolder
