import { RawEventInput } from './custodyClassifier.js';

/**
 * Generates a realistic dataset for Grace & Ronny spanning multiple months around October-November 2026.
 * The schedule features alternating weeks with Friday exchange days, plus realistic children's commitments.
 */
export function generateMockEvents(): RawEventInput[] {
  const events: RawEventInput[] = [];

  // Friday Oct 9 -> Ronny starts
  // Friday Oct 16 -> Grace starts (Ronny drops off, Grace picks up)
  // Friday Oct 23 -> Ronny starts (Grace drops off, Ronny picks up)
  // Friday Oct 30 -> Grace starts (Ronny drops off, Grace picks up)
  // Friday Nov 6 -> Ronny starts (Grace drops off, Ronny picks up)
  // Friday Nov 13 -> Grace starts (Ronny drops off, Grace picks up)

  // Start with a baseline alternating pattern from Oct 1 to Nov 30, 2026
  // Oct 1 to Oct 8: Grace
  // Oct 9: Exchange (Grace -> Ronny)
  // Oct 10 to Oct 15: Ronny
  // Oct 16: Exchange (Ronny -> Grace)
  // Oct 17 to Oct 22: Grace
  // Oct 23: Exchange (Grace -> Ronny)
  // Oct 24 to Oct 29: Ronny
  // Oct 30: Exchange (Ronny -> Grace)
  // Oct 31 to Nov 5: Grace
  // Nov 6: Exchange (Grace -> Ronny)
  // Nov 7 to Nov 12: Ronny
  // Nov 13: Exchange (Ronny -> Grace)
  // Nov 14 to Nov 19: Grace
  // Nov 20: Exchange (Grace -> Ronny)

  const scheduleBlocks = [
    { start: '2026-10-01', end: '2026-10-08', parent: 'Grace' },
    { start: '2026-10-09', end: '2026-10-09', parent: 'Exchange' },
    { start: '2026-10-10', end: '2026-10-15', parent: 'Ronny' },
    { start: '2026-10-16', end: '2026-10-16', parent: 'Exchange' },
    { start: '2026-10-17', end: '2026-10-22', parent: 'Grace' },
    { start: '2026-10-23', end: '2026-10-23', parent: 'Exchange' },
    { start: '2026-10-24', end: '2026-10-29', parent: 'Ronny' },
    { start: '2026-10-30', end: '2026-10-30', parent: 'Exchange' },
    { start: '2026-10-31', end: '2026-11-05', parent: 'Grace' },
    { start: '2026-11-06', end: '2026-11-06', parent: 'Exchange' },
    { start: '2026-11-07', end: '2026-11-12', parent: 'Ronny' },
    { start: '2026-11-13', end: '2026-11-13', parent: 'Exchange' },
    { start: '2026-11-14', end: '2026-11-19', parent: 'Grace' },
    { start: '2026-11-20', end: '2026-11-20', parent: 'Exchange' },
    { start: '2026-11-21', end: '2026-11-30', parent: 'Ronny' }
  ];

  let idCounter = 1;

  for (const block of scheduleBlocks) {
    if (block.parent === 'Exchange') {
      // Exchange day has BOTH all-day events: Ronny and Grace
      events.push({
        id: `mock-custody-${idCounter++}`,
        title: 'Ronny',
        start: block.start,
        end: block.end,
        isAllDay: true
      });
      events.push({
        id: `mock-custody-${idCounter++}`,
        title: 'Grace',
        start: block.start,
        end: block.end,
        isAllDay: true
      });
    } else {
      // Step through dates in range
      let cur = block.start;
      while (cur <= block.end) {
        events.push({
          id: `mock-custody-${idCounter++}`,
          title: block.parent,
          start: cur,
          end: cur,
          isAllDay: true
        });
        const [y, m, d] = cur.split('-').map(Number);
        const dt = new Date(Date.UTC(y, m - 1, d));
        dt.setUTCDate(dt.getUTCDate() + 1);
        cur = dt.toISOString().slice(0, 10);
      }
    }
  }

  // Realistic sample commitments & activities for the girls
  const mockCommitments: RawEventInput[] = [
    {
      id: 'comm-1',
      title: 'Elementary School Drop-off',
      start: '2026-10-26T08:15:00',
      end: '2026-10-26T08:30:00',
      isAllDay: false,
      location: 'Lincoln Elementary School',
      description: 'Morning drop-off at main entrance'
    },
    {
      id: 'comm-2',
      title: 'Soccer Practice (Maya)',
      start: '2026-10-26T16:00:00',
      end: '2026-10-26T17:15:00',
      isAllDay: false,
      location: 'Riverside Community Park - Field 3',
      description: 'Bring water bottle, shin guards, and cleats'
    },
    {
      id: 'comm-3',
      title: 'Piano Lesson (Chloe)',
      start: '2026-10-26T17:30:00',
      end: '2026-10-26T18:15:00',
      isAllDay: false,
      location: 'Harmony Music Studio',
      description: 'Teacher: Ms. Clara'
    },
    {
      id: 'comm-4',
      title: 'Dentist Checkup (Both Girls)',
      start: '2026-10-27T10:00:00',
      end: '2026-10-27T11:00:00',
      isAllDay: false,
      location: 'Pediatric Dental Care, Suite 204',
      description: 'Routine 6-month cleaning and fluoride treatment'
    },
    {
      id: 'comm-5',
      title: 'Art Club Workshop',
      start: '2026-10-28T15:30:00',
      end: '2026-10-28T16:45:00',
      isAllDay: false,
      location: 'Civic Arts Center',
      description: 'Ceramics and pottery day'
    },
    {
      id: 'comm-6',
      title: 'Math Tutoring',
      start: '2026-10-29T16:30:00',
      end: '2026-10-29T17:30:00',
      isAllDay: false,
      location: 'Downtown Library Study Room B',
      description: 'Homework review & fractions'
    },
    // Exchange day commitments (Friday Oct 30)
    {
      id: 'comm-7',
      title: 'School Fall Costume Parade',
      start: '2026-10-30T13:30:00',
      end: '2026-10-30T14:30:00',
      isAllDay: false,
      location: 'Lincoln Elementary Courtyard',
      description: 'Parents invited to watch parade!'
    },
    {
      id: 'comm-8',
      title: 'Friday Exchange Handover',
      start: '2026-10-30T15:15:00',
      end: '2026-10-30T15:30:00',
      isAllDay: false,
      location: 'Lincoln Elementary After-school Gate',
      description: 'Ronny drops off in morning; Grace picks up after dismissal'
    },
    {
      id: 'comm-9',
      title: 'Halloween Trick-or-Treating',
      start: '2026-10-31T17:00:00',
      end: '2026-10-31T20:00:00',
      isAllDay: false,
      location: 'Neighborhood Maple Grove',
      description: 'Meeting up with classmates at 5pm'
    },
    {
      id: 'comm-10',
      title: 'Sunday Gymnastics Open Gym',
      start: '2026-11-01T11:00:00',
      end: '2026-11-01T12:30:00',
      isAllDay: false,
      location: 'Flip & Tumble Gymnastics Academy',
      description: 'Open tumble session for Maya & Chloe'
    },
    {
      id: 'comm-11',
      title: 'Parent-Teacher Conference',
      start: '2026-11-04T16:00:00',
      end: '2026-11-04T16:45:00',
      isAllDay: false,
      location: 'Lincoln Elementary - Room 102',
      description: 'Joint conference with 3rd grade teacher'
    },
    {
      id: 'comm-12',
      title: 'Girls Swim Meet',
      start: '2026-11-07T09:00:00',
      end: '2026-11-07T12:00:00',
      isAllDay: false,
      location: 'Aquatics Center Pool 1',
      description: 'Warm-ups begin at 8:30am'
    }
  ];

  events.push(...mockCommitments);
  return events;
}
