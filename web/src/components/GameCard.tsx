import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { Game, getGameImageUrl } from '../services/api';

interface GameCardProps {
  game: Game;
  isFavorite: boolean;
  onPress: () => void;
  onFavoritePress: () => void;
  width?: number;
  height?: number;
}

export function GameCard({ game, isFavorite, onPress, onFavoritePress, width = 160, height = 110 }: GameCardProps) {
  const [imgError, setImgError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const imgUrl = getGameImageUrl(game);

  return (
    <div
      onClick={onPress}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        width, height,
        borderRadius: '12px',
        overflow: 'hidden',
        cursor: 'pointer',
        flexShrink: 0,
        border: isHovered ? '1px solid rgba(212,175,55,0.6)' : '1px solid rgba(255,255,255,0.1)',
        boxShadow: isHovered ? '0 0 20px rgba(212,175,55,0.3), 0 8px 24px rgba(0,0,0,0.5)' : '0 4px 12px rgba(0,0,0,0.4)',
        transform: isHovered ? 'scale(1.04)' : 'scale(1)',
        transition: 'all 0.2s ease',
        background: '#150A28',
      }}
    >
      {/* Image */}
      {!imgError ? (
        <img
          src={imgUrl}
          alt={game.title}
          onError={() => setImgError(true)}
          onLoad={() => setImgLoaded(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: imgLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
        />
      ) : (
        <div style={{
          width: '100%', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg, #1a0a2e 0%, #2d1545 100%)',
        }}>
          <span style={{ fontSize: '32px' }}>🎰</span>
        </div>
      )}

      {/* Gradient overlay */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: '60%',
        background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
        pointerEvents: 'none',
      }} />

      {/* Game title */}
      <div style={{
        position: 'absolute', bottom: 6, left: 8, right: 24,
        pointerEvents: 'none',
      }}>
        <span style={{
          fontSize: '11px',
          fontWeight: '700',
          color: '#fff',
          textShadow: '0 1px 3px rgba(0,0,0,0.8)',
          display: 'block',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {game.title}
        </span>
      </div>

      {/* Favorite button */}
      <button
        onClick={e => { e.stopPropagation(); onFavoritePress(); }}
        style={{
          position: 'absolute', top: 6, right: 6,
          background: 'rgba(0,0,0,0.5)',
          border: 'none', borderRadius: '50%',
          width: '26px', height: '26px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
      >
        <Heart
          size={12}
          fill={isFavorite ? '#FF1493' : 'none'}
          color={isFavorite ? '#FF1493' : 'rgba(255,255,255,0.7)'}
          style={{ filter: isFavorite ? 'drop-shadow(0 0 4px #FF1493)' : 'none' }}
        />
      </button>

      {/* New / Hot label */}
      {game.label && (
        <div style={{
          position: 'absolute', top: 6, left: 6,
          background: game.label.toLowerCase() === 'hot'
            ? 'linear-gradient(135deg, #FF6B35, #FF3366)'
            : 'linear-gradient(135deg, #00FF87, #0099FF)',
          borderRadius: '4px',
          padding: '2px 6px',
          fontSize: '9px',
          fontWeight: '800',
          color: '#fff',
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
        }}>
          {game.label}
        </div>
      )}
    </div>
  );
}
