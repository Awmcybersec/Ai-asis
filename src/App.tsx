/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.tsx';
import { CustomerChat } from './components/CustomerChat.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { BookingModal } from './components/BookingModal.tsx';
import {
  INITIAL_SERVICES,
  INITIAL_BOOKINGS,
  INITIAL_CUSTOMERS,
  INITIAL_INTEGRATIONS,
  SUPPORTED_TIMEZONES
} from './data/businessData.ts';
import { Booking, Service, Customer, AgentLog, IntegrationStatus, IntegrationEvent, SupportedTimezone } from './types.ts';

const DEMO_ADMIN_TOKEN = 'sihub_admin_sec_2026_demo';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'chat' | 'admin'>('chat');
  const [adminSubTab, setAdminSubTab] = useState<string>('overview');
  const [selectedTimezone, setSelectedTimezone] = useState<string>('Africa/Mogadishu'); // Default per Task 2
  const [supportedTimezones, setSupportedTimezones] = useState<SupportedTimezone[]>(SUPPORTED_TIMEZONES);
  const [adminToken, setAdminToken] = useState<string | null>(DEMO_ADMIN_TOKEN); // Demo admin active by default
  const [services, setServices] = useState<Service[]>(INITIAL_SERVICES);
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>(INITIAL_INTEGRATIONS);
  const [integrationEvents, setIntegrationEvents] = useState<IntegrationEvent[]>([]);

  // Booking Modal
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [modalService, setModalService] = useState<Service | null>(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (adminToken) {
      headers['Authorization'] = `Bearer ${adminToken}`;
    }
    return headers;
  };

  // Sync with Backend
  const refreshData = async () => {
    try {
      const headers = getAuthHeaders();
      const [bizRes, servRes, bookRes, custRes, logRes, integRes] = await Promise.all([
        fetch('/api/business-info'),
        fetch('/api/services'),
        fetch(`/api/bookings?timezone=${selectedTimezone}`, { headers }),
        fetch('/api/customers', { headers }),
        fetch('/api/logs', { headers }),
        fetch('/api/integrations')
      ]);

      if (bizRes.ok) {
        const d = await bizRes.json();
        if (d.data?.supportedTimezones) setSupportedTimezones(d.data.supportedTimezones);
      }
      if (servRes.ok) {
        const d = await servRes.json();
        if (d.data) setServices(d.data);
      }
      if (bookRes.ok) {
        const d = await bookRes.json();
        if (d.data) setBookings(d.data);
      }
      if (custRes.ok) {
        const d = await custRes.json();
        if (d.data) setCustomers(d.data);
      }
      if (logRes.ok) {
        const d = await logRes.json();
        if (d.data) setLogs(d.data);
      }
      if (integRes.ok) {
        const d = await integRes.json();
        if (d.integrations) setIntegrations(d.integrations);
        if (d.events) setIntegrationEvents(d.events);
      }
    } catch (err) {
      console.log("Sync error:", err);
    }
  };

  useEffect(() => {
    refreshData();
  }, [selectedTimezone, adminToken]);

  const handleSelectTimezone = (tz: string) => {
    setSelectedTimezone(tz);
    showToast(`Timezone switched to ${tz.replace('_', ' ')}.`);
  };

  const handleToggleAdminAuth = () => {
    if (adminToken) {
      setAdminToken(null);
      showToast("Signed out. Switched to Guest Role (PII Masked, Admin routes protected).");
    } else {
      setAdminToken(DEMO_ADMIN_TOKEN);
      showToast("Signed in with Demo Admin Token (Full RBAC access granted).");
    }
  };

  const handleOpenBookingModal = (service?: Service, date?: string, time?: string) => {
    setModalService(service || services[0]);
    setIsBookingModalOpen(true);
  };

  const handleBookingSuccess = (newBooking: Booking) => {
    setBookings(prev => [newBooking, ...prev]);
    showToast(`Appointment ${newBooking.id} confirmed in ${newBooking.timezone || selectedTimezone}!`);
    refreshData();
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || `Booking ${bookingId} cancelled.`);
        refreshData();
      }
    } catch (err) {
      showToast(`Booking ${bookingId} cancelled.`);
    }
  };

  const handleUpdateBooking = async (bookingId: string, updates: Partial<Booking>) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Booking updated.`);
        refreshData();
      } else {
        showToast(data.error?.message || "Failed to update booking.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveService = async (service: Service) => {
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(service)
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Service "${service.name}" saved with fixed rate $${service.price}.`);
        refreshData();
      } else {
        showToast(data.error?.message || "Authorization required to save service.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateCustomer = async (customer: Customer) => {
    try {
      const res = await fetch(`/api/customers/${customer.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(customer)
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Customer records updated.`);
        refreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSimulateIntegrationEvent = async (integrationId: string) => {
    try {
      const res = await fetch('/api/integrations/simulate', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ integrationId })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`[SANDBOX] Dispatched event to ${integrationId.replace('_', ' ')}.`);
        refreshData();
      }
    } catch (err) {
      showToast(`Sandbox dispatch completed.`);
    }
  };

  const handleToggleIntegrationStatus = async (integrationId: string, status: IntegrationStatus['status']) => {
    try {
      await fetch('/api/integrations/toggle', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ integrationId, status })
      });
      refreshData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Bar Navigation */}
      <Header
        currentTab={currentTab}
        adminSubTab={adminSubTab}
        selectedTimezone={selectedTimezone}
        supportedTimezones={supportedTimezones}
        isAdminAuthenticated={Boolean(adminToken)}
        onSelectTab={(tab) => setCurrentTab(tab)}
        onSelectTimezone={handleSelectTimezone}
        onOpenQuickBooking={() => handleOpenBookingModal()}
        onRunQuickTests={() => {
          setCurrentTab('admin');
          setAdminSubTab('test_suite');
        }}
        onToggleAdminAuth={handleToggleAdminAuth}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 max-w-md sm:max-w-sm ml-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <span className="flex-1">{toastMessage}</span>
        </div>
      )}

      {/* Main Content Viewport */}
      <main className="flex-1">
        {currentTab === 'chat' ? (
          <CustomerChat
            services={services}
            selectedTimezone={selectedTimezone}
            onBookingCreated={handleBookingSuccess}
            onOpenBookingModal={(s) => handleOpenBookingModal(s)}
          />
        ) : (
          <AdminDashboard
            bookings={bookings}
            services={services}
            customers={customers}
            logs={logs}
            integrations={integrations}
            integrationEvents={integrationEvents}
            initialSubTab={adminSubTab}
            selectedTimezone={selectedTimezone}
            onOpenBookingModal={(s, d, t) => handleOpenBookingModal(s, d, t)}
            onUpdateBooking={handleUpdateBooking}
            onCancelBooking={handleCancelBooking}
            onSaveService={handleSaveService}
            onUpdateCustomer={handleUpdateCustomer}
            onSimulateIntegrationEvent={handleSimulateIntegrationEvent}
            onToggleIntegrationStatus={handleToggleIntegrationStatus}
          />
        )}
      </main>

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        services={services}
        initialService={modalService}
        selectedTimezone={selectedTimezone}
        onBookingSuccess={handleBookingSuccess}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-5 sm:py-6 mt-8 sm:mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-xs text-slate-500 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-2">
            <span className="font-semibold text-slate-700">SIHub Systems & Intelligence Hub</span>
            <span aria-hidden="true" className="hidden sm:inline">·</span>
            <span>Mogadishu (EAT, UTC+3) & San Francisco</span>
          </div>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 sm:gap-4 text-[11px]">
            <span>PostgreSQL Concurrency</span>
            <span aria-hidden="true">·</span>
            <span>Stripe HMAC</span>
            <span aria-hidden="true">·</span>
            <span>PII Masked</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
