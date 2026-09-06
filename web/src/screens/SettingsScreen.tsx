import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Music, Volume2, Lock, Shield } from 'lucide-react';
import { NeonButton } from '../components/NeonButton';
import { NeonInput } from '../components/NeonInput';
import { useAuth } from '../contexts/AuthContext';
import { useAudio } from '../contexts/AudioContext';
import { changePassword } from '../services/api';

export function SettingsScreen() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { isMusicEnabled, volume, toggleMusic, setVolume } = useAudio();
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMessage, setPwMessage] = useState('');
  const [pwError, setPwError] = useState('');

  const handleChangePassword = async () => {
    if (!token) return;
    if (!currentPw || !newPw || !confirmPw) {
      setPwError('All fields are required');
      return;
    }
    if (newPw !== confirmPw) {
      setPwError('New passwords do not match');
      return;
    }
    if (newPw.length < 8) {
      setPwError('Password must be at least 8 characters');
      return;
    }
    setPwLoading(true);
    setPwError('');
    setPwMessage('');
    const result = await changePassword(token, currentPw, newPw);
    setPwLoading(false);
    if (result.success) {
      setPwMessage('Password changed successfully!');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      setShowPasswordForm(false);
    } else {
      setPwError(result.error || 'Failed to change password');
    }
  };

  return (
    <div style={{
      width: '100%', height: '100%',
      background: 'linear-gradient(180deg, #050208 0%, #0A0514 30%, #150A28 100%)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
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
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'rgba(255,255,255,0.7)', padding: '4px',
        }}>
          <ArrowLeft size={20} />
        </button>
        <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '16px', fontWeight: '700', color: '#D4AF37' }}>
          Settings
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Audio section */}
        <SectionCard title="Audio" icon={<Music size={16} />}>
          <SettingRow
            label="Background Music"
            right={
              <Toggle enabled={isMusicEnabled} onChange={toggleMusic} />
            }
          />
          {isMusicEnabled && (
            <div style={{ padding: '0 16px 14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Volume2 size={14} color="rgba(255,255,255,0.4)" />
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={e => setVolume(parseFloat(e.target.value))}
                style={{ flex: 1, accentColor: '#D4AF37', height: '4px' }}
              />
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', minWidth: '32px' }}>
                {Math.round(volume * 100)}%
              </span>
            </div>
          )}
        </SectionCard>

        {/* Account section */}
        <SectionCard title="Account" icon={<Shield size={16} />}>
          {pwMessage && (
            <div style={{ padding: '10px 16px', marginBottom: '4px', background: 'rgba(0,255,135,0.1)', borderRadius: '8px', margin: '8px 14px' }}>
              <p style={{ color: '#00FF87', fontSize: '13px' }}>{pwMessage}</p>
            </div>
          )}
          <SettingRow
            label="Change Password"
            right={
              <button
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                style={{
                  background: 'rgba(212,175,55,0.1)',
                  border: '1px solid rgba(212,175,55,0.3)',
                  borderRadius: '8px', padding: '6px 14px',
                  color: '#D4AF37', fontSize: '12px', fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                {showPasswordForm ? 'Cancel' : 'Change'}
              </button>
            }
          />
          {showPasswordForm && (
            <div style={{ padding: '10px 14px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {pwError && (
                <p style={{ color: '#FF6B8A', fontSize: '12px' }}>{pwError}</p>
              )}
              <NeonInput value={currentPw} onChange={setCurrentPw} placeholder="Current Password" type="password" icon="lock" />
              <NeonInput value={newPw} onChange={setNewPw} placeholder="New Password" type="password" icon="lock" />
              <NeonInput value={confirmPw} onChange={setConfirmPw} placeholder="Confirm New Password" type="password" icon="lock" />
              <NeonButton onClick={handleChangePassword} loading={pwLoading} variant="primary" fullWidth size="sm">
                Save Password
              </NeonButton>
            </div>
          )}
        </SectionCard>

        {/* About */}
        <SectionCard title="About" icon={<Lock size={16} />}>
          <SettingRow label="App Version" right={<span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px' }}>2.1.0</span>} />
          <SettingRow
            label="Terms of Service"
            right={
              <a href="https://bxbet.asia/terms" target="_blank" rel="noopener noreferrer"
                style={{ color: '#0099FF', fontSize: '13px', textDecoration: 'none' }}>
                View
              </a>
            }
          />
          <SettingRow
            label="Privacy Policy"
            right={
              <a href="https://bxbet.asia/privacy" target="_blank" rel="noopener noreferrer"
                style={{ color: '#0099FF', fontSize: '13px', textDecoration: 'none' }}>
                View
              </a>
            }
          />
        </SectionCard>
      </div>
    </div>
  );
}

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '14px', overflow: 'hidden',
    }}>
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <span style={{ color: '#D4AF37' }}>{icon}</span>
        <span style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(212,175,55,0.9)', letterSpacing: '0.5px', textTransform: 'uppercase' as const }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

function SettingRow({ label, right }: { label: string; right: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '13px 16px',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.75)' }}>{label}</span>
      {right}
    </div>
  );
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      style={{
        width: '44px', height: '24px', borderRadius: '12px',
        background: enabled ? '#D4AF37' : 'rgba(255,255,255,0.15)',
        border: 'none', cursor: 'pointer', position: 'relative',
        transition: 'all 0.2s ease',
        boxShadow: enabled ? '0 0 8px rgba(212,175,55,0.5)' : 'none',
      }}
    >
      <div style={{
        position: 'absolute', top: '3px',
        left: enabled ? '23px' : '3px',
        width: '18px', height: '18px', borderRadius: '50%',
        background: '#fff',
        transition: 'left 0.2s ease',
        boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
      }} />
    </button>
  );
}
