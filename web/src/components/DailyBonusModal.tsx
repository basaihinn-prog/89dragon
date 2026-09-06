import React, { useState } from 'react';
import { Gift, CheckCircle, Clock } from 'lucide-react';
import { GlassModal } from './GlassModal';
import { NeonButton } from './NeonButton';
import { useDailyBonus } from '../contexts/DailyBonusContext';
import { useAuth } from '../contexts/AuthContext';

export function DailyBonusModal() {
  const { isModalVisible, hideModal, canClaimToday, rewardStatus, claimBonus, isLoading } = useDailyBonus();
  const { refreshBalance } = useAuth();
  const [claimed, setClaimed] = useState(false);
  const [claimError, setClaimError] = useState('');

  const handleClaim = async () => {
    const success = await claimBonus();
    if (success) {
      setClaimed(true);
      setClaimError('');
      await refreshBalance();
    } else {
      setClaimError('Failed to claim bonus. Please try again.');
    }
  };

  const days = rewardStatus?.claimed_days || [];
  const currentDay = rewardStatus?.current_day || 1;

  return (
    <GlassModal visible={isModalVisible} onClose={hideModal} title="Daily Bonus">
      <div style={{ padding: '20px', textAlign: 'center' }}>
        {/* Icon */}
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 16px',
          background: 'linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.05))',
          border: '2px solid rgba(212,175,55,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 20px rgba(212,175,55,0.3)',
        }}>
          <Gift size={36} color="#D4AF37" />
        </div>

        {claimed ? (
          <div>
            <CheckCircle size={24} color="#00FF87" style={{ margin: '0 auto 12px' }} />
            <p style={{ color: '#00FF87', fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>
              Bonus Claimed!
            </p>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>
              Your daily bonus has been added to your balance.
            </p>
          </div>
        ) : canClaimToday ? (
          <div>
            <h3 style={{ color: '#D4AF37', fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>
              Daily Login Bonus
            </h3>
            <p style={{ color: '#fff', fontSize: '28px', fontWeight: '800', marginBottom: '4px' }}>
              ${rewardStatus?.reward_amount || '0'}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginBottom: '20px' }}>
              Available to claim today
            </p>
            {claimError && (
              <p style={{ color: '#FF6B8A', fontSize: '13px', marginBottom: '12px' }}>{claimError}</p>
            )}
            <NeonButton onClick={handleClaim} loading={isLoading} variant="royale" fullWidth>
              Claim Bonus
            </NeonButton>
          </div>
        ) : (
          <div>
            <Clock size={24} color="rgba(255,255,255,0.4)" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ color: '#D4AF37', fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>
              Already Claimed
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginBottom: '16px' }}>
              Come back tomorrow for your next bonus!
            </p>
            {rewardStatus?.next_claim_available && (
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
                Next bonus: {new Date(rewardStatus.next_claim_available).toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        {/* Day tracker */}
        {currentDay > 0 && (
          <div style={{ marginTop: '20px' }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginBottom: '10px' }}>
              Login Streak - Day {currentDay}
            </p>
            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {Array.from({ length: 7 }, (_, i) => {
                const day = i + 1;
                const isClaimed = days.includes(day);
                const isCurrent = day === currentDay;
                return (
                  <div key={day} style={{
                    width: '36px', height: '36px', borderRadius: '8px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontWeight: '700',
                    background: isClaimed
                      ? 'rgba(212,175,55,0.3)'
                      : isCurrent
                      ? 'rgba(212,175,55,0.1)'
                      : 'rgba(255,255,255,0.05)',
                    border: isCurrent ? '1px solid #D4AF37' : '1px solid rgba(255,255,255,0.1)',
                    color: isClaimed ? '#D4AF37' : isCurrent ? '#D4AF37' : 'rgba(255,255,255,0.3)',
                  }}>
                    {day}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </GlassModal>
  );
}
