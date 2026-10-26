import { DaySchedule, MonthSummary, ServiceStatus } from './types.js';

interface StaticData {
  generatedAt: string;
  status: ServiceStatus;
  days: Record<string, DaySchedule>;
  months: Record<string, MonthSummary>;
}

let staticDataPromise: Promise<StaticData | null> | null = null;

async function loadStaticData(): Promise<StaticData | null> {
  if (!staticDataPromise) {
    const base = import.meta.env.BASE_URL || './';
    const cleanBase = base.endsWith('/') ? base : `${base}/`;
    staticDataPromise = fetch(`${cleanBase}schedule-data.json`)
      .then(res => (res.ok ? res.json() : null))
      .catch(() => null);
  }
  return staticDataPromise;
}

export async function getServiceStatus(): Promise<ServiceStatus> {
  try {
    const res = await fetch('/api/status');
    if (res.ok) return await res.json();
  } catch {
    // fallback to static
  }

  const staticData = await loadStaticData();
  if (staticData) {
    return {
      ...staticData.status,
      message: `Connected via GitHub Pages Sync`
    };
  }

  return {
    isConfigured: true,
    isConnected: true,
    mode: 'google_calendar',
    message: 'GitHub Pages build'
  };
}

export async function getDaySchedule(date: string): Promise<{ schedule: DaySchedule; status: ServiceStatus }> {
  try {
    const res = await fetch(`/api/day?date=${encodeURIComponent(date)}`);
    if (res.ok) return await res.json();
  } catch {
    // fallback to static
  }

  const staticData = await loadStaticData();
  if (staticData && staticData.days[date]) {
    return {
      schedule: staticData.days[date],
      status: staticData.status
    };
  }

  return {
    schedule: {
      date,
      custody: { parent: 'None', isExchangeDay: false, matchedKeywords: [] },
      commitments: [],
      custodyEvents: []
    },
    status: staticData?.status || {
      isConfigured: true,
      isConnected: true,
      mode: 'google_calendar',
      message: 'GitHub Pages build'
    }
  };
}

export async function getMonthSummary(year: number, month: number): Promise<{ summary: MonthSummary; status: ServiceStatus }> {
  try {
    const res = await fetch(`/api/month?year=${year}&month=${month}`);
    if (res.ok) return await res.json();
  } catch {
    // fallback to static
  }

  const staticData = await loadStaticData();
  const mKey = `${year}-${String(month).padStart(2, '0')}`;
  if (staticData && staticData.months[mKey]) {
    return {
      summary: staticData.months[mKey],
      status: staticData.status
    };
  }

  return {
    summary: { year, month, days: {} },
    status: staticData?.status || {
      isConfigured: true,
      isConnected: true,
      mode: 'google_calendar',
      message: 'GitHub Pages build'
    }
  };
}

export async function refreshCalendar(): Promise<void> {
  try {
    const res = await fetch('/api/refresh', { method: 'POST' });
    if (res.ok) return;
  } catch {
    // reload static cache
  }
  staticDataPromise = null;
  await loadStaticData();
}
