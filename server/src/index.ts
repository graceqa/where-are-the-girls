import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleCalendarService } from './googleCalendar.js';
import { classifyEvents, shiftDateKey, toDateKey } from './custodyClassifier.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const calendarService = new GoogleCalendarService();

// Helper to get formatted YYYY-MM-DD for today
function getTodayString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Health & Configuration Status
 */
app.get('/api/status', async (req, res) => {
  try {
    const today = getTodayString();
    // Fetch a 7-day window to accurately compute today's custody with exchange context
    const { events, status } = await calendarService.getEvents(shiftDateKey(today, -3), shiftDateKey(today, 3));
    const classifier = classifyEvents(events);
    const todaySched = classifier.getDaySchedule(today);

    res.json({
      ...status,
      todayCustody: todaySched.custody
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error fetching status' });
  }
});

/**
 * Daily schedule & commitments
 * Query: ?date=YYYY-MM-DD
 */
app.get('/api/day', async (req, res) => {
  try {
    const dateQuery = typeof req.query.date === 'string' ? req.query.date : getTodayString();
    // Query a 3-day window around the target day to ensure prior/next day custody context for exchange resolution
    const startWindow = shiftDateKey(dateQuery, -2);
    const endWindow = shiftDateKey(dateQuery, 2);

    const { events, status } = await calendarService.getEvents(startWindow, endWindow);
    const classifier = classifyEvents(events);
    const schedule = classifier.getDaySchedule(dateQuery);

    res.json({
      schedule,
      status
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error fetching day schedule' });
  }
});

/**
 * Month overview for calendar widget
 * Query: ?year=YYYY&month=M (1-12)
 */
app.get('/api/month', async (req, res) => {
  try {
    const now = new Date();
    const year = Number(req.query.year) || now.getFullYear();
    const month = Number(req.query.month) || (now.getMonth() + 1);

    const monthStr = String(month).padStart(2, '0');
    const startOfMonth = `${year}-${monthStr}-01`;
    // Include 7 days before and after month boundary to capture edge exchange days
    const queryStart = shiftDateKey(startOfMonth, -7);
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const endOfMonth = `${year}-${monthStr}-${String(daysInMonth).padStart(2, '0')}`;
    const queryEnd = shiftDateKey(endOfMonth, 7);

    const { events, status } = await calendarService.getEvents(queryStart, queryEnd);
    const classifier = classifyEvents(events);
    const summary = classifier.monthSummary(year, month);

    res.json({
      summary,
      status
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error fetching month summary' });
  }
});

/**
 * Force refresh cache
 */
app.post('/api/refresh', (req, res) => {
  calendarService.clearCache();
  res.json({ ok: true, message: 'Calendar cache cleared' });
});

// Serve frontend if static dist folder exists
const clientDist = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(clientDist, 'index.html'), err => {
    if (err) {
      res.status(404).send('Where Are The Girls API Server is running. Client build not found.');
    }
  });
});

app.listen(port, () => {
  console.log(`[Server] "Where Are The Girls" backend running on port ${port}`);
});
