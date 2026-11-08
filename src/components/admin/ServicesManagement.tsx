/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Plus, Edit2, CheckCircle2, Clock, DollarSign, ShieldAlert, X } from 'lucide-react';
import { Service } from '../../types.ts';

interface ServicesManagementProps {
  services: Service[];
  onSaveService: (service: Service) => void;
}

export const ServicesManagement: React.FC<ServicesManagementProps> = ({
  services,
  onSaveService
}) => {
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleOpenEdit = (service: Service) => {
    setEditingService({ ...service });
    setIsCreating(false);
  };

  const handleOpenCreate = () => {
    setEditingService({
      id: `sih-serv-${Date.now()}`,
      name: '',
      category: 'AI & Machine Learning',
      durationMinutes: 60,
      price: 300,
      description: '',
      deliverables: ['Detailed Strategy Plan', 'Executive Summary'],
      prerequisites: 'Initial technology overview',
      isActive: true,
      recommendedFor: 'Growth-stage companies'
    });
    setIsCreating(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingService && editingService.name && editingService.price > 0) {
      onSaveService(editingService);
      setEditingService(null);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Services & Authorized Pricing</h3>
          <p className="text-xs text-slate-500">
            Centrally governed rates referenced deterministically by the AI Business Assistant.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors shadow-2xs min-h-[44px] sm:min-h-0 w-full sm:w-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add New Service</span>
        </button>
      </div>

      {/* Mobile Card List (< 768px) */}
      <div className="md:hidden space-y-3">
        {services.map((service) => (
          <div
            key={service.id}
            className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-xl space-y-2.5"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-bold text-sm text-slate-900">{service.name}</h4>
                <span className="inline-block text-[10px] font-semibold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded mt-1">
                  {service.category}
                </span>
              </div>
              <span className="text-base font-bold font-mono text-slate-900 shrink-0">
                ${service.price} USD
              </span>
            </div>

            <p className="text-xs text-slate-600 line-clamp-2">{service.description}</p>

            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono text-slate-600 text-[11px]">{service.durationMinutes} mins</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Active</span>
                </span>
              </div>

              <button
                onClick={() => handleOpenEdit(service)}
                className="min-h-[40px] px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop / Tablet Services Table (>= 768px) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <th className="py-2.5 px-3">Service Name & Scope</th>
              <th className="py-2.5 px-3">Category</th>
              <th className="py-2.5 px-3">Duration</th>
              <th className="py-2.5 px-3">Fixed Rate</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {services.map((service) => (
              <tr key={service.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-3 px-3">
                  <div className="font-bold text-slate-900">{service.name}</div>
                  <div className="text-[11px] text-slate-500 line-clamp-1">{service.description}</div>
                </td>
                <td className="py-3 px-3">
                  <span className="text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                    {service.category}
                  </span>
                </td>
                <td className="py-3 px-3 font-mono text-slate-600">
                  {service.durationMinutes} mins
                </td>
                <td className="py-3 px-3 font-mono font-bold text-slate-900">
                  ${service.price} USD
                </td>
                <td className="py-3 px-3">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Active</span>
                  </span>
                </td>
                <td className="py-3 px-3 text-right">
                  <button
                    onClick={() => handleOpenEdit(service)}
                    className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                    title="Edit Service"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit / Create Modal */}
      {editingService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden p-4 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-900">
                {isCreating ? "Create Authorized Service" : "Edit Service Pricing & Specifications"}
              </h4>
              <button
                onClick={() => setEditingService(null)}
                aria-label="Close modal"
                className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Service Title</label>
                <input
                  type="text"
                  required
                  value={editingService.name}
                  onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                  className="w-full min-h-[44px] sm:min-h-0 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fixed Rate (USD)</label>
                  <input
                    type="number"
                    required
                    min={50}
                    value={editingService.price}
                    onChange={(e) => setEditingService({ ...editingService, price: Number(e.target.value) })}
                    className="w-full min-h-[44px] sm:min-h-0 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    required
                    min={15}
                    step={15}
                    value={editingService.durationMinutes}
                    onChange={(e) => setEditingService({ ...editingService, durationMinutes: Number(e.target.value) })}
                    className="w-full min-h-[44px] sm:min-h-0 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Detailed Description</label>
                <textarea
                  rows={2}
                  required
                  value={editingService.description}
                  onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Prerequisites</label>
                <input
                  type="text"
                  value={editingService.prerequisites}
                  onChange={(e) => setEditingService({ ...editingService, prerequisites: e.target.value })}
                  className="w-full min-h-[44px] sm:min-h-0 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  className="w-full sm:w-auto min-h-[44px] sm:min-h-0 px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors flex items-center justify-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto min-h-[44px] sm:min-h-0 px-4 py-2 font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-xs flex items-center justify-center"
                >
                  Save Authorized Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
