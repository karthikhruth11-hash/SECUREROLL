import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Sparkles, RefreshCw, ShieldCheck, Database, FileText } from 'lucide-react';
import { apiAIAssistantChat } from '../../services/api.js';

export default function AIAssistantModal({ isOpen, onClose, user }) {
  const [messages, setMessages] = useState([
    {
      id: 'msg-1',
      sender: 'AI',
      text: `Greetings ${user?.name || 'User'}. I am the SECURE AI Intelligence Assistant. Ask me about attendance statistics, low attendance alerts, or security events.`,
      sources: ['SECURE Analytics Engine']
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (queryText = null) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg = { id: 'msg-' + Date.now(), sender: 'USER', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    if (!queryText) setInput('');
    setLoading(true);

    try {
      const res = await apiAIAssistantChat(textToSend);
      const aiMsg = {
        id: 'msg-' + (Date.now() + 1),
        sender: 'AI',
        text: res.answer,
        sources: res.sources || []
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: 'msg-' + (Date.now() + 1),
          sender: 'AI',
          text: err.message || 'Unable to process query at this time.',
          isError: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const suggestedPrompts = user?.role === 'STUDENT' ? [
    'What is my overall attendance percentage?',
    'Show my registered devices and passkeys'
  ] : [
    'How many students have attendance below 75%?',
    'Show today\'s active attendance sessions',
    'Summarize recent security alerts'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-cyan-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[600px]">
        {/* Header */}
        <div className="p-4 px-6 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                SECURE AI Assistant <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-mono">RBAC Guard Active</span>
              </h3>
              <p className="text-xs text-slate-400">Natural-Language Operational & Attendance Intelligence</p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 font-sans text-xs">
          {messages.map((m) => (
            <div key={m.id} className={`flex flex-col ${m.sender === 'USER' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[85%] p-4 rounded-2xl ${m.sender === 'USER' ? 'bg-cyan-500 text-slate-950 font-medium rounded-tr-none' : 'bg-slate-800/80 text-slate-100 border border-slate-700/60 rounded-tl-none space-y-2'}`}>
                <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
                {m.sources && m.sources.length > 0 && (
                  <div className="pt-2 border-t border-slate-700/50 flex items-center gap-2 text-[10px] text-cyan-400 font-mono">
                    <Database className="w-3 h-3" /> Sources: {m.sources.join(', ')}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs p-3">
              <RefreshCw className="w-4 h-4 animate-spin" /> Analyzing database records...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts */}
        <div className="p-3 px-6 bg-slate-950/40 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto text-[11px]">
          <span className="text-slate-500 shrink-0 font-semibold flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-cyan-400" /> Prompts:
          </span>
          {suggestedPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p)}
              className="px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 whitespace-nowrap transition-colors"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center gap-3"
        >
          <input
            type="text"
            placeholder="Ask AI Assistant about attendance, risk alerts, or security..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="py-3 px-5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 disabled:opacity-50 transition-all"
          >
            <Send className="w-4 h-4" /> Send
          </button>
        </form>
      </div>
    </div>
  );
}
