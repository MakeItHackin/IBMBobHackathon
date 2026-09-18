// Main entry point: runs all scrapers and MERGES results into app/public/events.json
// Curated events (hand-crafted, with geo/expected_attendance) are never overwritten.
// Scraped events are added only if their ID is not already present.

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { scrapeReddit } from './scrapers/reddit.js';
import { scrapeHuntsvilleGov } from './scrapers/huntsvilleGov.js';

const APP_EVENTS_FILE = new URL('../app/public/events.json', import.meta.url);
const DATA_DIR = new URL('../data', import.meta.url);

// Load the full existing events.json — template + all curated events
function loadExisting() {
  try {
    return JSON.parse(readFileSync(APP_EVENTS_FILE, 'utf-8'));
  } catch {
    return { template: {}, events: [] };
  }
}

// Merge scraped events into the curated list.
// Curated events always win — scraped events are appended only if their ID
// is not already present in the curated set.
function mergeEvents(curated, scraped) {
  const curatedIds = new Set(curated.map(e => e.id));
  const newEvents = scraped.filter(e => e.id && !curatedIds.has(e.id));
  return [...curated, ...newEvents];
}

function sortEvents(events) {
  return events.sort((a, b) => {
    const da = a.when?.date_start || 'zzzz';
    const db = b.when?.date_start || 'zzzz';
    return da.localeCompare(db);
  });
}

async function main() {
  console.log('=== Local Event Discovery — Huntsville, AL ===\n');

  mkdirSync(DATA_DIR, { recursive: true });

  // Load what we already have (curated hand-crafted events)
  const existing = loadExisting();
  const curatedEvents = existing.events || [];
  console.log(`Curated events loaded     : ${curatedEvents.length}`);

  // Run both scrapers in parallel
  const [hsvGovEvents, redditEvents] = await Promise.all([
    scrapeHuntsvilleGov(),
    scrapeReddit(),
  ]);

  console.log(`\n--- Scrape Results ---`);
  console.log(`City of Huntsville events : ${hsvGovEvents.length}`);
  console.log(`Reddit events             : ${redditEvents.length}`);

  const scrapedEvents = [...hsvGovEvents, ...redditEvents];

  // Save raw scraped data for debugging (separate from production file)
  writeFileSync(
    new URL('../data/scraped_events.json', import.meta.url),
    JSON.stringify({ scraped_at: new Date().toISOString(), events: scrapedEvents }, null, 2)
  );

  // Merge: curated events stay intact, new scraped events are appended
  const mergedEvents = sortEvents(mergeEvents(curatedEvents, scrapedEvents));
  const newCount = mergedEvents.length - curatedEvents.length;

  console.log(`\n--- Merge Results ---`);
  console.log(`New scraped events added  : ${newCount}`);
  console.log(`Total events in file      : ${mergedEvents.length}`);

  const output = {
    template: existing.template || {},
    events: mergedEvents,
    _meta: {
      last_scraped: new Date().toISOString(),
      curated_count: curatedEvents.length,
      scraped_added: newCount,
      total_events: mergedEvents.length,
      sources: ['curated', 'huntsvilleal.gov', 'reddit'],
    },
  };

  writeFileSync(APP_EVENTS_FILE, JSON.stringify(output, null, 2));
  console.log(`\n✓ app/public/events.json updated — ${mergedEvents.length} total events`);

  // Show 2 examples of newly added scraped events
  const newEvents = mergedEvents.slice(curatedEvents.length, curatedEvents.length + 2);
  if (newEvents.length > 0) {
    console.log('\n--- New Scraped Events (sample) ---');
    for (const ev of newEvents) {
      console.log(`\n[${ev.meta.source}] ${ev.title}`);
      console.log(`  Date  : ${ev.when.date_start || '(no date)'}${ev.when.time_start ? ' @ ' + ev.when.time_start : ''}`);
      console.log(`  Venue : ${ev.where.venue_name || '(no venue)'}`);
      console.log(`  URL   : ${ev.media.website_url}`);
    }
  } else {
    console.log('\n(No new scraped events to add — all already present)');
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
