import React, { useState } from 'react';
import { 
  HelpCircle, Search, MessageSquare, Phone, Mail, Clock, 
  ChevronDown, ChevronUp, Send, CheckCircle2, AlertCircle, FileText, Sparkles 
} from 'lucide-react';

const FAQ_DATA = [
  {
    id: 1,
    category: 'Escrow & Payouts',
    question: 'How long are funds held in escrow after shipment delivery?',
    answer: 'Once a shipment is delivered, funds remain in escrow during the 24-hour inspection window. Upon buyer confirmation or when the timer expires, funds are automatically transferred to your registered payout bank account.'
  },
  {
    id: 2,
    category: 'Escrow & Payouts',
    question: 'How do I update my payout bank account or UPI ID?',
    answer: 'Go to Profile & Bank Payout settings in the sidebar. For security, updating existing bank account details requires a 6-digit OTP verification sent to your registered mobile number.'
  },
  {
    id: 3,
    category: 'Logistics & Tracking',
    question: 'What happens if a courier partner delays pickup or delivery?',
    answer: 'Our live tracking system continuously polls partner APIs (Delhivery, BlueDart, DTDC). In case of delays beyond 24 hours, automated logistics escalation alerts are sent to the courier hub.'
  },
  {
    id: 4,
    category: 'Disputes & Refunds',
    question: 'What is the dispute process if a package arrives damaged?',
    answer: 'The recipient can click "File Dispute" on the shipment details card before releasing funds. This immediately locks the escrow funds in a neutral stage until our arbitration team reviews the unboxing proof.'
  },
  {
    id: 5,
    category: 'Escrow & Payouts',
    question: 'Is there any interest accrued on held escrow funds?',
    answer: 'Yes! Safecart escrow accounts earn a 5.0% annual yield on funds held longer than 7 days, which is automatically credited to the seller upon disbursal.'
  },
  {
    id: 6,
    category: 'Account & KYC',
    question: 'Why is Aadhaar or PAN KYC mandatory for escrow transactions?',
    answer: 'In compliance with Reserve Bank of India (RBI) escrow guidelines, identity verification prevents fraudulent transactions and ensures secure electronic disbursals.'
  }
];

