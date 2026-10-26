import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { classifyEvents, isCustodyEvent, RawEventInput } from './custodyClassifier.js';

describe('custodyClassifier', () => {
  it('correctly identifies custody events vs commitment activities', () => {
    const graceAllDay: RawEventInput = {
      id: '1',
      title: 'Grace',
      start: '2026-10-26',
      end: '2026-10-26',
      isAllDay: true
    };
    const ronnyEvent: RawEventInput = {
      id: '2',
      title: 'With Ronny',
      start: '2026-10-27',
      end: '2026-10-27',
      isAllDay: false
    };
    const activityEvent: RawEventInput = {
      id: '3',
      title: 'Soccer Practice',
      start: '2026-10-26T16:00:00Z',
      end: '2026-10-26T17:30:00Z',
      isAllDay: false
    };

    assert.equal(isCustodyEvent(graceAllDay).isCustody, true);
    assert.equal(isCustodyEvent(graceAllDay).parent, 'Grace');

    assert.equal(isCustodyEvent(ronnyEvent).isCustody, true);
    assert.equal(isCustodyEvent(ronnyEvent).parent, 'Ronny');

    assert.equal(isCustodyEvent(activityEvent).isCustody, false);
  });

  it('resolves Friday exchange day: Ronny on Thursday -> Ronny drops off, Grace picks up on Friday', () => {
    const rawEvents: RawEventInput[] = [
      // Thursday: Ronny
      {
        id: 'thurs-1',
        title: 'Ronny',
        start: '2026-10-22',
        end: '2026-10-22',
        isAllDay: true
      },
      // Friday: Both Ronny and Grace
      {
        id: 'fri-1',
        title: 'Ronny',
        start: '2026-10-23',
        end: '2026-10-23',
        isAllDay: true
      },
      {
        id: 'fri-2',
        title: 'Grace',
        start: '2026-10-23',
        end: '2026-10-23',
        isAllDay: true
      },
      // Commitment on Friday
      {
        id: 'fri-act-1',
        title: 'Girls Ballet Recital',
        start: '2026-10-23T15:30:00Z',
        end: '2026-10-23T17:00:00Z',
        isAllDay: false,
        location: 'Community Dance Hall'
      },
      // Saturday: Grace
      {
        id: 'sat-1',
        title: 'Grace',
        start: '2026-10-24',
        end: '2026-10-24',
        isAllDay: true
      }
    ];

    const engine = classifyEvents(rawEvents);
    const friSchedule = engine.getDaySchedule('2026-10-23');

    assert.equal(friSchedule.custody.isExchangeDay, true);
    assert.equal(friSchedule.custody.parent, 'Both');
    assert.ok(friSchedule.custody.exchangeDetails);
    assert.equal(friSchedule.custody.exchangeDetails.droppingOff, 'Ronny');
    assert.equal(friSchedule.custody.exchangeDetails.pickingUp, 'Grace');

    // Commitments should exclude the custody markers and keep the recital
    assert.equal(friSchedule.commitments.length, 1);
    assert.equal(friSchedule.commitments[0].title, 'Girls Ballet Recital');
  });

  it('resolves Friday exchange day: Grace on Thursday -> Grace drops off, Ronny picks up on Friday', () => {
    const rawEvents: RawEventInput[] = [
      // Thursday: Grace
      {
        id: 'thurs-1',
        title: 'Grace',
        start: '2026-10-15',
        end: '2026-10-15',
        isAllDay: true
      },
      // Friday: Both Ronny and Grace (single event or dual)
      {
        id: 'fri-1',
        title: 'Grace',
        start: '2026-10-16',
        end: '2026-10-16',
        isAllDay: true
      },
      {
        id: 'fri-2',
        title: 'Ronny',
        start: '2026-10-16',
        end: '2026-10-16',
        isAllDay: true
      },
      // Saturday: Ronny
      {
        id: 'sat-1',
        title: 'Ronny',
        start: '2026-10-17',
        end: '2026-10-17',
        isAllDay: true
      }
    ];

    const engine = classifyEvents(rawEvents);
    const friSchedule = engine.getDaySchedule('2026-10-16');

    assert.equal(friSchedule.custody.isExchangeDay, true);
    assert.ok(friSchedule.custody.exchangeDetails);
    assert.equal(friSchedule.custody.exchangeDetails.droppingOff, 'Grace');
    assert.equal(friSchedule.custody.exchangeDetails.pickingUp, 'Ronny');
  });

  it('correctly categorizes no school and Winter Recess as schoolBreak and excludes them from commitments', () => {
    const rawEvents: RawEventInput[] = [
      {
        id: 'ns-1',
        title: 'no school',
        start: '2026-11-03',
        end: '2026-11-03',
        isAllDay: true
      },
      {
        id: 'act-1',
        title: 'Soccer Practice',
        start: '2026-11-03T16:00:00Z',
        end: '2026-11-03T17:00:00Z',
        isAllDay: false
      },
      {
        id: 'wr-1',
        title: 'Winter Recess',
        start: '2026-12-24',
        end: '2027-01-02',
        isAllDay: true
      }
    ];

    const engine = classifyEvents(rawEvents);
    const daySchedule = engine.getDaySchedule('2026-11-03');
    assert.equal(daySchedule.schoolBreak, 'no school');
    assert.equal(daySchedule.commitments.length, 1);
    assert.equal(daySchedule.commitments[0].title, 'Soccer Practice');

    const recessDay = engine.getDaySchedule('2026-12-25');
    assert.equal(recessDay.schoolBreak, 'Winter Recess');
    assert.equal(recessDay.commitments.length, 0);
  });

  it('correctly categorizes "girls in Paris" as travel and sets travelStatus', () => {
    const rawEvents: RawEventInput[] = [
      {
        id: 'travel-1',
        title: 'girls in Paris',
        start: '2026-11-06',
        end: '2026-11-13',
        isAllDay: true
      },
      {
        id: 'custody-1',
        title: 'Grace',
        start: '2026-11-06',
        end: '2026-11-13',
        isAllDay: true
      }
    ];

    const engine = classifyEvents(rawEvents);
    const daySchedule = engine.getDaySchedule('2026-11-08');
    assert.equal(daySchedule.travelStatus, 'traveling in Paris');
    assert.equal(daySchedule.custody.parent, 'Grace');
    // Travel event is excluded from commitments list
    assert.equal(daySchedule.commitments.length, 0);
  });
});
