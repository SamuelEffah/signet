import { internalMutation } from './_generated/server'
import { v } from 'convex/values'

export const deleteAllFolderBookmarks = internalMutation({
    args: { ids: v.array(v.id('folderBookmarks')) },
    handler: async (ctx, { ids }) => {
        await Promise.all(ids.map((id) => ctx.db.delete(id)))
    },
})

export const deleteBookmarkFromFolder = internalMutation({
    args: { bookmarkId: v.id('bookmarks') },
    handler: async (ctx, { bookmarkId }) => {
        const folderBookmarkDoc = await ctx.db
            .query('folderBookmarks')
            .withIndex('by_bookmark', (q) => q.eq('bookmarkId', bookmarkId))
            .first()
        if (folderBookmarkDoc) {
            await ctx.db.delete(folderBookmarkDoc._id)
        }
    },
})
