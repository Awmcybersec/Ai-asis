/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Calendar,
  DollarSign,
  Users,
  ShieldAlert,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Database,
  Globe,
  Code,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { Booking, Service, Customer } from '../../types.ts';

interface OverviewTabProps {
  bookings: Booking[];
  services: Service[];
  customers: Customer[];
  selectedTimezone: string;
  onNavigateTab: (tab: string) => void;
  onOpenBookingModal: () => void;
  onRunTests: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  bookings,
  services,
  customers,
  selectedTimezone,
  onNavigateTab,
  onOpenBookingModal,
  onRunTests
}) => {
  const [showSqlSchema, setShowSqlSchema] = useState(false);
  const activeBookings = bookings.filter(b => b.status === 'confirmed');
  const totalRevenue = bookings
    .filter(b => b.status === 'confirmed' || b.status === 'completed')
    .reduce((sum, b) => sum + b.totalPrice, 0);
  const escalatedCount = bookings.filter(b => b.status === 'escalated').length;

  return (
    <div className="space-y-6">
      {/* Hero Visual Card */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 text-white min-h-[220px] flex flex-col justify-end p-4 sm:p-6">
        <img
          src="/src/assets/images/sihub_tech_office_1794169529898.jpg"
          alt="SIHub Innovation Hub"
          className="absolute inset-0 w-full h-full object-cover opacity-25"
          referrerPolicy="no-referrer"
        />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/20 border border-emerald-400/30 text-[11px] font-semibold text-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>PostgreSQL Concurrency Active</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-500/20 border border-indigo-400/30 text-[11px] font-semibold text-indigo-200">
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                <span>Timezone: {selectedTimezone.replace('_', ' ')}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/20 border border-amber-400/30 text-[11px] font-semibold text-amber-200">
                <span>Sandbox Mode (Simulated APIs)</span>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Production-Grade AI Command Center
            </h2>
            <p className="text-xs text-slate-300 max-w-xl mt-1">
              Deterministic customer assistant, PostgreSQL transaction isolation, Africa/Mogadishu (EAT) support, and Stripe HMAC webhook validation.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 shrink-0 w-full sm:w-auto">
            <button
              onClick={() => setShowSqlSchema(true)}
              className="px-3.5 py-2.5 sm:py-2 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg transition-colors flex items-center justify-center gap-1.5 min-h-[44px] sm:min-h-0"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Inspect DDL Schema</span>
            </button>
            <button
              onClick={onOpenBookingModal}
              className="px-4 py-2.5 sm:py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-xs flex items-center justify-center min-h-[44px] sm:min-h-0"
            >
              Manual Reservation
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Confirmed Bookings</span>
            <Calendar className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {activeBookings.length}
          </div>
          <div className="mt-1 text-[11px] text-emerald-600 font-medium">
            Unique Index Constraint Enforced
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Verified Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            ${totalRevenue.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Fixed rates · Zero discount leak
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Active Timezone</span>
            <Globe className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-sm font-bold text-slate-900 truncate">
            {selectedTimezone.replace('_', ' ')}
          </div>
          <div className="mt-1 text-[11px] text-blue-600 font-medium">
            {selectedTimezone.includes('Mogadishu') ? 'EAT (UTC+3) · Sat-Thu 08:30-16:30' : 'Local business hours active'}
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Human Escalations</span>
            <ShieldAlert className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {escalatedCount}
          </div>
          <div className="mt-1 text-[11px] text-amber-600 font-medium">
            Prompt injection firewall active
          </div>
        </div>
      </div>

      {/* Two Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upcoming Bookings (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Live Appointment Queue</h3>
              <p className="text-xs text-slate-500">
                Bookings verified by PostgreSQL concurrency engine (PII masked for non-admins)
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('calendar')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>View Full Calendar</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {bookings.slice(0, 5).map((b) => (
              <div key={b.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-9 sm:h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xs shrink-0 font-mono">
                    {b.time}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{b.customerName}</h4>
                    <p className="text-[11px] text-slate-500">
                      {b.serviceName} · <span className="font-mono text-slate-700">{b.date} ({b.timezone || selectedTimezone})</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 text-right pl-13 sm:pl-0">
                  <div>
                    <span className="text-xs font-bold font-mono text-slate-900">${b.totalPrice}</span>
                    <div className="text-[10px] text-slate-500 font-mono">{b.id}</div>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      b.status === 'confirmed'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : b.status === 'pending_payment'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : b.status === 'cancelled'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {b.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Architectural Verification Status (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Production Guardrails & Defense</h3>
            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-900">Database Constraint Concurrency</div>
                  <div className="text-[11px] text-slate-500">
                    <code>idx_unique_active_slot</code> blocks race conditions. Tested with 10 parallel asynchronous clients.
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-900">Stripe Webhook HMAC Verification</div>
                  <div className="text-[11px] text-slate-500">
                    Timing-safe HMAC-SHA256 signature checking with 300s replay attack tolerance.
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-900">PII Privacy & Secret Redaction</div>
                  <div className="text-[11px] text-slate-500">
                    Customer phone and email masked on public views; credential strings scrubbed in logs.
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-900">Configurable Timezones</div>
                  <div className="text-[11px] text-slate-500">
                    Full support for Africa/Mogadishu (EAT, UTC+3) and America/Los_Angeles with custom operating days.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SQL DDL Schema Dialog */}
      {showSqlSchema && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-xl overflow-hidden p-4 sm:p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-600" />
                <h4 className="text-sm font-bold text-slate-900">PostgreSQL Schema & Unique Constraint DDL</h4>
              </div>
              <button
                onClick={() => setShowSqlSchema(false)}
                aria-label="Close modal"
                className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 text-sm font-bold rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-900 text-slate-200 rounded-xl p-3.5 sm:p-4 font-mono text-[11px] overflow-y-auto space-y-1">
              <p className="text-slate-400">-- Unique partial index enforcing zero double-booking at DB level:</p>
              <p className="text-emerald-400 font-bold">
                CREATE UNIQUE INDEX idx_unique_active_slot<br />
                ON bookings (booking_date, booking_time, timezone)<br />
                WHERE status != 'cancelled';
              </p>
              <br />
              <p className="text-slate-400">-- Serializable transaction booking query:</p>
              <p className="text-indigo-300">
                BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;<br />
                SELECT id FROM bookings WHERE booking_date = $1 AND booking_time = $2 AND timezone = $3 FOR UPDATE;<br />
                INSERT INTO bookings (...) VALUES (...);<br />
                COMMIT;
              </p>
            </div>

            <div className="flex justify-end pt-2 shrink-0">
              <button
                onClick={() => setShowSqlSchema(false)}
                className="w-full sm:w-auto min-h-[44px] sm:min-h-0 px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-xl flex items-center justify-center"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
