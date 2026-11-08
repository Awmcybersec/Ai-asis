/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, Mail, Phone, Building, Calendar, DollarSign, Edit3, X, UserCheck } from 'lucide-react';
import { Customer } from '../../types.ts';

interface CustomerRecordsProps {
  customers: Customer[];
  onUpdateCustomer: (customer: Customer) => void;
}

export const CustomerRecords: React.FC<CustomerRecordsProps> = ({
  customers,
  onUpdateCustomer
}) => {
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [notes, setNotes] = useState('');

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.toLowerCase().includes(search.toLowerCase()) ||
    (c.company && c.company.toLowerCase().includes(search.toLowerCase()))
  );

  const handleEditNotes = (customer: Customer) => {
    setSelectedCustomer(customer);
    setNotes(customer.notes);
  };

  const handleSaveNotes = () => {
    if (selectedCustomer) {
      const updated = { ...selectedCustomer, notes };
      onUpdateCustomer(updated);
      setSelectedCustomer(null);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900">CRM Customer Database</h3>
          <p className="text-xs text-slate-500">
            Unified client profiles synced across AI chat, calendar, and payment systems.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5 sm:top-2.5" />
          <input
            type="text"
            placeholder="Search name, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full min-h-[44px] sm:min-h-0 bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Mobile Card List (< 768px) */}
      <div className="md:hidden space-y-3">
        {filtered.map((cust) => (
          <div
            key={cust.id}
            className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-xl space-y-2.5"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-bold text-sm text-slate-900">{cust.name}</h4>
                <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                  <Building className="w-3 h-3 text-slate-400" />
                  <span>{cust.company || 'Private Client'}</span>
                </div>
              </div>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                  cust.tier === 'Enterprise'
                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                    : cust.tier === 'Scale'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {cust.tier}
              </span>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 text-xs space-y-1">
              <div className="flex justify-between text-slate-600">
                <span className="text-slate-400">Email:</span>
                <span className="font-mono text-[11px]">{cust.email}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span className="text-slate-400">Phone:</span>
                <span className="font-mono text-[11px]">{cust.phone}</span>
              </div>
              <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-100">
                <span className="text-slate-400">Value / Sessions:</span>
                <span className="font-semibold text-slate-900 font-mono">
                  ${cust.totalSpend.toLocaleString()} · {cust.bookingCount} session{cust.bookingCount > 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {cust.notes && (
              <p className="text-[11px] text-slate-500 italic bg-slate-100/60 p-2 rounded">
                Notes: {cust.notes}
              </p>
            )}

            <div className="pt-2 border-t border-slate-200/60 flex justify-end">
              <button
                onClick={() => handleEditNotes(cust)}
                className="min-h-[40px] px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit CRM Notes</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop / Tablet Customer Table (>= 768px) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <th className="py-2.5 px-3">Customer & Company</th>
              <th className="py-2.5 px-3">Contact</th>
              <th className="py-2.5 px-3">Tier</th>
              <th className="py-2.5 px-3">Lifetime Value</th>
              <th className="py-2.5 px-3">Bookings</th>
              <th className="py-2.5 px-3">Internal Notes</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filtered.map((cust) => (
              <tr key={cust.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-3 px-3">
                  <div className="font-bold text-slate-900">{cust.name}</div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Building className="w-3 h-3 text-slate-400" />
                    <span>{cust.company || 'Private Client'}</span>
                  </div>
                </td>
                <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                  <div>{cust.email}</div>
                  <div className="text-slate-400">{cust.phone}</div>
                </td>
                <td className="py-3 px-3">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      cust.tier === 'Enterprise'
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : cust.tier === 'Scale'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {cust.tier}
                  </span>
                </td>
                <td className="py-3 px-3 font-mono font-bold text-slate-900">
                  ${cust.totalSpend.toLocaleString()}
                </td>
                <td className="py-3 px-3 font-mono text-slate-700">
                  {cust.bookingCount} session{cust.bookingCount > 1 ? 's' : ''}
                </td>
                <td className="py-3 px-3 max-w-[200px]">
                  <p className="text-[11px] text-slate-600 truncate" title={cust.notes}>
                    {cust.notes || '—'}
                  </p>
                </td>
                <td className="py-3 px-3 text-right">
                  <button
                    onClick={() => handleEditNotes(cust)}
                    className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                    title="Edit Notes"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Notes Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl overflow-hidden p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Customer CRM Notes</h4>
                <p className="text-xs text-slate-500">{selectedCustomer.name} ({selectedCustomer.company || 'Client'})</p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                aria-label="Close modal"
                className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700">
                Staff & Consultation Notes
              </label>
              <textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            <div className="pt-2 flex flex-col sm:flex-row justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="w-full sm:w-auto min-h-[44px] sm:min-h-0 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl flex items-center justify-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNotes}
                className="w-full sm:w-auto min-h-[44px] sm:min-h-0 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs flex items-center justify-center"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
