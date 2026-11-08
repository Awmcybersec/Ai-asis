/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  LayoutDashboard,
  Calendar,
  Layers,
  Users,
  FileText,
  Activity,
  Workflow,
  CheckCircle2,
  Terminal
} from 'lucide-react';
import { Booking, Service, Customer, AgentLog, IntegrationStatus, IntegrationEvent } from '../types.ts';
import { OverviewTab } from './admin/OverviewTab.tsx';
import { AppointmentCalendar } from './admin/AppointmentCalendar.tsx';
import { ServicesManagement } from './admin/ServicesManagement.tsx';
import { CustomerRecords } from './admin/CustomerRecords.tsx';
import { BookingHistory } from './admin/BookingHistory.tsx';
import { AgentLogs } from './admin/AgentLogs.tsx';
import { ApiIntegrationsHub } from './admin/ApiIntegrationsHub.tsx';
import { TestRunner } from './admin/TestRunner.tsx';

interface AdminDashboardProps {
  bookings: Booking[];
  services: Service[];
  customers: Customer[];
  logs: AgentLog[];
  integrations: IntegrationStatus[];
  integrationEvents: IntegrationEvent[];
  initialSubTab?: string;
  selectedTimezone: string;
  onOpenBookingModal: (service?: Service, date?: string, time?: string) => void;
  onUpdateBooking: (bookingId: string, updates: Partial<Booking>) => void;
  onCancelBooking: (bookingId: string) => void;
  onSaveService: (service: Service) => void;
  onUpdateCustomer: (customer: Customer) => void;
  onSimulateIntegrationEvent: (integrationId: string) => void;
  onToggleIntegrationStatus: (integrationId: string, status: IntegrationStatus['status']) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  bookings,
  services,
  customers,
  logs,
  integrations,
  integrationEvents,
  initialSubTab = 'overview',
  selectedTimezone,
  onOpenBookingModal,
  onUpdateBooking,
  onCancelBooking,
  onSaveService,
  onUpdateCustomer,
  onSimulateIntegrationEvent,
  onToggleIntegrationStatus
}) => {
  const [subTab, setSubTab] = useState<string>(initialSubTab);

  const navItems = [
    { id: 'overview', label: 'Executive Overview', icon: LayoutDashboard },
    { id: 'calendar', label: 'Appointment Calendar', icon: Calendar },
    { id: 'services', label: 'Services & Pricing', icon: Layers },
    { id: 'crm', label: 'CRM Records', icon: Users },
    { id: 'bookings', label: 'Booking History', icon: FileText },
    { id: 'logs', label: 'Agent Logs & Safety', icon: Activity },
    { id: 'integrations', label: 'API Integrations Hub', icon: Workflow },
    { id: 'test_suite', label: 'Benchmark Test Suite', icon: Terminal }
  ];

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div className="space-y-4 sm:space-y-6">
        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-200/70 rounded-xl overflow-x-auto no-scrollbar scroll-smooth shadow-2xs">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = subTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSubTab(item.id)}
                className={`flex items-center gap-2 px-3 py-2 sm:py-2 min-h-[40px] sm:min-h-0 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Viewport */}
        <div>
          {subTab === 'overview' && (
            <OverviewTab
              bookings={bookings}
              services={services}
              customers={customers}
              selectedTimezone={selectedTimezone}
              onNavigateTab={(tab) => setSubTab(tab)}
              onOpenBookingModal={() => onOpenBookingModal()}
              onRunTests={() => setSubTab('test_suite')}
            />
          )}

          {subTab === 'calendar' && (
            <AppointmentCalendar
              bookings={bookings}
              services={services}
              onUpdateBooking={onUpdateBooking}
              onCancelBooking={onCancelBooking}
              onOpenNewBookingForSlot={(date, time) => onOpenBookingModal(undefined, date, time)}
            />
          )}

          {subTab === 'services' && (
            <ServicesManagement
              services={services}
              onSaveService={onSaveService}
            />
          )}

          {subTab === 'crm' && (
            <CustomerRecords
              customers={customers}
              onUpdateCustomer={onUpdateCustomer}
            />
          )}

          {subTab === 'bookings' && (
            <BookingHistory
              bookings={bookings}
              onCancelBooking={onCancelBooking}
              onUpdateBookingStatus={(id, status) => onUpdateBooking(id, { status })}
              onTriggerNotification={(id) => onSimulateIntegrationEvent('whatsapp')}
            />
          )}

          {subTab === 'logs' && (
            <AgentLogs logs={logs} />
          )}

          {subTab === 'integrations' && (
            <ApiIntegrationsHub
              integrations={integrations}
              events={integrationEvents}
              onSimulateEvent={onSimulateIntegrationEvent}
              onToggleStatus={onToggleIntegrationStatus}
            />
          )}

          {subTab === 'test_suite' && (
            <TestRunner />
          )}
        </div>
      </div>
    </div>
  );
};
