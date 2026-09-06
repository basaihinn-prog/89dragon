import React from 'react';
import { Bell, CheckCircle } from 'lucide-react';
import { GlassModal } from '../components/GlassModal';
import { useNotifications } from '../contexts/NotificationsContext';

export function NotificationsModal() {
  const { isModalVisible, hideModal, notifications, markRead } = useNotifications();

  return (
    <GlassModal visible={isModalVisible} onClose={hideModal} title="Notifications" maxHeight="70vh">
      <div style={{ padding: '16px' }}>
        {notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 20px' }}>
            <Bell size={40} color="rgba(255,255,255,0.2)" style={{ margin: '0 auto 12px' }} />
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>No notifications</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {notifications.map(n => (
              <div
                key={n.id}
                onClick={() => !n.read && markRead(n.id)}
                style={{
                  padding: '14px',
                  background: n.read ? 'rgba(255,255,255,0.03)' : 'rgba(212,175,55,0.05)',
                  border: `1px solid ${n.read ? 'rgba(255,255,255,0.08)' : 'rgba(212,175,55,0.2)'}`,
                  borderRadius: '12px',
                  cursor: n.read ? 'default' : 'pointer',
                  display: 'flex', gap: '12px', alignItems: 'flex-start',
                }}
              >
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50%', marginTop: '5px', flexShrink: 0,
                  background: n.read ? 'rgba(255,255,255,0.2)' : '#D4AF37',
                  boxShadow: n.read ? 'none' : '0 0 6px #D4AF37',
                }} />
                <div style={{ flex: 1 }}>
                  <p style={{
                    fontSize: '14px', fontWeight: '600',
                    color: n.read ? 'rgba(255,255,255,0.6)' : '#fff',
                    marginBottom: '4px',
                  }}>
                    {n.title}
                  </p>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)' }}>
                    {n.message}
                  </p>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', marginTop: '6px' }}>
                    {new Date(n.created_at).toLocaleDateString()}
                  </p>
                </div>
                {n.read && <CheckCircle size={14} color="rgba(255,255,255,0.2)" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </GlassModal>
  );
}
