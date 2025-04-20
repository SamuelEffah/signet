import { internalAction } from './_generated/server'
import { v } from 'convex/values'
import axios from 'axios'
import * as cheerio from 'cheerio'
import { internal } from './_generated/api'

export const scrapeMetatData = internalAction({
    args: { bookmarkId: v.id('bookmarks'), url: v.string() },
    handler: async (ctx, { url, bookmarkId }) => {
        try {
            const headers = {
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br',
                Connection: 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
            }

            const res = await axios.get(url, {
                headers,
                timeout: 5000,
                maxRedirects: 5,
            })

            const $ = cheerio.load(res.data)

            const title = $('title').text() || new URL(url).hostname
            const description = $('meta[name="description"]').attr('content')

            let favicon =
                $('link[rel="icon"]').attr('href') ||
                $('link[rel="shortcut icon"]').attr('href') ||
                $('link[rel="apple-touch-icon"]').attr('href') ||
                $('link[rel="apple-touch-icon-precomposed"]').attr('href')

            if (favicon && !favicon.startsWith('http')) {
                const baseUrl = new URL(url).origin
                favicon = new URL(favicon, baseUrl).toString()
            }

            if (!favicon) {
                favicon = new URL('/favicon.ico', new URL(url).origin).toString()
            }

            await ctx.runMutation(internal.bookmarks.updateBookmarkWithMetaData, {
                bookmarkId,
                description,
                favicon,
            })
        } catch (error) {
            // pass
        }
    },
})
