import React, { useState } from 'react';
import { Eye, EyeOff, User, Lock, Mail, Phone, Search } from 'lucide-react';

interface NeonInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: 'text' | 'password' | 'email' | 'tel' | 'number';
  icon?: 'user' | 'lock' | 'mail' | 'phone' | 'search';
  error?: boolean;
  disabled?: boolean;
  autoComplete?: string;
  autoCapitalize?: string;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  style?: React.CSSProperties;
}

const icons = { user: User, lock: Lock, mail: Mail, phone: Phone, search: Search };

export function NeonInput({
  value, onChange, placeholder, type = 'text', icon, error, disabled, autoComplete, autoCapitalize, onKeyDown, style
}: NeonInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const Icon = icon ? icons[icon] : null;

  const borderColor = error
    ? 'rgba(255,51,102,0.6)'
    : isFocused
    ? 'rgba(212,175,55,0.7)'
    : 'rgba(255,255,255,0.15)';

  const shadowColor = error
    ? '0 0 10px rgba(255,51,102,0.3)'
    : isFocused
    ? '0 0 15px rgba(212,175,55,0.3)'
    : 'none';

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      ...style,
    }}>
      {Icon && (
        <div style={{
          position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
          color: error ? '#FF6B8A' : isFocused ? '#D4AF37' : 'rgba(255,255,255,0.4)',
          pointerEvents: 'none', zIndex: 1,
          transition: 'color 0.2s ease',
        }}>
          <Icon size={16} />
        </div>
      )}
      <input
        type={type === 'password' && showPassword ? 'text' : type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={onKeyDown}
        style={{
          width: '100%',
          height: '48px',
          padding: `0 ${type === 'password' ? '44px' : '14px'} 0 ${Icon ? '42px' : '14px'}`,
          background: 'rgba(0,0,0,0.4)',
          border: `1px solid ${borderColor}`,
          borderRadius: '12px',
          color: '#fff',
          fontSize: '15px',
          outline: 'none',
          boxShadow: shadowColor,
          transition: 'all 0.2s ease',
          backdropFilter: 'blur(4px)',
        }}
      />
      {type === 'password' && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          style={{
            position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(255,255,255,0.4)', padding: '4px',
          }}
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      )}
    </div>
  );
}
