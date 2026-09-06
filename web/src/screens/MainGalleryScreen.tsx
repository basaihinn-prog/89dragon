import React, { useEffect, useRef, useState } from 'react';
import { RefreshCw, Bell, User, Settings, Gift, Star, DollarSign, ArrowDown, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { GameCard } from '../components/GameCard';
import { DailyBonusModal } from '../components/DailyBonusModal';
import { SpinWheelModal } from '../components/SpinWheelModal';
import { NotificationsModal } from './NotificationsModal';
import { useAuth } from '../contexts/AuthContext';
import { useGames } from '../contexts/GamesContext';
import { useAudio } from '../contexts/AudioContext';
import { useDailyBonus } from '../contexts/DailyBonusContext';
import { useSpinWheel } from '../contexts/SpinWheelContext';
import { useNotifications } from '../contexts/NotificationsContext';
import { Game } from '../services/api';

const LOGO_URL = '/logo.png';

function AnimatedBackground() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, #050208 0%, #0A0514 30%, #150A28 70%, #0A0514 100%)',
      }} />
      {/* Subtle orbs */}
      <div style={{
        position: 'absolute', right: '10%', top: '20%',
        width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(160,32,240,0.08) 0%, transparent 70%)',
        animation: 'floatOrb 8s ease-in-out infinite alternate',
      }} />
      <div style={{
        position: 'absolute', left: '15%', bottom: '15%',
        width: 200, height: 200, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,153,255,0.06) 0%, transparent 70%)',
        animation: 'floatOrb 10s ease-in-out 2s infinite alternate',
      }} />
    </div>
  );
}

