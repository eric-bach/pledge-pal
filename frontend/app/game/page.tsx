'use client';

import { useEffect, useState } from 'react';
import { SendHorizontal } from 'lucide-react';
import { events } from 'aws-amplify/data';
import { FloatingWidget } from '@/components/FloatingWidget';

// Define the widget items with rarity
const WIDGET_ITEMS = [
  {
    imageUrl: '/images/up.png',
    value: 1000,
    type: 'up',
    weight: 40,
  },
  {
    imageUrl: '/images/heart.png',
    value: 2000,
    type: 'heart',
    weight: 30,
  },
  {
    imageUrl: '/images/money-bag.png',
    value: 5000,
    type: 'money-bag',
    weight: 20,
  },
  {
    imageUrl: '/images/genie-lamp.png',
    value: 20000,
    type: 'genie-lamp',
    weight: 6,
  },
  {
    imageUrl: '/images/genie.png',
    value: 50000,
    type: 'genie',
    weight: 4,
  },
];

// Calculate total weight for probability calculation
const TOTAL_WEIGHT = WIDGET_ITEMS.reduce((sum, item) => sum + item.weight, 0);
const MAX_WIDGETS = 15;
const MIN_WIDGETS = 3;
const WIDGET_LIFETIME = 60000; // Widget lifetime in milliseconds
const SPAWN_INTERVAL = 8000; // New widget spawn interval in milliseconds

const generateRandomUsername = () => {
  const adjectives = ['Happy', 'Clever', 'Brave', 'Swift', 'Bright', 'Witty', 'Calm', 'Eager', 'Fierce', 'Gentle'];
  const nouns = ['Panda', 'Tiger', 'Eagle', 'Dolphin', 'Fox', 'Lion', 'Wolf', 'Bear', 'Hawk', 'Dragon'];
  const randomNum = Math.floor(Math.random() * 1000);

  const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];

  return `${randomAdj}${randomNoun}${randomNum}`;
};

// Score Label Component
const ScoreLabel = ({ value, position }: { value: number; position: { x: number; y: number } }) => {
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOpacity(0);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className='absolute pointer-events-none transition-opacity duration-1000'
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        opacity,
      }}
    >
      <div className='text-2xl font-bold text-green-500 animate-float'>+{value}</div>
    </div>
  );
};

