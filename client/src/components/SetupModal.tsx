import React from 'react';
import { ServiceStatus } from '../types.js';

interface SetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: ServiceStatus | null;
}

export const SetupModal: React.FC<SetupModalProps> = ({
  isOpen,
  onClose,
  status
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.5rem' }}>⚙️</span>
            <h3 className="modal-title">Google Calendar Connection</h3>
          </div>
          <button className="close-btn" onClick={onClose} title="Close">
            ✕
          </button>
        </div>

        <div style={{ padding: '0.75rem 1rem', background: status?.isConnected ? '#ecfdf5' : '#fffbeb', borderRadius: 'var(--radius-md)', border: `1px solid ${status?.isConnected ? '#a7f3d0' : '#fde68a'}` }}>
          <p style={{ fontWeight: 700, fontSize: '0.9rem', color: status?.isConnected ? '#065f46' : '#92400e' }}>
            {status?.isConnected ? '✅ Live Google Calendar Connected' : 'ℹ️ Currently in Demo Mode'}
          </p>
          <p style={{ fontSize: '0.825rem', color: status?.isConnected ? '#047857' : '#78350f', marginTop: '0.2rem' }}>
            {status?.message}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            To connect your shared family calendar using Google Calendar API:
          </p>

          <div className="guide-step">
            <span className="step-num">1</span>
            <div className="step-text">
              <strong>Create a Service Account</strong> in Google Cloud Console, enable the <em>Google Calendar API</em>, and download a Service Account JSON Key.
            </div>
          </div>

          <div className="guide-step">
            <span className="step-num">2</span>
            <div className="step-text">
              <strong>Share your Google Calendar</strong>: Open Google Calendar Settings for the shared custody calendar, click <em>Share with specific people</em>, and add the Service Account email with <strong>"See all event details"</strong> permission.
            </div>
          </div>

          <div className="guide-step">
            <span className="step-num">3</span>
            <div className="step-text">
              <strong>Set your environment variables</strong> in <code>.env</code> in this project:
            </div>
          </div>

          <div className="code-snippet">
GOOGLE_CALENDAR_ID=your-calendar-id@group.calendar.google.com
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-sa@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
          </div>
        </div>

        <button
          className="btn-today-primary"
          onClick={onClose}
          style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
        >
          Got it
        </button>
      </div>
    </div>
  );
};
