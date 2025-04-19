export interface Bookmark {
    id: string
    title: string
    folderId?: string
    url: string
    tags: string[]
    lastVisited?: string
    note?: string
    reminderDate?: Date
    hostname: string
    favorite: boolean
    dateAdded: string
}
