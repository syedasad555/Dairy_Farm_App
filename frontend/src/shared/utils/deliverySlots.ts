import { MORNING_SLOT, EVENING_SLOT } from '@/shared/constants';
import type { DeliverySlot, SlotAssignment } from '@/shared/types';

function formatScheduledDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getMorningSlotDate(orderTime: Date): Date {
  const scheduled = new Date(orderTime);
  scheduled.setHours(MORNING_SLOT.start, 0, 0, 0);
  if (orderTime.getHours() >= MORNING_SLOT.end) {
    scheduled.setDate(scheduled.getDate() + 1);
  }
  return scheduled;
}

function getEveningSlotDate(orderTime: Date): Date {
  const scheduled = new Date(orderTime);
  scheduled.setHours(EVENING_SLOT.start, 0, 0, 0);
  if (orderTime.getHours() >= EVENING_SLOT.end) {
    scheduled.setDate(scheduled.getDate() + 1);
  }
  return scheduled;
}

/**
 * Determines the nearest available delivery slot based on order time.
 * Morning: 04:00-08:00 | Evening: 16:00-20:00
 */
export function assignNearestDeliverySlot(orderTime: Date = new Date()): SlotAssignment {
  const hour = orderTime.getHours();

  // Before morning slot ends → morning today
  if (hour < MORNING_SLOT.end) {
    const scheduled = getMorningSlotDate(orderTime);
    return {
      slot: 'morning',
      slotLabel: MORNING_SLOT.label,
      scheduledDate: formatScheduledDate(scheduled),
      message: 'Your order has been scheduled for the nearest delivery slot.',
    };
  }

  // Between morning end and evening start → evening today
  if (hour >= MORNING_SLOT.end && hour < EVENING_SLOT.start) {
    const scheduled = getEveningSlotDate(orderTime);
    return {
      slot: 'evening',
      slotLabel: EVENING_SLOT.label,
      scheduledDate: formatScheduledDate(scheduled),
      message: 'Your order has been scheduled for the nearest delivery slot.',
    };
  }

  // After evening slot ends → morning next day
  const scheduled = getMorningSlotDate(orderTime);
  scheduled.setDate(scheduled.getDate() + 1);
  return {
    slot: 'morning',
    slotLabel: MORNING_SLOT.label,
    scheduledDate: formatScheduledDate(scheduled),
    message: 'Your order has been scheduled for the nearest delivery slot.',
  };
}

export function getSlotDisplayLabel(slot: DeliverySlot): string {
  return slot === 'morning' ? MORNING_SLOT.label : EVENING_SLOT.label;
}

export function isSlotActive(slot: DeliverySlot, now: Date = new Date()): boolean {
  const hour = now.getHours();
  if (slot === 'morning') {
    return hour >= MORNING_SLOT.start && hour < MORNING_SLOT.end;
  }
  return hour >= EVENING_SLOT.start && hour < EVENING_SLOT.end;
}
