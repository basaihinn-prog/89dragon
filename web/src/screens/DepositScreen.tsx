import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import { NeonButton } from '../components/NeonButton';
import { NeonInput } from '../components/NeonInput';
import { useAuth } from '../contexts/AuthContext';
import { activatePinCode } from '../services/api';

type Status = 'idle' | 'loading' | 'success' | 'error';

interface DepositResult {
  amountAdded: string;
  newBalance: string;
  refundBonus: string;
}

export function DepositScreen() {
  const navigate = useNavigate();
  const { token, refreshBalance } = useAuth();
  const [pinCode, setPinCode] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [result, setResult] = useState<DepositResult | null>(null);

  const isValid = pinCode.replace(/[-\s]/g, '').length >= 8;

  const handleActivate = async () => {
    if (!isValid || !token) return;
    setStatus('loading');
    setErrorMessage('');
    setResult(null);

    const response = await activatePinCode(token, pinCode);
    const apiData = response.data as any;

    let resultData: any = null;
    if (apiData?.data) resultData = apiData.data;
    else if (apiData?.credit_history) resultData = apiData.credit_history;
    else if (apiData?.amount_added || apiData?.new_balance) resultData = apiData;

    const success = apiData?.success === true || (resultData && (resultData.amount_added || resultData.new_balance));

    if (success && resultData) {
      setStatus('success');
      setResult({
        amountAdded: resultData.amount_added || '0',
        newBalance: resultData.new_balance || '0',
        refundBonus: resultData.refund_bonus || '0',
      });
      setPinCode('');
      await refreshBalance();
    } else {
      setStatus('error');
      setErrorMessage(
        (apiData?.message || apiData?.error || response.error || 'Invalid PIN code. Please try again.')
      );
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setResult(null);
    setErrorMessage('');
    setPinCode('');
  };

  const formatPin = (value: string) => {
    const clean = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    return clean;
  };

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
          Deposit (PIN Code)
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>

          {status === 'success' && result ? (
            <div style={{
              textAlign: 'center', padding: '32px 24px',
              background: 'rgba(0,255,135,0.05)',
              border: '1px solid rgba(0,255,135,0.3)',
              borderRadius: '20px',
            }}>
              <CheckCircle size={56} color="#00FF87" style={{ margin: '0 auto 16px', filter: 'drop-shadow(0 0 10px #00FF87)' }} />
              <h2 style={{ color: '#00FF87', fontSize: '22px', fontWeight: '800', marginBottom: '8px' }}>
                Success!
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginBottom: '20px' }}>
                Your PIN code has been activated
              </p>
              <div style={{
                background: 'rgba(0,0,0,0.3)', borderRadius: '14px', padding: '16px',
                marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px',
              }}>
                <ResultRow label="Amount Added" value={`$${parseFloat(result.amountAdded).toFixed(2)}`} color="#00FF87" />
                <ResultRow label="New Balance" value={`$${parseFloat(result.newBalance).toFixed(2)}`} color="#FFD700" />
                {parseFloat(result.refundBonus) > 0 && (
                  <ResultRow label="Refund Bonus" value={`$${parseFloat(result.refundBonus).toFixed(2)}`} color="#A020F0" />
                )}
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <NeonButton onClick={handleReset} variant="ghost" fullWidth>
                  Activate Another
                </NeonButton>
                <NeonButton onClick={() => navigate('/')} variant="royale" fullWidth>
                  Play Now
                </NeonButton>
              </div>
            </div>
          ) : (
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(212,175,55,0.2)',
              borderRadius: '20px', padding: '28px 24px',
              boxShadow: '0 0 30px rgba(212,175,55,0.1)',
            }}>
              {/* Icon */}
              <div style={{
                width: '72px', height: '72px', borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.05))',
                border: '2px solid rgba(212,175,55,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
              }}>
                <CreditCard size={32} color="#D4AF37" />
              </div>

              <h2 style={{ color: '#D4AF37', fontSize: '20px', fontWeight: '800', textAlign: 'center', marginBottom: '8px', fontFamily: 'Orbitron, sans-serif' }}>
                Activate PIN Code
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', textAlign: 'center', marginBottom: '24px' }}>
                Enter your voucher PIN to deposit funds
              </p>

              {status === 'error' && (
                <div style={{
                  background: 'rgba(255,51,102,0.1)', border: '1px solid rgba(255,51,102,0.3)',
                  borderRadius: '10px', padding: '12px 14px', marginBottom: '16px',
                  display: 'flex', alignItems: 'center', gap: '10px',
                }}>
                  <AlertCircle size={16} color="#FF6B8A" />
                  <p style={{ color: '#FF6B8A', fontSize: '13px' }}>{errorMessage}</p>
                </div>
              )}

              <div style={{ marginBottom: '20px' }}>
                <NeonInput
                  value={pinCode}
                  onChange={v => setPinCode(formatPin(v))}
                  placeholder="Enter PIN Code"
                  icon="search"
                  style={{ fontSize: '18px', letterSpacing: '2px', textAlign: 'center' }}
                  onKeyDown={e => { if (e.key === 'Enter') handleActivate(); }}
                />
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', textAlign: 'center', marginTop: '8px' }}>
                  PIN codes are case-insensitive
                </p>
              </div>

              <NeonButton
                onClick={handleActivate}
                loading={status === 'loading'}
                disabled={!isValid || status === 'loading'}
                variant="royale"
                fullWidth
                size="lg"
              >
                Activate PIN
              </NeonButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>{label}</span>
      <span style={{ color, fontSize: '16px', fontWeight: '700' }}>{value}</span>
    </div>
  );
}
