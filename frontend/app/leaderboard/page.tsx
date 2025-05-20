'use client';

import { useEffect, useState } from 'react';
import { events } from 'aws-amplify/data';
import Image from 'next/image';

interface User {
  uuid: string;
  username: string;
}

interface Scores extends User {
  totalScore: number;
}

interface Comments extends User {
  comment: string;
  timestamp: string;
}

interface Notification {
  id: string;
  message: string;
  timestamp: number;
}

// Helper function to generate notification messages
const generateNotificationMessage = (
  username: string,
  oldIndex: number | null,
  newIndex: number,
  score: number
): string => {
  if (oldIndex === null) {
    return `${username} has joined the leaderboard!`;
  }

  if (newIndex < oldIndex) {
    if (score >= 5000000) return `${username} has unlocked the Genie's golden lamp!`;
    if (score >= 2000000) return `${username} has mastered the art of wish-making!`;
    if (score >= 1000000) return `${username} has summoned the Genie!`;
    if (score >= 500000) return `${username} is radiating magical energy!`;
    if (score >= 200000) return `${username} has found a magical lamp!`;
    if (score >= 100000) return `${username} discovered ancient treasure!`;
    if (score >= 50000) return `${username} is on a magic carpet ride!`;
    return `${username} is moving up the rankings!`;
  }

  if (newIndex > oldIndex) {
    return `${username} has been overtaken!`;
  }

  return `${username} has increased their score!`;
};

export default function LeaderboardPage() {
  const [scores, setScores] = useState<Scores[]>([]);
  const [comments, setComments] = useState<Comments[]>([]);
  const [notifications, setNotifications] = useState<Notification | undefined>(undefined);

  // Function to add a notification
  const addNotification = (message: string) => {
    const id = crypto.randomUUID();
    setNotifications({ id, message, timestamp: Date.now() });

    // Remove notification after 2 seconds
    setTimeout(() => {
      setNotifications(undefined);
    }, 2000);
  };

  useEffect(() => {
    async function handleScoresConnect() {
      return (await events.connect('/scores/channel')).subscribe({
        next: (data) => {
          console.log('Received score:', data.event.data);
          setScores((prevScores) => {
            // Sort previous scores to get current positions
            const sortedPrevScores = [...prevScores].sort((a, b) => b.totalScore - a.totalScore);
            const existingIndex = prevScores.findIndex((msg) => msg.uuid === data.event.data.uuid);
            const oldIndex =
              existingIndex >= 0 ? sortedPrevScores.findIndex((s) => s.uuid === data.event.data.uuid) : null;

            // Create new scores array
            const newScores =
              existingIndex >= 0
                ? prevScores.map((msg, i) =>
                    i === existingIndex ? { ...msg, totalScore: data.event.data.totalScore } : msg
                  )
                : [...prevScores, data.event.data];

            // Sort new scores to get new position
            const sortedNewScores = [...newScores].sort((a, b) => b.totalScore - a.totalScore);
            const newIndex = sortedNewScores.findIndex((s) => s.uuid === data.event.data.uuid);

            // Only show notification if position actually changed
            if (oldIndex !== newIndex) {
              const message = generateNotificationMessage(
                data.event.data.username,
                oldIndex,
                newIndex,
                data.event.data.totalScore
              );
              addNotification(message);
            }

            return newScores;
          });
        },
        error: (error) => {
          console.error('Subscription error:', error);
        },
      });
    }

    async function handleCommentsConnect() {
      return (await events.connect('/comments/channel')).subscribe({
        next: (data) => {
          console.log('Received comment:', data.event.data);
          setComments((prevComments) => {
            const updatedComments = [...prevComments, data.event.data];
            return updatedComments
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .slice(0, 5);
          });
        },
        error: (error) => {
          console.error('Subscription error:', error);
        },
      });
    }

    handleScoresConnect();
    handleCommentsConnect();
  }, []);

  return (
    <div className='min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-3xl mx-auto'>
        {notifications && (
          <div className='fixed top-4 left-0 right-0 z-50 flex justify-center'>
            <div
              key={notifications.id}
              className='bg-white rounded-lg shadow-lg px-4 py-2 text-center animate-slide-in'
            >
              <p className='text-lg font-semibold text-gray-900'>{notifications.message}</p>
            </div>
          </div>
        )}

        <h1 className='text-4xl font-bold text-center mt-4 text-gray-900 mb-8'>Welcome to Dragon&apos;s Vault</h1>

        {scores.length > 0 && (
          <div className='bg-white rounded-lg shadow-xl overflow-hidden mb-8'>
            <h2 className='text-2xl font-semibold text-gray-900 p-4 border-b border-gray-200'>Top Dragons</h2>
            {scores
              .sort((a, b) => b.totalScore - a.totalScore)
              .map((user, i) => (
                <div
                  key={user.uuid}
                  className='flex items-center px-6 py-4 border-b border-gray-200 last:border-0 hover:bg-gray-50 transition-colors'
                >
                  <div className='flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold'>
                    {i + 1}
                  </div>
                  <div className='ml-4 flex-1'>
                    <div className='text-lg font-semibold text-gray-900'>{user.username}</div>
                  </div>
                  <div className='text-xl font-bold text-blue-600'>${user.totalScore.toLocaleString()}</div>
                </div>
              ))}
          </div>
        )}

        {comments.length > 0 && (
          <div className='bg-white rounded-lg shadow-xl overflow-hidden mb-8'>
            <h2 className='text-2xl font-semibold text-gray-900 p-4 border-b border-gray-200'>Recent Comments</h2>
            {comments
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .map((c, i) => (
                <div key={i} className='p-4 border-gray-200 last:border-0'>
                  <div className='flex items-center'>
                    <span className='font-semibold text-gray-900'>{c.username}:</span>
                    <p className='text-gray-700 ml-2'>&quot;{c.comment}&quot;</p>
                  </div>
                </div>
              ))}
          </div>
        )}

        <div className='text-center'>
          <h2 className='text-2xl font-semibold text-gray-900 mb-4'>Join the Leaderboard</h2>
          <div className='bg-white p-6 rounded-lg shadow-lg inline-block'>
            <Image src='/code.png' alt='QR Code to join' width={200} height={200} className='mx-auto' />
            <p className='mt-4 text-sm text-gray-600'>Scan to start contributing</p>
          </div>
        </div>
      </div>
    </div>
  );
}
