import { Alert } from "../types/alert.types";
// !!DUMMY !! DUMMY
/**
 * Dummy alert data — replace with real API calls when the backend is ready.
 * Dates are relative to "today" (Sept 28, 2026) so the grouping labels stay
 * accurate during development.
 */
export const DUMMY_ALERTS: Alert[] = [
  // Today 
  {
    id: "alert-001",
    severity: "all_clear",
    status: "read",
    timeRange: "3:20 – 3:40 PM",
    date: "2026-09-28",
    isRead: true,
    snapshotUris: [
      // TODO: replace with real snapshot URIs from your camera API
      // "https://your-cdn.com/snapshots/alert-001-1.jpg",
    ],
    autoDeleteLabel: "Auto-deletes in 47h 12m",
    timeline: [
      { time: "3:40 PM", description: "All clear confirmed" },
      { time: "3:20 PM", description: "Monitoring started" },
    ],
    contactsNotified: false,
  },
  {
    id: "alert-002",
    severity: "possible_threat",
    status: "unread",
    timeRange: "9:00 – 9:20 AM",
    date: "2026-09-28",
    isRead: false,
    snapshotUris: [
      // TODO: replace with real snapshot URIs from your camera API
      // "https://your-cdn.com/snapshots/alert-002-1.jpg",
      // "https://your-cdn.com/snapshots/alert-002-2.jpg",
      // "https://your-cdn.com/snapshots/alert-002-3.jpg",
      // "https://your-cdn.com/snapshots/alert-002-4.jpg",
    ],
    autoDeleteLabel: "Auto-deletes in 47h 12m",
    timeline: [
      { time: "9:08 am", description: "Possible armed threat" },
      { time: "9:05 am", description: "Suspicious movement" },
      { time: "9:01 am", description: "Passenger boarded" },
    ],
    contactsNotified: false,
  },
  {
    id: "alert-003",
    severity: "metal_detected",
    status: "pending",
    timeRange: "11:10 – 11:35 AM",
    date: "2026-09-28",
    isRead: false,
    snapshotUris: [],
    autoDeleteLabel: "Auto-deletes in 47h 12m",
    timeline: [
      { time: "11:35 AM", description: "Metal object scan complete" },
      { time: "11:10 AM", description: "Metal object detected" },
    ],
    contactsNotified: false,
  },

  // Yesterday
  {
    id: "alert-004",
    severity: "all_clear",
    status: "read",
    timeRange: "3:20 – 3:40 PM",
    date: "2026-09-27",
    isRead: true,
    snapshotUris: [],
    autoDeleteLabel: "Auto-deletes in 23h 12m",
    timeline: [
      { time: "3:40 PM", description: "All clear confirmed" },
      { time: "3:20 PM", description: "Monitoring started" },
    ],
    contactsNotified: false,
  },
  {
    id: "alert-005",
    severity: "possible_threat",
    status: "false_alarm",
    timeRange: "9:00 – 9:20 AM",
    date: "2026-09-27",
    subLabel: "Marked as false alarm",
    isRead: true,
    snapshotUris: [],
    autoDeleteLabel: "Auto-deletes in 23h 12m",
    timeline: [
      { time: "9:08 am", description: "Possible armed threat" },
      { time: "9:05 am", description: "Suspicious movement" },
      { time: "9:01 am", description: "Passenger boarded" },
    ],
    contactsNotified: false,
  },
  {
    id: "alert-006",
    severity: "metal_detected",
    status: "unread",
    timeRange: "11:10 – 3:40 AM",
    date: "2026-09-27",
    isRead: false,
    snapshotUris: [],
    autoDeleteLabel: "Auto-deletes in 23h 12m",
    timeline: [
      { time: "11:35 AM", description: "Metal object scan complete" },
      { time: "11:10 AM", description: "Metal object detected" },
    ],
    contactsNotified: false,
  },

  // September 2
  {
    id: "alert-007",
    severity: "all_clear",
    status: "read",
    timeRange: "3:20 – 3:40 PM",
    date: "2026-09-02",
    isRead: true,
    snapshotUris: [],
    autoDeleteLabel: "Auto-deletes in 1h 12m",
    timeline: [
      { time: "3:40 PM", description: "All clear confirmed" },
      { time: "3:20 PM", description: "Monitoring started" },
    ],
    contactsNotified: false,
  },
];
