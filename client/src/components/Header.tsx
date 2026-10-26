import React from 'react';

interface HeaderProps {
  onJumpToToday: () => void;
  onOpenDatePicker: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onJumpToToday,
  onOpenDatePicker,
  onRefresh,
  isRefreshing
}) => {
  return (
    <header className="app-header">
      <div className="brand-section">
        <div className="brand-icon" role="img" aria-label="Girls icon">
          👯‍♀️
        </div>
        <div className="brand-text-container">
          <h1 className="brand-title">Where are the girls?</h1>
        </div>
      </div>

      <div className="header-actions">
        <button
          className="btn-today-primary"
          onClick={onJumpToToday}
          title="Jump directly to today's schedule"
        >
          <span>📅</span>
          <span>Today</span>
        </button>

        <button
          className="btn-picker-action"
          onClick={onOpenDatePicker}
          title="Open date picker"
        >
          <span>🗓️</span>
          <span>Pick Date</span>
        </button>

        <button
          className="btn-refresh-action"
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh calendar data from Google"
          aria-label="Refresh calendar"
        >
          <span>{isRefreshing ? '⏳' : '🔄'}</span>
          <span>Refresh</span>
        </button>
      </div>
    </header>
  );
};
