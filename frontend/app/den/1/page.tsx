'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className='relative w-full h-screen bg-gray-100 cursor-default' onClick={() => router.push('/den/2')}>
      <Image src='/images/den/1.jpg' alt='Slide 1' fill className='object-contain' priority sizes='100vw' />
    </div>
  );
}
