/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Terminal,
  ShieldCheck,
  AlertTriangle,
  Clock,
  User,
  Bot,
  Filter,
  CheckCircle2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { AgentLog } from '../../types.ts';

interface AgentLogsProps {
  logs: AgentLog[];
}

export const AgentLogs: React.FC<AgentLogsProps> = ({ logs }) => {
  const [filterAction, setFilterAction] = useState<string>('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const filtered = logs.filter(l => filterAction === 'all' || l.actionTaken === filterAction);

  const toggleExpand = (id: string) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Agent Activity & Guardrail Audit Trail</h3>
          <p className="text-xs text-slate-500">
            Real-time inspection of user inputs, model replies, tool validations, and safety blocks.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs overflow-x-auto no-scrollbar scroll-smooth max-w-full">
          {['all', 'inquiry', 'slot_check', 'booking_created', 'discount_denied', 'escalated'].map(a => (
            <button
              key={a}
              onClick={() => setFilterAction(a)}
              className={`px-2.5 py-1.5 sm:py-1 font-medium rounded-md transition-colors capitalize whitespace-nowrap min-h-[36px] sm:min-h-0 flex items-center justify-center shrink-0 ${
                filterAction === a
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {a.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Logs List */}
      <div className="space-y-3">
        {filtered.map((log) => {
          const isExpanded = expandedLogId === log.id;
          return (
            <div
              key={log.id}
              className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/30 transition-all"
            >
              <div
                onClick={() => toggleExpand(log.id)}
                className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-100/50"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div
                    className={`w-9 h-9 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      log.actionTaken === 'escalated'
                        ? 'bg-amber-100 text-amber-700'
                        : log.actionTaken === 'discount_denied'
                        ? 'bg-purple-100 text-purple-700'
                        : log.actionTaken === 'booking_created'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-indigo-100 text-indigo-700'
                    }`}
                  >
                    <Terminal className="w-4 h-4" />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <span className="font-bold text-xs text-slate-900 capitalize">
                        {log.actionTaken.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">· {log.latencyMs}ms</span>
                    </div>
                    <div className="text-xs text-slate-700 font-medium line-clamp-2 sm:line-clamp-1 mt-0.5">
                      "{log.userPrompt}"
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/50">
                  <div className="flex items-center gap-1.5 text-[11px]">
                    {log.guardrailsTriggered.promptInjectionDetected ? (
                      <span className="text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        Injection Blocked
                      </span>
                    ) : log.guardrailsTriggered.discountPolicyEnforced ? (
                      <span className="text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                        Discount Denied
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Guardrails Clean
                      </span>
                    )}
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
              </div>

              {/* Expanded Audit Card */}
              {isExpanded && (
                <div className="p-4 bg-white border-t border-slate-200 space-y-3 text-xs">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                      Customer Prompt
                    </span>
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono text-[11px] break-words">
                      {log.userPrompt}
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                      Elena AI Generated Response
                    </span>
                    <div className="p-2.5 bg-indigo-50/40 border border-indigo-100 rounded-lg text-slate-800 whitespace-pre-line text-[11px]">
                      {log.agentResponse}
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                      Guardrail Assertions
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                      <div className="p-2 bg-slate-50 rounded border border-slate-200">
                        <span className="text-slate-500 block">Price Grounding</span>
                        <span className="font-semibold text-emerald-600">PASSED</span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded border border-slate-200">
                        <span className="text-slate-500 block">Double-Booking Lock</span>
                        <span className="font-semibold text-emerald-600">PASSED</span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded border border-slate-200">
                        <span className="text-slate-500 block">Prompt Injection Check</span>
                        <span className={`font-semibold ${log.guardrailsTriggered.promptInjectionDetected ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {log.guardrailsTriggered.promptInjectionDetected ? 'TRIGGERED (BLOCKED)' : 'CLEAN'}
                        </span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded border border-slate-200">
                        <span className="text-slate-500 block">Human Escalation</span>
                        <span className={`font-semibold ${log.guardrailsTriggered.escalatedToHuman ? 'text-amber-600' : 'text-slate-600'}`}>
                          {log.guardrailsTriggered.escalatedToHuman ? 'ESCALATED' : 'NONE'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
