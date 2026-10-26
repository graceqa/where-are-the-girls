import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleCalendarService } from '../server/src/googleCalendar.js';
import { classifyEvents, shiftDateKey, toDateKey } from '../server/src/custodyClassifier.js';
import { DaySchedule, MonthSummary, ServiceStatus } from '../server/src/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function sync() {
  console.log('[Sync] Initializing Google Calendar Service...');
  const service = new GoogleCalendarService();

  const outputDir = path.resolve(__dirname, '../client/public');
  const outputPath = path.join(outputDir, 'schedule-data.json');

  if (!service.getStatus().isConfigured && fs.existsSync(outputPath)) {
    console.log('[Sync] Service account credentials not configured in environment. Preserving existing schedule-data.json.');
    return;
  }

  const now = new Date();
  const todayKey = now.toISOString().slice(0, 10);

  // Sync window: 60 days in past to 240 days in future (8 months)
  const startWindow = shiftDateKey(todayKey, -60);
  const endWindow = shiftDateKey(todayKey, 240);

  console.log(`[Sync] Fetching events from ${startWindow} to ${endWindow}...`);
  const { events, status } = await service.getEvents(startWindow, endWindow);
  console.log(`[Sync] Retrieved ${events.length} events.`);

  console.log('[Sync] Classifying events, custody, exchange days, and travel...');
  const engine = classifyEvents(events);

  const days: Record<string, DaySchedule> = {};
  const months: Record<string, MonthSummary> = {};

  // Populate days
  let cur = startWindow;
  while (cur <= endWindow) {
    days[cur] = engine.getDaySchedule(cur);
    cur = shiftDateKey(cur, 1);
  }

  // Populate months for the next 12 months
  const startMonthDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  for (let i = 0; i < 14; i++) {
    const d = new Date(startMonthDate.getFullYear(), startMonthDate.getMonth() + i, 1);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const monthKey = `${y}-${String(m).padStart(2, '0')}`;
    months[monthKey] = engine.monthSummary(y, m);
  }

  const staticPayload = {
    generatedAt: new Date().toISOString(),
    status,
    days,
    months
  };

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(staticPayload, null, 2), 'utf8');
  console.log(`[Sync] Successfully generated static data at ${outputPath}`);
}

sync().catch(err => {
  console.error('[Sync Error]', err);
  process.exit(1);
});
