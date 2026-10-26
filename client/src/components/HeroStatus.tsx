import React from 'react';
import { CalendarEvent, CustodyInfo } from '../types.js';

interface HeroStatusProps {
  selectedDate: string;
  todayDate: string;
  custody: CustodyInfo | undefined;
  schoolBreak?: string;
  travelStatus?: string;
  commitments: CalendarEvent[];
  loading?: boolean;
  onPrevDay: () => void;
  onNextDay: () => void;
}

function renderDescriptionWithLinks(desc?: string) {
  if (!desc) return null;

  let s = desc
    .replace(/<wbr\s*\/?>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/<\/?(ul|ol|li|p|div|span)[^>]*>/gi, '\n');

  const links: Array<{ url: string; label: string }> = [];

  // Extract <a href="..."> tags
  s = s.replace(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi, (_, url, txt) => {
    const label = txt.replace(/<[^>]+>/g, '').trim() || url;
    const placeholder = `___EXT_LINK_${links.length}___`;
    links.push({ url, label });
    return placeholder;
  });

  // Strip remaining HTML tags
  s = s.replace(/<[^>]+>/g, '');

  // Extract raw URLs (https?://)
  s = s.replace(/(https?:\/\/[^\s<>"]+)/gi, m => {
    if (m.startsWith('___EXT_LINK_')) return m;
    const placeholder = `___EXT_LINK_${links.length}___`;
    links.push({ url: m, label: m });
    return placeholder;
  });

  const parts: Array<{ type: 'text'; content: string } | { type: 'link'; url: string; label: string }> = [];
  const segments = s.split(/(___EXT_LINK_\d+___)/g);

  for (const seg of segments) {
    const match = seg.match(/^___EXT_LINK_(\d+)___$/);
    if (match) {
      const idx = parseInt(match[1], 10);
      parts.push({ type: 'link', ...links[idx] });
    } else if (seg) {
      parts.push({ type: 'text', content: seg });
    }
  }

  return (
    <p className="hero-commitment-desc">
      {parts.map((p, idx) =>
        p.type === 'link' ? (
          <a
            key={idx}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className="event-link"
          >
            {p.label}
          </a>
        ) : (
          <span key={idx}>{p.content}</span>
        )
      )}
    </p>
  );
}

export const HeroStatus: React.FC<HeroStatusProps> = ({
  selectedDate,
  todayDate,
  custody,
  schoolBreak,
  travelStatus,
  commitments,
  loading = false,
  onPrevDay,
  onNextDay
}) => {
  const isToday = selectedDate === todayDate;

  // Format date display (e.g., "Monday, October 26, 2026")
  const formatDateLabel = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(Date.UTC(y, m - 1, d));
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC'
    });
  };

  const formatShortTime = (timeStr: string, isAllDay: boolean) => {
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
    const s = formatShortTime(start, false);
    const e = formatShortTime(end, false);
    return s === e ? s : `${s} – ${e}`;
  };

  const formattedDate = formatDateLabel(selectedDate);
  const isExchange = custody?.isExchangeDay;
  const parent = custody?.parent;

  let themeClass = 'none';
  let parentLabel = 'Unscheduled';
  let avatarIcon = '🗓️';

  if (isExchange) {
    themeClass = 'exchange';
    parentLabel = 'Exchange Day';
    avatarIcon = '🔄';
  } else if (parent === 'Grace') {
    themeClass = 'grace';
    parentLabel = 'With Grace';
    avatarIcon = '🌸';
  } else if (parent === 'Ronny') {
    themeClass = 'ronny';
    parentLabel = 'With Ronny';
    avatarIcon = '🌊';
  }

  return (
    <div className={`hero-card ${themeClass}`}>
      {/* Full-width Date Navigation Bar (same width as widget) */}
      <div className="hero-date-nav-fullwidth">
        <button className="nav-step-btn" onClick={onPrevDay} title="Previous Day" aria-label="Previous day">
          ‹
        </button>

        <div className="hero-date-center-group">
          <span className="hero-date-text">{formattedDate}</span>
          {isToday && <span className="today-chip">Today</span>}
        </div>

        <button className="nav-step-btn" onClick={onNextDay} title="Next Day" aria-label="Next day">
          ›
        </button>
      </div>

      {/* School Break / No School Notice in Red right below the date component */}
      {schoolBreak && (
        <div className="school-break-notice">
          <span className="school-break-text">{schoolBreak}</span>
        </div>
      )}

      {/* Main Custody Status Body - Center Aligned */}
      <div className="hero-body-centered">
        <div className="hero-tag-wrap">
          <span className="hero-tag">
            {isExchange
              ? '🔄 Handover Day'
              : travelStatus
              ? `✈️ ${parentLabel}`
              : `🏡 ${parentLabel}`}
          </span>
        </div>

        <div className="hero-avatar">{avatarIcon}</div>

        <div className="hero-info-centered">
          <h2 className="hero-heading">
            {isExchange ? (
              <>
                <span className="parent-name-highlight">Exchange Day</span>
              </>
            ) : parent === 'Grace' ? (
              <>
                Gabby & Penny are with <span className="parent-name-highlight">Grace</span>
              </>
            ) : parent === 'Ronny' ? (
              <>
                Gabby & Penny are with <span className="parent-name-highlight">Ronny</span>
              </>
            ) : (
              'No parent residence marked for this day'
            )}
          </h2>

          {travelStatus && (
            <p className="hero-travel-text">{travelStatus}</p>
          )}
        </div>
      </div>

      {/* Dedicated Exchange Handover Flow Cards */}
      {isExchange && custody?.exchangeDetails && (
        <div className="exchange-flow-container">
          <div className="exchange-step-card">
            <div className="step-icon">🚗</div>
            <div>
              <div className="step-label">Morning Drop-off</div>
              <div className={`step-parent parent-${custody.exchangeDetails.droppingOff.toLowerCase()}`}>
                {custody.exchangeDetails.droppingOff} drops off
              </div>
            </div>
          </div>

          <div className="exchange-step-card">
            <div className="step-icon">🎒</div>
            <div>
              <div className="step-label">Afternoon Pick-up</div>
              <div className={`step-parent parent-${custody.exchangeDetails.pickingUp.toLowerCase()}`}>
                {custody.exchangeDetails.pickingUp} picks up
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Events directly inside this block */}
      <div className="hero-commitments-section">
        <div className="commitments-section-header">
          <span className="commitments-section-title">
            <span>📋</span> Events
          </span>
          {commitments.length > 0 && (
            <span className="commitments-count-chip">{commitments.length}</span>
          )}
        </div>

        {loading ? (
          <div className="commitments-loading">
            <span className="loading-spinner" />
            <span>Loading schedule...</span>
          </div>
        ) : commitments.length === 0 ? (
          <div className="empty-day-commitments">
            <span>✨ No events scheduled for this day</span>
          </div>
        ) : (
          <div className="hero-commitments-list">
            {commitments.map(item => (
              <div key={item.id} className="hero-commitment-card">
                <div className="hero-commitment-main">
                  <span className="hero-commitment-title">{item.title}</span>
                  <span className="hero-commitment-time">
                    {formatEventRange(item.start, item.end, item.isAllDay)}
                  </span>
                </div>

                {item.location && (
                  <div className="hero-commitment-meta">
                    <span>📍</span>
                    <span>{item.location}</span>
                  </div>
                )}

                {item.description && renderDescriptionWithLinks(item.description)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
