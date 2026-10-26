import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';
import { RawEventInput } from './custodyClassifier.js';
import { generateMockEvents } from './mockData.js';
import { ServiceStatus } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface CalendarSource {
  id: string;
  name: string;
  titleOverride?: string;
  forceCategory?: 'commitment';
  isAveryCalendar?: boolean;
}

interface CacheEntry {
  timestamp: number;
  events: RawEventInput[];
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, CacheEntry>();

function formatClockTimeNoAmPm(isoStr: string): string {
  if (!isoStr || !isoStr.includes('T')) return '';
  const match = isoStr.match(/T(\d{2}):(\d{2})/);
  if (!match) return '';
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  hours = hours % 12;
  if (hours === 0) hours = 12;
  return `${hours}:${minutes}`;
}

function extractDropOffLocation(summary: string, desc?: string): string | undefined {
  if (desc) {
    const cleanDesc = desc.replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ');
    const match = cleanDesc.match(/drop(?:ping)?[\s-]?off\s+(?:with\s+[^<]+?\s+at|at)\s+([^<]+?)(?:<|\.|$)/i);
    if (match) {
      return `Dropping off at ${match[1].trim()}`;
    }
  }
  if (summary) {
    const cleanSum = summary.replace(/^drop\s*@?\s*/i, '').trim();
    if (cleanSum) {
      return `Dropping off at ${cleanSum}`;
    }
  }
  return undefined;
}

export class GoogleCalendarService {
  private calendarSources: CalendarSource[];
  private clientEmail: string;
  private privateKey: string;
  private isConfigured: boolean;
  private connectedCalendarSummary: string = '';

  constructor() {
    const primaryId = process.env.GOOGLE_CALENDAR_ID || 'graceandronnyg@gmail.com';
    const averyId = process.env.AVERY_CALENDAR_ID || '2e8d9c4b80d785a54e9022b3eab3babdfe2992441f2c14c8db35e3efc1cf6e4c@group.calendar.google.com';
    const violinId = process.env.VIOLIN_CALENDAR_ID || 'e4ea6f97f4fc72cce026a19533683f8156346bc8151862052868da36a845aec5@group.calendar.google.com';

    this.calendarSources = [
      {
        id: primaryId,
        name: 'Family Calendar'
      },
      {
        id: averyId,
        name: 'Avery pick-up',
        isAveryCalendar: true,
        forceCategory: 'commitment'
      },
      {
        id: violinId,
        name: 'Gabby Penny Violin Lessons',
        titleOverride: 'violin lesson',
        forceCategory: 'commitment'
      }
    ];

    let email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '';
    let key = process.env.GOOGLE_PRIVATE_KEY || '';

    // Check for JSON key file in root or specified in env
    const keyFilePath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE || this.findKeyFile();
    if (keyFilePath && fs.existsSync(keyFilePath)) {
      try {
        const fileContent = JSON.parse(fs.readFileSync(keyFilePath, 'utf8'));
        if (fileContent.type === 'service_account') {
          email = fileContent.client_email || email;
          key = fileContent.private_key || key;
        }
      } catch (err: any) {
        console.warn('Could not parse service account key file:', err.message);
      }
    }

    if (key.includes('\\n')) {
      key = key.replace(/\\n/g, '\n');
    }

    this.clientEmail = email;
    this.privateKey = key;
    this.isConfigured = Boolean(this.clientEmail && this.privateKey);
  }

  private findKeyFile(): string | null {
    const rootDir = path.resolve(__dirname, '../../');
    const files = fs.readdirSync(rootDir);
    for (const file of files) {
      if (file.endsWith('.json') && file.includes('schedule')) {
        return path.join(rootDir, file);
      }
    }
    for (const file of files) {
      if (file.endsWith('.json') && !file.startsWith('package') && !file.startsWith('tsconfig')) {
        try {
          const content = JSON.parse(fs.readFileSync(path.join(rootDir, file), 'utf8'));
          if (content.type === 'service_account') {
            return path.join(rootDir, file);
          }
        } catch {
          // ignore
        }
      }
    }
    return null;
  }

