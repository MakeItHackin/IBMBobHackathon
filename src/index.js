// Main entry point: runs all scrapers and merges results into events.json
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { scrapeReddit } from './scrapers/reddit.js';

const EVENTS_FILE = new URL('../events.json', import.meta.url);
const DATA_DIR = new URL('../data', import.meta.url);

function loadExistingEvents() {
  try {
    const raw = JSON.parse(readFileSync(EVENTS_FILE, 'utf-8'));
    return raw.events || [];
  } catch {
    return [];
  }
}

function mergeEvents(existing, incoming) {
  const byId = new Map(existing.map(e => [e.id, e]));

  let added = 0;
  let updated = 0;

  for (const event of incoming) {
    if (!event.id) continue;
    if (byId.has(event.id)) {
      // Update meta.updated_at but preserve any manual enrichments
      const prev = byId.get(event.id);
      byId.set(event.id, { ...event, meta: { ...event.meta, created_at: prev.meta.created_at } });
      updated++;
    } else {
      byId.set(event.id, event);
      added++;
    }
  }

  console.log(`  Merge: +${added} new, ~${updated} updated`);
  return [...byId.values()];
}

function sortEvents(events) {
  return events.sort((a, b) => {
    const da = a.when?.date_start || '';
    const db = b.when?.date_start || '';
    return da.localeCompare(db);
  });
}

async function main() {
  console.log('=== Local Event Discovery — Huntsville, AL ===\n');

  // Ensure data dir exists
  try { mkdirSync(DATA_DIR, { recursive: true }); } catch {}

  const existing = loadExistingEvents();
  console.log(`Loaded ${existing.length} existing events\n`);

  // Run scrapers
  const redditEvents = await scrapeReddit();

  // Merge all sources
  const allNew = [...redditEvents];
  console.log(`\nTotal scraped across all sources: ${allNew.length}`);

  const merged = sortEvents(mergeEvents(existing, allNew));

  // Read the full events.json to preserve the template
  let base = {};
  try { base = JSON.parse(readFileSync(EVENTS_FILE, 'utf-8')); } catch {}

  const output = {
    ...base,
    events: merged,
    _meta: {
      last_scraped: new Date().toISOString(),
      total_events: merged.length,
      sources: ['reddit'],
    },
  };

  writeFileSync(EVENTS_FILE, JSON.stringify(output, null, 2));
  console.log(`\n✓ events.json updated — ${merged.length} total events`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
