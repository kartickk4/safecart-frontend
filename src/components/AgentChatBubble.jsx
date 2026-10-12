import React from 'react';
import { Bot, User } from 'lucide-react';

/**
 * AgentChatBubble — A single message bubble in light friendly colors.
 * role: 'agent' | 'user'
 */
const AgentChatBubble = ({ role, content, timestamp }) => {
  const isAgent = role === 'agent';

  // Convert *bold* markdown to <strong> and newlines to <br>
  const formatContent = (text) => {
    if (!text) return '';
    const parts = text.split(/(\*[^*]+\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('*') && part.endsWith('*')) {
        return <strong key={i} style={{ color: isAgent ? '#1e293b' : '#ffffff', fontWeight: '700' }}>{part.slice(1, -1)}</strong>;
      }
      return part.split('\n').map((line, j, arr) => (
        <span key={`${i}-${j}`}>
          {line}
          {j < arr.length - 1 && <br />}
        </span>
      ));
    });
  };

  const time = timestamp
    ? new Date(timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isAgent ? 'row' : 'row-reverse',
        alignItems: 'flex-start',
        gap: '10px',
        marginBottom: '14px',
        animation: 'bubbleFadeIn 0.25s ease-out'
      }}
    >
      {/* Avatar */}
      {isAgent ? (
        <div style={{
          width: '34px',
          height: '34px',
          borderRadius: '50%',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)',
          marginTop: '2px',
          border: '1.5px solid #e0e7ff',
          background: '#ffffff'
        }}>
          <img src="/logo.jpg" alt="SecureKaro" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      ) : (
        <div style={{
          width: '34px',
          height: '34px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 3px 8px rgba(2, 132, 199, 0.25)',
          marginTop: '2px'
        }}>
          <User size={18} color="#ffffff" />
        </div>
      )}

      {/* Bubble */}
      <div style={{ maxWidth: '78%', display: 'flex', flexDirection: 'column', alignItems: isAgent ? 'flex-start' : 'flex-end' }}>
        <div style={{
          background: isAgent ? '#ffffff' : 'linear-gradient(135deg, #4f46e5, #6366f1)',
          color: isAgent ? '#334155' : '#ffffff',
          padding: '12px 16px',
          borderRadius: isAgent ? '4px 18px 18px 18px' : '18px 4px 18px 18px',
          fontSize: '13.5px',
          lineHeight: '1.6',
          border: isAgent ? '1.5px solid #e2e8f0' : 'none',
          boxShadow: isAgent
            ? '0 2px 10px rgba(99, 102, 241, 0.05), 0 1px 3px rgba(0,0,0,0.03)'
            : '0 4px 14px rgba(79, 70, 229, 0.25)',
          wordBreak: 'break-word'
        }}>
          {formatContent(content)}
        </div>
        {time && (
          <span style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '3px', padding: '0 4px' }}>
            {time}
          </span>
        )}
      </div>
    </div>
  );
};

export default AgentChatBubble;
