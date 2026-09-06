import React, { useState, useEffect, useRef } from 'react';
import { NeonButton } from '../components/NeonButton';
import { NeonInput } from '../components/NeonInput';
import { useAuth } from '../contexts/AuthContext';

const logoUrl = '/logo.png';

function AnimatedOrb({ x, y, size, color, delay }: { x: string; y: string; size: number; color: string; delay: number }) {
  return (
    <div style={{
      position: 'absolute',
      left: x, top: y,
      width: size, height: size,
      borderRadius: '50%',
      background: color,
      filter: `blur(${size / 3}px)`,
      opacity: 0.35,
      animation: `floatOrb ${4 + delay}s ease-in-out ${delay}s infinite alternate`,
      pointerEvents: 'none',
    }} />
  );
}

export function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }
    setIsLoading(true);
    setError('');
    const result = await login(username.trim(), password);
    setIsLoading(false);
    if (!result.success) {
      setError(result.error || 'Login failed. Please try again.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    <div style={{
      width: '100%', height: '100%',
      background: 'linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 30%, #0f0520 70%, #0a0a1a 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Animated orbs */}
      <AnimatedOrb x="8%" y="15%" size={100} color="#00FF87" delay={0} />
      <AnimatedOrb x="78%" y="10%" size={80} color="#0099FF" delay={1} />
      <AnimatedOrb x="70%" y="65%" size={120} color="#A020F0" delay={2} />
      <AnimatedOrb x="12%" y="70%" size={90} color="#FF1493" delay={1.5} />
      <AnimatedOrb x="45%" y="5%" size={60} color="#0099FF" delay={0.5} />
      <AnimatedOrb x="85%" y="45%" size={50} color="#00FF87" delay={2.5} />

      {/* Login card */}
      <div style={{
        position: 'relative', zIndex: 10,
        width: '100%', maxWidth: '380px',
        padding: '0 20px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        {/* Logo */}
        <img
          src={logoUrl}
          alt="Jade Royale"
          onError={(e) => {
            const img = e.currentTarget;
            img.style.display = 'none';
            const next = img.nextElementSibling as HTMLElement;
            if (next) next.style.display = 'flex';
          }}
          style={{ width: '180px', height: '180px', objectFit: 'contain', marginBottom: '24px', mixBlendMode: 'screen', borderRadius: '20px' }}
        />
        {/* Fallback title if logo fails */}
        <div style={{
          display: 'none',
          flexDirection: 'column', alignItems: 'center',
          marginBottom: '24px',
        }}>
          <span style={{
            fontFamily: 'Orbitron, sans-serif',
            fontSize: '32px', fontWeight: '900',
            color: '#D4AF37',
            textShadow: '0 0 20px rgba(212,175,55,0.7), 0 0 40px rgba(212,175,55,0.4)',
            letterSpacing: '2px',
          }}>
            JADE
          </span>
          <span style={{
            fontFamily: 'Orbitron, sans-serif',
            fontSize: '20px', fontWeight: '700',
            color: 'rgba(212,175,55,0.7)', letterSpacing: '6px',
          }}>
            ROYALE
          </span>
        </div>

        {/* Card */}
        <div style={{
          width: '100%',
          background: 'linear-gradient(180deg, rgba(26,10,46,0.9) 0%, rgba(15,5,32,0.95) 100%)',
          border: '1px solid rgba(212,175,55,0.4)',
          borderRadius: '20px',
          padding: '28px 24px',
          boxShadow: '0 0 30px rgba(212,175,55,0.15), 0 20px 60px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(12px)',
        }}>
          {/* Decorative line */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(212,175,55,0.3)' }} />
            <div style={{
              width: '8px', height: '8px',
              background: 'linear-gradient(135deg, #FFD700, #FFA500)',
              transform: 'rotate(45deg)',
            }} />
            <div style={{ flex: 1, height: '1px', background: 'rgba(212,175,55,0.3)' }} />
          </div>

          <h2 style={{
            color: '#D4AF37',
            fontSize: '20px', fontWeight: '800',
            textAlign: 'center', marginBottom: '6px',
            textShadow: '0 0 12px rgba(212,175,55,0.5)',
            letterSpacing: '1px',
            fontFamily: 'Orbitron, sans-serif',
          }}>
            Welcome Back
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', fontSize: '13px', marginBottom: '20px' }}>
            Sign in to continue playing
          </p>

          {error && (
            <div style={{
              background: 'rgba(255,51,102,0.15)',
              border: '1px solid rgba(255,51,102,0.4)',
              borderRadius: '10px', padding: '10px 14px',
              marginBottom: '16px',
            }}>
              <p style={{ color: '#FF6B8A', fontSize: '13px', textAlign: 'center' }}>{error}</p>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '6px' }}>
            <NeonInput
              value={username}
              onChange={setUsername}
              placeholder="Username"
              icon="user"
              autoComplete="username"
              error={!!error}
              onKeyDown={handleKeyDown}
            />
            <NeonInput
              value={password}
              onChange={setPassword}
              placeholder="Password"
              type="password"
              icon="lock"
              autoComplete="current-password"
              error={!!error}
              onKeyDown={handleKeyDown}
            />
          </div>

          <p style={{
            color: 'rgba(255,255,255,0.35)', fontSize: '12px',
            textAlign: 'center', marginBottom: '18px',
          }}>
            Contact your agent for help with login
          </p>

          <NeonButton
            onClick={handleLogin}
            loading={isLoading}
            disabled={isLoading}
            variant="royale"
            fullWidth
            size="lg"
          >
            Sign In
          </NeonButton>

          {/* Footer decoration */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '20px' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(212,175,55,0.15)' }} />
            <span style={{
              fontSize: '10px', fontWeight: '700',
              color: 'rgba(212,175,55,0.3)', letterSpacing: '4px',
            }}>
              JADE ROYALE
            </span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(212,175,55,0.15)' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
