import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api/client';
import { MessageCircle, X, Send, Loader2, Sparkles, Mic } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function EdithAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hey there, hero. I'm EDITH — your personal AI assistant. Ask me anything about your quests, progress, or what to focus on next." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Voice Input State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const originalInputRef = useRef('');

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        const baseText = originalInputRef.current;
        setInput((baseText ? baseText + ' ' : '') + transcript);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (recognitionRef.current) {
        originalInputRef.current = input.trim();
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch (err) {
          console.error('Failed to start recognition:', err);
        }
      } else {
        alert("Voice input is not supported in this browser.");
      }
    }
  };

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);
  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    setMessages(prev => [...prev, { role: 'user', text: trimmed }]);
    setInput('');
    setLoading(true);

    try {
      const data = await api.askEdith(trimmed);
      setMessages(prev => [...prev, { role: 'assistant', text: data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: "My systems hit a snag. Try again in a moment." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <motion.button
        onClick={() => setOpen(prev => !prev)}
        className="fixed z-[80] rounded-full flex items-center justify-center shadow-lg"
        style={{
          bottom: 'calc(env(safe-area-inset-bottom, 8px) + 80px)',
          right: '16px',
          width: 52,
          height: 52,
          background: 'linear-gradient(135deg, var(--color-spider-red), var(--color-spider-red-dark))',
          boxShadow: '0 4px 20px rgba(220,20,60,0.4)',
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {open ? <X size={22} color="white" /> : <Sparkles size={22} color="white" />}
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed z-[79] flex flex-col"
            style={{
              bottom: 'calc(env(safe-area-inset-bottom, 8px) + 140px)',
              right: 16,
              width: 'min(380px, calc(100vw - 32px))',
              maxHeight: 'min(500px, calc(100dvh - 200px))',
              background: 'linear-gradient(135deg, rgba(8,10,18,0.97), rgba(16,20,28,0.95))',
              border: '1px solid rgba(220,20,60,0.2)',
              borderRadius: 16,
              backdropFilter: 'blur(20px)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.5), 0 0 30px rgba(220,20,60,0.08)',
            }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 p-4 shrink-0" style={{ borderBottom: '1px solid var(--color-verse-border)' }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{
                background: 'linear-gradient(135deg, var(--color-spider-red), var(--color-spider-red-dark))',
              }}>
                <Sparkles size={14} color="white" />
              </div>
              <div>
                <p className="font-bold text-sm" style={{ color: 'var(--color-verse-text)' }}>E.D.I.T.H.</p>
                <p className="text-[10px]" style={{ color: 'var(--color-verse-muted)' }}>Even Dead, I'm The Hero</p>
              </div>
              <button onClick={() => setOpen(false)} className="ml-auto p-1 rounded-lg transition-all hover:bg-white/5">
                <X size={16} style={{ color: 'var(--color-verse-muted)' }} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className="max-w-[85%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed"
                    style={msg.role === 'user' ? {
                      background: 'linear-gradient(135deg, var(--color-spider-red), var(--color-spider-red-dark))',
                      color: 'white',
                      borderBottomRightRadius: 4,
                    } : {
                      background: 'var(--color-verse-panel)',
                      color: 'var(--color-verse-text)',
                      border: '1px solid var(--color-verse-border)',
                      borderBottomLeftRadius: 4,
                    }}
                  >
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p style={{ margin: '4px 0' }}>{children}</p>,
                        ul: ({ children }) => <ul style={{ paddingLeft: '18px', margin: '6px 0' }}>{children}</ul>,
                        ol: ({ children }) => <ol style={{ paddingLeft: '18px', margin: '6px 0' }}>{children}</ol>,
                        li: ({ children }) => <li style={{ marginBottom: '4px' }}>{children}</li>,
                        h1: ({ children }) => <h1 style={{ fontSize: '16px', fontWeight: 'bold' }}>{children}</h1>,
                        h2: ({ children }) => <h2 style={{ fontSize: '14px', fontWeight: 'bold' }}>{children}</h2>,
                        code: ({ inline, children }) =>
                          inline ? (
                            <code style={{ background: '#222', padding: '2px 4px', borderRadius: 4 }}>
                              {children}
                            </code>
                          ) : (
                            <pre style={{ background: '#111', padding: '10px', borderRadius: 8 }}>
                              <code>{children}</code>
                            </pre>
                          ),
                      }}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  </div>
                </motion.div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="px-4 py-3 rounded-2xl flex items-center gap-3" style={{
                    background: 'var(--color-verse-panel)',
                    border: '1px solid var(--color-verse-border)',
                  }}>
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: 'var(--color-spider-red)' }}
                        />
                      ))}
                    </div>
                    <span className="text-xs" style={{ color: 'var(--color-verse-muted)' }}>EDITH is typing...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 shrink-0" style={{ borderTop: '1px solid var(--color-verse-border)' }}>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleListen}
                  className="p-2.5 rounded-xl transition-all flex items-center justify-center shrink-0"
                  style={{
                    background: isListening ? 'rgba(220,20,60,0.2)' : 'var(--color-verse-surface)',
                    color: isListening ? '#DC143C' : 'var(--color-verse-muted)',
                    border: '1px solid var(--color-verse-border)',
                  }}
                  title={isListening ? "Stop listening" : "Start voice input"}
                >
                  <Mic size={16} className={isListening ? "animate-pulse" : ""} />
                </button>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isListening ? "Listening..." : "Ask EDITH anything..."}
                  className="spider-input flex-1"
                  style={{ fontSize: '13px', padding: '10px 14px', borderRadius: 12 }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || loading}
                  className="p-2.5 rounded-xl transition-all disabled:opacity-30"
                  style={{
                    background: 'linear-gradient(135deg, var(--color-spider-red), var(--color-spider-red-dark))',
                    color: 'white',
                  }}
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
