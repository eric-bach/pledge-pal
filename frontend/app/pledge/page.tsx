'use client';

import { useEffect, useState, useRef } from 'react';
import { FloatingWidget } from '@/components/FloatingWidget';
import { websocket } from '@/lib/websocket';

// Define the widget items with rarity
const WIDGET_ITEMS = [
  {
    imageUrl: '/images/dollar.png',
    value: 100,
    type: 'dollar',
    weight: 70,
  },
  {
    imageUrl: '/images/dollar-bag.png',
    value: 250,
    type: 'dollar-bag',
    weight: 25,
  },
  {
    imageUrl: '/images/genie.png',
    value: 1000,
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

export default function Pledge() {
  const [score, setScore] = useState(0);
  const [widgets, setWidgets] = useState<
    Array<{ id: string; type: string; value: number; imageUrl: string; createdAt: number }>
  >([]);

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
    websocket.connect();

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
      websocket.disconnect();
    };
  }, []);

  const handleCollect = (id: string, value: number) => {
    setScore((prev) => prev + value);

    // Send to WebSocket
    websocket.emit('collectItem', {
      value,
      timestamp: new Date().toISOString(),
      totalScore: score + value,
    });

    // Remove only the specific widget that was clicked
    setWidgets((prev) => prev.filter((w) => w.id !== id));
  };

  return (
    <div className='relative min-h-screen bg-gradient-to-b from-purple-100 to-blue-100 overflow-hidden'>
      {/* Score Display */}
      <div className='fixed top-4 right-4 bg-white rounded-lg shadow-lg p-4 z-50'>
        <h2 className='text-xl font-bold text-gray-900'>Score</h2>
        <p className='text-3xl font-bold text-blue-600'>{score}</p>
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
      <div className='fixed bottom-4 left-4 bg-white bg-opacity-90 rounded-lg shadow-lg p-4 max-w-sm'>
        <h2 className='text-lg font-semibold text-gray-900 mb-2'>How to Play</h2>
        <p className='text-sm text-gray-600'>
          Click on the floating items to collect points! Dollar signs are common, but keep an eye out for the rare and
          valuable genie tokens!
        </p>
      </div>
    </div>
  );
}
