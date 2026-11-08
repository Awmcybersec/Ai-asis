/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, Phone, Mail, CheckCircle2, AlertCircle, ShieldCheck, Globe } from 'lucide-react';
import { Service, Booking } from '../types.ts';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  services: Service[];
  initialService?: Service | null;
  selectedTimezone: string;
  onBookingSuccess: (booking: Booking) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  services,
  initialService,
  selectedTimezone,
  onBookingSuccess
}) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split('T')[0];

  const [selectedServiceId, setSelectedServiceId] = useState<string>(initialService?.id || services[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState<string>(defaultDateStr);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [slots, setSlots] = useState<{ time: string; available: boolean; bookingId?: string }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successBooking, setSuccessBooking] = useState<Booking | null>(null);

  useEffect(() => {
    if (initialService) {
      setSelectedServiceId(initialService.id);
    } else if (services.length > 0 && !selectedServiceId) {
      setSelectedServiceId(services[0].id);
    }
  }, [initialService, services]);

  // Fetch slots whenever date or timezone changes
  useEffect(() => {
    if (!selectedDate || !isOpen) return;
    setLoadingSlots(true);
    setSelectedTime('');
    setError(null);

    fetch(`/api/availability?date=${selectedDate}&serviceId=${selectedServiceId}&timezone=${selectedTimezone}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.slots) {
          setSlots(data.slots);
          const firstAvailable = data.slots.find((s: any) => s.available);
          if (firstAvailable) {
            setSelectedTime(firstAvailable.time);
          }
        } else {
          setSlots([]);
        }
      })
      .catch(err => {
        console.error("Failed to load slots:", err);
        setSlots([]);
      })
      .finally(() => setLoadingSlots(false));
  }, [selectedDate, selectedServiceId, selectedTimezone, isOpen]);

  if (!isOpen) return null;

  const currentService = services.find(s => s.id === selectedServiceId) || services[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !selectedDate || !selectedTime) {
      setError("Please complete all required fields (Name, Phone, Date, Time).");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: currentService.id,
          customerName: name,
          customerEmail: email || `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
          customerPhone: phone,
          date: selectedDate,
          time: selectedTime,
          timezone: selectedTimezone,
          notes
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || data.error || "Failed to create appointment");
      }

      setSuccessBooking(data.data);
      onBookingSuccess(data.data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during booking.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                {successBooking ? "Booking Confirmed" : "Book Enterprise Consultation"}
              </h3>
              <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                {selectedTimezone.replace('_', ' ')}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
              {successBooking ? "Synced to Google Calendar & WhatsApp sandbox" : "PostgreSQL transaction & database unique constraint active"}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close booking modal"
            className="w-10 h-10 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        {successBooking ? (
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Confirmed</span>
              <h4 className="text-base sm:text-lg font-bold text-slate-900">{successBooking.serviceName}</h4>
              <p className="text-xs font-mono text-slate-500">Reference: {successBooking.id}</p>
            </div>

            <div className="bg-slate-50 rounded-xl p-3.5 sm:p-4 border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Client Name:</span>
                <span className="font-semibold text-slate-900">{successBooking.customerName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Schedule & Timezone:</span>
                <span className="font-semibold text-slate-900 text-right">
                  {successBooking.date} at {successBooking.time} ({successBooking.timezone || selectedTimezone})
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Total Fixed Fee:</span>
                <span className="font-bold font-mono text-slate-900">${successBooking.totalPrice} USD</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Payment Status:</span>
                <span className="font-medium text-emerald-600">Verified Paid (Sandbox)</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">WhatsApp Alert:</span>
                <span className="font-medium text-slate-700">Dispatched (Sandbox Mode)</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full min-h-[44px] py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm rounded-xl transition-colors shadow-xs flex items-center justify-center"
            >
              Done & Return to Assistant
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Service Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Select Service & Fixed Price
              </label>
              <select
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
                className="w-full min-h-[44px] sm:min-h-0 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {services.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} — ${s.price} ({s.durationMinutes} mins)
                  </option>
                ))}
              </select>
            </div>

            {/* Date and Time Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Consultation Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full min-h-[44px] sm:min-h-0 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Available Slot ({selectedTimezone.includes('Mogadishu') ? 'EAT' : 'Local'})
                </label>
                {loadingSlots ? (
                  <div className="min-h-[44px] sm:h-9 bg-slate-100 rounded-xl animate-pulse flex items-center justify-center text-[11px] text-slate-400">
                    Checking database slots...
                  </div>
                ) : (
                  <select
                    value={selectedTimeTimeOrDefault(selectedTime, slots)}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="w-full min-h-[44px] sm:min-h-0 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {slots.map(s => (
                      <option key={s.time} value={s.time} disabled={!s.available}>
                        {s.time} {s.available ? "(Open)" : `(Booked - ${s.bookingId || 'Taken'})`}
                      </option>
                    ))}
                    {slots.length === 0 && (
                      <option disabled>Closed on this day</option>
                    )}
                  </select>
                )}
              </div>
            </div>

            {/* Customer Details */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Thorne"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full min-h-[44px] sm:min-h-0 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number (with Country Code) *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+252 61 555 4231 or +1 415 555 0192"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full min-h-[44px] sm:min-h-0 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Work Email
                  </label>
                  <input
                    type="email"
                    placeholder="alex@thorne.tech"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full min-h-[44px] sm:min-h-0 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Consultation Goals / Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Briefly describe what you'd like to achieve..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
            </div>

            {/* Summary Box */}
            <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="font-semibold text-indigo-950">Fixed Price Guarantee</span>
              </div>
              <span className="font-bold font-mono text-indigo-900">${currentService?.price} USD</span>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] sm:min-h-0 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors flex items-center justify-center"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !selectedTime}
                className="min-h-[44px] sm:min-h-0 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 rounded-xl transition-colors shadow-xs flex items-center justify-center"
              >
                {submitting ? "Verifying..." : "Confirm Booking"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

function selectedTimeTimeOrDefault(selectedTime: string, slots: { time: string; available: boolean }[]): string {
  if (selectedTime) return selectedTime;
  const first = slots.find(s => s.available);
  return first ? first.time : '';
}
