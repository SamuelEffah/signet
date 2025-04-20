import { paginationOptsValidator } from 'convex/server'
import { mutation, query, type QueryCtx } from './_generated/server'
import { v } from 'convex/values'
import type { Id } from './_generated/dataModel'
import { internal } from './_generated/api'
import { getAuthUserId } from '@convex-dev/auth/server'

export const getFolders = query({
    args: { paginationOpts: paginationOptsValidator },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx)
        if (!userId) throw new Error('Not signed in')

        const results = await ctx.db
            .query('folders')
            .withIndex('by_folders_user', (q) => q.eq('userId', userId))
            .order('desc')
            .paginate(args.paginationOpts)
        const ids = results.page.map((f) => f._id)
        const counts: Record<string, Array<Id<'bookmarks'>>> = {}
        for (let i = 0; i < ids.length; i++) {
            const folderBookmarkDoc = await ctx.db
                .query('folderBookmarks')
                .withIndex('by_folder_bookmark', (q) => q.eq('folderId', ids[i]))
                .collect()
            counts[ids[i]] = folderBookmarkDoc.map((f) => f.bookmarkId)
        }

        return {
            ...results,
            page: results.page
                .sort((a, b) => a._creationTime - b._creationTime)
                .map((r) => {
                    return {
                        ...r,
                        allBookmarkIds: counts[r._id],
                    }
                }),
        }
    },
})

export const getFolder = query({
    args: { id: v.id('folders') },
    handler: async (ctx, { id }) => {
        const userId = await getAuthUserId(ctx)
        if (!userId) throw new Error('Not signed in')
        return await ctx.db
            .query('folders')
            .withIndex('by_folders_user', (q) => q.eq('userId', userId))
            .filter((q) => q.eq(q.field('_id'), id))
    },
})

export const createFolder = mutation({
    args: { name: v.string() },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx)
        if (!userId) throw new Error('Not signed in')
        const { name } = args
        return await ctx.db.insert('folders', { name, userId })
    },
})

export const getFolderBookmarks = query({
    args: { id: v.id('folders') },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx)
        if (!userId) throw new Error('Not signed in')
        const { id } = args

        const folderBookmarks = await ctx.db
            .query('folderBookmarks')
            .withIndex('by_folder_bookmark', (q) => q.eq('folderId', id))
            .collect()
        const bookmarks = await Promise.all(
            folderBookmarks.map(async (fB) => {
                const bookmark = await ctx.db.get(fB.bookmarkId)
                return bookmark
            }),
        )

        return bookmarks
    },
})

// export const reorderFolders = mutation({
//     args: { id: v.id('folders'), orderIndex: v.number() },
//     handler: async (ctx, { id, orderIndex }) => {
//         const userId = await getAuthUserId(ctx)
//         if (!userId) throw new Error('Not signed in')

//         const folder = await ctx.db.get(id)
//         const allFolders = (
//             await ctx.db
//                 .query('folders')
//                 .withIndex('by_folders_user', (q) => q.eq('userId', userId))
//                 .collect()
//         ).filter((f) => f._id !== id)

//         const slicedFolders = allFolders
//             .sort((a, b) => a.orderIndex - b.orderIndex)
//             .slice(orderIndex, allFolders.length)

//         let index = orderIndex
//         if (folder) {
//             slicedFolders.splice(0, 0, folder)
//         }

//         await Promise.all(
//             slicedFolders.map((b) => {
//                 const obj = { orderIndex: index }
//                 index++
//                 return ctx.db.patch(b._id, obj)
//             }),
//         )
//     },
// })

export const deleteFolder = mutation({
    args: { id: v.id('folders') },
    handler: async (ctx, { id }) => {
        const userId = await getAuthUserId(ctx)
        if (!userId) throw new Error('Not signed in')

        const folderBookmarkDoc = await ctx.db
            .query('folderBookmarks')
            .withIndex('by_folder_bookmark', (q) => q.eq('folderId', id))
            .collect()
        const bookmarkIds: Array<Id<'bookmarks'>> = []
        const folderBookmarkIds = folderBookmarkDoc.map((f) => {
            bookmarkIds.push(f.bookmarkId)
            return f._id
        })

        await ctx.runMutation(internal.folderBookmarks.deleteAllFolderBookmarks, {
            ids: folderBookmarkIds,
        })

        // update bookmark folderId to undefined
        await ctx.runMutation(internal.bookmarks.deleteFolderByIds, {
            ids: bookmarkIds,
        })

        await ctx.db.delete(id)
    },
})
