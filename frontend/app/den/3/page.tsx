'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className='relative w-full h-screen bg-gray-100 cursor-default' onClick={() => router.push('/den/4')}>
      <Image src='/images/den/3.png' alt='Slide 3' fill className='object-contain' priority sizes='100vw' />
    </div>
  );
}
