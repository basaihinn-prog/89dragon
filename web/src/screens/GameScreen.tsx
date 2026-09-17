import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { Game } from '../services/api';
import { launchGameSession } from '../services/gameApi';

export function GameScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token, refreshBalance } = useAuth();
  const game: Game | undefined = location.state?.game;

  const [gameUrl, setGameUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!game || !token) {
      navigate('/', { replace: true });
      return;
    }

    let cancelled = false;

    async function loadGame() {
      setIsLoading(true);
      setError(null);
      setGameUrl(null);

      const result = await launchGameSession(token, game.name);
      if (cancelled) return;

      if (!result.success || !result.data?.url) {
        setError(result.error || 'Unable to launch this game.');
        setIsLoading(false);
        return;
      }

      setGameUrl(result.data.url);
    }

    loadGame();
    return () => {
      cancelled = true;
    };
  }, [game, token, retryCount, navigate]);

  const handleBack = async () => {
    await refreshBalance();
    navigate('/');
  };

  if (!game) return null;

  return (
    <div style={styles.root}>
      <div style={styles.topBar}>
        <button onClick={handleBack} style={styles.iconButton} aria-label="Back">
          <ArrowLeft size={18} />
        </button>

        <div style={styles.balancePill}>
          <span style={styles.balanceText}>${(user?.balance ?? 0).toFixed(2)}</span>
          <button onClick={() => refreshBalance()} style={styles.refreshButton} aria-label="Refresh balance">
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      {error ? (
        <div style={styles.centered}>
          <p style={styles.errorText}>{error}</p>
          <button onClick={() => setRetryCount((value) => value + 1)} style={styles.retryButton}>
            Try Again
          </button>
          <button onClick={handleBack} style={styles.secondaryButton}>
            Go Back
          </button>
        </div>
      ) : !gameUrl ? (
        <div style={styles.centered}>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>Starting {game.title || game.name}…</p>
        </div>
      ) : (
        <iframe
          src={gameUrl}
          style={styles.iframe}
          allow="fullscreen; autoplay; clipboard-write"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          title={game.title || game.name}
          onLoad={() => setIsLoading(false)}
        />
      )}

      {isLoading && gameUrl && !error ? (
        <div style={styles.loadingOverlay}>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>Loading game…</p>
        </div>
      ) : null}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    width: '100%',
    height: '100%',
    minHeight: '100vh',
    background: '#000',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 14px',
    background: 'linear-gradient(rgba(0,0,0,0.82), transparent)',
    zIndex: 100,
    pointerEvents: 'none',
  },
  iconButton: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: '1px solid rgba(255,255,255,0.2)',
    background: 'rgba(0,0,0,0.65)',
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'auto',
  },
  balancePill: {
    background: 'rgba(0,0,0,0.65)',
    border: '1px solid rgba(212,175,55,0.3)',
    borderRadius: '10px',
    padding: '6px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    pointerEvents: 'auto',
  },
  balanceText: { color: '#D4AF37', fontSize: '13px', fontWeight: 700 },
  refreshButton: { background: 'none', border: 0, color: '#D4AF37', cursor: 'pointer', padding: 0, display: 'flex' },
  iframe: { width: '100%', height: '100vh', border: 0, background: '#000' },
  centered: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: '16px',
    padding: '20px',
  },
  loadingOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.92)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: '16px',
    zIndex: 50,
  },
  spinner: {
    width: '48px',
    height: '48px',
    border: '3px solid rgba(212,175,55,0.2)',
    borderTopColor: '#D4AF37',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: { color: 'rgba(255,255,255,0.68)', fontSize: '14px' },
  errorText: { color: '#FF6B8A', textAlign: 'center', maxWidth: '520px' },
  retryButton: {
    border: 0,
    borderRadius: '10px',
    padding: '10px 20px',
    background: '#D4AF37',
    color: '#111',
    fontWeight: 700,
    cursor: 'pointer',
  },
  secondaryButton: {
    borderRadius: '10px',
    padding: '10px 20px',
    background: 'rgba(212,175,55,0.1)',
    border: '1px solid rgba(212,175,55,0.3)',
    color: '#D4AF37',
    cursor: 'pointer',
  },
};