export function MainGalleryScreen() {
  const navigate = useNavigate();
  const { user, logout, refreshBalance } = useAuth();
  const { games, favorites, isLoading, error, selectedCategory, setSelectedCategory, toggleFavorite, getFilteredGames, refreshGames, usingCache, categories } = useGames();
  const { playDashboardMusic } = useAudio();
  const { showModal: showBonus, canClaimToday } = useDailyBonus();
  const { showModal: showSpinWheel } = useSpinWheel();
  const { showModal: showNotifications, unreadCount } = useNotifications();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    playDashboardMusic();
  }, []);

  const handleRefreshBalance = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    await refreshBalance();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleRefreshGames = async () => {
    await refreshGames();
  };

  const handleGamePress = (game: Game) => {
    navigate('/game', { state: { game } });
  };

  const filteredGames = getFilteredGames();

  const scrollCarousel = (dir: 'left' | 'right') => {
    if (!carouselRef.current) return;
    const amount = 300;
    carouselRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  const CARD_WIDTH = 160;
  const CARD_HEIGHT = 110;

  // Group games into columns of 2 for horizontal scroll
  const gameColumns: Game[][] = [];
  for (let i = 0; i < filteredGames.length; i += 2) {
    gameColumns.push(filteredGames.slice(i, i + 2));
  }

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      <AnimatedBackground />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative', zIndex: 1 }}>
        {/* Sidebar */}
        <Sidebar
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
          extraCategories={categories}
        />

        {/* Main content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 16px',
            background: 'rgba(5,2,8,0.8)',
            borderBottom: '1px solid rgba(212,175,55,0.1)',
            backdropFilter: 'blur(10px)',
            flexShrink: 0,
            gap: '12px',
          }}>
            {/* Logo */}
            {!logoError ? (
              <img
                src={LOGO_URL}
                alt="Jade Royale"
                onError={() => setLogoError(true)}
                style={{ height: '36px', objectFit: 'contain' }}
              />
            ) : (
              <span style={{
                fontFamily: 'Orbitron, sans-serif',
                fontSize: '16px', fontWeight: '800',
                color: '#D4AF37',
                textShadow: '0 0 10px rgba(212,175,55,0.5)',
              }}>
                JADE ROYALE
              </span>
            )}

            {/* Right side */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto' }}>
              {/* Balance */}
              <button
                onClick={handleRefreshBalance}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  background: 'rgba(212,175,55,0.1)',
                  border: '1px solid rgba(212,175,55,0.3)',
                  borderRadius: '10px', padding: '6px 12px',
                  cursor: 'pointer', color: '#D4AF37',
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#FFD700' }}>
                  ${(user?.balance ?? 0).toFixed(2)}
                </span>
                <RefreshCw
                  size={13}
                  color="rgba(212,175,55,0.7)"
                  style={{ animation: isRefreshing ? 'spin 0.7s linear infinite' : 'none' }}
                />
              </button>

              {/* Action buttons */}
              <ActionIconBtn icon={<Gift size={16} />} onClick={showBonus} badge={canClaimToday} color="#D4AF37" title="Daily Bonus" />
              <ActionIconBtn icon={<Star size={16} />} onClick={showSpinWheel} color="#A020F0" title="Spin Wheel" />
              <ActionIconBtn icon={<Bell size={16} />} onClick={showNotifications} badge={unreadCount > 0} color="#0099FF" title="Notifications" />
              <ActionIconBtn icon={<DollarSign size={16} />} onClick={() => navigate('/deposit')} color="#00FF87" title="Deposit" />
              <ActionIconBtn icon={<ArrowDown size={16} />} onClick={() => navigate('/withdrawal')} color="#FF1493" title="Withdraw" />
              <ActionIconBtn icon={<User size={16} />} onClick={() => navigate('/profile')} color="#A020F0" title="Profile" />
              <ActionIconBtn icon={<Settings size={16} />} onClick={() => navigate('/settings')} color="rgba(255,255,255,0.5)" title="Settings" />
              <ActionIconBtn icon={<LogOut size={16} />} onClick={logout} color="#FF3366" title="Logout" />
            </div>
          </div>

          {/* Cache banner */}
          {usingCache && (
            <div style={{
              background: 'rgba(255,165,0,0.1)', borderBottom: '1px solid rgba(255,165,0,0.3)',
              padding: '6px 16px', flexShrink: 0,
            }}>
              <p style={{ color: 'rgba(255,165,0,0.8)', fontSize: '12px', textAlign: 'center' }}>
                Showing saved games — pull to refresh
              </p>
            </div>
          )}

          {/* Games area */}
          <div style={{ flex: 1, overflow: 'hidden', padding: '12px 0 12px 8px', display: 'flex', flexDirection: 'column' }}>
            {/* Category header with scroll buttons */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: '16px', marginBottom: '10px', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{
                  fontSize: '14px', fontWeight: '700', color: '#D4AF37',
                  letterSpacing: '1px', textTransform: 'uppercase' as const,
                  fontFamily: 'Orbitron, sans-serif',
                }}>
                  {selectedCategory === 'hot' ? 'Hot Games'
                    : selectedCategory === 'favorites' ? 'My Favorites'
                    : selectedCategory === 'slots' ? 'Slots'
                    : selectedCategory === 'fishing' ? 'Fishing'
                    : selectedCategory === 'arcade' ? 'Arcade'
                    : selectedCategory}
                </span>
                <span style={{
                  fontSize: '11px', color: 'rgba(255,255,255,0.35)',
                  background: 'rgba(255,255,255,0.06)',
                  padding: '2px 8px', borderRadius: '10px',
                }}>
                  {filteredGames.length}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <IconBtn icon={<RefreshCw size={14} />} onClick={handleRefreshGames} title="Refresh" />
                <IconBtn icon={<ChevronLeft size={14} />} onClick={() => scrollCarousel('left')} title="Scroll left" />
                <IconBtn icon={<ChevronRight size={14} />} onClick={() => scrollCarousel('right')} title="Scroll right" />
              </div>
            </div>

            {isLoading ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: '40px', height: '40px', border: '3px solid rgba(212,175,55,0.2)',
                    borderTopColor: '#D4AF37', borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite', margin: '0 auto 12px',
                  }} />
                  <p style={{ color: 'rgba(212,175,55,0.7)', fontSize: '13px' }}>Loading games...</p>
                </div>
              </div>
            ) : error && filteredGames.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <p style={{ color: '#FF6B8A', fontSize: '14px', marginBottom: '12px' }}>{error}</p>
                  <button
                    onClick={handleRefreshGames}
                    style={{
                      background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)',
                      borderRadius: '10px', padding: '8px 16px', color: '#D4AF37',
                      cursor: 'pointer', fontSize: '13px',
                    }}
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : filteredGames.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', fontStyle: 'italic' }}>
                  {selectedCategory === 'favorites' ? 'No favorites yet — tap the heart on any game!' : 'No games found'}
                </p>
              </div>
            ) : (
              /* Horizontal carousel */
              <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
                <div
                  ref={carouselRef}
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    gap: '10px',
                    overflowX: 'auto',
                    overflowY: 'hidden',
                    height: '100%',
                    paddingRight: '16px',
                    paddingBottom: '4px',
                    scrollBehavior: 'smooth',
                  }}
                >
                  {gameColumns.map((column, colIdx) => (
                    <div key={colIdx} style={{ display: 'flex', flexDirection: 'column', gap: '10px', flexShrink: 0 }}>
                      {column.map(game => (
                        <GameCard
                          key={game.name}
                          game={game}
                          isFavorite={favorites.includes(game.name)}
                          onPress={() => handleGamePress(game)}
                          onFavoritePress={() => toggleFavorite(game.name)}
                          width={CARD_WIDTH}
                          height={CARD_HEIGHT}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <DailyBonusModal />
      <SpinWheelModal />
      <NotificationsModal />
    </div>
  );
}

function ActionIconBtn({ icon, onClick, badge, color, title }: {
  icon: React.ReactNode; onClick: () => void; badge?: boolean; color: string; title: string;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        width: '34px', height: '34px', borderRadius: '10px',
        background: hovered ? `rgba(${hexToRgb(color)}, 0.15)` : 'rgba(255,255,255,0.05)',
        border: `1px solid ${hovered ? color + '50' : 'rgba(255,255,255,0.1)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', color,
        transition: 'all 0.15s ease',
        boxShadow: hovered ? `0 0 10px ${color}30` : 'none',
      }}
    >
      {icon}
      {badge && (
        <div style={{
          position: 'absolute', top: '2px', right: '2px',
          width: '7px', height: '7px', borderRadius: '50%',
          background: '#FFD700', boxShadow: '0 0 4px #FFD700',
        }} />
      )}
    </button>
  );
}

function IconBtn({ icon, onClick, title }: { icon: React.ReactNode; onClick: () => void; title: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: '30px', height: '30px', borderRadius: '8px',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', color: 'rgba(255,255,255,0.5)',
      }}
    >
      {icon}
    </button>
  );
}

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  return '255, 255, 255';
}
