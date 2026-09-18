// Main entry point: runs all scrapers and writes real events to app/public/events.json
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { scrapeReddit } from './scrapers/reddit.js';
import { scrapeHuntsvilleGov } from './scrapers/huntsvilleGov.js';

const APP_EVENTS_FILE = new URL('../app/public/events.json', import.meta.url);
const DATA_DIR = new URL('../data', import.meta.url);

// Load just the template block from the existing file (not the fake events)
function loadTemplate() {
  try {
    const raw = JSON.parse(readFileSync(APP_EVENTS_FILE, 'utf-8'));
    return raw.template || {};
  } catch {
    return {};
  }
}

function deduplicateById(events) {
  const seen = new Set();
  return events.filter(e => {
    if (!e.id || seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });
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

  // Run both scrapers
  const [hsvGovEvents, redditEvents] = await Promise.all([
    scrapeHuntsvilleGov(),
    scrapeReddit(),
  ]);

  console.log(`\n--- Results ---`);
  console.log(`City of Huntsville events : ${hsvGovEvents.length}`);
  console.log(`Reddit events             : ${redditEvents.length}`);

  const allEvents = deduplicateById(sortEvents([...hsvGovEvents, ...redditEvents]));
  console.log(`Total events written      : ${allEvents.length}`);

  // Save raw scraped data for debugging
  writeFileSync(
    new URL('../data/scraped_events.json', import.meta.url),
    JSON.stringify({ scraped_at: new Date().toISOString(), events: allEvents }, null, 2)
  );

  // Write production file to app/public/events.json (no fake/sample events)
  const template = loadTemplate();
  const output = {
    template,
    events: allEvents,
    _meta: {
      last_scraped: new Date().toISOString(),
      total_events: allEvents.length,
      sources: ['huntsvilleal.gov', 'reddit'],
    },
  };

  writeFileSync(APP_EVENTS_FILE, JSON.stringify(output, null, 2));
  console.log(`\n✓ app/public/events.json updated — ${allEvents.length} real events`);

  // Show 2 examples
  console.log('\n--- Example Events ---');
  for (const ev of allEvents.slice(0, 2)) {
    console.log(`\n[${ev.meta.source}] ${ev.title}`);
    console.log(`  Date  : ${ev.when.date_start || '(no date)'}${ev.when.time_start ? ' @ ' + ev.when.time_start : ''}`);
    console.log(`  Venue : ${ev.where.venue_name || '(no venue)'}`);
    console.log(`  URL   : ${ev.media.website_url}`);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