  public getStatus(): ServiceStatus {
    const isLive = Boolean(this.isConfigured && this.connectedCalendarSummary);

    return {
      isConfigured: this.isConfigured,
      isConnected: isLive,
      mode: isLive ? 'google_calendar' : 'demo',
      calendarId: this.connectedCalendarSummary || this.calendarSources.map(s => s.name).join(', '),
      message: isLive
        ? `Connected to Google Calendars: ${this.connectedCalendarSummary}`
        : this.isConfigured
        ? `Service account authenticated (${this.clientEmail}). Syncing calendars...`
        : 'Running in Demo Mode with sample schedule. Add Google Service Account credentials to connect your live calendar.'
    };
  }

  /**
   * Fetches raw events across all configured Google Calendars or fallback mock data
   */
  public async getEvents(startDate: string, endDate: string): Promise<{ events: RawEventInput[]; status: ServiceStatus }> {
    const cacheKey = `${startDate}_${endDate}`;
    const cached = cache.get(cacheKey);
    const now = Date.now();

    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      return { events: cached.events, status: this.getStatus() };
    }

    if (!this.isConfigured) {
      const mockEvents = generateMockEvents();
      cache.set(cacheKey, { timestamp: now, events: mockEvents });
      return { events: mockEvents, status: this.getStatus() };
    }

    try {
      const auth = new google.auth.JWT({
        email: this.clientEmail,
        key: this.privateKey,
        scopes: ['https://www.googleapis.com/auth/calendar.readonly']
      });

      const calendar = google.calendar({ version: 'v3', auth });

      const timeMin = new Date(`${startDate}T00:00:00Z`).toISOString();
      const timeMax = new Date(`${endDate}T23:59:59Z`).toISOString();

      const allEvents: RawEventInput[] = [];
      const successfulCalendars: string[] = [];

      await Promise.all(
        this.calendarSources.map(async source => {
          try {
            const response = await calendar.events.list({
              calendarId: source.id,
              timeMin,
              timeMax,
              singleEvents: true,
              orderBy: 'startTime',
              maxResults: 250
            });

            successfulCalendars.push(source.name);
            const items = response.data.items || [];

            for (const item of items) {
              const isAllDay = Boolean(item.start?.date && !item.start?.dateTime);
              const start = isAllDay ? item.start!.date! : (item.start?.dateTime || '');
              const end = isAllDay ? (item.end?.date || start) : (item.end?.dateTime || start);

              let eventTitle = item.summary || 'Untitled Event';
              let location = item.location || undefined;
              let description = item.description || undefined;

              // Apply special formatting for Avery pick-up calendar
              if (source.isAveryCalendar) {
                const timeStr = formatClockTimeNoAmPm(start);
                eventTitle = timeStr ? `Avery p/u @ ${timeStr}` : 'Avery p/u';
                description = extractDropOffLocation(item.summary || '', item.description || undefined);
                location = undefined;
              } else if (source.titleOverride) {
                // If original title contains an address, extract it as location if empty
                if (!location && eventTitle.includes('@')) {
                  const parts = eventTitle.split('@');
                  if (parts[1]) {
                    location = parts[1].trim();
                  }
                }
                eventTitle = source.titleOverride;
              }

              allEvents.push({
                id: item.id || String(Math.random()),
                title: eventTitle,
                start,
                end,
                isAllDay,
                location,
                description,
                colorId: item.colorId || undefined,
                forceCategory: source.forceCategory
              });
            }
          } catch (err: any) {
            console.warn(`Failed to fetch events from ${source.name} (${source.id}):`, err.message);
          }
        })
      );

      this.connectedCalendarSummary = successfulCalendars.join(', ');

      // Sort all events chronologically by start time
      allEvents.sort((a, b) => (a.start > b.start ? 1 : -1));

      cache.set(cacheKey, { timestamp: now, events: allEvents });
      return { events: allEvents, status: this.getStatus() };
    } catch (err: any) {
      console.warn('Google Calendar API query error, falling back to mock data:', err.message);
      this.connectedCalendarSummary = '';
      const mockEvents = generateMockEvents();
      const status: ServiceStatus = {
        isConfigured: true,
        isConnected: false,
        mode: 'demo',
        message: `API query error (${err.message}). Displaying mock schedule as fallback.`
      };
      return { events: mockEvents, status };
    }
  }

  public clearCache(): void {
    cache.clear();
  }
}
