export type ParentName = 'Grace' | 'Ronny';
export type CustodyParent = ParentName | 'Both' | 'None';

export interface ExchangeDetails {
  droppingOff: ParentName;
  pickingUp: ParentName;
  description: string;
}

export interface CustodyInfo {
  parent: CustodyParent;
  isExchangeDay: boolean;
  exchangeDetails?: ExchangeDetails;
  matchedKeywords: string[];
}

export type EventCategory = 'custody' | 'commitment' | 'school_break' | 'travel';

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  isAllDay: boolean;
  location?: string;
  description?: string;
  category: EventCategory;
  parentTag?: ParentName | 'Both';
}

export interface DaySchedule {
  date: string;
  custody: CustodyInfo;
  schoolBreak?: string;
  travelStatus?: string;
  commitments: CalendarEvent[];
  custodyEvents: CalendarEvent[];
}

export interface MonthSummaryDay {
  date: string;
  custody: CustodyInfo;
  commitmentCount: number;
}

export interface MonthSummary {
  year: number;
  month: number;
  days: Record<string, MonthSummaryDay>;
}

export interface ServiceStatus {
  isConfigured: boolean;
  isConnected: boolean;
  mode: 'google_calendar' | 'demo';
  calendarId?: string;
  message: string;
  todayCustody?: CustodyInfo;
}
