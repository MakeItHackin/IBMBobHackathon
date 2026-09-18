// City of Huntsville iCal scraper
// Source: https://www.huntsvilleal.gov/events/?ical=1
// Public iCal feed — no auth, no rate limits

import axios from 'axios';
import { mkdirSync, writeFileSync } from 'fs';

const ICAL_URL = 'https://www.huntsvilleal.gov/events/?ical=1';
const USER_AGENT = 'local-event-discovery/0.1.0 (hackathon project)';

const client = axios.create({
  headers: { 'User-Agent': USER_AGENT },
  timeout: 15000,
});

// Minimal iCal parser — extracts VEVENT blocks
function parseICal(text) {
  const events = [];
  const blocks = text.split('BEGIN:VEVENT');
  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i].split('END:VEVENT')[0];
    const props = {};
    // Handle folded lines (lines starting with space/tab are continuations)
    const unfolded = block.replace(/\r?\n[ \t]/g, '');
    for (const line of unfolded.split(/\r?\n/)) {
      const sep = line.indexOf(':');
      if (sep === -1) continue;
      const key = line.slice(0, sep).split(';')[0].trim().toUpperCase();
      const val = line.slice(sep + 1).trim()
        .replace(/\\n/g, '\n')
        .replace(/\\,/g, ',')
        .replace(/\\;/g, ';')
        .replace(/\\\\/g, '\\');
      if (key) props[key] = val;
    }
    if (props['SUMMARY']) events.push(props);
  }
  return events;
}

// Parse iCal date strings: YYYYMMDD or YYYYMMDDTHHmmssZ
function parseICalDate(str) {
  if (!str) return { date: '', time: '' };
  const s = str.replace(/Z$/, '').replace(/[TZ]/g, '');
  const year = s.slice(0, 4);
  const month = s.slice(4, 6);
  const day = s.slice(6, 8);
  const hour = s.slice(8, 10) || '';
  const min = s.slice(10, 12) || '';
  return {
    date: year && month && day ? `${year}-${month}-${day}` : '',
    time: hour && min ? `${hour}:${min}` : '',
  };
}

function normalizeICalEvent(ev) {
  const start = parseICalDate(ev['DTSTART'] || ev['DTSTART;VALUE=DATE'] || '');
  const end = parseICalDate(ev['DTEND'] || ev['DTEND;VALUE=DATE'] || '');
  const title = ev['SUMMARY'] || '';
  const description = ev['DESCRIPTION'] || '';
  const location = ev['LOCATION'] || '';
  const url = ev['URL'] || 'https://www.huntsvilleal.gov/events/';
  const uid = ev['UID'] || `hsv-gov-${Date.now()}`;

  // Parse venue from LOCATION field
  const locationParts = location.split(',').map(s => s.trim());
  const venueName = locationParts[0] || '';
  const street = locationParts[1] || '';

  return {
    id: `hsv-gov-${uid.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`,
    title: title.trim(),
    description: {
      short: description.split('\n')[0].slice(0, 200).trim() || title,
      long: description.trim(),
    },
    category: detectCategory(title + ' ' + description),
    tags: extractTags(title + ' ' + description),
    when: {
      date_start: start.date,
      date_end: end.date,
      time_start: start.time,
      time_end: end.time,
      timezone: 'America/Chicago',
      recurrence: '',
    },
    where: {
      venue_name: venueName,
      address: {
        street,
        city: 'Huntsville',
        state: 'AL',
        zip: '',
      },
      room: '',
      online_url: '',
      parking_info: '',
    },
    organizer: {
      name: '',
      organization: 'City of Huntsville',
      email: '',
      phone: '',
    },
    attendance: {
      cost: description.toLowerCase().includes('free') ? 'Free' : '',
      is_free: description.toLowerCase().includes('free'),
      registration_required: false,
      registration_url: '',
      rsvp_deadline: '',
      capacity: null,
    },
    audience: {
      age_group: 'All ages',
      accessibility: '',
      languages: ['English'],
      dress_code: '',
      requirements: '',
    },
    media: {
      image_url: '',
      website_url: url,
      social_links: [],
    },
    meta: {
      status: 'scheduled',
      source: 'huntsvilleal.gov',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  };
}

const CATEGORY_KEYWORDS = {
  'Music': ['concert', 'music', 'band', 'jazz', 'symphony', 'orchestra', 'open mic'],
  'Food & Drink': ['food', 'market', 'farmers', 'tasting', 'brewery', 'dinner'],
  'Arts': ['art', 'gallery', 'exhibit', 'theatre', 'theater', 'film', 'comedy', 'dance'],
  'Fitness': ['run', '5k', 'race', 'walk', 'bike', 'yoga', 'fitness'],
  'Education': ['workshop', 'class', 'seminar', 'lecture', 'conference', 'stem', 'library'],
  'Community': ['meeting', 'volunteer', 'fundraiser', 'charity', 'cleanup', 'civic'],
  'Family': ['kids', 'family', 'children', 'story time', 'youth'],
  'Tech': ['tech', 'hackathon', 'coding', 'stem', 'maker', 'startup'],
  'Sports': ['game', 'tournament', 'baseball', 'football', 'soccer', 'basketball'],
  'Outdoor': ['park', 'trail', 'hike', 'outdoor', 'nature', 'garden'],
};

function detectCategory(text) {
  const lower = text.toLowerCase();
  for (const [cat, kws] of Object.entries(CATEGORY_KEYWORDS)) {
    if (kws.some(k => lower.includes(k))) return cat;
  }
  return 'Community';
}

function extractTags(text) {
  const lower = text.toLowerCase();
  const tags = new Set();
  for (const kws of Object.values(CATEGORY_KEYWORDS)) {
    for (const kw of kws) {
      if (lower.includes(kw)) tags.add(kw);
    }
  }
  if (lower.includes('free')) tags.add('free');
  return [...tags].slice(0, 6);
}

export async function scrapeHuntsvilleGov() {
  console.log('\n[hsv-gov] Fetching City of Huntsville events calendar...');
  try {
    const res = await client.get(ICAL_URL);
    const rawEvents = parseICal(res.data);
    console.log(`  Parsed ${rawEvents.length} events from iCal feed`);

    const normalized = rawEvents.map(normalizeICalEvent);
    console.log(`  Normalized ${normalized.length} events`);
    return normalized;
  } catch (err) {
    console.error(`  [hsv-gov] Error: ${err.message}`);
    return [];
  }
}

// Allow running standalone
if (process.argv[1].endsWith('huntsvilleGov.js')) {
  const events = await scrapeHuntsvilleGov();
  console.log(`\n[hsv-gov] Total events: ${events.length}`);
  mkdirSync(new URL('../../data', import.meta.url), { recursive: true });
  writeFileSync(
    new URL('../../data/hsvgov_events.json', import.meta.url),
    JSON.stringify({ scraped_at: new Date().toISOString(), events }, null, 2)
  );
  console.log('[hsv-gov] Saved to data/hsvgov_events.json');
}
