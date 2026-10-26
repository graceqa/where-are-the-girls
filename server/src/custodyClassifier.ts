import { CalendarEvent, CustodyInfo, CustodyParent, DaySchedule, EventCategory, ExchangeDetails, MonthSummary, ParentName } from './types.js';

// Regexes to recognize parent names and variations
const GRACE_REGEX = /\b(grace|mom)\b/i;
const RONNY_REGEX = /\b(ronny|ronnie|dad)\b/i;

// Patterns that identify an event as a custody marker
const CUSTODY_MARKER_REGEX = /^(\s*with\s+)?(grace|ronny|ronnie|mom|dad)(\s*\'?s?\s*(house|weekend|custody|time|turn|days?))?\s*$/i;
const CUSTODY_EXPLICIT_EXCHANGE = /\b(custody\s+(exchange|handover|transition)|coparent\s+exchange)\b/i;

export interface RawEventInput {
  id: string;
  title: string;
  start: string; // YYYY-MM-DD or ISO string
  end: string;
  isAllDay: boolean;
  location?: string;
  description?: string;
  colorId?: string;
  forceCategory?: EventCategory;
}

const SCHOOL_BREAK_REGEX = /\b(no\s+school|winter\s+recess|spring\s+break|midwinter\s+break|thanksgiving\s+(break|recess)|summer\s+recess|school\s+(recess|break|closed))\b/i;
const TRAVEL_REGEX = /^\s*girls\s+in\s+(.+)$/i;

export function isTravelEvent(event: RawEventInput): { isTravel: boolean; destination?: string } {
  const title = (event.title || '').trim();
  const match = title.match(TRAVEL_REGEX);
  if (match) {
    return { isTravel: true, destination: match[1].trim() };
  }
  return { isTravel: false };
}

export function isSchoolBreakEvent(event: RawEventInput): boolean {
  const title = (event.title || '').trim();
  if (SCHOOL_BREAK_REGEX.test(title)) {
    return true;
  }
  // Tomato / Red colored all-day events in Google Calendar indicate no school or breaks
  if (event.colorId === '11' && event.isAllDay) {
    return true;
  }
  return false;
}

/**
 * Checks whether an event title is primarily a custody tag
 */
export function isCustodyEvent(event: RawEventInput): { isCustody: boolean; parent?: CustodyParent } {
  if (event.forceCategory === 'commitment') {
    return { isCustody: false };
  }
  const title = (event.title || '').trim();
  const hasGrace = GRACE_REGEX.test(title);
  const hasRonny = RONNY_REGEX.test(title);

  // Explicit custody exchange event title
  if (CUSTODY_EXPLICIT_EXCHANGE.test(title)) {
    return {
      isCustody: true,
      parent: hasGrace && hasRonny ? 'Both' : hasGrace ? 'Grace' : hasRonny ? 'Ronny' : 'Both'
    };
  }

  // Pure custody label (e.g. "Grace", "Ronny", "With Grace", "Ronny's House")
  if (CUSTODY_MARKER_REGEX.test(title)) {
    if (hasGrace && hasRonny) return { isCustody: true, parent: 'Both' };
    if (hasGrace) return { isCustody: true, parent: 'Grace' };
    if (hasRonny) return { isCustody: true, parent: 'Ronny' };
  }

  // All day events representing custody (e.g., "Ronny", "Grace", or both on exchange days)
  if (event.isAllDay) {
    const activityNouns = /\b(practice|game|class|lesson|school|party|camp|dentist|doctor|conference|meeting|recital|playdate|parade|holiday)\b/i;
    if (hasGrace && hasRonny) {
      return { isCustody: true, parent: 'Both' };
    }
    if ((hasGrace || hasRonny) && !activityNouns.test(title)) {
      return { isCustody: true, parent: hasGrace ? 'Grace' : 'Ronny' };
    }
  }

  return { isCustody: false };
}

/**
 * Normalizes any date string or ISO timestamp into YYYY-MM-DD
 */
export function toDateKey(dateStr: string): string {
  if (!dateStr) return '';
  return dateStr.slice(0, 10);
}

/**
 * Add or subtract days from a YYYY-MM-DD string
 */
export function shiftDateKey(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/**
 * Processes a collection of raw calendar events across dates and calculates
 * custody status, exchange day transitions, and commitment activities.
 */
export function classifyEvents(rawEvents: RawEventInput[]): {
  days: Record<string, DaySchedule>;
  monthSummary: (year: number, month: number) => MonthSummary;
  getDaySchedule: (dateKey: string) => DaySchedule;
} {
  // Map of dateKey -> list of events on that date
  const eventsByDate = new Map<string, CalendarEvent[]>();

  // Ensure each raw event is placed into the appropriate date buckets
  for (const raw of rawEvents) {
    const isBreak = isSchoolBreakEvent(raw);
    const travelCheck = !isBreak ? isTravelEvent(raw) : { isTravel: false };
    const custodyCheck = !isBreak && !travelCheck.isTravel ? isCustodyEvent(raw) : { isCustody: false };

    let category: EventCategory = 'commitment';
    if (isBreak) {
      category = 'school_break';
    } else if (travelCheck.isTravel) {
      category = 'travel';
    } else if (custodyCheck.isCustody) {
      category = 'custody';
    }

    const parentTag: ParentName | 'Both' | undefined =
      custodyCheck.parent === 'Grace' || custodyCheck.parent === 'Ronny' || custodyCheck.parent === 'Both'
        ? custodyCheck.parent
        : undefined;

    const parsedEvent: CalendarEvent = {
      id: raw.id,
      title: raw.title,
      start: raw.start,
      end: raw.end,
      isAllDay: raw.isAllDay,
      location: raw.location,
      description: raw.description,
      category,
      parentTag
    };

    const startDateKey = toDateKey(raw.start);
    let inclusiveEndKey = toDateKey(raw.end) || startDateKey;

    // In Google Calendar API, all-day events use an exclusive end date (e.g. Oct 23 to Oct 31 ends on Oct 30)
    if (raw.isAllDay && inclusiveEndKey > startDateKey) {
      inclusiveEndKey = shiftDateKey(inclusiveEndKey, -1);
    }

    // Add to each intermediate day up to inclusiveEndKey
    let curKey = startDateKey;
    while (curKey <= inclusiveEndKey) {
      if (!eventsByDate.has(curKey)) {
        eventsByDate.set(curKey, []);
      }
      eventsByDate.get(curKey)!.push(parsedEvent);
      if (curKey === inclusiveEndKey || !raw.isAllDay) break;
      curKey = shiftDateKey(curKey, 1);
    }
  }

  // Pre-calculate initial single-day custody hints (without exchange context)
  const rawCustodyByDate = new Map<string, { grace: boolean; ronny: boolean; keywords: string[] }>();

  for (const [dateKey, events] of eventsByDate.entries()) {
    let grace = false;
    let ronny = false;
    const keywords: string[] = [];

    for (const ev of events) {
      if (ev.category === 'custody') {
        if (ev.parentTag === 'Grace' || ev.parentTag === 'Both') {
          grace = true;
          keywords.push('Grace');
        }
        if (ev.parentTag === 'Ronny' || ev.parentTag === 'Both') {
          ronny = true;
          keywords.push('Ronny');
        }
      }
    }

    rawCustodyByDate.set(dateKey, { grace, ronny, keywords });
  }

  /**
   * Helper to inspect single-day parent before exchange day resolution
   */
  function getBasicParent(dateKey: string): CustodyParent {
    const raw = rawCustodyByDate.get(dateKey);
    if (!raw) return 'None';
    if (raw.grace && raw.ronny) return 'Both';
    if (raw.grace) return 'Grace';
    if (raw.ronny) return 'Ronny';
    return 'None';
  }

  /**
   * Resolves full custody info for a specific date, including exchange logic
   */
  function resolveCustodyInfo(dateKey: string): CustodyInfo {
    const raw = rawCustodyByDate.get(dateKey) || { grace: false, ronny: false, keywords: [] };
    const isBoth = raw.grace && raw.ronny;

    if (isBoth) {
      // Exchange day detected!
      // Resolve who is dropping off vs picking up based on previous day
      const prevDateKey = shiftDateKey(dateKey, -1);
      const nextDateKey = shiftDateKey(dateKey, 1);

      const prevParent = getBasicParent(prevDateKey);
      const nextParent = getBasicParent(nextDateKey);

      let droppingOff: ParentName = 'Ronny';
      let pickingUp: ParentName = 'Grace';

      if (prevParent === 'Grace') {
        droppingOff = 'Grace';
        pickingUp = 'Ronny';
      } else if (prevParent === 'Ronny') {
        droppingOff = 'Ronny';
        pickingUp = 'Grace';
      } else if (nextParent === 'Grace') {
        // If yesterday was unknown or exchange, check tomorrow
        droppingOff = 'Ronny';
        pickingUp = 'Grace';
      } else if (nextParent === 'Ronny') {
        droppingOff = 'Grace';
        pickingUp = 'Ronny';
      }

      const exchangeDetails: ExchangeDetails = {
        droppingOff,
        pickingUp,
        description: `${droppingOff} drops off ➔ ${pickingUp} picks up`
      };

      return {
        parent: 'Both',
        isExchangeDay: true,
        exchangeDetails,
        matchedKeywords: raw.keywords
      };
    }

    if (raw.grace) {
      return {
        parent: 'Grace',
        isExchangeDay: false,
        matchedKeywords: raw.keywords
      };
    }

    if (raw.ronny) {
      return {
        parent: 'Ronny',
        isExchangeDay: false,
        matchedKeywords: raw.keywords
      };
    }

    return {
      parent: 'None',
      isExchangeDay: false,
      matchedKeywords: []
    };
  }

  function getDaySchedule(dateKey: string): DaySchedule {
    const all = eventsByDate.get(dateKey) || [];
    const custody = resolveCustodyInfo(dateKey);
    const schoolBreakEvent = all.find(e => e.category === 'school_break');
    const travelEvent = all.find(e => e.category === 'travel');
    let travelStatus: string | undefined = undefined;
    if (travelEvent) {
      const match = travelEvent.title.match(TRAVEL_REGEX);
      const destination = match ? match[1].trim() : travelEvent.title;
      travelStatus = `traveling in ${destination}`;
    }

    const commitments = all
      .filter(e => e.category === 'commitment')
      .sort((a, b) => (a.start > b.start ? 1 : -1));
    const custodyEvents = all.filter(e => e.category === 'custody');

    return {
      date: dateKey,
      custody,
      schoolBreak: schoolBreakEvent ? schoolBreakEvent.title : undefined,
      travelStatus,
      commitments,
      custodyEvents
    };
  }

  function monthSummary(year: number, month: number): MonthSummary {
    const days: Record<string, { date: string; custody: CustodyInfo; commitmentCount: number }> = {};
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = day < 10 ? `0${day}` : `${day}`;
      const monthStr = month < 10 ? `0${month}` : `${month}`;
      const dateKey = `${year}-${monthStr}-${dayStr}`;
      const sched = getDaySchedule(dateKey);

      days[dateKey] = {
        date: dateKey,
        custody: sched.custody,
        commitmentCount: sched.commitments.length
      };
    }

    return {
      year,
      month,
      days
    };
  }

  return {
    days: {},
    monthSummary,
    getDaySchedule
  };
}
