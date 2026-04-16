import React, { useState, useRef, useEffect } from 'react';
import { getAiResponse } from '../utils/aiClient';

export default function AiAdvisor({ courses, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      content: "Hey! I'm Lumina AI. I just analyzed your live Infinite Campus grades. Ask me anything—like 'What score do I need on my math final to get an A?'"
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg = inputText.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInputText("");
    setIsLoading(true);

    // Call the Client
    const reply = await getAiResponse(courses, userMsg);
    
    setMessages(prev => [...prev, { role: 'ai', content: reply }]);
    setIsLoading(false);
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '80px',
      right: '20px',
      width: '350px',
      height: '500px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 20px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(99, 102, 241, 0.2)',
      borderRadius: 'var(--radius-lg)'
    }} className="glass-panel animate-slide-up">
      
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
          <strong style={{ color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif' }}>Lumina AI Advisor</strong>
        </div>
        <button 
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem' }}
        >✕</button>
      </div>

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
            {msg.content}
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
        padding: '1rem',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        gap: '0.5rem'
      }}>
        <input 
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask a question..."
          className="input-field"
          style={{ flex: 1, borderRadius: '20px', padding: '10px 16px' }}
        />
        <button 
          type="submit" 
          disabled={!inputText.trim() || isLoading}
          className="btn-primary"
          style={{ width: '40px', height: '40px', padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          ↑
        </button>
      </form>
    </div>
  );
}
