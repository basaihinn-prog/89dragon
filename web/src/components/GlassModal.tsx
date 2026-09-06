import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface GlassModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
  maxHeight?: string;
}

export function GlassModal({ visible, onClose, title, children, maxWidth = '480px', maxHeight = '80vh' }: GlassModalProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (visible) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.2s ease',
        padding: '16px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth, maxHeight,
          background: 'linear-gradient(180deg, rgba(26,10,46,0.95) 0%, rgba(15,5,32,0.98) 100%)',
          border: '1px solid rgba(212,175,55,0.3)',
          borderRadius: '20px',
          boxShadow: '0 0 40px rgba(212,175,55,0.2), 0 20px 60px rgba(0,0,0,0.8)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          animation: 'scaleIn 0.2s ease',
        }}
      >
        {/* Header */}
        {title && (
          <div style={{
            padding: '18px 20px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <span style={{
              fontSize: '16px', fontWeight: '700',
              color: '#D4AF37',
              textShadow: '0 0 10px rgba(212,175,55,0.4)',
              letterSpacing: '0.5px',
              fontFamily: 'Orbitron, sans-serif',
            }}>
              {title}
            </span>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '8px', width: '32px', height: '32px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'rgba(255,255,255,0.7)',
                transition: 'all 0.15s ease',
              }}
            >
              <X size={16} />
            </button>
          </div>
        )}
        {/* Content */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
