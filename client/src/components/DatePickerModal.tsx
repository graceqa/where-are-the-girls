import React, { useState, useEffect } from 'react';

interface DatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  todayDate: string;
  onSelectDate: (dateKey: string) => void;
}

export const DatePickerModal: React.FC<DatePickerModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  todayDate,
  onSelectDate
}) => {
  const [pickerYear, setPickerYear] = useState<number>(() => {
    const [y] = selectedDate.split('-').map(Number);
    return y || new Date().getFullYear();
  });
  const [pickerMonth, setPickerMonth] = useState<number>(() => {
    const [, m] = selectedDate.split('-').map(Number);
    return m || (new Date().getMonth() + 1);
  });

  // Sync with selectedDate when modal opens
  useEffect(() => {
    if (isOpen && selectedDate) {
      const [y, m] = selectedDate.split('-').map(Number);
      if (y && m) {
        setPickerYear(y);
        setPickerMonth(m);
      }
    }
  }, [isOpen, selectedDate]);

  if (!isOpen) return null;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const monthLabel = `${monthNames[pickerMonth - 1]} ${pickerYear}`;

  const handlePrevMonth = () => {
    if (pickerMonth === 1) {
      setPickerMonth(12);
      setPickerYear(y => y - 1);
    } else {
      setPickerMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (pickerMonth === 12) {
      setPickerMonth(1);
      setPickerYear(y => y + 1);
    } else {
      setPickerMonth(m => m + 1);
    }
  };

  const handlePick = (dateKey: string) => {
    onSelectDate(dateKey);
    onClose();
  };

  const handlePickToday = () => {
    onSelectDate(todayDate);
    onClose();
  };

  // Calculate grid
  const firstDayOfWeek = new Date(Date.UTC(pickerYear, pickerMonth - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(pickerYear, pickerMonth, 0)).getUTCDate();
  const dayHeaders = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const cells: Array<{ type: 'empty'; key: string } | { type: 'day'; dayNum: number; dateKey: string }> = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push({ type: 'empty', key: `empty-${i}` });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = String(d).padStart(2, '0');
    const mStr = String(pickerMonth).padStart(2, '0');
    const dateKey = `${pickerYear}-${mStr}-${dStr}`;
    cells.push({ type: 'day', dayNum: d, dateKey });
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="picker-modal-content" onClick={e => e.stopPropagation()}>
        <div className="picker-modal-header">
          <span className="picker-modal-title">Pick Date</span>
          <button className="close-btn" onClick={onClose} title="Close" aria-label="Close">
            ✕
          </button>
        </div>

        {/* Month Navigation */}
        <div className="picker-nav-header">
          <button className="nav-arrow-btn" onClick={handlePrevMonth} title="Previous Month">
            ‹
          </button>
          <span className="picker-month-label">{monthLabel}</span>
          <button className="nav-arrow-btn" onClick={handleNextMonth} title="Next Month">
            ›
          </button>
        </div>

        {/* Calendar Grid (Clean, no info badges) */}
        <div className="picker-grid">
          {dayHeaders.map(dh => (
            <div key={dh} className="picker-day-header">
              {dh}
            </div>
          ))}

          {cells.map(cell => {
            if (cell.type === 'empty') {
              return <div key={cell.key} className="picker-cell empty" />;
            }

            const isSelected = cell.dateKey === selectedDate;
            const isToday = cell.dateKey === todayDate;

            return (
              <button
                key={cell.dateKey}
                className={`picker-cell ${isSelected ? 'selected' : ''} ${isToday ? 'is-today' : ''}`}
                onClick={() => handlePick(cell.dateKey)}
              >
                {cell.dayNum}
              </button>
            );
          })}
        </div>

        {/* Quick jump to today */}
        <div className="picker-footer">
          <button className="btn-secondary" onClick={handlePickToday} style={{ width: '100%' }}>
            Select Today
          </button>
        </div>
      </div>
    </div>
  );
};
