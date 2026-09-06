import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, QrCode, Lock, Eye, EyeOff } from 'lucide-react';
import { NeonButton } from '../components/NeonButton';
import { NeonInput } from '../components/NeonInput';
import { useAuth } from '../contexts/AuthContext';

const PIN_STORAGE_KEY = 'jr_withdrawal_pin';

type ScreenState = 'setup_pin' | 'verify_pin' | 'show_qr';

export function WithdrawalScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [screenState, setScreenState] = useState<ScreenState>(() => {
    return localStorage.getItem(PIN_STORAGE_KEY) ? 'verify_pin' : 'setup_pin';
  });
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSetupPin = () => {
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setError('PIN must be exactly 4 digits');
      return;
    }
    if (pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }
    localStorage.setItem(PIN_STORAGE_KEY, pin);
    setPin('');
    setConfirmPin('');
    setError('');
    setScreenState('show_qr');
  };

  const handleVerifyPin = () => {
    const savedPin = localStorage.getItem(PIN_STORAGE_KEY);
    if (pin === savedPin) {
      setPin('');
      setError('');
      setScreenState('show_qr');
    } else {
      setError('Incorrect PIN');
      setPin('');
    }
  };

  const qrData = user ? JSON.stringify({
    username: user.username,
    user_id: user.user_id,
    balance: user.balance,
    timestamp: Date.now(),
  }) : '';

  // Simple QR code URL using a public API
  const qrUrl = qrData ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}&bgcolor=0A0514&color=D4AF37&margin=10` : '';

  return (
    <div style={{
      width: '100%', height: '100%',
      background: 'linear-gradient(180deg, #050208 0%, #0A0514 30%, #150A28 100%)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '14px',
        padding: '14px 16px',
        background: 'rgba(0,0,0,0.4)',
        borderBottom: '1px solid rgba(212,175,55,0.15)',
        flexShrink: 0,
      }}>
        <button onClick={() => navigate(-1)} style={{
          background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', padding: '4px',
        }}>
          <ArrowLeft size={20} />
        </button>
        <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '16px', fontWeight: '700', color: '#D4AF37' }}>
          Withdrawal
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ width: '100%', maxWidth: '380px' }}>

          {screenState === 'setup_pin' && (
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(212,175,55,0.2)',
              borderRadius: '20px', padding: '28px 24px',
            }}>
              <div style={{
                width: '72px', height: '72px', borderRadius: '50%',
                background: 'rgba(160,32,240,0.1)',
                border: '2px solid rgba(160,32,240,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
              }}>
                <Lock size={32} color="#A020F0" />
              </div>
              <h2 style={{ color: '#D4AF37', fontSize: '20px', fontWeight: '800', textAlign: 'center', marginBottom: '8px', fontFamily: 'Orbitron, sans-serif' }}>
                Set Withdrawal PIN
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', textAlign: 'center', marginBottom: '24px' }}>
                Create a 4-digit PIN to secure your withdrawal QR code
              </p>
              {error && <p style={{ color: '#FF6B8A', fontSize: '13px', textAlign: 'center', marginBottom: '12px' }}>{error}</p>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                <PinInput value={pin} onChange={setPin} placeholder="Enter 4-digit PIN" />
                <PinInput value={confirmPin} onChange={setConfirmPin} placeholder="Confirm PIN" />
              </div>
              <NeonButton onClick={handleSetupPin} variant="royale" fullWidth size="lg">
                Set PIN
              </NeonButton>
            </div>
          )}

          {screenState === 'verify_pin' && (
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(212,175,55,0.2)',
              borderRadius: '20px', padding: '28px 24px',
            }}>
              <div style={{
                width: '72px', height: '72px', borderRadius: '50%',
                background: 'rgba(160,32,240,0.1)',
                border: '2px solid rgba(160,32,240,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
              }}>
                <Lock size={32} color="#A020F0" />
              </div>
              <h2 style={{ color: '#D4AF37', fontSize: '20px', fontWeight: '800', textAlign: 'center', marginBottom: '8px', fontFamily: 'Orbitron, sans-serif' }}>
                Enter PIN
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', textAlign: 'center', marginBottom: '24px' }}>
                Enter your withdrawal PIN to proceed
              </p>
              {error && <p style={{ color: '#FF6B8A', fontSize: '13px', textAlign: 'center', marginBottom: '12px' }}>{error}</p>}
              <div style={{ marginBottom: '20px' }}>
                <PinInput value={pin} onChange={setPin} placeholder="Your 4-digit PIN" onEnter={handleVerifyPin} />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <NeonButton onClick={() => {
                  localStorage.removeItem(PIN_STORAGE_KEY);
                  setPin('');
                  setError('');
                  setScreenState('setup_pin');
                }} variant="ghost" fullWidth>
                  Reset PIN
                </NeonButton>
                <NeonButton onClick={handleVerifyPin} variant="royale" fullWidth>
                  Unlock
                </NeonButton>
              </div>
            </div>
          )}

          {screenState === 'show_qr' && (
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(212,175,55,0.2)',
              borderRadius: '20px', padding: '28px 24px',
              textAlign: 'center',
            }}>
              <QrCode size={40} color="#D4AF37" style={{ margin: '0 auto 16px', filter: 'drop-shadow(0 0 10px rgba(212,175,55,0.5))' }} />
              <h2 style={{ color: '#D4AF37', fontSize: '20px', fontWeight: '800', marginBottom: '6px', fontFamily: 'Orbitron, sans-serif' }}>
                Withdrawal QR Code
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginBottom: '24px' }}>
                Show this QR code to your agent to process your withdrawal
              </p>

              {/* QR Code */}
              <div style={{
                width: '220px', height: '220px',
                background: 'rgba(0,0,0,0.5)',
                border: '2px solid rgba(212,175,55,0.4)',
                borderRadius: '16px',
                overflow: 'hidden', margin: '0 auto 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <img src={qrUrl} alt="Withdrawal QR" style={{ width: '200px', height: '200px' }} />
              </div>

              <div style={{
                background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '14px',
                marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px' }}>Player</span>
                  <span style={{ color: '#fff', fontSize: '13px', fontWeight: '600' }}>{user?.username}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px' }}>Balance</span>
                  <span style={{ color: '#FFD700', fontSize: '14px', fontWeight: '700' }}>${(user?.balance ?? 0).toFixed(2)}</span>
                </div>
              </div>

              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', marginBottom: '16px' }}>
                Max cashout: $500/day | Limit may vary
              </p>

              <NeonButton onClick={() => { setScreenState('verify_pin'); }} variant="ghost" fullWidth>
                Lock
              </NeonButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PinInput({ value, onChange, placeholder, onEnter }: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; onEnter?: () => void;
}) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => {
          const v = e.target.value.replace(/\D/g, '').slice(0, 4);
          onChange(v);
        }}
        onKeyDown={e => { if (e.key === 'Enter' && onEnter) onEnter(); }}
        placeholder={placeholder}
        maxLength={4}
        inputMode="numeric"
        style={{
          width: '100%', height: '52px',
          textAlign: 'center', letterSpacing: '12px',
          fontSize: '24px', fontWeight: '700',
          background: 'rgba(0,0,0,0.4)',
          border: '1px solid rgba(212,175,55,0.3)',
          borderRadius: '14px', color: '#fff',
          outline: 'none',
          paddingLeft: '40px',
        }}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        style={{
          position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)',
        }}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}
