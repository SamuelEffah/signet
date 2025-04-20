import { defineSchema, defineTable } from 'convex/server'
import { authTables } from '@convex-dev/auth/server'
import { v } from 'convex/values'

const schema = defineSchema({
    ...authTables,
    folders: defineTable({
        name: v.string(),
        userId: v.id('users'),
    }).index('by_folders_user', ['userId']),
    folderBookmarks: defineTable({
        folderId: v.id('folders'),
        bookmarkId: v.id('bookmarks'),
    })
        .index('by_folder_bookmark', ['folderId'])
        .index('by_bookmark', ['bookmarkId']),

    bookmarks: defineTable({
        title: v.string(),
        url: v.string(),
        userId: v.id('users'),
        hostname: v.string(),
        description: v.optional(v.string()),
        favicon: v.optional(v.string()),
        folderId: v.optional(v.id('folders')),
        isFavorite: v.optional(v.boolean()),
        tags: v.optional(v.string()),
        reminderDate: v.optional(v.string()),
        lastVisited: v.optional(v.string()),
        note: v.optional(v.string()),
    })
        .index('by_title', ['title'])
        .index('by_bookmark_user', ['userId'])
        .index('by_folder', ['folderId'])
        .searchIndex('search_title', {
            searchField: 'title',
        })
        .searchIndex('search_tags', {
            searchField: 'tags',
        }),

    // TODO: user settings table
})

export default schema
