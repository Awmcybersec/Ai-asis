/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  User,
  Phone,
  Mail,
  ShieldCheck,
  X,
  AlertTriangle,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { Booking, Service } from '../../types.ts';

interface AppointmentCalendarProps {
  bookings: Booking[];
  services: Service[];
  onUpdateBooking: (bookingId: string, updates: Partial<Booking>) => void;
  onCancelBooking: (bookingId: string) => void;
  onOpenNewBookingForSlot: (date: string, time: string) => void;
}

export const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({
  bookings,
  services,
  onUpdateBooking,
  onCancelBooking,
  onOpenNewBookingForSlot
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week'>('week');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Auto-detect mobile screen and default to Day view for optimal reading
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setViewMode('day');
    }
  }, []);

  const hours = [
    "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"
  ];

  // Helper to get week days
  const getDaysOfWeek = (baseDate: Date): Date[] => {
    const days: Date[] = [];
    const curr = new Date(baseDate);
    const firstDay = curr.getDate() - curr.getDay() + 1; // Monday start
    for (let i = 0; i < 6; i++) { // Mon - Sat (SIHub open days)
      const d = new Date(curr.setDate(firstDay + i));
      days.push(new Date(d));
    }
    return days;
  };

  const weekDays = getDaysOfWeek(currentDate);

  const handlePrev = () => {
    const d = new Date(currentDate);
    if (viewMode === 'day') {
      d.setDate(d.getDate() - 1);
    } else {
      d.setDate(d.getDate() - 7);
    }
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (viewMode === 'day') {
      d.setDate(d.getDate() + 1);
    } else {
      d.setDate(d.getDate() + 7);
    }
    setCurrentDate(d);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const formatDateStr = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const daysToRender = viewMode === 'day' ? [currentDate] : weekDays;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
      {/* Calendar Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-slate-100">
        <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2.5 sm:gap-3">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors min-h-[36px] sm:min-h-0 flex items-center justify-center ${
                viewMode === 'day' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Day View
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors min-h-[36px] sm:min-h-0 flex items-center justify-center ${
                viewMode === 'week' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Week View
            </button>
          </div>

          <h3 className="text-sm font-bold text-slate-900">
            {currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </h3>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2">
          <button
            onClick={handleToday}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors min-h-[44px] sm:min-h-0 flex items-center justify-center"
          >
            Today
          </button>
          <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-0.5">
            <button
              onClick={handlePrev}
              className="p-2 sm:p-1 hover:bg-slate-100 text-slate-600 rounded min-h-[44px] sm:min-h-0 min-w-[44px] sm:min-w-0 flex items-center justify-center"
              title="Previous"
              aria-label="Previous Day or Week"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="p-2 sm:p-1 hover:bg-slate-100 text-slate-600 rounded min-h-[44px] sm:min-h-0 min-w-[44px] sm:min-w-0 flex items-center justify-center"
              title="Next"
              aria-label="Next Day or Week"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid Container */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[700px]">
          <thead>
            <tr>
              <th className="w-20 p-2 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                Time (PST)
              </th>
              {daysToRender.map((day, idx) => {
                const dateStr = formatDateStr(day);
                const isToday = formatDateStr(new Date()) === dateStr;
                return (
                  <th
                    key={idx}
                    className={`p-2.5 text-center border-b border-slate-100 text-xs ${
                      isToday ? 'bg-indigo-50/50' : ''
                    }`}
                  >
                    <div className="font-semibold text-slate-900">
                      {day.toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div className={`text-[11px] font-mono ${isToday ? 'text-indigo-600 font-bold' : 'text-slate-500'}`}>
                      {day.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {hours.map((time) => (
              <tr key={time} className="hover:bg-slate-50/40">
                <td className="p-2.5 text-[11px] font-mono font-medium text-slate-500 border-r border-slate-100">
                  {time}
                </td>
                {daysToRender.map((day, idx) => {
                  const dateStr = formatDateStr(day);
                  const matchedBooking = bookings.find(
                    b => b.date === dateStr && b.time === time && b.status !== 'cancelled'
                  );

                  return (
                    <td
                      key={idx}
                      className="p-1.5 border-r border-slate-100 last:border-r-0 align-top h-16 min-w-[120px]"
                    >
                      {matchedBooking ? (
                        <div
                          onClick={() => setSelectedBooking(matchedBooking)}
                          className={`p-2 rounded-xl text-left cursor-pointer transition-all hover:scale-[1.02] shadow-2xs ${
                            matchedBooking.status === 'confirmed'
                              ? 'bg-indigo-50 border border-indigo-200 text-indigo-950'
                              : matchedBooking.status === 'pending_payment'
                              ? 'bg-amber-50 border border-amber-200 text-amber-950'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          <div className="font-bold text-[11px] truncate">
                            {matchedBooking.customerName}
                          </div>
                          <div className="text-[10px] text-slate-600 truncate">
                            {matchedBooking.serviceName}
                          </div>
                          <div className="flex items-center justify-between text-[9px] mt-1 text-slate-500 font-mono">
                            <span>{matchedBooking.time}</span>
                            <span>${matchedBooking.totalPrice}</span>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => onOpenNewBookingForSlot(dateStr, time)}
                          className="w-full h-full min-h-[44px] rounded-lg border border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30 flex items-center justify-center text-[11px] text-slate-400 hover:text-indigo-600 transition-colors"
                        >
                          + Open
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Booking Details Dialog */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl overflow-hidden p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-400">{selectedBooking.id}</span>
                <h4 className="text-base font-bold text-slate-900">{selectedBooking.serviceName}</h4>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                aria-label="Close dialog"
                className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 sm:p-4 bg-slate-50 rounded-xl space-y-2 text-xs text-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Client:</span>
                <span className="font-bold text-slate-900">{selectedBooking.customerName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Phone:</span>
                <span className="font-mono">{selectedBooking.customerPhone}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Email:</span>
                <span className="font-mono">{selectedBooking.customerEmail}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Schedule:</span>
                <span className="font-bold text-slate-900">{selectedBooking.date} at {selectedBooking.time} ({selectedBooking.timezone || 'PST'})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Price:</span>
                <span className="font-bold font-mono text-slate-900">${selectedBooking.totalPrice} USD</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Payment Status:</span>
                <span className="font-semibold text-emerald-600">{selectedBooking.paymentStatus}</span>
              </div>
              {selectedBooking.notes && (
                <div className="pt-2 border-t border-slate-200/60">
                  <span className="text-slate-500 block mb-1">Notes:</span>
                  <p className="text-[11px] text-slate-600 italic">{selectedBooking.notes}</p>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
              <button
                onClick={() => {
                  onCancelBooking(selectedBooking.id);
                  setSelectedBooking(null);
                }}
                className="w-full sm:flex-1 min-h-[44px] py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors flex items-center justify-center"
              >
                Cancel per 24h Policy
              </button>
              <button
                onClick={() => setSelectedBooking(null)}
                className="w-full sm:flex-1 min-h-[44px] py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors flex items-center justify-center"
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
