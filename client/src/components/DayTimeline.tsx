import React from 'react';
import { CalendarEvent } from '../types.js';

interface DayTimelineProps {
  selectedDate: string;
  commitments: CalendarEvent[];
  loading: boolean;
}

export const DayTimeline: React.FC<DayTimelineProps> = ({
  selectedDate,
  commitments,
  loading
}) => {
  const formatTime = (timeStr: string, isAllDay: boolean) => {
    if (isAllDay || !timeStr.includes('T')) return 'All Day';
    try {
      const date = new Date(timeStr);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return timeStr;
    }
  };

  const formatEventRange = (start: string, end: string, isAllDay: boolean) => {
    if (isAllDay) return 'All Day';
    const s = formatTime(start, false);
    const e = formatTime(end, false);
    return s === e ? s : `${s} - ${e}`;
  };

  return (
    <div className="panel-card">
      <div className="timeline-header">
        <div className="timeline-title-row">
          <span style={{ fontSize: '1.25rem' }}>📋</span>
          <h3 className="timeline-title">Scheduled Commitments</h3>
        </div>
        <span className="count-badge">
          {commitments.length} {commitments.length === 1 ? 'event' : 'events'}
        </span>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <div className="loading-spinner" />
          <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Loading schedule details...
          </p>
        </div>
      ) : commitments.length === 0 ? (
        <div className="empty-commitments">
          <div className="empty-icon">🌈</div>
          <p className="empty-title">No scheduled commitments</p>
          <p className="empty-subtitle">
            There are no sports, appointments, or events recorded for this date.
          </p>
        </div>
      ) : (
        <div className="commitments-list">
          {commitments.map(item => (
            <div key={item.id} className="commitment-card">
              <div className="commitment-top">
                <span className="commitment-title">{item.title}</span>
                <span className="commitment-time">
                  {formatEventRange(item.start, item.end, item.isAllDay)}
                </span>
              </div>

              {item.location && (
                <div className="commitment-location">
                  <span>📍</span>
                  <span>{item.location}</span>
                </div>
              )}

              {item.description && (
                <p className="commitment-desc">{item.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
