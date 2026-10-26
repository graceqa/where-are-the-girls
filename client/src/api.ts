import { DaySchedule, MonthSummary, ServiceStatus } from './types.js';

export async function getServiceStatus(): Promise<ServiceStatus> {
  const res = await fetch('/api/status');
  if (!res.ok) {
    throw new Error(`Failed to load service status: ${res.statusText}`);
  }
  return res.json();
}

export async function getDaySchedule(date: string): Promise<{ schedule: DaySchedule; status: ServiceStatus }> {
  const res = await fetch(`/api/day?date=${encodeURIComponent(date)}`);
  if (!res.ok) {
    throw new Error(`Failed to load day schedule for ${date}: ${res.statusText}`);
  }
  return res.json();
}

export async function getMonthSummary(year: number, month: number): Promise<{ summary: MonthSummary; status: ServiceStatus }> {
  const res = await fetch(`/api/month?year=${year}&month=${month}`);
  if (!res.ok) {
    throw new Error(`Failed to load calendar month summary: ${res.statusText}`);
  }
  return res.json();
}

export async function refreshCalendar(): Promise<void> {
  const res = await fetch('/api/refresh', { method: 'POST' });
  if (!res.ok) {
    throw new Error(`Failed to refresh calendar: ${res.statusText}`);
  }
}