export default function GamePage() {
  const [user, setUser] = useState({
    uuid: '',
    username: '',
    totalScore: 0,
  });
  const [widgets, setWidgets] = useState<
    Array<{ id: string; type: string; value: number; imageUrl: string; createdAt: number }>
  >([]);
  const [scoreLabels, setScoreLabels] = useState<
    Array<{ id: string; value: number; position: { x: number; y: number } }>
  >([]);
  const [userComment, setUserComment] = useState('');
  const [showInstructions, setShowInstructions] = useState(true);

  // Function to get a random widget based on weight
  const getRandomWidget = () => {
    const random = Math.random() * TOTAL_WEIGHT;
    let weightSum = 0;

    for (const item of WIDGET_ITEMS) {
      weightSum += item.weight;
      if (random <= weightSum) {
        return item;
      }
    }

    return WIDGET_ITEMS[0]; // Fallback to first item (shouldn't happen)
  };

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const username = localStorage.getItem('username');
    setUser({
      uuid: userId ?? crypto.randomUUID(),
      username: username ?? generateRandomUsername(),
      totalScore: 0,
    });

    // Connect to WebSocket
    async function handleConnect() {
      return (await events.connect('/scores/channel')).subscribe({
        next: () => {
          // console.log('Received data:', data);
        },
        error: (error) => {
          console.error('Subscription error:', error);
        },
      });
    }

    handleConnect();

    // Generate widgets periodically if below maximum
    const generateWidget = () => {
      setWidgets((prev) => {
        // Only add new widget if below maximum
        if (prev.length >= MAX_WIDGETS) return prev;

        const randomItem = getRandomWidget();
        return [...prev, { ...randomItem, id: crypto.randomUUID(), createdAt: Date.now() }];
      });
    };

    // Generate initial widgets
    for (let i = 0; i < MIN_WIDGETS; i++) {
      generateWidget();
    }

    // Spawn new widgets periodically
    const spawnInterval = setInterval(() => {
      generateWidget();
    }, SPAWN_INTERVAL);

    // Remove expired widgets
    const cleanupInterval = setInterval(() => {
      setWidgets((prev) => {
        const now = Date.now();
        const filtered = prev.filter((widget) => {
          const age = now - widget.createdAt;
          return age < WIDGET_LIFETIME;
        });

        // If we're below minimum, add a new widget
        if (filtered.length < MIN_WIDGETS) {
          const randomItem = getRandomWidget();
          filtered.push({ ...randomItem, id: crypto.randomUUID(), createdAt: Date.now() });
        }

        return filtered;
      });
    }, 1000); // Check every second

    return () => {
      clearInterval(spawnInterval);
      clearInterval(cleanupInterval);
    };
  }, []);

  const handleCollect = async (id: string, value: number, position: { x: number; y: number }) => {
    setUser((prev) => ({ ...prev, totalScore: prev.totalScore + value }));

    // Add score label
    const labelId = `label-${Date.now()}`;
    setScoreLabels((prev) => [...prev, { id: labelId, value, position }]);

    // Remove score label after animation
    setTimeout(() => {
      setScoreLabels((prev) => prev.filter((label) => label.id !== labelId));
    }, 1000);

    // Send to WebSocket
    const data = {
      uuid: user.uuid,
      username: user.username,
      value,
      timestamp: new Date().toISOString(),
      totalScore: user.totalScore + value,
    };

    await events.post('scores/channel', { data: data });

    // Remove only the specific widget that was clicked
    setWidgets((prev) => prev.filter((w) => w.id !== id));
  };

  const handleMessageSubmit = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && userComment.trim()) {
      // Send comment to WebSocket
      const data = {
        uuid: user.uuid,
        username: user.username,
        comment: userComment.trim(),
        timestamp: new Date().toISOString(),
      };
      await events.post('comments/channel', { data: data });

      // Clear the input
      setUserComment('');
    }
  };

  return (
    <div className='relative min-h-screen bg-gradient-to-b from-purple-100 to-blue-100 overflow-hidden'>
      {/* Score Display */}
      <div className='fixed top-4 right-4 bg-white bg-opacity-30 rounded-lg shadow-lg p-2 z-50'>
        <h2 className='text-lg font-bold text-gray-900'>Score</h2>
        <p className='text-2xl font-bold text-blue-600'>${user.totalScore.toLocaleString()}</p>
      </div>

      {/* Message Input */}
      <div className='fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md px-4'>
        <input
          type='text'
          value={userComment}
          onChange={(e) => setUserComment(e.target.value)}
          onKeyDown={handleMessageSubmit}
          maxLength={60}
          placeholder='Enter your feedback...'
          className='w-full pr-12 pl-4 py-2 text-xl rounded-lg bg-white bg-opacity-50 backdrop-blur-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
          style={{ position: 'relative' }}
        />
        <button
          onClick={() => handleMessageSubmit({ key: 'Enter' } as React.KeyboardEvent<HTMLInputElement>)}
          className='absolute right-6 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-gray-500 text-white rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
        >
          <SendHorizontal className='w-4 h-4' />
        </button>
      </div>

      {/* Score Labels */}
      {scoreLabels.map((label) => (
        <ScoreLabel key={label.id} value={label.value} position={label.position} />
      ))}

      {/* Floating Widgets */}
      {widgets.map((widget) => (
        <FloatingWidget
          key={widget.id}
          imageUrl={widget.imageUrl}
          value={widget.value}
          onCollect={(value, position) => handleCollect(widget.id, value, position)}
        />
      ))}

      {/* Instructions */}
      {showInstructions && (
        <div className='fixed bottom-4 left-4 bg-white bg-opacity-30 rounded-lg shadow-lg p-3 max-w-sm'>
          <div className='flex justify-between items-start mb-2'>
            <h2 className='text-md font-semibold text-gray-900'>Provide your feedback</h2>
            <button onClick={() => setShowInstructions(false)} className='text-gray-500 hover:text-gray-700'>
              ✕
            </button>
          </div>
          <p className='text-sm text-gray-600'>
            Click on the floating items and share your feedback! Keep an eye out for the rare and valuable genie tokens!
          </p>
        </div>
      )}
    </div>
  );
}
