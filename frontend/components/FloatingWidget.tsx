import { useEffect, useState, useCallback, useRef } from 'react';
import Image from 'next/image';

interface FloatingWidgetProps {
  imageUrl: string;
  value: number;
  onCollect: (value: number, position: { x: number; y: number }) => void;
}

export function FloatingWidget({ imageUrl, value, onCollect }: FloatingWidgetProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [collected, setCollected] = useState(false);

  // Store animation frame ID and speeds in refs
  const animationFrameId = useRef<number | null>(null);
  const speedRef = useRef({
    x: (Math.random() - 0.5) * 3,
    y: (Math.random() - 0.5) * 3,
  });

  const animate = useCallback(() => {
    if (collected) return;

    setPosition((prev) => {
      let newX = prev.x + speedRef.current.x;
      let newY = prev.y + speedRef.current.y;

      // Bounce off walls - adjusted for larger size
      if (newX <= 0 || newX >= window.innerWidth - 200) {
        speedRef.current.x *= -1;
        newX = Math.max(0, Math.min(window.innerWidth - 200, newX));
      }
      if (newY <= 0 || newY >= window.innerHeight - 200) {
        speedRef.current.y *= -1;
        newY = Math.max(0, Math.min(window.innerHeight - 200, newY));
      }

      return { x: newX, y: newY };
    });

    animationFrameId.current = requestAnimationFrame(animate);
  }, [collected]);

  useEffect(() => {
    // Random starting position - adjusted for larger size
    const startX = Math.random() * (window.innerWidth - 200);
    const startY = Math.random() * (window.innerHeight - 200);
    setPosition({ x: startX, y: startY });

    // Start animation
    animate();

    // Cleanup function
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [animate]);

  const handleClick = () => {
    if (!collected) {
      // Cancel animation immediately
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      setCollected(true);
      onCollect(value, position);
    }
  };

  if (collected) return null;

  return (
    <div
      className='absolute'
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        transition: 'transform 0.05s linear',
      }}
    >
      <div
        className='relative w-32 h-32 cursor-pointer transition-transform duration-200 hover:scale-110 active:scale-95'
        onClick={handleClick}
      >
        <Image src={imageUrl} alt='Floating item' width={72} height={72} className='object-contain' draggable={false} />
      </div>
    </div>
  );
}
