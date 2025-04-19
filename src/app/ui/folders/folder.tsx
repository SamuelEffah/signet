import { GripVertical } from 'lucide-react'
import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview'
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import {
    type HTMLAttributes,
    useEffect,
    useRef,
    type MouseEvent,
    useCallback,
    useState,
} from 'react'
import { createPortal } from 'react-dom'
import LoadingSpinner from '../loading-spinner/loading-spinner'
import { useMutation, useConvex } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import BookmarkItem from '../bookmark-list/bookmark-item'
import { preserveOffsetOnSource } from '@atlaskit/pragmatic-drag-and-drop/element/preserve-offset-on-source'

import {
    attachClosestEdge,
    type Edge,
    extractClosestEdge,
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'

import { Trash2 } from 'lucide-react'

import type { Id, Doc } from '../../../../convex/_generated/dataModel'

type FolderState =
    | {
          type: 'idle'
      }
    | {
          type: 'preview'
          container: HTMLElement
          react: DOMRect
      }
    | {
          type: 'is-dragging'
      }
    | {
          type: 'is-dragging-over'
          closestEdge: Edge | null
      }

const stateStyles: { [Key in FolderState['type']]?: HTMLAttributes<HTMLDivElement>['className'] } =
    {
        'is-dragging': 'opacity-40',
    }

const idle: FolderState = { type: 'idle' }
const draggingState: FolderState = { type: 'is-dragging' }

interface FolderProps {
    folder: Doc<'folders'> & { allBookmarkIds: Array<Id<'bookmarks'>> }
}

export const Folder = ({ folder }: FolderProps) => {
    const ref = useRef<HTMLDivElement | null>(null)
    const [folderState, setFolderState] = useState<FolderState>(idle)
    const [open, setOpen] = useState(false)
    const [isShow, setIsShow] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [bookmarks, setBookmarks] = useState<Array<Doc<'bookmarks'>> | undefined>(undefined)

    const deleteFolderById = useMutation(api.folders.deleteFolder)

    const convex = useConvex()

    useEffect(() => {
        if (open) {
            setIsLoading(true)
            const getFolderBookmarks = async () => {
                const bookmarks = await convex.query(api.bookmarks.getBookmarkByIds, {
                    ids: folder.allBookmarkIds,
                })

                if (bookmarks) {
                    setBookmarks(bookmarks as Doc<'bookmarks'>[])
                }

                setIsLoading(false)
            }
            void getFolderBookmarks()
        }
    }, [open, convex, folder])

    useEffect(() => {
        const element = ref.current

        if (!element) return

        return combine(
            draggable({
                element,
                getInitialData() {
                    return { isFolder: true, folderId: folder._id }
                },
                onGenerateDragPreview({ location, source, nativeSetDragImage }) {
                    const react = source.element.getBoundingClientRect()

                    setCustomNativeDragPreview({
                        nativeSetDragImage,
                        getOffset: preserveOffsetOnSource({
                            element,
                            input: location.current.input,
                        }),
                        render({ container }) {
                            setFolderState({ type: 'preview', container, react })
                            return () => setFolderState(draggingState)
                        },
                    })
                },
                onDragStart() {
                    setFolderState({ type: 'is-dragging' })
                    setOpen(false)
                },
                onDrop() {
                    setFolderState(idle)
                },
            }),
            dropTargetForElements({
                element,
                canDrop({ source }) {
                    if (source.element === element) {
                        return false
                    }
                    return true
                },
                getData({ input }) {
                    const data = { isFolder: true, folderId: folder._id }
                    return attachClosestEdge(data, {
                        element,
                        input,
                        allowedEdges: ['top', 'bottom'],
                    })
                },
                getIsSticky() {
                    return true
                },
                onDragEnter({ self }) {
                    const closestEdge = extractClosestEdge(self.data)
                    setFolderState({ type: 'is-dragging-over', closestEdge })
                },
                onDrag({ self }) {
                    const closestEdge = extractClosestEdge(self.data)
                    setFolderState((current) => {
                        if (
                            current.type === 'is-dragging-over' &&
                            current.closestEdge === closestEdge
                        ) {
                            return current
                        }
                        return { type: 'is-dragging-over', closestEdge }
                    })
                },

                onDragLeave() {
                    setFolderState(idle)
                },
                onDrop() {
                    setFolderState(idle)
                },
            }),
        )
    }, [folder])

    const handleDeleteFolder = useCallback(
        (evt: MouseEvent<HTMLDivElement>) => {
            evt.stopPropagation()
            deleteFolderById({
                id: folder._id,
            })
        },
        [folder, deleteFolderById],
    )

    const handleExpandFolder = useCallback(() => {
        setOpen((prev) => !prev)
    }, [])

    return (
        <>
            <div
                onMouseEnter={() => setIsShow(true)}
                onMouseLeave={() => setIsShow(false)}
                onClick={handleExpandFolder}
                className="w-full px-1 cursor-pointer">
                <div
                    data-task-id={folder._id}
                    ref={ref}
                    className={`flex items-center justify-between dark:hover:bg-dark-hover p-1 py-2 pl-0 hover:bg-slate-100  ${stateStyles[folderState.type] ?? ''}`}>
                    <div className="flex text-[11px] items-center">
                        <div className="w-6 flex hover:cursor-grab items-center justify-center">
                            <GripVertical size={10} />
                        </div>
                        <span className="truncate">{folder.name}</span>
                        {folder.allBookmarkIds && folder.allBookmarkIds.length > 0 ? (
                            <div className=" text-[10px] text-center items-center justify-center pl-1 dark:text-[#7f8080]">
                                {folder.allBookmarkIds.length}
                            </div>
                        ) : null}

                        {isLoading && <LoadingSpinner className="ml-[4px]" />}
                    </div>

                    {isShow ? (
                        <div onClick={() => console.log('asdfasd')}>
                            <Trash2 className="text-[#9c9c9c] hover:text-[#ff6f6f]" size={12} />
                        </div>
                    ) : null}
                </div>

                {open ? (
                    <div className="pl-4 text-[12px]">
                        {bookmarks?.map((bookmark) => (
                            <BookmarkItem
                                isFolder={true}
                                key={bookmark?._id}
                                bookmark={bookmark as Doc<'bookmarks'>}
                            />
                        ))}
                    </div>
                ) : null}
                {/* {folderState.type === 'is-dragging-over' && folderState.closestEdge ? (
        <DropIndicator edge={folderState.closestEdge} gap={'8px'} />
      ) : null} */}
            </div>
            <div className="w-full">
                {folderState.type === 'preview'
                    ? createPortal(
                          <DragPreview
                              width={folderState.react.width}
                              height={folderState.react.height}
                              folder={folder}
                          />,
                          folderState.container,
                      )
                    : null}
            </div>
        </>
    )
}

function DragPreview({ folder, width, height }: FolderProps & { width: number; height: number }) {
    return (
        <div
            style={{
                width,
                height,
            }}
            className="w-full shadow-md  px-1 cursor-pointer dark:bg-[#252836]">
            <div
                data-task-id={folder._id}
                className="flex items-center justify-between dark:hover:bg-dark-hover p-1 py-2 pl-0 hover:bg-slate-100 ">
                <div className="flex text-[11px] items-center">
                    <div className="w-6 flex hover:cursor-grab items-center justify-center">
                        <GripVertical size={10} />
                    </div>
                    <span className="truncate">{folder.name}</span>
                    {folder.allBookmarkIds && folder.allBookmarkIds.length > 0 ? (
                        <div className=" text-[10px] text-center items-center justify-center pl-1 dark:text-[#7f8080]">
                            {folder.allBookmarkIds.length}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    )
}
