import React, { useEffect, useState, useCallback } from 'react';
import { Header } from './components/Header.js';
import { HeroStatus } from './components/HeroStatus.js';
import { DatePickerModal } from './components/DatePickerModal.js';
import { SetupModal } from './components/SetupModal.js';
import { getDaySchedule, getServiceStatus, refreshCalendar } from './api.js';
import { DaySchedule, ServiceStatus } from './types.js';

function getTodayString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function App() {
  const todayDate = getTodayString();

  const [selectedDate, setSelectedDate] = useState<string>(todayDate);
  const [status, setStatus] = useState<ServiceStatus | null>(null);
  const [daySchedule, setDaySchedule] = useState<DaySchedule | null>(null);

  const [isDayLoading, setIsDayLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isSetupOpen, setIsSetupOpen] = useState<boolean>(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState<boolean>(false);

  // Load Status
  useEffect(() => {
    getServiceStatus()
      .then(setStatus)
      .catch(err => console.error('Error fetching service status:', err));
  }, []);

  // Load Day Schedule when selectedDate changes
  useEffect(() => {
    setIsDayLoading(true);
    getDaySchedule(selectedDate)
      .then(res => {
        setDaySchedule(res.schedule);
        if (res.status) setStatus(res.status);
      })
      .catch(err => console.error('Error fetching day schedule:', err))
      .finally(() => setIsDayLoading(false));
  }, [selectedDate]);

  // Jump to Today action
  const handleJumpToToday = useCallback(() => {
    const today = getTodayString();
    setSelectedDate(today);
  }, []);

  // Day Stepping actions
  const shiftDay = useCallback((offset: number) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    dt.setUTCDate(dt.getUTCDate() + offset);
    const nextKey = dt.toISOString().slice(0, 10);
    setSelectedDate(nextKey);
  }, [selectedDate]);

  const handlePrevDay = useCallback(() => shiftDay(-1), [shiftDay]);
  const handleNextDay = useCallback(() => shiftDay(1), [shiftDay]);

  // Force Refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshCalendar();
      const [statusRes, dayRes] = await Promise.all([
        getServiceStatus(),
        getDaySchedule(selectedDate)
      ]);
      setStatus(statusRes);
      setDaySchedule(dayRes.schedule);
    } catch (err) {
      console.error('Refresh error:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [selectedDate]);

  const handleSelectDate = useCallback((dateKey: string) => {
    setSelectedDate(dateKey);
  }, []);

  return (
    <div className="app-container">
      <Header
        status={status}
        onJumpToToday={handleJumpToToday}
        onOpenDatePicker={() => setIsDatePickerOpen(true)}
        onRefresh={handleRefresh}
        onOpenSetup={() => setIsSetupOpen(true)}
        isRefreshing={isRefreshing}
      />

      <HeroStatus
        selectedDate={selectedDate}
        todayDate={todayDate}
        custody={daySchedule?.custody}
        schoolBreak={daySchedule?.schoolBreak}
        travelStatus={daySchedule?.travelStatus}
        commitments={daySchedule?.commitments ?? []}
        loading={isDayLoading}
        onPrevDay={handlePrevDay}
        onNextDay={handleNextDay}
      />

      <DatePickerModal
        isOpen={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        selectedDate={selectedDate}
        todayDate={todayDate}
        onSelectDate={handleSelectDate}
      />

      <SetupModal
        isOpen={isSetupOpen}
        onClose={() => setIsSetupOpen(false)}
        status={status}
      />
    </div>
  );
}
