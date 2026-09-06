import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Game, getGameLaunchUrlFromGame, launchGame } from '../services/api';

export function GameScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token, refreshBalance } = useAuth();
  const game: Game | undefined = location.state?.game;

  const [gameUrl, setGameUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!game || !token) {
      navigate('/');
      return;
    }
    loadGame();
  }, []);

  const loadGame = async () => {
    if (!game || !token) return;
    setIsLoading(true);
    setError(null);

    try {
      const result = await launchGame(token, game.name);
      if (result.success && result.data) {
        const url = (result.data as any).url || (result.data as any).launcher_url;
        if (url) {
          setGameUrl(url);
          setIsLoading(false);
          return;
        }
      }
    } catch {}

    const fallbackUrl = getGameLaunchUrlFromGame(game, token);
    setGameUrl(fallbackUrl);
    setIsLoading(false);
  };

  const handleBack = async () => {
    await refreshBalance();
    navigate('/');
  };

  if (!game) return null;

  return (
    <div style={{
      width: '100%', height: '100%',
      background: '#000',
      display: 'flex', flexDirection: 'column',
      position: 'relative',
    }}>
      {/* Top overlay bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px',
        background: 'linear-gradient(rgba(0,0,0,0.8), transparent)',
        zIndex: 100,
      }}>
        <button
          onClick={handleBack}
          style={{
            width: '40px', height: '40px', borderRadius: '50%',
            background: 'rgba(0,0,0,0.6)',
            border: '1px solid rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#fff',
            transition: 'all 0.15s ease',
          }}
        >
          <ArrowLeft size={18} />
        </button>

        <div style={{
          background: 'rgba(0,0,0,0.6)',
          border: '1px solid rgba(212,175,55,0.3)',
          borderRadius: '10px', padding: '6px 14px',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <span style={{ color: '#D4AF37', fontSize: '13px', fontWeight: '700' }}>
            ${(user?.balance ?? 0).toFixed(2)}
          </span>
          <button
            onClick={() => refreshBalance()}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <RefreshCw size={12} color="rgba(212,175,55,0.6)" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: '16px',
        }}>
          <div style={{
            width: '48px', height: '48px',
            border: '3px solid rgba(212,175,55,0.2)', borderTopColor: '#D4AF37',
            borderRadius: '50%', animation: 'spin 0.8s linear infinite',
          }} />
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>Loading {game.title}...</p>
        </div>
      ) : error ? (
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: '16px', padding: '20px',
        }}>
          <p style={{ color: '#FF6B8A', textAlign: 'center' }}>{error}</p>
          <button onClick={handleBack} style={{
            background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)',
            borderRadius: '10px', padding: '10px 20px', color: '#D4AF37', cursor: 'pointer',
          }}>
            Go Back
          </button>
        </div>
      ) : gameUrl ? (
        <iframe
          src={gameUrl}
          style={{ width: '100%', height: '100%', border: 'none', background: '#000' }}
          allow="fullscreen; autoplay; clipboard-write"
          title={game.title}
        />
      ) : null}
    </div>
  );
}
