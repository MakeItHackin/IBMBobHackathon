// Reddit scraper for local Huntsville, AL events
// Uses Reddit's public RSS feeds (no auth required)

import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { normalizeRedditPost } from '../normalizers/redditNormalizer.js';

const config = JSON.parse(readFileSync(new URL('../../config.json', import.meta.url)));

const USER_AGENT = 'local-event-discovery/0.1.0 (hackathon project)';
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });

const client = axios.create({
  headers: { 'User-Agent': USER_AGENT },
  timeout: 15000,
});

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// GET with exponential backoff on 429
async function getWithRetry(url, params = {}, retries = 3) {
  let delay = 3000;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await client.get(url, { params });
    } catch (err) {
      const status = err.response?.status;
      if (status === 429 && attempt < retries) {
        console.warn(`  [reddit] Rate limited — retrying in ${delay / 1000}s...`);
        await sleep(delay);
        delay *= 2;
      } else {
        throw err;
      }
    }
  }
}

// Fetch RSS feed for a subreddit (new posts)
async function fetchSubredditRSS(subreddit) {
  const url = `https://www.reddit.com/r/${subreddit}/new/.rss`;
  try {
    const res = await getWithRetry(url);
    const parsed = parser.parse(res.data);
    const entries = parsed?.feed?.entry || [];
    return Array.isArray(entries) ? entries : [entries];
  } catch (err) {
    console.error(`  [reddit] RSS error for r/${subreddit}: ${err.message}`);
    return [];
  }
}

// Fetch RSS search results for a subreddit + query
async function searchSubredditRSS(subreddit, query) {
  const url = `https://www.reddit.com/r/${subreddit}/search/.rss`;
  try {
    const res = await getWithRetry(url, { q: query, restrict_sr: 'on', sort: 'new', limit: 25 });
    const parsed = parser.parse(res.data);
    const entries = parsed?.feed?.entry || [];
    return Array.isArray(entries) ? entries : [entries];
  } catch (err) {
    console.error(`  [reddit] RSS search error (${subreddit}, "${query}"): ${err.message}`);
    return [];
  }
}

// Convert an RSS Atom entry to a post-like object the normalizer expects
function rssEntryToPost(entry) {
  const content = entry?.content?.['#text'] || entry?.content || '';
  // Extract text from the HTML content blob
  const textContent = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

  const link = entry?.link?.['@_href'] || entry?.link || '';
  const idRaw = entry?.id || link;
  // Reddit post IDs look like t3_XXXXX
  const idMatch = idRaw.match(/comments\/([a-z0-9]+)/i);
  const postId = idMatch ? idMatch[1] : idRaw.slice(-8);

  return {
    id: postId,
    title: entry?.title?.['#text'] || entry?.title || '',
    selftext: textContent,
    author: entry?.author?.name || '',
    url: link,
    permalink: link.replace('https://www.reddit.com', ''),
    thumbnail: '',
    created_utc: entry?.updated ? Math.floor(new Date(entry.updated).getTime() / 1000) : Math.floor(Date.now() / 1000),
  };
}

function isEventLikelyPost(post) {
  const text = `${post.title} ${post.selftext || ''}`.toLowerCase();
  return config.reddit.searchTerms.some(term => text.includes(term));
}

function deduplicateById(posts) {
  const seen = new Set();
  return posts.filter(p => {
    if (!p.id || seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
}

export async function scrapeReddit() {
  const { subreddits, searchTerms, maxPostsPerSubreddit } = config.reddit;
  const allNormalized = [];

  for (const subreddit of subreddits) {
    console.log(`\n[reddit] Scraping r/${subreddit} via RSS...`);
    const rawPosts = [];

    // 1. Fetch new posts feed
    const feedEntries = await fetchSubredditRSS(subreddit);
    const feedPosts = feedEntries.map(rssEntryToPost);
    const eventPosts = feedPosts.filter(isEventLikelyPost);
    console.log(`  New feed: ${eventPosts.length} event-like posts from ${feedPosts.length} total`);
    rawPosts.push(...eventPosts);
    await sleep(1500);

    // 2. Search for top event-related terms
    const termsToSearch = searchTerms.slice(0, 5); // limit to avoid hammering
    for (const term of termsToSearch) {
      const entries = await searchSubredditRSS(subreddit, `${term} Huntsville`);
      rawPosts.push(...entries.map(rssEntryToPost));
      await sleep(1200);
    }

    // 3. Deduplicate and normalize
    const unique = deduplicateById(rawPosts);
    const normalized = unique.map(post => normalizeRedditPost(post, subreddit));
    allNormalized.push(...normalized);
    console.log(`  Normalized ${normalized.length} events from r/${subreddit}`);

    await sleep(2000);
  }

  return allNormalized;
}

// Allow running standalone: node src/scrapers/reddit.js
if (process.argv[1].endsWith('reddit.js')) {
  const events = await scrapeReddit();
  console.log(`\n[reddit] Total events scraped: ${events.length}`);

  const dataDir = new URL('../../data', import.meta.url);
  mkdirSync(dataDir, { recursive: true });

  const outPath = new URL('../../data/reddit_events.json', import.meta.url);
  writeFileSync(outPath, JSON.stringify({ scraped_at: new Date().toISOString(), events }, null, 2));
  console.log(`[reddit] Saved to data/reddit_events.json`);
}