export default function SupportView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedFaq, setExpandedFaq] = useState(null);

  // Ticket Form state
  const [ticketCategory, setTicketCategory] = useState('Escrow & Disbursal');
  const [ticketPriority, setTicketPriority] = useState('Normal');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Sample User Tickets
  const [userTickets, setUserTickets] = useState([
    {
      id: 'TKT-2026-8921',
      subject: 'Payout delay query for SPL-9201-A',
      category: 'Escrow & Disbursal',
      priority: 'Normal',
      status: 'Resolved',
      date: '2026-07-25 14:30'
    },
    {
      id: 'TKT-2026-9041',
      subject: 'Update GST registration number on invoice',
      category: 'Account & KYC',
      priority: 'Low',
      status: 'In Progress',
      date: '2026-07-27 09:15'
    }
  ]);

  const filteredFaqs = FAQ_DATA.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCreateTicket = (e) => {
    e.preventDefault();
    if (!ticketSubject || !ticketMessage) return;

    setSubmitting(true);
    setTimeout(() => {
      const newTicket = {
        id: `TKT-2026-${Math.floor(9000 + Math.random() * 900)}`,
        subject: ticketSubject,
        category: ticketCategory,
        priority: ticketPriority,
        status: 'Open',
        date: new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })
      };

      setUserTickets([newTicket, ...userTickets]);
      setTicketSubject('');
      setTicketMessage('');
      setSubmitting(false);
      setToastMsg(`Support ticket ${newTicket.id} created successfully! Our team will respond within 2 hours.`);
      setTimeout(() => setToastMsg(''), 5000);
    }, 800);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
          <HelpCircle className="w-7 h-7 text-[#1E56E3]" />
          Help & Support Center
        </h1>
        <p className="text-xs text-slate-500 mt-1">Get 24/7 assistance with escrow transactions, courier tracking, payouts, and dispute resolution.</p>
      </div>

      {toastMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top 3 Quick Contact Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-start gap-4 hover:shadow-md transition">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1E56E3] flex items-center justify-center font-bold shrink-0">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">24/7 Email Support</h3>
            <p className="text-xs text-blue-600 font-bold mt-0.5">support@safecart.com</p>
            <p className="text-[11px] text-slate-500 mt-1">Priority ticket responses delivered directly to your inbox.</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-start gap-4 hover:shadow-md transition">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <Phone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">Toll-Free Hotline</h3>
            <p className="text-xs text-emerald-700 font-extrabold mt-0.5">1800-123-SAFE (7233)</p>
            <p className="text-[11px] text-slate-500 mt-1">Mon - Sat: 9:00 AM to 9:00 PM IST hotline support.</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-start gap-4 hover:shadow-md transition">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">Avg. Response Time</h3>
            <p className="text-xs text-purple-700 font-extrabold mt-0.5">Under 2 Hours</p>
            <p className="text-[11px] text-slate-500 mt-1">Dedicated escrow specialist assigned to every ticket.</p>
          </div>
        </div>
      </div>

      {/* Main Grid: FAQ Accordion + Ticket Submission Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Knowledge Base / FAQ (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-7 rounded-3xl border border-slate-200/80 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <h2 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                Frequently Asked Questions
              </h2>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] font-semibold">
                {['All', 'Escrow & Payouts', 'Logistics & Tracking', 'Disputes & Refunds'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl transition shrink-0 ${
                      selectedCategory === cat
                        ? 'bg-[#1E56E3] text-white font-bold shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search help articles (e.g. payout, refund, tracking)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
            </div>

            {/* FAQ List Accordion */}
            <div className="space-y-3">
              {filteredFaqs.length > 0 ? (
                filteredFaqs.map(faq => {
                  const isOpen = expandedFaq === faq.id;
                  return (
                    <div
                      key={faq.id}
                      className="border border-slate-200/70 rounded-2xl overflow-hidden transition bg-slate-50/50 hover:bg-white"
                    >
                      <button
                        onClick={() => setExpandedFaq(isOpen ? null : faq.id)}
                        className="w-full p-4 text-left flex items-center justify-between gap-3 text-xs font-bold text-slate-900"
                      >
                        <span className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#1E56E3] shrink-0"></span>
                          {faq.question}
                        </span>
                        {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                      </button>

                      {isOpen && (
                        <div className="px-4 pb-4 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-white">
                          <p>{faq.answer}</p>
                          <span className="inline-block mt-3 text-[10px] font-bold text-[#1E56E3] bg-blue-50 px-2 py-0.5 rounded-md">
                            Category: {faq.category}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs font-medium">
                  No matching help articles found. Create a support ticket below for direct assistance!
                </div>
              )}
            </div>
          </div>

          {/* User Active Tickets Table */}
          <div className="bg-white p-7 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
            <h2 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#1E56E3]" />
              My Support Tickets
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-bold uppercase text-slate-400">
                    <th className="py-2.5 px-3">Ticket ID</th>
                    <th className="py-2.5 px-3">Subject</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {userTickets.map(tkt => (
                    <tr key={tkt.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3 font-mono font-bold text-[#1E56E3]">{tkt.id}</td>
                      <td className="py-3 px-3 font-semibold text-slate-900">{tkt.subject}</td>
                      <td className="py-3 px-3 text-slate-500 text-[11px]">{tkt.category}</td>
                      <td className="py-3 px-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          tkt.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' :
                          tkt.status === 'In Progress' ? 'bg-amber-100 text-amber-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {tkt.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400 text-[11px]">{tkt.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Ticket Submission Form (1 Col) */}
        <div className="bg-white p-7 rounded-3xl border border-slate-200/80 shadow-sm space-y-5 h-fit">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#1E56E3]" />
              Create Support Ticket
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">Submit an inquiry directly to our escrow resolution managers.</p>
          </div>

          <form onSubmit={handleCreateTicket} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Issue Category</label>
              <select
                value={ticketCategory}
                onChange={(e) => setTicketCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
              >
                <option value="Escrow & Disbursal">Escrow & Disbursal</option>
                <option value="Logistics & Delivery Delay">Logistics & Delivery Delay</option>
                <option value="Dispute Claim Assistance">Dispute Claim Assistance</option>
                <option value="Account & KYC Setup">Account & KYC Setup</option>
                <option value="Other Inquiries">Other Inquiries</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Priority Level</label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {['Normal', 'High', 'Urgent'].map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setTicketPriority(p)}
                    className={`py-2 rounded-xl font-bold transition text-[11px] ${
                      ticketPriority === p
                        ? p === 'Urgent' ? 'bg-rose-600 text-white shadow-sm' : 'bg-[#1E56E3] text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
              <input
                type="text"
                required
                placeholder="Brief summary of your query..."
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Detailed Message</label>
              <textarea
                rows="4"
                required
                placeholder="Include Shipment ID (e.g. SPL-XXXX) or specific details..."
                value={ticketMessage}
                onChange={(e) => setTicketMessage(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-4 bg-[#1E56E3] hover:bg-[#1649CC] text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Ticket</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
