import { DateTime } from 'luxon';
import {
  createDateTime,
  detectDSTTransitions,
  detectDSTTransitionOnDate,
  checkSlotOverlapWithDST,
  validateSlotDuringDST,
  adjustSlotForDST,
  validateSchedule,
  createTimeSlot,
  timeSlotToISO,
  adjustForDSTGap,
  type TimeSlot,
  type SchedulingConfig,
} from '../date';

describe('DST Scheduling Bug Guard (T-16.2)', () => {
  // Test data for 2025-03-30 EU/Madrid DST transition (Spring Forward)
  const MADRID_SPRING_2025 = '2025-03-30';
  const MADRID_FALL_2025 = '2025-10-26';
  const TIMEZONE = 'Europe/Madrid';

  describe('createDateTime', () => {
    it('should create DateTime with correct timezone', () => {
      const dt = createDateTime(2025, 3, 30, 1, 30, TIMEZONE);
      expect(dt.zoneName).toBe(TIMEZONE);
      expect(dt.hour).toBe(1);
      expect(dt.minute).toBe(30);
    });

    it('should handle invalid parameters gracefully', () => {
      expect(() => createDateTime(2025, 13, 30, 1, 30, TIMEZONE)).toThrow();
    });
  });

  describe('detectDSTTransitionOnDate', () => {
    it('should detect spring forward transition on 2025-03-30 in Madrid', () => {
      const date = DateTime.fromISO(MADRID_SPRING_2025, { zone: TIMEZONE });
      const transition = detectDSTTransitionOnDate(date, TIMEZONE);

      expect(transition).not.toBeNull();
      expect(transition?.type).toBe('spring_forward');
      expect(transition?.isProblematic).toBe(true);
      expect(transition?.offsetChange).toBeGreaterThan(0);
    });

    it('should detect fall back transition on 2025-10-26 in Madrid', () => {
      const date = DateTime.fromISO(MADRID_FALL_2025, { zone: TIMEZONE });
      const transition = detectDSTTransitionOnDate(date, TIMEZONE);

      expect(transition).not.toBeNull();
      expect(transition?.type).toBe('fall_back');
      expect(transition?.isProblematic).toBe(false);
      expect(transition?.offsetChange).toBeGreaterThan(0);
    });

    it('should return null for dates without DST transitions', () => {
      const date = DateTime.fromISO('2025-06-15', { zone: TIMEZONE });
      const transition = detectDSTTransitionOnDate(date, TIMEZONE);

      expect(transition).toBeNull();
    });
  });

  describe('detectDSTTransitions', () => {
    it('should detect transitions in a date range covering spring forward', () => {
      const start = DateTime.fromISO('2025-03-25', { zone: TIMEZONE });
      const end = DateTime.fromISO('2025-04-05', { zone: TIMEZONE });
      const transitions = detectDSTTransitions(start, end, TIMEZONE);

      expect(transitions).toHaveLength(1);
      expect(transitions[0].type).toBe('spring_forward');
    });

    it('should detect both spring and fall transitions in a full year', () => {
      const start = DateTime.fromISO('2025-01-01', { zone: TIMEZONE });
      const end = DateTime.fromISO('2025-12-31', { zone: TIMEZONE });
      const transitions = detectDSTTransitions(start, end, TIMEZONE);

      expect(transitions).toHaveLength(2);
      expect(transitions.some((t) => t.type === 'spring_forward')).toBe(true);
      expect(transitions.some((t) => t.type === 'fall_back')).toBe(true);
    });

    it('should return empty array for range without transitions', () => {
      const start = DateTime.fromISO('2025-06-01', { zone: TIMEZONE });
      const end = DateTime.fromISO('2025-06-30', { zone: TIMEZONE });
      const transitions = detectDSTTransitions(start, end, TIMEZONE);

      expect(transitions).toHaveLength(0);
    });
  });

  describe('createTimeSlot', () => {
    it('should create TimeSlot from ISO strings', () => {
      const slot = createTimeSlot(
        '2025-03-30T01:00:00',
        '2025-03-30T02:00:00',
        TIMEZONE
      );

      expect(slot.start.zoneName).toBe(TIMEZONE);
      expect(slot.end.zoneName).toBe(TIMEZONE);
      expect(slot.duration).toBe(60);
      expect(slot.timezone).toBe(TIMEZONE);
    });

    it('should create TimeSlot from DateTime objects', () => {
      const start = DateTime.fromISO('2025-03-30T01:00:00', { zone: TIMEZONE });
      const end = DateTime.fromISO('2025-03-30T02:00:00', { zone: TIMEZONE });
      const slot = createTimeSlot(start, end, TIMEZONE, 'Test Venue');

      expect(slot.start.equals(start.setZone(TIMEZONE))).toBe(true);
      expect(slot.end.equals(end.setZone(TIMEZONE))).toBe(true);
      expect(slot.venue).toBe('Test Venue');
    });
  });

  describe('validateSlotDuringDST - Spring Forward Edge Cases', () => {
    it('should detect slot conflict during spring forward (2 AM - 3 AM skipped)', () => {
      // This slot would start at 2:30 AM which doesn't exist on 2025-03-30
      const slot = createTimeSlot(
        '2025-03-30T02:30:00',
        '2025-03-30T03:30:00',
        TIMEZONE
      );

      const validation = validateSlotDuringDST(slot, TIMEZONE);
      expect(validation.isValid).toBe(false);
      expect(validation.issues).toHaveLength(1);
      expect(validation.issues[0]).toContain('spring forward transition');
    });

    it('should detect slot ending in skipped hour', () => {
      const slot = createTimeSlot(
        '2025-03-30T01:30:00',
        '2025-03-30T02:30:00',
        TIMEZONE
      );

      const validation = validateSlotDuringDST(slot, TIMEZONE);
      expect(validation.isValid).toBe(false);
      expect(validation.issues[0]).toContain('spring forward transition');
    });

    it('should validate slots before DST transition', () => {
      const slot = createTimeSlot(
        '2025-03-30T01:00:00',
        '2025-03-30T01:59:00',
        TIMEZONE
      );

      const validation = validateSlotDuringDST(slot, TIMEZONE);
      expect(validation.isValid).toBe(true);
      expect(validation.issues).toHaveLength(0);
    });

    it('should validate slots after DST transition', () => {
      const slot = createTimeSlot(
        '2025-03-30T03:00:00',
        '2025-03-30T04:00:00',
        TIMEZONE
      );

      const validation = validateSlotDuringDST(slot, TIMEZONE);
      expect(validation.isValid).toBe(true);
      expect(validation.issues).toHaveLength(0);
    });
  });

  describe('validateSlotDuringDST - Fall Back Edge Cases', () => {
    it('should detect ambiguous slot during fall back (2 AM occurs twice)', () => {
      const slot = createTimeSlot(
        '2025-10-26T02:30:00',
        '2025-10-26T03:30:00',
        TIMEZONE
      );

      const validation = validateSlotDuringDST(slot, TIMEZONE);
      expect(validation.isValid).toBe(false);
      expect(validation.issues[0]).toContain('fall back transition');
    });

    it('should validate slots outside ambiguous period', () => {
      const slot = createTimeSlot(
        '2025-10-26T04:00:00',
        '2025-10-26T05:00:00',
        TIMEZONE
      );

      const validation = validateSlotDuringDST(slot, TIMEZONE);
      expect(validation.isValid).toBe(true);
    });
  });

  describe('adjustSlotForDST', () => {
    it('should adjust slot starting in skipped hour to after transition', () => {
      const problematicSlot = createTimeSlot(
        '2025-03-30T02:30:00',
        '2025-03-30T03:30:00',
        TIMEZONE
      );

      const adjustedSlot = adjustSlotForDST(problematicSlot, TIMEZONE);

      // Should be moved to after 3 AM (when clocks spring forward)
      expect(adjustedSlot.start.hour).toBeGreaterThanOrEqual(3);
      expect(adjustedSlot.duration).toBe(problematicSlot.duration);
    });

    it('should not adjust valid slots', () => {
      const validSlot = createTimeSlot(
        '2025-03-30T01:00:00',
        '2025-03-30T01:30:00',
        TIMEZONE
      );

      const adjustedSlot = adjustSlotForDST(validSlot, TIMEZONE);

      expect(adjustedSlot.start.equals(validSlot.start)).toBe(true);
      expect(adjustedSlot.end.equals(validSlot.end)).toBe(true);
    });
  });

  describe('checkSlotOverlapWithDST', () => {
    it('should detect overlap when slots span DST transition', () => {
      const slot1 = createTimeSlot(
        '2025-03-30T01:30:00',
        '2025-03-30T03:30:00', // Spans the 2-3 AM gap
        TIMEZONE
      );

      const slot2 = createTimeSlot(
        '2025-03-30T03:00:00',
        '2025-03-30T04:00:00',
        TIMEZONE
      );

      const overlaps = checkSlotOverlapWithDST(slot1, slot2, TIMEZONE);
      expect(overlaps).toBe(true);
    });

    it('should not detect overlap for non-overlapping slots during DST', () => {
      const slot1 = createTimeSlot(
        '2025-03-30T01:00:00',
        '2025-03-30T01:30:00',
        TIMEZONE
      );

      const slot2 = createTimeSlot(
        '2025-03-30T03:30:00',
        '2025-03-30T04:00:00',
        TIMEZONE
      );

      const overlaps = checkSlotOverlapWithDST(slot1, slot2, TIMEZONE);
      expect(overlaps).toBe(false);
    });

    it('should handle normal overlaps without DST transitions', () => {
      const slot1 = createTimeSlot(
        '2025-06-15T10:00:00',
        '2025-06-15T11:00:00',
        TIMEZONE
      );

      const slot2 = createTimeSlot(
        '2025-06-15T10:30:00',
        '2025-06-15T11:30:00',
        TIMEZONE
      );

      const overlaps = checkSlotOverlapWithDST(slot1, slot2, TIMEZONE);
      expect(overlaps).toBe(true);
    });
  });

  describe('validateSchedule', () => {
    it('should validate schedule with DST-safe slots', () => {
      const config: SchedulingConfig = {
        timezone: TIMEZONE,
        defaultDurationMinutes: 60,
        bufferMinutes: 0,
      };

      const slots = [
        createTimeSlot('2025-03-30T01:00:00', '2025-03-30T01:30:00', TIMEZONE),
        createTimeSlot('2025-03-30T03:30:00', '2025-03-30T04:00:00', TIMEZONE),
        createTimeSlot('2025-03-30T04:30:00', '2025-03-30T05:00:00', TIMEZONE),
      ];

      const validation = validateSchedule(slots, config);
      expect(validation.isValid).toBe(true);
      expect(validation.issues).toHaveLength(0);
    });

    it('should detect issues in schedule with DST conflicts', () => {
      const config: SchedulingConfig = {
        timezone: TIMEZONE,
        defaultDurationMinutes: 60,
        bufferMinutes: 0,
      };

      const slots = [
        createTimeSlot('2025-03-30T01:00:00', '2025-03-30T01:30:00', TIMEZONE),
        createTimeSlot('2025-03-30T02:30:00', '2025-03-30T03:30:00', TIMEZONE), // Problematic
        createTimeSlot('2025-03-30T03:00:00', '2025-03-30T04:00:00', TIMEZONE), // Overlaps
      ];

      const validation = validateSchedule(slots, config);
      expect(validation.isValid).toBe(false);
      expect(validation.issues.length).toBeGreaterThan(0);
    });
  });

  describe('timeSlotToISO', () => {
    it('should convert TimeSlot to ISO format for serialization', () => {
      const slot = createTimeSlot(
        '2025-03-30T01:00:00',
        '2025-03-30T01:30:00', // Use a safe time that doesn't cross DST
        TIMEZONE,
        'Test Venue'
      );

      const isoSlot = timeSlotToISO(slot);

      expect(isoSlot.start).toContain('2025-03-30T01:00:00');
      expect(isoSlot.end).toContain('2025-03-30T01:30:00');
      expect(isoSlot.timezone).toBe(TIMEZONE);
      expect(isoSlot.venue).toBe('Test Venue');
    });
  });

  describe('adjustForDSTGap', () => {
    it('should adjust invalid time during spring forward', () => {
      // Create a time that doesn't exist (2:30 AM on spring forward day)
      const invalidTime = DateTime.fromISO('2025-03-30T02:30:00', {
        zone: TIMEZONE,
      });
      const adjusted = adjustForDSTGap(invalidTime);

      // Should be adjusted to a valid time
      expect(adjusted.isValid).toBe(true);
    });

    it('should not adjust valid times', () => {
      const validTime = DateTime.fromISO('2025-03-30T01:30:00', {
        zone: TIMEZONE,
      });
      const adjusted = adjustForDSTGap(validTime);

      expect(adjusted.equals(validTime)).toBe(true);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle invalid timezone gracefully', () => {
      expect(() => {
        createDateTime(2025, 3, 30, 1, 0, 'Invalid/Timezone');
      }).toThrow();
    });

    it('should handle slots spanning multiple days with DST', () => {
      const slot = createTimeSlot(
        '2025-03-29T23:00:00',
        '2025-03-30T04:00:00', // Spans DST transition
        TIMEZONE
      );

      const validation = validateSlotDuringDST(slot, TIMEZONE);
      expect(validation.isValid).toBe(false);
    });

    it('should handle very short slots during DST transition', () => {
      const slot = createTimeSlot(
        '2025-03-30T02:00:00',
        '2025-03-30T02:01:00', // 1 minute in skipped hour
        TIMEZONE
      );

      const validation = validateSlotDuringDST(slot, TIMEZONE);
      expect(validation.isValid).toBe(false);
    });
  });

  describe('Performance and Boundary Tests', () => {
    it('should handle large date ranges efficiently', () => {
      const start = DateTime.fromISO('2020-01-01', { zone: TIMEZONE });
      const end = DateTime.fromISO('2030-12-31', { zone: TIMEZONE });

      const startTime = Date.now();
      const transitions = detectDSTTransitions(start, end, TIMEZONE);
      const endTime = Date.now();

      expect(transitions.length).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle many slots in schedule validation', () => {
      const config: SchedulingConfig = {
        timezone: TIMEZONE,
        defaultDurationMinutes: 60,
        bufferMinutes: 0,
      };

      const slots: TimeSlot[] = [];
      for (let i = 0; i < 100; i++) {
        const start = DateTime.fromISO('2025-06-15T08:00:00', {
          zone: TIMEZONE,
        }).plus({ hours: i });
        const end = start.plus({ minutes: 30 });
        slots.push(createTimeSlot(start.toISO()!, end.toISO()!, TIMEZONE));
      }

      const startTime = Date.now();
      const validation = validateSchedule(slots, config);
      const endTime = Date.now();

      expect(validation.isValid).toBe(true);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});
