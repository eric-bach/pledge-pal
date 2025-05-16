'use client';

import { useEffect, useState } from 'react';
import { events } from 'aws-amplify/data';
import Image from 'next/image';

interface LeaderboardData {
  uuid: string;
  username: string;
  totalScore: number;
}

export default function Home() {
  const [messages, setMessages] = useState<LeaderboardData[]>([]);

  useEffect(() => {
    async function handleConnect() {
      return (await events.connect('/pledges/channel')).subscribe({
        next: (data) => {
          //console.log('Received data:', data.event.data);
          setMessages((prevMessages) => {
            const existingIndex = prevMessages.findIndex((msg) => msg.uuid === data.event.data.uuid);
            if (existingIndex >= 0) {
              // Update existing entry
              return prevMessages.map((msg, i) =>
                i === existingIndex ? { ...msg, totalScore: data.event.data.totalScore } : msg
              );
            }
            // Add new entry
            return [...prevMessages, data.event.data];
          });
        },
        error: (error) => {
          console.error('Subscription error:', error);
        },
      });
    }

    handleConnect();
  }, []);

  return (
    <div className='min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-3xl mx-auto'>
        <h1 className='text-4xl font-bold text-center text-gray-900 mb-8'>Task Genie Leaderboard</h1>

        <div className='bg-white rounded-lg shadow-xl overflow-hidden mb-8'>
          {messages
            .sort((a, b) => b.totalScore - a.totalScore)
            .map((pledger, i) => (
              <div
                key={pledger.uuid}
                className='flex items-center px-6 py-4 border-b border-gray-200 last:border-0 hover:bg-gray-50 transition-colors'
              >
                <div className='flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold'>
                  {i + 1}
                </div>
                <div className='ml-4 flex-1'>
                  <div className='text-lg font-semibold text-gray-900'>{pledger.username}</div>
                </div>
                <div className='text-xl font-bold text-blue-600'>${pledger.totalScore.toLocaleString()}</div>
              </div>
            ))}
        </div>

        <div className='text-center'>
          <h2 className='text-2xl font-semibold text-gray-900 mb-4'>Join the Leaderboard</h2>
          <div className='bg-white p-6 rounded-lg shadow-lg inline-block'>
            <Image src='/code.jpg' alt='QR Code to join' width={200} height={200} className='mx-auto' />
            <p className='mt-4 text-sm text-gray-600'>Scan to start contributing</p>
          </div>
        </div>
      </div>
    </div>
  );
}
