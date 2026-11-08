/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  MessageSquare,
  Calendar,
  DollarSign
} from 'lucide-react';
import { Booking } from '../../types.ts';

interface BookingHistoryProps {
  bookings: Booking[];
  onCancelBooking: (bookingId: string) => void;
  onUpdateBookingStatus: (bookingId: string, status: Booking['status']) => void;
  onTriggerNotification: (bookingId: string) => void;
}

export const BookingHistory: React.FC<BookingHistoryProps> = ({
  bookings,
  onCancelBooking,
  onUpdateBookingStatus,
  onTriggerNotification
}) => {
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [notificationSuccess, setNotificationSuccess] = useState<string | null>(null);

  const filtered = bookings.filter(b => {
    const matchesFilter = filter === 'all' || b.status === filter;
    const matchesSearch =
      b.id.toLowerCase().includes(search.toLowerCase()) ||
      b.customerName.toLowerCase().includes(search.toLowerCase()) ||
      b.customerPhone.toLowerCase().includes(search.toLowerCase()) ||
      b.serviceName.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleSendReminder = (bookingId: string) => {
    onTriggerNotification(bookingId);
    setNotificationSuccess(bookingId);
    setTimeout(() => setNotificationSuccess(null), 3000);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
      {/* Top Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Appointment Master Ledger</h3>
          <p className="text-xs text-slate-500">
            Audit history of all scheduled consultations, status changes, and notifications.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          {/* Segmented Filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs overflow-x-auto no-scrollbar scroll-smooth">
            {['all', 'confirmed', 'pending_payment', 'completed', 'cancelled'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1.5 sm:py-1 font-medium rounded-md transition-colors capitalize whitespace-nowrap min-h-[36px] sm:min-h-0 flex items-center justify-center shrink-0 ${
                  filter === f
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5 sm:top-2.5" />
            <input
              type="text"
              placeholder="Search reference, name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px] sm:min-h-0"
            />
          </div>
        </div>
      </div>

      {notificationSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>WhatsApp & Google Calendar synchronization re-dispatched for {notificationSuccess}.</span>
        </div>
      )}

      {/* Mobile Card List (< 768px) */}
      <div className="md:hidden space-y-3">
        {filtered.map((b) => (
          <div
            key={b.id}
            className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-xl space-y-2.5"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-mono text-[11px] font-bold text-slate-900">{b.id}</span>
                <h4 className="font-semibold text-xs text-slate-800">{b.serviceName}</h4>
              </div>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded capitalize ${
                  b.status === 'confirmed'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : b.status === 'pending_payment'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : b.status === 'cancelled'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {b.status.replace('_', ' ')}
              </span>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 text-xs space-y-1">
              <div className="flex justify-between text-slate-700 font-medium">
                <span>{b.customerName}</span>
                <span className="font-mono text-[11px] text-slate-500">{b.customerPhone}</span>
              </div>
              <div className="flex justify-between text-slate-600 text-[11px]">
                <span>{b.date} at {b.time} ({b.timezone || 'EAT'})</span>
                <span className="font-bold font-mono text-slate-900">${b.totalPrice}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-100 text-[11px]">
                <span className="text-slate-400">Payment:</span>
                <span
                  className={`font-mono ${
                    b.paymentStatus === 'verified_paid'
                      ? 'text-emerald-700 font-semibold'
                      : 'text-amber-700 font-medium'
                  }`}
                >
                  {b.paymentStatus === 'verified_paid' ? 'Paid ✓' : 'Pending'}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-end gap-2">
              <button
                onClick={() => handleSendReminder(b.id)}
                className="min-h-[40px] px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors shadow-2xs flex items-center justify-center"
              >
                Resend WA
              </button>
              {b.status !== 'cancelled' && (
                <button
                  onClick={() => onCancelBooking(b.id)}
                  className="min-h-[40px] px-3 py-1.5 text-xs font-semibold text-rose-600 bg-white border border-rose-200 hover:bg-rose-50 rounded-lg transition-colors shadow-2xs flex items-center justify-center"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop / Tablet Bookings Table (>= 768px) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[760px]">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <th className="py-2.5 px-3">Reference & Service</th>
              <th className="py-2.5 px-3">Client Information</th>
              <th className="py-2.5 px-3">Scheduled Slot</th>
              <th className="py-2.5 px-3">Fixed Fee</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3">Payment</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filtered.map((b) => (
              <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-3 px-3">
                  <div className="font-mono font-bold text-slate-900">{b.id}</div>
                  <div className="text-[11px] text-slate-500">{b.serviceName}</div>
                </td>
                <td className="py-3 px-3">
                  <div className="font-semibold text-slate-900">{b.customerName}</div>
                  <div className="font-mono text-[11px] text-slate-500">{b.customerPhone}</div>
                </td>
                <td className="py-3 px-3">
                  <div className="font-semibold text-slate-900">{b.date}</div>
                  <div className="font-mono text-[11px] text-slate-500">{b.time} ({b.timezone || 'PST'})</div>
                </td>
                <td className="py-3 px-3 font-mono font-bold text-slate-900">
                  ${b.totalPrice}
                </td>
                <td className="py-3 px-3">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded capitalize ${
                      b.status === 'confirmed'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : b.status === 'pending_payment'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : b.status === 'cancelled'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {b.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="py-3 px-3">
                  <span
                    className={`text-[10px] font-mono ${
                      b.paymentStatus === 'verified_paid'
                        ? 'text-emerald-700 font-semibold'
                        : 'text-amber-700 font-medium'
                    }`}
                  >
                    {b.paymentStatus === 'verified_paid' ? 'Paid ✓' : 'Pending'}
                  </span>
                </td>
                <td className="py-3 px-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => handleSendReminder(b.id)}
                      className="px-2 py-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                      title="Re-send WhatsApp Notification"
                    >
                      Resend WA
                    </button>
                    {b.status !== 'cancelled' && (
                      <button
                        onClick={() => onCancelBooking(b.id)}
                        className="px-2 py-1 text-[11px] font-medium text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded transition-colors"
                        title="Cancel per 24h Policy"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
