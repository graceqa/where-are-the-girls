import React from 'react';
import { MonthSummary } from '../types.js';

interface CalendarWidgetProps {
  selectedDate: string;
  todayDate: string;
  onSelectDate: (date: string) => void;
  monthSummary: MonthSummary | null;
  year: number;
  month: number; // 1-12
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onJumpToToday: () => void;
}

export const CalendarWidget: React.FC<CalendarWidgetProps> = ({
  selectedDate,
  todayDate,
  onSelectDate,
  monthSummary,
  year,
  month,
  onPrevMonth,
  onNextMonth,
  onJumpToToday
}) => {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const monthLabel = `${monthNames[month - 1]} ${year}`;

  // Calculate days in month and starting day offset
  const firstDayOfWeek = new Date(Date.UTC(year, month - 1, 1)).getUTCDay(); // 0 = Sun
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Days array
  const cells: Array<{ type: 'empty'; key: string } | { type: 'day'; dayNum: number; dateKey: string }> = [];

  // Empty leading cells
  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push({ type: 'empty', key: `empty-${i}` });
  }

  // Day cells
  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = String(d).padStart(2, '0');
    const mStr = String(month).padStart(2, '0');
    const dateKey = `${year}-${mStr}-${dStr}`;
    cells.push({ type: 'day', dayNum: d, dateKey });
  }

  return (
    <div className="panel-card">
      <div className="calendar-header">
        <h3 className="month-label">{monthLabel}</h3>

        <div className="calendar-nav-buttons">
          <button
            className="stepper-btn"
            onClick={onJumpToToday}
            style={{ marginRight: '0.25rem', fontSize: '0.75rem' }}
            title="Jump to current month & today"
          >
            Today
          </button>
          <button className="nav-arrow-btn" onClick={onPrevMonth} title="Previous month">
            ‹
          </button>
          <button className="nav-arrow-btn" onClick={onNextMonth} title="Next month">
            ›
          </button>
        </div>
      </div>

      <div className="calendar-grid">
        {dayHeaders.map(dh => (
          <div key={dh} className="day-header">
            {dh}
          </div>
        ))}

        {cells.map(cell => {
          if (cell.type === 'empty') {
            return <div key={cell.key} className="calendar-cell empty" />;
          }

          const isSelected = cell.dateKey === selectedDate;
          const isToday = cell.dateKey === todayDate;
          const dayData = monthSummary?.days[cell.dateKey];
          const custody = dayData?.custody;
          const commitmentCount = dayData?.commitmentCount || 0;

          let pillClass = 'none';
          let pillText = '—';

          if (custody?.isExchangeDay) {
            pillClass = 'exchange';
            pillText = 'Exchange';
          } else if (custody?.parent === 'Grace') {
            pillClass = 'grace';
            pillText = 'Grace';
          } else if (custody?.parent === 'Ronny') {
            pillClass = 'ronny';
            pillText = 'Ronny';
          }

          return (
            <button
              key={cell.dateKey}
              className={`calendar-cell ${isSelected ? 'selected' : ''} ${isToday ? 'is-today' : ''}`}
              onClick={() => onSelectDate(cell.dateKey)}
              title={`${cell.dateKey}: ${pillText} (${commitmentCount} commitments)`}
            >
              <span className="cell-day-number">{cell.dayNum}</span>

              <span className={`cell-custody-pill ${pillClass}`}>{pillText}</span>

              <div className="cell-commitment-dots">
                {commitmentCount > 0 &&
                  Array.from({ length: Math.min(commitmentCount, 3) }).map((_, i) => (
                    <span key={i} className="commitment-dot" />
                  ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="calendar-legend">
        <div className="legend-item">
          <span className="legend-badge grace" />
          <span>Grace</span>
        </div>
        <div className="legend-item">
          <span className="legend-badge ronny" />
          <span>Ronny</span>
        </div>
        <div className="legend-item">
          <span className="legend-badge exchange" />
          <span>Exchange Day</span>
        </div>
        <div className="legend-item">
          <span className="legend-badge commitment" />
          <span>Commitment</span>
        </div>
      </div>
    </div>
  );
};
