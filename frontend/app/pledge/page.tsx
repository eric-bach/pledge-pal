'use client';

import { useEffect, useState, useRef } from 'react';
import { FloatingWidget } from '@/components/FloatingWidget';
import { events } from 'aws-amplify/data';

// Define the widget items with rarity
const WIDGET_ITEMS = [
  {
    imageUrl: '/images/up.png',
    value: 100,
    type: 'up',
    weight: 50,
  },
  {
    imageUrl: '/images/heart.png',
    value: 250,
    type: 'heart',
    weight: 25,
  },
  {
    imageUrl: '/images/money-face.png',
    value: 500,
    type: 'money-face',
    weight: 15,
  },
  {
    imageUrl: '/images/money-bag.png',
    value: 1000,
    type: 'money-bag',
    weight: 5,
  },
  {
    imageUrl: '/images/genie.png',
    value: 2500,
    type: 'token',
    weight: 5,
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

export default function PledgePage() {
  const [user, setUser] = useState({
    uuid: localStorage.getItem('userId') ?? crypto.randomUUID(),
    username: localStorage.getItem('username') ?? generateRandomUsername(),
    totalScore: 0,
  });
  const [score, setScore] = useState(0);
  const [widgets, setWidgets] = useState<
    Array<{ id: string; type: string; value: number; imageUrl: string; createdAt: number }>
  >([]);
  const [message, setMessage] = useState('');

  // Use a ref to maintain a counter for unique IDs
  const nextIdRef = useRef(1);

  // Function to generate a unique ID
  const generateUniqueId = () => {
    const id = `widget-${Date.now()}-${nextIdRef.current}`;
    nextIdRef.current += 1;
    return id;
  };

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
    // Connect to WebSocket
    async function handleConnect() {
      return (await events.connect('/pledges/channel')).subscribe({
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
        return [...prev, { ...randomItem, id: generateUniqueId(), createdAt: Date.now() }];
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
          filtered.push({ ...randomItem, id: generateUniqueId(), createdAt: Date.now() });
        }

        return filtered;
      });
    }, 1000); // Check every second

    return () => {
      clearInterval(spawnInterval);
      clearInterval(cleanupInterval);
      //websocket.disconnect();
    };
  }, []);

  const handleCollect = async (id: string, value: number) => {
    setScore((prev) => prev + value);

    // Send to WebSocket
    const data = {
      uuid: user.uuid,
      username: user.username,
      value,
      timestamp: new Date().toISOString(),
      totalScore: user.totalScore + value,
    };

    setUser((prev) => ({ ...prev, totalScore: prev.totalScore + value }));

    await events.post('pledges/channel', { data: data });

    // Remove only the specific widget that was clicked
    setWidgets((prev) => prev.filter((w) => w.id !== id));
  };

  const handleMessageSubmit = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && message.trim()) {
      // Send message to WebSocket
      const data = {
        uuid: user.uuid,
        username: user.username,
        comment: message.trim(),
        timestamp: new Date().toISOString(),
      };
      await events.post('comments/channel', { data: data });

      // Clear the input
      setMessage('');
    }
  };

  return (
    <div className='relative min-h-screen bg-gradient-to-b from-purple-100 to-blue-100 overflow-hidden'>
      {/* Score Display */}
      <div className='fixed top-4 right-4 bg-white rounded-lg shadow-lg p-4 z-50'>
        <h2 className='text-xl font-bold text-gray-900'>Investment</h2>
        <p className='text-3xl font-bold text-blue-600'>{score}</p>
      </div>

      {/* Message Input */}
      <div className='fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md px-4'>
        <input
          type='text'
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleMessageSubmit}
          placeholder='Type your feedback and press Enter...'
          className='w-full px-4 py-2 text-xl rounded-lg bg-white bg-opacity-50 backdrop-blur-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
        />
      </div>

      {/* Floating Widgets */}
      {widgets.map((widget) => (
        <FloatingWidget
          key={widget.id}
          imageUrl={widget.imageUrl}
          value={widget.value}
          onCollect={(value) => handleCollect(widget.id, value)}
        />
      ))}

      {/* Instructions */}
      <div className='fixed bottom-4 left-4 bg-white bg-opacity-50 rounded-lg shadow-lg p-4 max-w-sm'>
        <h2 className='text-lg font-semibold text-gray-900 mb-2'>How to Play</h2>
        <p className='text-sm text-gray-600'>
          Click on the floating items to share your feedback! Some signs are more common than others, keep an eye out
          for the rare and valuable genie tokens!
        </p>
      </div>
    </div>
  );
}
