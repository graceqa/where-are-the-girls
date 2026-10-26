import React from 'react';

interface DayNavigationProps {
  selectedDate: string;
  todayDate: string;
  onPrevDay: () => void;
  onNextDay: () => void;
  onJumpToToday: () => void;
}

export const DayNavigation: React.FC<DayNavigationProps> = ({
  selectedDate,
  todayDate,
  onPrevDay,
  onNextDay,
  onJumpToToday
}) => {
  const isToday = selectedDate === todayDate;

  const [y, m, d] = selectedDate.split('-').map(Number);
  const dateObj = new Date(Date.UTC(y, m - 1, d));
  const shortDateLabel = dateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC'
  });

  return (
    <div className="day-stepper-bar">
      <button className="stepper-btn" onClick={onPrevDay} title="Previous day">
        <span>←</span>
        <span>Prev Day</span>
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span className="stepper-current-label">
          {shortDateLabel} {isToday ? '(Today)' : ''}
        </span>
        {!isToday && (
          <button
            className="stepper-btn"
            onClick={onJumpToToday}
            style={{ fontSize: '0.75rem', padding: '0.2rem 0.45rem', background: '#e2e8f0' }}
            title="Jump to today"
          >
            Today ↩
          </button>
        )}
      </div>

      <button className="stepper-btn" onClick={onNextDay} title="Next day">
        <span>Next Day</span>
        <span>→</span>
      </button>
    </div>
  );
};
