// Utility: parse natural-language date/time strings from Reddit posts
// Returns { date_start, date_end, time_start, time_end } or nulls if unparseable

const MONTHS = {
  january: '01', february: '02', march: '03', april: '04',
  may: '05', june: '06', july: '07', august: '08',
  september: '09', october: '10', november: '11', december: '12',
  jan: '01', feb: '02', mar: '03', apr: '04',
  jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
};

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function padTwo(n) {
  return String(n).padStart(2, '0');
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${padTwo(d.getMonth() + 1)}-${padTwo(d.getDate())}`;
}

function nextWeekday(name) {
  const today = new Date();
  const target = WEEKDAYS.indexOf(name.toLowerCase());
  if (target === -1) return null;
  const diff = (target - today.getDay() + 7) % 7 || 7;
  const result = new Date(today);
  result.setDate(today.getDate() + diff);
  return `${result.getFullYear()}-${padTwo(result.getMonth() + 1)}-${padTwo(result.getDate())}`;
}

function parseTime(str) {
  // e.g. "7pm", "7:30pm", "19:00", "7 PM"
  const match = str.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? match[2] : '00';
  const meridiem = match[3] ? match[3].toLowerCase() : null;
  if (meridiem === 'pm' && hours < 12) hours += 12;
  if (meridiem === 'am' && hours === 12) hours = 0;
  return `${padTwo(hours)}:${minutes}`;
}

export function parseDateFromText(text) {
  if (!text) return { date_start: null, date_end: null, time_start: null, time_end: null };

  const lower = text.toLowerCase();
  let date_start = null;
  let date_end = null;
  let time_start = null;
  let time_end = null;

  // "June 14", "June 14th", "Jun 14"
  const monthDayMatch = lower.match(
    /\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\s+(\d{1,2})(?:st|nd|rd|th)?\b/
  );
  if (monthDayMatch) {
    const year = new Date().getFullYear();
    const month = MONTHS[monthDayMatch[1]];
    const day = padTwo(parseInt(monthDayMatch[2], 10));
    date_start = `${year}-${month}-${day}`;
  }

  // "6/14", "6/14/2025"
  if (!date_start) {
    const numericDate = lower.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
    if (numericDate) {
      const year = numericDate[3]
        ? (numericDate[3].length === 2 ? '20' + numericDate[3] : numericDate[3])
        : new Date().getFullYear();
      date_start = `${year}-${padTwo(parseInt(numericDate[1], 10))}-${padTwo(parseInt(numericDate[2], 10))}`;
    }
  }

  // "this saturday", "next friday", weekday names
  if (!date_start) {
    const weekdayMatch = lower.match(/\b(?:this\s+|next\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/);
    if (weekdayMatch) {
      date_start = nextWeekday(weekdayMatch[1]);
    }
  }

  // "tonight", "today"
  if (!date_start && (lower.includes('tonight') || lower.includes('today'))) {
    date_start = todayStr();
  }

  // "this weekend" → nearest Saturday
  if (!date_start && lower.includes('this weekend')) {
    date_start = nextWeekday('saturday');
  }

  // Time: "7pm", "7:30 PM", "at 8", "from 6-9pm"
  const timeRange = text.match(/(?:from\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm))\s*[-–to]+\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i);
  if (timeRange) {
    time_start = parseTime(timeRange[1]);
    time_end = parseTime(timeRange[2]);
  } else {
    const singleTime = text.match(/\bat\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i) ||
                       text.match(/\b(\d{1,2}(?::\d{2})?\s*(?:am|pm))\b/i);
    if (singleTime) {
      time_start = parseTime(singleTime[1]);
    }
  }

  return { date_start, date_end, time_start, time_end };
}
