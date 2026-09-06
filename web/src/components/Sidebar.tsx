import React from 'react';
import { Flame, Heart, Zap, Target, Grid, Star } from 'lucide-react';

interface SidebarProps {
  selectedCategory: string;
  onCategorySelect: (cat: string) => void;
  extraCategories?: Array<{ slug: string; title: string }>;
}

const DEFAULT_CATEGORIES = [
  { id: 'hot', label: 'Hot', Icon: Flame, color: '#FF6B35' },
  { id: 'favorites', label: 'Favs', Icon: Heart, color: '#FF1493' },
  { id: 'slots', label: 'Slots', Icon: Star, color: '#FFD700' },
  { id: 'fishing', label: 'Fish', Icon: Target, color: '#0099FF' },
  { id: 'arcade', label: 'Arcade', Icon: Zap, color: '#A020F0' },
];

export function Sidebar({ selectedCategory, onCategorySelect, extraCategories = [] }: SidebarProps) {
  const allCategories = [
    ...DEFAULT_CATEGORIES,
    ...extraCategories
      .filter(c => !DEFAULT_CATEGORIES.find(d => d.id === c.slug))
      .map(c => ({ id: c.slug, label: c.title.slice(0, 5), Icon: Grid, color: '#00FF87' })),
  ];

  return (
    <div style={{
      width: '72px',
      height: '100%',
      background: 'linear-gradient(180deg, rgba(15,5,30,0.98) 0%, rgba(25,10,50,0.95) 50%, rgba(15,5,30,0.98) 100%)',
      borderRight: '1px solid rgba(212,175,55,0.15)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingTop: '12px',
      paddingBottom: '12px',
      gap: '4px',
      flexShrink: 0,
      overflowY: 'auto',
      overflowX: 'hidden',
    }}>
      {allCategories.map(({ id, label, Icon, color }) => {
        const isSelected = selectedCategory === id;
        return (
          <button
            key={id}
            onClick={() => onCategorySelect(id)}
            title={label}
            style={{
              width: '56px',
              height: '56px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              background: isSelected ? `rgba(${hexToRgb(color)}, 0.15)` : 'transparent',
              border: isSelected ? `1px solid ${color}60` : '1px solid transparent',
              borderRadius: '12px',
              cursor: 'pointer',
              color: isSelected ? color : 'rgba(255,255,255,0.4)',
              boxShadow: isSelected ? `0 0 12px ${color}40` : 'none',
              transition: 'all 0.2s ease',
              flexShrink: 0,
            }}
          >
            <Icon
              size={20}
              style={{ filter: isSelected ? `drop-shadow(0 0 6px ${color})` : 'none' }}
            />
            <span style={{
              fontSize: '9px',
              fontWeight: '600',
              letterSpacing: '0.3px',
              textTransform: 'uppercase',
            }}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  }
  return '255, 255, 255';
}
