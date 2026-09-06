import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, RefreshCw, LogOut, Clock, TrendingUp } from 'lucide-react';
import { NeonButton } from '../components/NeonButton';
import { useAuth } from '../contexts/AuthContext';
import { getTransactions, getGameActivity, Transaction } from '../services/api';

type Tab = 'details' | 'transactions' | 'activity';

export function ProfileScreen() {
  const navigate = useNavigate();
  const { user, token, logout, refreshBalance, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('details');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    const [txResult, actResult] = await Promise.all([
      getTransactions(token),
      getGameActivity(token),
    ]);
    if (txResult.success && txResult.data) setTransactions(txResult.data);
    if (actResult.success && actResult.data) {
      const d = (actResult.data as any).activity || (actResult.data as any).data?.activity || actResult.data;
      setActivity(Array.isArray(d) ? d.slice(0, 20) : []);
    }
    setIsLoading(false);
  }, [token]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshBalance();
    await refreshProfile();
    setIsRefreshing(false);
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      logout();
      navigate('/');
    }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'details', label: 'Profile' },
    { id: 'transactions', label: 'Transactions' },
    { id: 'activity', label: 'Activity' },
  ];

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
        <button onClick={() => navigate('/')} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'rgba(255,255,255,0.7)', padding: '4px',
        }}>
          <ArrowLeft size={20} />
        </button>
        <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '16px', fontWeight: '700', color: '#D4AF37' }}>
          My Profile
        </span>
        <button onClick={handleRefresh} style={{
          marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer',
          color: 'rgba(255,255,255,0.5)',
        }}>
          <RefreshCw size={16} style={{ animation: isRefreshing ? 'spin 0.7s linear infinite' : 'none' }} />
        </button>
      </div>

      {/* Avatar & info */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '16px',
        padding: '20px 20px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(212,175,55,0.3), rgba(160,32,240,0.3))',
          border: '2px solid rgba(212,175,55,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', flexShrink: 0,
        }}>
          {user?.avatar ? (
            <img src={user.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          ) : (
            <User size={28} color="rgba(212,175,55,0.7)" />
          )}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '18px', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>
            {user?.username}
          </p>
          <p style={{ fontSize: '22px', fontWeight: '800', color: '#FFD700', textShadow: '0 0 10px rgba(255,215,0,0.4)' }}>
            ${(user?.balance ?? 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '0 16px', flexShrink: 0, gap: '4px',
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 16px',
              background: 'none', border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #D4AF37' : '2px solid transparent',
              color: activeTab === tab.id ? '#D4AF37' : 'rgba(255,255,255,0.4)',
              fontSize: '13px', fontWeight: '600', cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {activeTab === 'details' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <InfoRow icon={<User size={15} />} label="Username" value={user?.username || '-'} />
            <InfoRow icon={<Mail size={15} />} label="Email" value={user?.email || '-'} />
            {user?.phone && <InfoRow icon={<Phone size={15} />} label="Phone" value={user.phone} />}
            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <NeonButton onClick={() => navigate('/settings')} variant="secondary" fullWidth>
                Settings
              </NeonButton>
              <NeonButton onClick={() => navigate('/deposit')} variant="primary" fullWidth>
                Deposit (PIN Code)
              </NeonButton>
              <NeonButton onClick={() => navigate('/withdrawal')} variant="secondary" fullWidth>
                Withdraw
              </NeonButton>
              <NeonButton onClick={() => navigate('/transactions')} variant="ghost" fullWidth>
                Transaction History
              </NeonButton>
              <NeonButton onClick={handleLogout} variant="danger" fullWidth>
                <LogOut size={15} /> Log Out
              </NeonButton>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div>
            {isLoading ? (
              <LoadingState />
            ) : transactions.length === 0 ? (
              <EmptyState text="No transactions yet" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {transactions.map(tx => (
                  <div key={tx.id} style={{
                    padding: '12px 14px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: '600', color: '#fff', marginBottom: '2px' }}>
                        {tx.title || tx.type}
                      </p>
                      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
                        {new Date(tx.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span style={{
                      fontSize: '15px', fontWeight: '700',
                      color: parseFloat(tx.sum) >= 0 ? '#00FF87' : '#FF6B8A',
                    }}>
                      {parseFloat(tx.sum) >= 0 ? '+' : ''}${parseFloat(tx.sum).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div>
            {isLoading ? (
              <LoadingState />
            ) : activity.length === 0 ? (
              <EmptyState text="No game activity yet" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {activity.map((item, idx) => (
                  <div key={idx} style={{
                    padding: '12px 14px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: '600', color: '#fff', marginBottom: '2px' }}>
                        {item.game}
                      </p>
                      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
                        Bet: ${parseFloat(item.bet || 0).toFixed(2)}
                      </p>
                    </div>
                    <span style={{
                      fontSize: '14px', fontWeight: '700',
                      color: parseFloat(item.win || 0) > 0 ? '#FFD700' : 'rgba(255,255,255,0.4)',
                    }}>
                      Win: ${parseFloat(item.win || 0).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{
      padding: '12px 16px',
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '12px',
      display: 'flex', alignItems: 'center', gap: '12px',
    }}>
      <span style={{ color: 'rgba(212,175,55,0.6)' }}>{icon}</span>
      <div>
        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginBottom: '2px' }}>{label}</p>
        <p style={{ fontSize: '15px', color: '#fff', fontWeight: '500' }}>{value}</p>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ textAlign: 'center', padding: '32px' }}>
      <div style={{
        width: '32px', height: '32px',
        border: '3px solid rgba(212,175,55,0.2)', borderTopColor: '#D4AF37',
        borderRadius: '50%', animation: 'spin 0.8s linear infinite',
        margin: '0 auto',
      }} />
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '32px' }}>
      <Clock size={32} color="rgba(255,255,255,0.2)" style={{ margin: '0 auto 12px' }} />
      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '14px' }}>{text}</p>
    </div>
  );
}
