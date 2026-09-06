import React, { useState } from 'react';

interface NeonButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'royale' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  style?: React.CSSProperties;
  type?: 'button' | 'submit';
}

const variants = {
  primary: {
    background: 'linear-gradient(135deg, #00FF87 0%, #0099FF 100%)',
    border: 'none',
    color: '#000',
    shadow: '0 0 20px rgba(0,255,135,0.4)',
    hoverShadow: '0 0 30px rgba(0,255,135,0.6)',
  },
  royale: {
    background: 'linear-gradient(135deg, #B8860B 0%, #D4AF37 30%, #FFD700 50%, #D4AF37 70%, #B8860B 100%)',
    border: 'none',
    color: '#000',
    shadow: '0 0 20px rgba(212,175,55,0.5)',
    hoverShadow: '0 0 35px rgba(212,175,55,0.8)',
  },
  secondary: {
    background: 'rgba(160,32,240,0.2)',
    border: '1px solid rgba(160,32,240,0.6)',
    color: '#fff',
    shadow: '0 0 15px rgba(160,32,240,0.3)',
    hoverShadow: '0 0 25px rgba(160,32,240,0.5)',
  },
  danger: {
    background: 'rgba(255,51,102,0.2)',
    border: '1px solid rgba(255,51,102,0.6)',
    color: '#FF6B8A',
    shadow: '0 0 15px rgba(255,51,102,0.3)',
    hoverShadow: '0 0 25px rgba(255,51,102,0.5)',
  },
  ghost: {
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.2)',
    color: 'rgba(255,255,255,0.7)',
    shadow: 'none',
    hoverShadow: '0 0 10px rgba(255,255,255,0.1)',
  },
};

const sizes = {
  sm: { padding: '8px 16px', fontSize: '13px', borderRadius: '10px', height: '36px' },
  md: { padding: '10px 20px', fontSize: '14px', borderRadius: '12px', height: '44px' },
  lg: { padding: '14px 28px', fontSize: '15px', borderRadius: '14px', height: '52px' },
};

export function NeonButton({
  children, onClick, disabled, loading, variant = 'primary', size = 'md', fullWidth, style, type = 'button'
}: NeonButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const v = variants[variant];
  const s = sizes[size];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setIsPressed(false); }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        width: fullWidth ? '100%' : undefined,
        height: s.height,
        padding: s.padding,
        fontSize: s.fontSize,
        fontWeight: '700',
        fontFamily: 'inherit',
        background: v.background,
        border: v.border,
        color: v.color,
        borderRadius: s.borderRadius,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.6 : 1,
        boxShadow: isHovered && !disabled ? v.hoverShadow : v.shadow,
        transform: isPressed && !disabled ? 'scale(0.97)' : 'scale(1)',
        transition: 'all 0.15s ease',
        letterSpacing: '0.5px',
        textTransform: 'uppercase' as const,
        userSelect: 'none',
        ...style,
      }}
    >
      {loading ? (
        <span style={{
          display: 'inline-block',
          width: '16px',
          height: '16px',
          border: `2px solid ${v.color}40`,
          borderTopColor: v.color,
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
        }} />
      ) : children}
    </button>
  );
}
