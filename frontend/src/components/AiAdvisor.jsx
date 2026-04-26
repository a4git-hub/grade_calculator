import React, { useState, useRef, useEffect } from 'react';
import { getAiResponse } from '../utils/aiClient';

// Lightweight Markdown renderer — handles **bold**, *italic*, bullet lines
function renderMarkdown(text) {
  return text.split('\n').map((line, i) => {
    // Bullet point lines
    const isBullet = /^[\*\-]\s/.test(line);
    const cleanLine = isBullet ? line.replace(/^[\*\-]\s/, '') : line;

    // Parse inline bold (**text**) and italic (*text*)
    const parts = [];
    const regex = /\*\*(.+?)\*\*|\*(.+?)\*/g;
    let last = 0, match;
    while ((match = regex.exec(cleanLine)) !== null) {
      if (match.index > last) parts.push(cleanLine.slice(last, match.index));
      if (match[1]) parts.push(<strong key={match.index}>{match[1]}</strong>);
      else if (match[2]) parts.push(<em key={match.index}>{match[2]}</em>);
      last = match.index + match[0].length;
    }
    if (last < cleanLine.length) parts.push(cleanLine.slice(last));

    if (isBullet) {
      return <div key={i} style={{ display: 'flex', gap: '6px', marginTop: '4px' }}><span>•</span><span>{parts}</span></div>;
    }
    return <span key={i}>{parts}{i < text.split('\n').length - 1 ? <br/> : null}</span>;
  });
}

const DAILY_LIMIT = 15;
const todayKey = () => `lumina_ai_usage_${new Date().toDateString()}`;
const getUsageToday = () => parseInt(localStorage.getItem(todayKey()) || '0');
const incrementUsage = () => localStorage.setItem(todayKey(), getUsageToday() + 1);

export default function AiAdvisor({ courses, onClose, focusedCourse = null, syllabusKey = null, inline = false }) {
  const [aiConsented, setAiConsented] = useState(
    () => localStorage.getItem('lumina_ai_consent') === 'yes'
  );
  const [usageCount, setUsageCount] = useState(() => getUsageToday());
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      content: focusedCourse
        ? `Hey! I'm your AI Tutor for **${focusedCourse}**. I'm looking at your grades${localStorage.getItem(syllabusKey) ? ' and syllabus' : ''} right now. How can I help?`
        : "Hey! I'm Lumina AI. I just analyzed your live Infinite Campus grades. Ask me anything—like 'What score do I need on my math final to get an A?'"
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const handleConsent = () => {
    localStorage.setItem('lumina_ai_consent', 'yes');
    setAiConsented(true);
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    if (usageCount >= DAILY_LIMIT) return;

    const userMsg = inputText.trim();
    const updatedMessages = [...messages, { role: 'user', content: userMsg }];
    setMessages(updatedMessages);
    setInputText("");
    setIsLoading(true);
    incrementUsage();
    setUsageCount(getUsageToday());

    // Pass full conversation history so AI remembers context
    // If syllabusKey exists, pass the base64 string
    const syllabusData = syllabusKey ? localStorage.getItem(syllabusKey) : null;
    const reply = await getAiResponse(courses, userMsg, updatedMessages, syllabusData);
    
    setMessages(prev => [...prev, { role: 'ai', content: reply }]);
    setIsLoading(false);
  };

  return (
    <div style={{
      position: inline ? 'relative' : 'fixed',
      bottom: inline ? 'auto' : '80px',
      right: inline ? 'auto' : '20px',
      width: inline ? '100%' : '350px',
      height: inline ? '100%' : (aiConsented ? '500px' : 'auto'),
      zIndex: inline ? 1 : 9999,
      display: 'flex',
      flexDirection: 'column',
      boxShadow: inline ? 'none' : '0 20px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(99, 102, 241, 0.2)',
      borderRadius: 'var(--radius-lg)'
    }} className={inline ? "" : "glass-panel animate-slide-up"}>

      {/* Header */}
      <div style={{
        padding: '1rem',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(99, 102, 241, 0.1)',
        borderTopLeftRadius: 'var(--radius-lg)',
        borderTopRightRadius: 'var(--radius-lg)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ 
            width: '10px', height: '10px', borderRadius: '50%', 
            background: 'var(--primary-color)',
            boxShadow: '0 0 10px var(--primary-color)'
          }}></div>
          <strong style={{ color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif' }}>
            {focusedCourse ? `AI Tutor: ${focusedCourse}` : "Lumina AI Advisor"}
          </strong>
        </div>
        {!inline && (
          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem' }}
          >✕</button>
        )}
      </div>

      {/* Consent Gate */}
      {!aiConsented ? (
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--text-primary)' }}>Before we continue</strong><br/><br/>
            To answer your questions, Lumina sends your <strong>course names and grades</strong> to Google Gemini AI. No personal info (name, DOB, address) is ever sent.<br/><br/>
            Your IC credentials are <strong>never stored</strong> by Lumina — authentication happens entirely through your school's secure ClassLink portal.<br/><br/>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>By enabling AI, you confirm you are 13 or older. If you are under 13, please ask a parent before continuing.</span>
          </p>
          <button onClick={handleConsent} className="btn-primary" style={{ fontSize: '0.9rem', padding: '0.75rem' }}>
            I understand — Enable AI
          </button>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem' }}>
            No thanks
          </button>
        </div>
      ) : (
        <>
        {/* Messages */}
        <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '85%',
            padding: '0.75rem 1rem',
            borderRadius: '16px',
            borderBottomRightRadius: msg.role === 'user' ? '4px' : '16px',
            borderBottomLeftRadius: msg.role === 'ai' ? '4px' : '16px',
            background: msg.role === 'user' ? 'var(--primary-color)' : 'rgba(255, 255, 255, 0.05)',
            border: msg.role === 'ai' ? '1px solid var(--border-color)' : 'none',
            color: 'white',
            fontSize: '0.9rem',
            lineHeight: 1.4
          }}>
            {msg.content ? renderMarkdown(msg.content) : ''}
          </div>
        ))}
        {isLoading && (
          <div style={{
            alignSelf: 'flex-start',
            padding: '0.75rem 1rem',
            borderRadius: '16px',
            borderBottomLeftRadius: '4px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)'
          }}>
            <span style={{ animation: 'pulse 1.5s infinite' }}>Thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} style={{
        padding: '0.75rem 1rem',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      }}>
        {usageCount >= DAILY_LIMIT ? (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.82rem', padding: '0.5rem' }}>
            Daily limit reached (15/15). Resets tomorrow. ✨
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Ask a question... (${DAILY_LIMIT - usageCount} left today)`}
              className="input-field"
              style={{ flex: 1, borderRadius: '20px', padding: '10px 16px' }}
              maxLength={500}
            />
            <button 
              type="submit" 
              disabled={!inputText.trim() || isLoading}
              className="btn-primary"
              style={{ width: '40px', height: '40px', padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            >
              ↑
            </button>
          </div>
        )}
      </form>
        </>
      )}
    </div>
  );
}
