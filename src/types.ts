/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type BookingStatus = 'confirmed' | 'pending_payment' | 'cancelled' | 'escalated' | 'completed';

export interface Service {
  id: string;
  name: string;
  category: 'AI & Machine Learning' | 'Cloud & Architecture' | 'Security & Audit' | 'Engineering Sprint';
  durationMinutes: number;
  price: number; // in USD - fixed price, never invented
  description: string;
  deliverables: string[];
  prerequisites: string;
  isActive: boolean;
  recommendedFor: string;
}

export interface TimeSlot {
  time: string; // e.g. "09:00", "10:30"
  available: boolean;
  bookingId?: string;
  clientName?: string;
}

export interface DaySchedule {
  date: string; // YYYY-MM-DD
  dayOfWeek: string;
  isOpen: boolean;
  slots: TimeSlot[];
}

export interface Booking {
  id: string; // e.g. "SIH-2026-8492"
  serviceId: string;
  serviceName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  date: string; // YYYY-MM-DD
  time: string; // e.g. "10:00"
  timezone?: string; // e.g. "Africa/Mogadishu" or "America/Los_Angeles"
  durationMinutes: number;
  totalPrice: number;
  status: BookingStatus;
  paymentStatus: 'unpaid' | 'pending' | 'verified_paid';
  paymentLink?: string;
  notes?: string;
  createdAt: string;
  escalationReason?: string;
  calendarEventId?: string;
  whatsappNotificationSent?: boolean;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  tier: 'Enterprise' | 'Scale' | 'Standard';
  totalSpend: number;
  bookingCount: number;
  lastBookingDate?: string;
  notes: string;
  createdAt: string;
}

export interface AgentLog {
  id: string;
  timestamp: string;
  customerId?: string;
  customerName?: string;
  userPrompt: string;
  agentResponse: string;
  actionTaken: 'inquiry' | 'slot_check' | 'booking_created' | 'booking_cancelled' | 'discount_denied' | 'escalated';
  guardrailsTriggered: {
    priceVerification: 'passed' | 'violation_blocked';
    doubleBookingCheck: 'passed' | 'collision_prevented';
    discountPolicyEnforced: boolean;
    promptInjectionDetected: boolean;
    escalatedToHuman: boolean;
  };
  sentiment: 'positive' | 'neutral' | 'frustrated' | 'suspicious';
  latencyMs: number;
  correlationId?: string;
}

export interface IntegrationStatus {
  id: 'google_calendar' | 'crm' | 'payment_gateway' | 'whatsapp';
  name: string;
  category: string;
  status: 'connected' | 'mock_active' | 'disconnected';
  isSandbox: boolean; // Explicit flag separating sandbox from live production
  productionVerified: boolean;
  lastSync?: string;
  eventsCount: number;
  description: string;
  docsUrl: string;
  requiredEnvVars: string[];
  disclaimer: string;
}

export interface IntegrationEvent {
  id: string;
  integrationId: 'google_calendar' | 'crm' | 'payment_gateway' | 'whatsapp';
  type: string;
  timestamp: string;
  status: 'dispatched' | 'received' | 'failed';
  isSimulated: boolean; // Explicitly indicates whether it was dispatched in sandbox
  payloadSummary: string;
  details: Record<string, any>;
}

export interface SupportedTimezone {
  id: string;
  label: string;
  offset: string;
  region: string;
  businessDays: string;
  hours: string;
  operatingHours: {
    [key: string]: { open: string; close: string; isOpen: boolean };
  };
}

export interface BusinessInfo {
  name: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  timezone: string;
  supportedTimezones: SupportedTimezone[];
  operatingHours: {
    [key: string]: { open: string; close: string; isOpen: boolean };
  };
  policies: {
    cancellation: string;
    discount: string;
    payments: string;
    humanEscalation: string;
  };
}

export interface TestScenario {
  id: number;
  title: string;
  objective: string;
  customerPrompt: string;
  simulatedContext?: {
    conflictingSlot?: { date: string; time: string };
    bookingId?: string;
  };
  expectedResult: string;
  actualResult?: string;
  status?: 'passed' | 'failed' | 'running' | 'idle';
  guardrailTriggered?: string;
  latencyMs?: number;
  verificationNotes?: string;
}
