"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignNearestDeliverySlot = assignNearestDeliverySlot;
exports.generateOrderNumber = generateOrderNumber;
const MORNING = { start: 4, end: 8, label: '04:00 AM - 08:00 AM' };
const EVENING = { start: 16, end: 20, label: '04:00 PM - 08:00 PM' };
function assignNearestDeliverySlot(orderTime = new Date()) {
    const hour = orderTime.getHours();
    const formatDate = (d) => d.toISOString().split('T')[0];
    if (hour < MORNING.end) {
        const scheduled = new Date(orderTime);
        scheduled.setHours(MORNING.start, 0, 0, 0);
        return { slot: 'morning', slotLabel: MORNING.label, scheduledDate: formatDate(scheduled) };
    }
    if (hour >= MORNING.end && hour < EVENING.start) {
        const scheduled = new Date(orderTime);
        scheduled.setHours(EVENING.start, 0, 0, 0);
        return { slot: 'evening', slotLabel: EVENING.label, scheduledDate: formatDate(scheduled) };
    }
    const scheduled = new Date(orderTime);
    scheduled.setDate(scheduled.getDate() + 1);
    scheduled.setHours(MORNING.start, 0, 0, 0);
    return { slot: 'morning', slotLabel: MORNING.label, scheduledDate: formatDate(scheduled) };
}
function generateOrderNumber(count) {
    return `MVR${String(count + 1).padStart(6, '0')}`;
}
//# sourceMappingURL=deliverySlots.js.map