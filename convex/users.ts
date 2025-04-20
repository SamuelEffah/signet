import { paginationOptsValidator } from 'convex/server'
import { mutation, query, type QueryCtx } from './_generated/server'
import { v } from 'convex/values'
import type { Id } from './_generated/dataModel'

import { getAuthUserId } from '@convex-dev/auth/server'

export const getMe = query({
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx)
        if (!userId) throw new Error('Not signed in')
        const user = await ctx.db
            .query('users')
            .withIndex('by_id', (q) => q.eq('_id', userId))
            .first()
        return {
            _id: user?._id,
            email: user?.email,
            image: user?.image,
            name: user?.name,
        }
    },
})
