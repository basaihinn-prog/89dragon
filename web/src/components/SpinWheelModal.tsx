import React, { useState, useRef, useEffect } from 'react';
import { GlassModal } from './GlassModal';
import { NeonButton } from './NeonButton';
import { useSpinWheel } from '../contexts/SpinWheelContext';
import { useAuth } from '../contexts/AuthContext';

const SEGMENT_COLORS = [
  '#FF6B35', '#FFD700', '#A020F0', '#00FF87', '#0099FF', '#FF1493', '#FF3366', '#00E5FF'
];

export function SpinWheelModal() {
  const { isModalVisible, hideModal, wheelConfig, isLoading, spin } = useSpinWheel();
  const { refreshBalance } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const rotationRef = useRef(0);
  const animFrameRef = useRef<number>(0);

  const segments = wheelConfig?.segments || [
    { id: 1, label: '$1', value: 1 },
    { id: 2, label: '$5', value: 5 },
    { id: 3, label: '$2', value: 2 },
    { id: 4, label: '$10', value: 10 },
    { id: 5, label: '$3', value: 3 },
    { id: 6, label: '$50', value: 50 },
    { id: 7, label: '$1', value: 1 },
    { id: 8, label: '$20', value: 20 },
  ];

  const drawWheel = (angle: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const size = canvas.width;
    const center = size / 2;
    const radius = center - 8;
    const segCount = segments.length;
    const arc = (2 * Math.PI) / segCount;

    ctx.clearRect(0, 0, size, size);

    // Outer ring
    ctx.beginPath();
    ctx.arc(center, center, radius + 4, 0, 2 * Math.PI);
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 4;
    ctx.stroke();

    segments.forEach((seg, i) => {
      const startAngle = angle + i * arc;
      const endAngle = startAngle + arc;

      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = SEGMENT_COLORS[i % SEGMENT_COLORS.length];
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Text
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(startAngle + arc / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 13px Inter, sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;
      ctx.fillText(seg.label, radius - 12, 5);
      ctx.restore();
    });

    // Center circle
    const gradient = ctx.createRadialGradient(center, center, 0, center, center, 28);
    gradient.addColorStop(0, '#FFD700');
    gradient.addColorStop(1, '#B8860B');
    ctx.beginPath();
    ctx.arc(center, center, 28, 0, 2 * Math.PI);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  useEffect(() => {
    drawWheel(rotation);
  }, [rotation, segments.length]);

  const handleSpin = async () => {
    if (spinning || !isModalVisible) return;
    setSpinning(true);
    setResult(null);

    const spinResult = await spin();
    const targetExtraRotations = 5 + Math.random() * 3;
    const targetAngle = rotationRef.current + targetExtraRotations * 2 * Math.PI;
    const duration = 4000;
    const startTime = Date.now();
    const startAngle = rotationRef.current;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentAngle = startAngle + (targetAngle - startAngle) * eased;
      rotationRef.current = currentAngle;
      setRotation(currentAngle);
      drawWheel(currentAngle);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        setSpinning(false);
        if (spinResult) {
          setResult(`You won ${spinResult.prize || `$${spinResult.amount}`}!`);
          refreshBalance();
        } else {
          setResult('No spins available');
        }
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);
  };

  return (
    <GlassModal visible={isModalVisible} onClose={hideModal} title="Wheel of Fortune">
      <div style={{ padding: '20px', textAlign: 'center' }}>
        {/* Pointer */}
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: '16px' }}>
          <div style={{
            position: 'absolute', top: '-12px', left: '50%',
            transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '10px solid transparent',
            borderRight: '10px solid transparent',
            borderTop: '20px solid #FFD700',
            filter: 'drop-shadow(0 0 8px #FFD700)',
            zIndex: 10,
          }} />
          <canvas
            ref={canvasRef}
            width={280}
            height={280}
            style={{ display: 'block' }}
          />
        </div>

        {result && (
          <div style={{
            marginBottom: '16px', padding: '12px 20px',
            background: 'rgba(212,175,55,0.1)',
            border: '1px solid rgba(212,175,55,0.4)',
            borderRadius: '12px',
          }}>
            <p style={{ color: '#FFD700', fontSize: '18px', fontWeight: '700' }}>{result}</p>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
          <NeonButton
            onClick={handleSpin}
            loading={spinning || isLoading}
            disabled={spinning || isLoading}
            variant="royale"
          >
            {spinning ? 'Spinning...' : 'Spin!'}
          </NeonButton>
          <NeonButton onClick={hideModal} variant="ghost">
            Close
          </NeonButton>
        </div>

        {wheelConfig && (
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginTop: '12px' }}>
            Spins available: {wheelConfig.available_spins}
          </p>
        )}
      </div>
    </GlassModal>
  );
}
