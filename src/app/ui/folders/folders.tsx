'use client'
import { useState, useEffect } from 'react'
import CreateFolder from '../create-folder/create-folder'
import ThemeToggle from '../theme-toggle/theme-toggle'
import { usePaginatedQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import type { Id, Doc } from '../../../../convex/_generated/dataModel'
import { extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import { reorderWithEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/util/reorder-with-edge'
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { flushSync } from 'react-dom'
import { Folder } from './folder'
import UserProfile from '../user-profile/user-profile'

const Folders = () => {
    const [folders, setFolders] = useState<
        Array<Doc<'folders'> & { allBookmarkIds: Array<Id<'bookmarks'>> }>
    >([])
    const { results } = usePaginatedQuery(api.folders.getFolders, {}, { initialNumItems: 100 })

    useEffect(() => {
        setFolders(results)
    }, [results])

    useEffect(() => {
        return monitorForElements({
            canMonitor({ source }) {
                return true
            },
            onDrop({ location, source }) {
                const target = location.current.dropTargets[0]
                if (!target) {
                    return
                }

                const sourceData = source.data
                const targetData = target.data
                const indexOfSource = folders.findIndex((f) => f._id === sourceData.folderId)
                const indexOfTarget = folders.findIndex((f) => f._id === targetData.folderId)

                if (indexOfTarget < 0 || indexOfSource < 0) {
                    return
                }

                const closestEdgeOfTarget = extractClosestEdge(targetData)

                flushSync(() => {
                    setFolders(
                        reorderWithEdge({
                            list: folders,
                            startIndex: indexOfSource,
                            indexOfTarget,
                            closestEdgeOfTarget,
                            axis: 'vertical',
                        }),
                    )
                })
            },
        })
    }, [folders])

    return (
        <div className=" w-full border-r-[1px] border-[#dddddd] dark:border-dark-border relative">
            <div className="flex items-center m-2">
                <p className="text-xs mr-2 font-medium">Folders </p>
                <CreateFolder />
            </div>

            <div className="">
                {folders.map((folder) => (
                    <Folder key={folder._id} folder={folder} />
                ))}
            </div>

            <div className="absolute bottom-0 h-[40px] w-full flex items-center justify-between px-2 border-t-[1px] border-[#dddddd] dark:border-dark-border">
                <UserProfile />
                <ThemeToggle />
            </div>
        </div>
    )
}

export default Folders
