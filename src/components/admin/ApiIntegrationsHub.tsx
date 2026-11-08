/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Layers,
  Calendar,
  Users,
  CreditCard,
  MessageSquare,
  Play,
  CheckCircle2,
  Code,
  Copy,
  Check,
  AlertCircle,
  ShieldAlert,
  ShieldCheck,
  Terminal
} from 'lucide-react';
import { IntegrationStatus, IntegrationEvent } from '../../types.ts';

interface ApiIntegrationsHubProps {
  integrations: IntegrationStatus[];
  events: IntegrationEvent[];
  onSimulateEvent: (integrationId: string) => void;
  onToggleStatus: (integrationId: string, status: IntegrationStatus['status']) => void;
}

export const ApiIntegrationsHub: React.FC<ApiIntegrationsHubProps> = ({
  integrations,
  events,
  onSimulateEvent,
  onToggleStatus
}) => {
  const [selectedDocs, setSelectedDocs] = useState<IntegrationStatus | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [webhookTestOutput, setWebhookTestOutput] = useState<{
    testType: string;
    status: number;
    response: any;
    timestamp: string;
  } | null>(null);
  const [testingWebhook, setTestingWebhook] = useState(false);

  const getIcon = (id: string) => {
    switch (id) {
      case 'google_calendar':
        return <Calendar className="w-5 h-5 text-indigo-600" />;
      case 'crm':
        return <Users className="w-5 h-5 text-blue-600" />;
      case 'payment_gateway':
        return <CreditCard className="w-5 h-5 text-emerald-600" />;
      case 'whatsapp':
        return <MessageSquare className="w-5 h-5 text-green-600" />;
      default:
        return <Layers className="w-5 h-5 text-slate-600" />;
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Test real Stripe Webhook endpoint
  const runWebhookTest = async (mode: 'valid' | 'tampered' | 'expired') => {
    setTestingWebhook(true);
    setWebhookTestOutput(null);

    try {
      const now = Math.floor(Date.now() / 1000);
      const timestamp = mode === 'expired' ? now - 400 : now; // 400s old exceeds 300s window
      const payload = {
        id: `evt_test_${Date.now()}`,
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: `pi_test_${Date.now()}`,
            amount: 35000,
            currency: 'usd',
            metadata: { bookingId: 'SIH-2026-9043' }
          }
        }
      };

      const rawPayload = JSON.stringify(payload);
      let signatureHeader = '';

      if (mode === 'valid' || mode === 'expired') {
        // Calculate HMAC in browser client to simulate Stripe dispatch
        // Using crypto.subtle or testing against server
        const encoder = new TextEncoder();
        const keyData = encoder.encode('whsec_sihub_demo_secret');
        const cryptoKey = await window.crypto.subtle.importKey(
          'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
        );
        const signedPayload = `${timestamp}.${rawPayload}`;
        const signatureBytes = await window.crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(signedPayload));
        const signatureHex = Array.from(new Uint8Array(signatureBytes)).map(b => b.toString(16).padStart(2, '0')).join('');
        signatureHeader = `t=${timestamp},v1=${signatureHex}`;
      } else {
        // Tampered signature
        signatureHeader = `t=${timestamp},v1=deadbeef_forged_invalid_signature_hex_00000000000000000000000000000000`;
      }

      const res = await fetch('/api/webhooks/stripe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': signatureHeader
        },
        body: rawPayload
      });

      const data = await res.json();
      setWebhookTestOutput({
        testType: mode === 'valid' ? 'Valid HMAC Signature Test' : mode === 'tampered' ? 'Forged Signature Defense Test' : 'Expired Replay Attack Defense Test',
        status: res.status,
        response: data,
        timestamp: new Date().toLocaleTimeString()
      });
    } catch (err: any) {
      setWebhookTestOutput({
        testType: 'Webhook Call Error',
        status: 500,
        response: { error: err.message },
        timestamp: new Date().toLocaleTimeString()
      });
    } finally {
      setTestingWebhook(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Layers className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Modular API Integration Adapters</h3>
            </div>
            <p className="text-xs text-slate-500">
              Clear distinction between sandbox simulations and live production credentials.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md">
              Sandbox Simulation Active
            </span>
          </div>
        </div>

        {/* Integration Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {integrations.map((integ) => (
            <div
              key={integ.id}
              className="p-4 border border-slate-200 rounded-xl bg-slate-50/40 hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-white border border-slate-200">
                      {getIcon(integ.id)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{integ.name}</h4>
                      <span className="text-[11px] text-slate-500">{integ.category}</span>
                    </div>
                  </div>

                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                    Sandbox Mock Active
                  </span>
                </div>

                <p className="text-xs text-slate-600 mb-2">{integ.description}</p>
                <div className="text-[10px] text-amber-800 bg-amber-50/80 p-2 rounded-lg border border-amber-200/60 mb-3">
                  <strong>Sandbox Disclaimer:</strong> {integ.disclaimer}
                </div>
              </div>

              <div>
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500 mb-3">
                  <span>Dispatched: <strong className="font-mono text-slate-700">{integ.eventsCount}</strong></span>
                  <span>Sync: <strong className="text-slate-700">{integ.lastSync || 'Active'}</strong></span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSimulateEvent(integ.id)}
                    className="flex-1 py-1.5 px-3 text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <Play className="w-3 h-3 text-indigo-600" />
                    <span>Trigger Sandbox Ping</span>
                  </button>
                  <button
                    onClick={() => setSelectedDocs(integ)}
                    className="py-1.5 px-3 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    Live Setup Spec
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Stripe Webhook Signature Verification Sandbox (Task 4) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Stripe Webhook Cryptographic HMAC Verifier Sandbox
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Interactive test console demonstrating real-time HMAC-SHA256 signature checking and replay attack defenses on <code>/api/webhooks/stripe</code>.
            </p>
          </div>
          <span className="text-[11px] font-mono text-slate-500">HMAC-SHA256</span>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <button
            onClick={() => runWebhookTest('valid')}
            disabled={testingWebhook}
            className="w-full sm:w-auto min-h-[44px] sm:min-h-0 px-3.5 py-2.5 sm:py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-2xs flex items-center justify-center"
          >
            Test 1: Send Valid HMAC Webhook (Expect 200 OK)
          </button>
          <button
            onClick={() => runWebhookTest('tampered')}
            disabled={testingWebhook}
            className="w-full sm:w-auto min-h-[44px] sm:min-h-0 px-3.5 py-2.5 sm:py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-2xs flex items-center justify-center"
          >
            Test 2: Send Forged Signature (Expect 400 Rejection)
          </button>
          <button
            onClick={() => runWebhookTest('expired')}
            disabled={testingWebhook}
            className="w-full sm:w-auto min-h-[44px] sm:min-h-0 px-3.5 py-2.5 sm:py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors shadow-2xs flex items-center justify-center"
          >
            Test 3: Send Expired Timestamp (Expect Replay Defense)
          </button>
        </div>

        {webhookTestOutput && (
          <div className="p-4 bg-slate-900 rounded-xl font-mono text-xs text-slate-200 space-y-2">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800 text-slate-400 text-[11px]">
              <span>Scenario: <strong>{webhookTestOutput.testType}</strong></span>
              <span>HTTP Status: <strong className={webhookTestOutput.status === 200 ? 'text-emerald-400' : 'text-rose-400'}>{webhookTestOutput.status}</strong> · {webhookTestOutput.timestamp}</span>
            </div>
            <pre className="text-[11px] overflow-x-auto text-emerald-300">
              {JSON.stringify(webhookTestOutput.response, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Dispatched Events Feed */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Sandbox Event Stream</h3>
            <p className="text-xs text-slate-500">Real-time webhook and API payload delivery log</p>
          </div>
          <span className="text-xs font-mono text-slate-400">{events.length} Dispatched</span>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {events.slice(0, 8).map((evt) => (
            <div key={evt.id} className="py-2.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                  {evt.integrationId.replace('_', ' ')}
                </span>
                <div>
                  <div className="font-medium text-slate-800">{evt.payloadSummary}</div>
                  <div className="text-[10px] font-mono text-slate-400">
                    Type: {evt.type} · {new Date(evt.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>

              <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Sandbox Dispatched
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Credentials Spec Modal */}
      {selectedDocs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="text-sm font-bold text-slate-900">{selectedDocs.name} Integration Guide</h4>
                <p className="text-xs text-slate-500">Live API credentials and transition guide</p>
              </div>
              <button
                onClick={() => setSelectedDocs(null)}
                aria-label="Close modal"
                className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-lg text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-semibold text-slate-700 block mb-1">Required Environment Variables:</span>
                <div className="bg-slate-900 text-slate-200 rounded-xl p-3 font-mono text-[11px] space-y-1 relative">
                  {selectedDocs.requiredEnvVars.map((env, i) => (
                    <div key={i} className="flex justify-between items-center pr-8">
                      <span className="break-all">{env}="YOUR_LIVE_KEY"</span>
                    </div>
                  ))}
                  <button
                    onClick={() => copyToClipboard(selectedDocs.requiredEnvVars.map(e => `${e}="YOUR_KEY"`).join('\n'), 'envs')}
                    className="absolute right-2 top-2 p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded min-h-[32px] min-w-[32px] flex items-center justify-center"
                    title="Copy Envs"
                  >
                    {copiedKey === 'envs' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                <span className="font-semibold text-amber-950 block">Production Sandbox Notice:</span>
                <p className="text-amber-900 text-[11px] leading-relaxed">
                  {selectedDocs.disclaimer}
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedDocs(null)}
                className="w-full sm:w-auto min-h-[44px] sm:min-h-0 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl flex items-center justify-center"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
