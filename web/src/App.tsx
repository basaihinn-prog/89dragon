import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { GamesProvider } from './contexts/GamesContext';
import { AudioProvider } from './contexts/AudioContext';
import { DailyBonusProvider } from './contexts/DailyBonusContext';
import { SpinWheelProvider } from './contexts/SpinWheelContext';
import { NotificationsProvider } from './contexts/NotificationsContext';
import { LoginScreen } from './screens/LoginScreen';
import { MainGalleryScreen } from './screens/MainGalleryScreen';
import { GameScreen } from './screens/GameScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { DepositScreen } from './screens/DepositScreen';
import { WithdrawalScreen } from './screens/WithdrawalScreen';

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{
        width: '100%', height: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#050208',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px', height: '48px',
            border: '3px solid rgba(212,175,55,0.2)',
            borderTopColor: '#D4AF37', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
          }} />
          <p style={{
            fontFamily: 'Orbitron, sans-serif',
            color: 'rgba(212,175,55,0.6)', fontSize: '14px', letterSpacing: '2px',
          }}>
            JADE ROYALE
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="*" element={<LoginScreen />} />
      </Routes>
    );
  }

  return (
    <GamesProvider>
      <AudioProvider>
        <DailyBonusProvider>
          <SpinWheelProvider>
            <NotificationsProvider>
              <Routes>
                <Route path="/" element={<MainGalleryScreen />} />
                <Route path="/game" element={<GameScreen />} />
                <Route path="/profile" element={<ProfileScreen />} />
                <Route path="/settings" element={<SettingsScreen />} />
                <Route path="/deposit" element={<DepositScreen />} />
                <Route path="/withdrawal" element={<WithdrawalScreen />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </NotificationsProvider>
          </SpinWheelProvider>
        </DailyBonusProvider>
      </AudioProvider>
    </GamesProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
