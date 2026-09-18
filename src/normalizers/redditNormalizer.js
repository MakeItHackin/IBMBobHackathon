// Maps a raw Reddit post into the events.json schema
import { parseDateFromText } from '../utils/dateParser.js';
import { createHash } from 'crypto';

const CATEGORY_KEYWORDS = {
  'Music': ['concert', 'live music', 'band', 'open mic', 'jazz', 'bluegrass', 'acoustic', 'dj', 'festival'],
  'Food & Drink': ['food truck', 'farmers market', 'market', 'brewery', 'tasting', 'brunch', 'dinner', 'restaurant'],
  'Arts': ['art walk', 'gallery', 'exhibit', 'exhibition', 'theatre', 'theater', 'film', 'movie', 'comedy'],
  'Fitness': ['5k', 'run', 'race', 'walk', 'hike', 'yoga', 'workout', 'triathlon', 'bike'],
  'Education': ['workshop', 'class', 'seminar', 'lecture', 'talk', 'conference', 'expo'],
  'Community': ['meetup', 'volunteer', 'fundraiser', 'charity', 'cleanup', 'neighborhood', 'civic'],
  'Family': ['kids', 'family', 'children', 'playground', 'story time'],
  'Tech': ['hackathon', 'tech', 'coding', 'startup', 'maker', 'stem'],
  'Sports': ['game', 'match', 'tournament', 'tailgate', 'baseball', 'football', 'soccer', 'basketball'],
  'Nightlife': ['bar', 'club', 'trivia night', 'karaoke', 'drag'],
};

function detectCategory(text) {
  const lower = text.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) return category;
  }
  return 'General';
}

function extractTags(text) {
  const lower = text.toLowerCase();
  const tags = new Set();
  const allKeywords = Object.values(CATEGORY_KEYWORDS).flat();
  for (const kw of allKeywords) {
    if (lower.includes(kw)) tags.add(kw);
  }
  if (lower.includes('free')) tags.add('free');
  if (lower.includes('outdoor') || lower.includes('outside')) tags.add('outdoor');
  if (lower.includes('indoor')) tags.add('indoor');
  if (lower.includes('21+') || lower.includes('21 and up')) tags.add('21+');
  if (lower.includes('all ages')) tags.add('all ages');
  return [...tags].slice(0, 8);
}

function isFree(text) {
  const lower = text.toLowerCase();
  if (lower.includes('free admission') || lower.includes('free entry') || lower.includes('no cost') || lower.includes('free event')) return true;
  if (lower.match(/\$\d+/) || lower.includes('tickets') || lower.includes('admission')) return false;
  if (lower.includes('free')) return true;
  return null; // unknown
}

function extractCost(text) {
  const match = text.match(/\$(\d+(?:\.\d{2})?)/);
  if (match) return `$${match[1]}`;
  if (isFree(text)) return 'Free';
  return '';
}

function stableId(subreddit, postId) {
  return `reddit-${subreddit}-${postId}`;
}

export function normalizeRedditPost(post, subreddit) {
  const fullText = `${post.title} ${post.selftext || ''}`;
  const { date_start, date_end, time_start, time_end } = parseDateFromText(fullText);
  const free = isFree(fullText);

  // Use post URL as the source link; if it has a url field (link post), prefer that
  const eventUrl = post.url && !post.url.includes('reddit.com') ? post.url : `https://reddit.com${post.permalink}`;

  return {
    id: stableId(subreddit, post.id),
    title: post.title.trim(),
    description: {
      short: (post.selftext || '').split('\n')[0].slice(0, 200).trim() || post.title.trim(),
      long: (post.selftext || '').trim(),
    },
    category: detectCategory(fullText),
    tags: extractTags(fullText),
    when: {
      date_start: date_start || '',
      date_end: date_end || '',
      time_start: time_start || '',
      time_end: time_end || '',
      timezone: 'America/Chicago',
      recurrence: '',
    },
    where: {
      venue_name: '',
      address: {
        street: '',
        city: 'Huntsville',
        state: 'AL',
        zip: '',
      },
      room: '',
      online_url: '',
      parking_info: '',
      geo: { lat: null, lng: null },
    },
    organizer: {
      name: post.author || '',
      organization: '',
      email: '',
      phone: '',
    },
    attendance: {
      cost: extractCost(fullText),
      is_free: free === null ? false : free,
      registration_required: fullText.toLowerCase().includes('rsvp') || fullText.toLowerCase().includes('register'),
      registration_url: '',
      rsvp_deadline: '',
      capacity: null,
      expected_attendance: null,
    },
    audience: {
      age_group: fullText.toLowerCase().includes('21+') ? '21+' : fullText.toLowerCase().includes('all ages') ? 'All ages' : '',
      accessibility: '',
      languages: ['English'],
      dress_code: '',
      requirements: '',
    },
    media: {
      image_url: post.thumbnail && post.thumbnail.startsWith('http') ? post.thumbnail : '',
      website_url: eventUrl,
      social_links: [],
    },
    meta: {
      status: 'scheduled',
      source: `reddit/r/${subreddit}`,
      created_at: new Date(post.created_utc * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    },
  };
}
