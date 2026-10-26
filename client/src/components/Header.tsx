import React from 'react';
import { ServiceStatus } from '../types.js';

interface HeaderProps {
  status: ServiceStatus | null;
  onJumpToToday: () => void;
  onOpenDatePicker: () => void;
  onRefresh: () => void;
  onOpenSetup: () => void;
  isRefreshing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  onJumpToToday,
  onOpenDatePicker,
  onRefresh,
  onOpenSetup,
  isRefreshing
}) => {
  const isConnected = status?.isConnected ?? false;
  const isDemo = status?.mode === 'demo';

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
          className="btn-secondary"
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh calendar data from Google"
          aria-label="Refresh calendar"
        >
          <span>{isRefreshing ? '⏳' : '🔄'}</span>
        </button>

        <button
          className="status-pill"
          onClick={onOpenSetup}
          title={status?.message || 'Connection info'}
        >
          <span className={`status-dot ${isConnected ? 'connected' : 'demo'}`} />
          <span className="status-label">Connection</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>⚙️</span>
        </button>
      </div>
    </header>
  );
};
