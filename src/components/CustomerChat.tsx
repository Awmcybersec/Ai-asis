/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Calendar,
  Clock,
  Shield,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Globe,
  Layers,
  X
} from 'lucide-react';
import { Service, Booking } from '../types.ts';

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent' | 'system';
  text: string;
  timestamp: string;
  bookingCard?: Booking;
  actionRequired?: string;
  isEscalated?: boolean;
}

interface CustomerChatProps {
  services: Service[];
  selectedTimezone: string;
  onBookingCreated: (booking: Booking) => void;
  onOpenBookingModal: (service?: Service) => void;
}

export const CustomerChat: React.FC<CustomerChatProps> = ({
  services,
  selectedTimezone,
  onBookingCreated,
  onOpenBookingModal
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'agent',
      text: `Hello! I am Elena, your SIHub Business Assistant operating in ${selectedTimezone.replace('_', ' ')}. I help you explore our enterprise AI and cloud advisory services, check live calendar availability, and confirm verified bookings with zero wait time.\n\nHow can I help your team today?`,
      timestamp: 'Just now'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const quickPrompts = [
    { label: "Services & Prices", prompt: "What services do you offer and what are the exact prices?" },
    { label: "Book AI Strategy ($350)", prompt: `I would like to book the AI Strategy & Readiness Assessment tomorrow at 10:00 AM (${selectedTimezone}). My name is Alex Vance, phone +252 61 555 0199, email alex@vance.io.` },
    { label: "Check Available Slots", prompt: `What appointment slots are currently open for tomorrow in ${selectedTimezone}?` },
    { label: "Test False Discount", prompt: "Can I get 50% discount with promo code VIP-HALF on the AI Agent Sprint?" },
    { label: "Cancel Appointment", prompt: "I need to cancel booking SIH-2026-9041 per the 24h refund policy." },
    { label: "Speak to Human Admin", prompt: "I need to speak with a human executive regarding an enterprise custom contract." }
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const userText = textToSend || input;
    if (!userText.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          timezone: selectedTimezone
        })
      });
      const data = await res.json();

      if (data.success) {
        const agentMessage: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          sender: 'agent',
          text: data.response,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isEscalated: data.action === 'escalated' || data.guardrails?.escalatedToHuman
        };
        setMessages(prev => [...prev, agentMessage]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: `msg-${Date.now() + 1}`,
            sender: 'agent',
            text: data.error?.message || "I am currently verifying your request with our scheduling service. Please allow a moment or rephrase your inquiry.",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages(prev => [
        ...prev,
        {
          id: `msg-${Date.now() + 1}`,
          sender: 'agent',
          text: "All SIHub services operate on fixed rates. You can also view our full catalog directly on the right panel.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-3 sm:py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">
        {/* Main Chat Stream (8 cols on desktop, full width on mobile/tablet) */}
        <div className="lg:col-span-8 flex flex-col bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden h-[calc(100dvh-5.5rem)] sm:h-[660px] lg:h-[740px]">
          {/* Agent Identity Bar */}
          <div className="px-3.5 sm:px-6 py-3 sm:py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="relative shrink-0">
                <img
                  src="/src/assets/images/avatar_sihub_agent_1794169529787.jpg"
                  alt="Elena - SIHub AI Assistant"
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover ring-2 ring-indigo-400"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 truncate">
                  <h3 className="text-xs sm:text-sm font-semibold text-white truncate">Elena</h3>
                  <span className="text-[10px] sm:text-[11px] text-slate-400 truncate">· AI Assistant</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] sm:text-xs text-slate-300 truncate">
                  <span className="flex items-center gap-1 truncate">
                    <Shield className="w-3 h-3 text-indigo-400 shrink-0" />
                    <span className="truncate">Grounded Pricing</span>
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1 truncate">
                    <Globe className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span className="truncate">{selectedTimezone.replace('_', ' ')}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Mobile / Tablet Catalog Toggle Button */}
            <button
              onClick={() => setShowCatalog(true)}
              className="lg:hidden flex items-center gap-1 text-[11px] font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 rounded-lg transition-colors shrink-0 min-h-[36px]"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Catalog</span>
            </button>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4 bg-slate-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 sm:gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'agent' && (
                  <img
                    src="/src/assets/images/avatar_sihub_agent_1794169529787.jpg"
                    alt="Elena"
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover shrink-0 mt-0.5"
                    referrerPolicy="no-referrer"
                  />
                )}

                <div
                  className={`max-w-[88%] sm:max-w-[78%] rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm leading-relaxed shadow-2xs ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-xs'
                      : msg.isEscalated
                      ? 'bg-amber-50 border border-amber-200 text-amber-950 rounded-tl-xs'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs'
                  }`}
                >
                  {msg.isEscalated && (
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 mb-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Notice: Escalated to Human Advisory Desk</span>
                    </div>
                  )}

                  <div className="whitespace-pre-line break-words">{msg.text}</div>

                  <div
                    className={`mt-1 text-[10px] text-right ${
                      msg.sender === 'user' ? 'text-indigo-200' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2 sm:gap-3 items-center">
                <img
                  src="/src/assets/images/avatar_sihub_agent_1794169529787.jpg"
                  alt="Elena"
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs px-3.5 py-2 text-xs text-slate-500 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
                  <span className="truncate">Elena is checking schedule...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Bar (Responsive horizontal scroll with touch support) */}
          <div className="px-3 sm:px-4 py-2 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
            <span className="text-[10px] font-semibold text-slate-400 shrink-0">Prompts:</span>
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(qp.prompt)}
                className="text-[11px] px-2.5 py-1.5 rounded-md bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 transition-colors whitespace-nowrap shrink-0 min-h-[36px]"
              >
                {qp.label}
              </button>
            ))}
          </div>

          {/* Input Form (Pinned above mobile keyboard) */}
          <div className="p-3 sm:p-4 bg-white border-t border-slate-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2 sm:gap-3"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Ask about services or book in ${selectedTimezone.replace('_', ' ')}...`}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all min-h-[44px]"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                aria-label="Send message"
                className="px-3.5 sm:px-4 py-2 sm:py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl font-medium text-xs flex items-center justify-center gap-1.5 transition-colors shrink-0 shadow-xs min-h-[44px] min-w-[44px]"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>
            <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 px-1">
              <span className="truncate">PostgreSQL Concurrency Lock · Grounded Pricing</span>
              <span className="shrink-0">{selectedTimezone.includes('Mogadishu') ? 'EAT' : 'Local'}</span>
            </div>
          </div>
        </div>

        {/* Desktop Sidebar: Services & Catalog (4 cols on lg screens) */}
        <div className="hidden lg:block lg:col-span-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">SIHub Official Catalog</h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">5 Authorized</span>
            </div>

            <div className="space-y-3">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-indigo-300 bg-slate-50/50 hover:bg-indigo-50/30 transition-all group"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                      {service.name}
                    </h4>
                    <span className="text-xs font-bold font-mono text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                      ${service.price}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 line-clamp-2 mb-2.5">
                    {service.description}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{service.durationMinutes} mins</span>
                    </span>

                    <button
                      onClick={() => onOpenBookingModal(service)}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform min-h-[36px]"
                    >
                      <span>Book Slot</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Business Trust Box */}
            <div className="mt-5 p-3.5 bg-slate-100/70 rounded-xl text-xs text-slate-600 space-y-1.5">
              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Enterprise Booking Rules</span>
              </div>
              <div className="text-[11px] text-slate-500 space-y-1">
                <p>• Operating in {selectedTimezone.replace('_', ' ')}.</p>
                <p>• Free cancellation up to 24 hours prior.</p>
                <p>• PostgreSQL atomic lock double-booking protection.</p>
                <p>• Verified Stripe payment gateway protection.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Catalog Slide-Over Sheet (Visible on mobile/tablet when triggered) */}
      {showCatalog && (
        <div className="lg:hidden fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md h-full flex flex-col p-4 sm:p-6 shadow-2xl animate-in slide-in-from-right duration-200 overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Authorized Services</h3>
              </div>
              <button
                onClick={() => setShowCatalog(false)}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="text-xs font-bold text-slate-900">
                      {service.name}
                    </h4>
                    <span className="text-xs font-bold font-mono text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                      ${service.price}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 mb-2.5">
                    {service.description}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs text-slate-500">
                    <span className="flex items-center gap-1 text-[11px]">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{service.durationMinutes} mins</span>
                    </span>

                    <button
                      onClick={() => {
                        setShowCatalog(false);
                        onOpenBookingModal(service);
                      }}
                      className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1 min-h-[36px]"
                    >
                      <span>Book Now</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
