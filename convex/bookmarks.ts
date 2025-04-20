import { paginationOptsValidator } from 'convex/server'
import { internalMutation, mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { internal } from './_generated/api'
import { getAuthUserId } from '@convex-dev/auth/server'

export const getBookmarks = query({
    args: { paginationOpts: paginationOptsValidator, searchTerm: v.string() },
    handler: async (ctx, { paginationOpts, searchTerm }) => {
        const userId = await getAuthUserId(ctx)
        if (!userId) throw new Error('Not signed in')

        const searchSplit = searchTerm.split(/tags:/i)
        if (searchSplit === null && searchTerm.trim().length > 0) {
            return await ctx.db
                .query('bookmarks')
                .withSearchIndex('search_title', (q) => q.search('title', searchTerm))
                .filter((q) => q.eq(q.field('userId'), userId))
                .paginate(paginationOpts)
        } else if (searchSplit.length > 1 && searchSplit[1].length > 0) {
            return await ctx.db
                .query('bookmarks')
                .withSearchIndex('search_tags', (q) => q.search('tags', searchSplit[1]))
                .filter((q) => q.eq(q.field('userId'), userId))
                .paginate(paginationOpts)
        }
        return await ctx.db
            .query('bookmarks')
            .withIndex('by_bookmark_user', (q) => q.eq('userId', userId))
            .order('desc')
            .paginate(paginationOpts)
    },
})

export const getBookmarkByIds = query({
    args: { ids: v.array(v.id('bookmarks')) },
    handler: async (ctx, { ids }) => {
        const allBookmarks = await Promise.all(ids.map((id) => ctx.db.get(id)))
        return allBookmarks
    },
})

export const getBookmark = query({
    args: { id: v.id('bookmarks') },
    handler: async (ctx, args) => {
        const { id } = args
        return await ctx.db.get(id)
    },
})

export const createBookmark = mutation({
    args: { title: v.string(), hostname: v.string(), url: v.string() },
    handler: async (ctx, { title, hostname, url }) => {
        const userId = await getAuthUserId(ctx)
        if (!userId) throw new Error('Not signed in')

        const id = await ctx.db.insert('bookmarks', {
            title: title,
            url: url,
            userId: userId,
            hostname: hostname,
        })

        await ctx.scheduler.runAfter(0, internal.helpers.scrapeMetatData, {
            bookmarkId: id,
            url,
        })

        return id
    },
})

export const addBookmarkTag = mutation({
    args: { tags: v.array(v.string()), id: v.id('bookmarks') },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx)
        if (!userId) throw new Error('Not signed in')
        const { tags, id } = args
        const bookmark = await ctx.db.get(id)
        const currTags = bookmark?.tags?.split(' ') || []
        if (currTags) {
            for (const tag of tags) {
                if (!currTags.includes(tag)) {
                    currTags.push(tag.split(' ').join('.'))
                }
            }
            await ctx.db.patch(id, { tags: currTags.join(' ') })
        }
    },
})

export const removeBookmarkTag = mutation({
    args: { tag: v.string(), id: v.id('bookmarks') },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx)
        if (!userId) throw new Error('Not signed in')

        const { tag, id } = args
        const bookmark = await ctx.db.get(id)
        const currTags = bookmark?.tags
            ?.split(' ')
            .flatMap((t) => t.split('.'))
            .filter((t) => t !== tag)

        await ctx.db.patch(id, {
            tags: currTags && currTags.length > 0 ? currTags.join(' ') : undefined,
        })
    },
})

export const addBookmarkNote = mutation({
    args: { id: v.id('bookmarks'), note: v.string() },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx)
        if (!userId) throw new Error('Not signed in')

        const { id, note } = args
        await ctx.db.patch(id, { note })
    },
})

export const addBookmarkToFolder = mutation({
    args: { folderId: v.id('folders'), id: v.id('bookmarks') },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx)
        if (!userId) throw new Error('Not signed in')

        const { folderId, id } = args
        const bookmark = await ctx.db.patch(id, { folderId })
        await ctx.db.insert('folderBookmarks', { folderId, bookmarkId: id })
        return bookmark
    },
})

export const removeBookmarkFromFolder = mutation({
    args: { bookmarkId: v.id('bookmarks') },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx)
        if (!userId) throw new Error('Not signed in')

        const { bookmarkId } = args
        const bookmark = await ctx.db.patch(bookmarkId, { folderId: undefined })
        await ctx.runMutation(internal.folderBookmarks.deleteBookmarkFromFolder, {
            bookmarkId,
        })
        return bookmark
    },
})

export const bulkAddBookmarksToFolder = mutation({
    args: { folderId: v.id('folders'), bookmarkIds: v.array(v.id('bookmarks')) },
    handler: async (ctx, { folderId, bookmarkIds }) => {
        const userId = await getAuthUserId(ctx)
        if (!userId) throw new Error('Not signed in')

        await Promise.all(bookmarkIds.map((id) => ctx.db.patch(id, { folderId })))
        await Promise.all(
            bookmarkIds.map((id) => ctx.db.insert('folderBookmarks', { folderId, bookmarkId: id })),
        )
    },
})

export const addReminderDate = mutation({
    args: { id: v.id('bookmarks'), reminderDate: v.string() },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx)
        if (!userId) throw new Error('Not signed in')

        const { id, reminderDate } = args
        await ctx.db.patch(id, { reminderDate })
    },
})

export const bulkTags = mutation({
    args: { tags: v.array(v.string()), ids: v.array(v.id('bookmarks')) },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx)
        if (!userId) throw new Error('Not signed in')

        const { tags, ids } = args
        for (const id of ids) {
            let tempTags = ''
            for (const tag of tags) {
                tempTags += `${tag.split(' ').join('.')} `
            }

            await ctx.db.patch(id, { tags: tempTags.trimEnd() })
        }
    },
})

export const bulkDelete = mutation({
    args: { ids: v.array(v.id('bookmarks')) },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx)
        if (!userId) throw new Error('Not signed in')

        const { ids } = args
        await Promise.all(
            ids.map((id) =>
                ctx.runMutation(internal.folderBookmarks.deleteBookmarkFromFolder, {
                    bookmarkId: id,
                }),
            ),
        )
        await Promise.all(ids.map((id) => ctx.db.delete(id)))
    },
})

export const lastVisited = mutation({
    args: { lastVisited: v.string(), id: v.id('bookmarks') },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx)
        if (!userId) throw new Error('Not signed in')

        const { lastVisited, id } = args
        await ctx.db.patch(id, { lastVisited })
    },
})

export const deleteFolderByIds = internalMutation({
    args: { ids: v.array(v.id('bookmarks')) },
    handler: async (ctx, { ids }) => {
        const userId = await getAuthUserId(ctx)
        if (!userId) throw new Error('Not signed in')

        await Promise.all(ids.map((id) => ctx.db.patch(id, { folderId: undefined })))
    },
})

export const updateBookmarkWithMetaData = internalMutation({
    args: {
        bookmarkId: v.id('bookmarks'),
        description: v.optional(v.string()),
        favicon: v.optional(v.string()),
        title: v.optional(v.string()),
    },
    handler: async (ctx, { bookmarkId, description, favicon }) => {
        await ctx.db.patch(bookmarkId, { description, favicon })
    },
})
