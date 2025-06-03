'use client';

import Image from 'next/image';

export default function HomePage() {
  return (
    <div className='relative w-full h-screen bg-gray-100 cursor-default'>
      <Image src='/images/den/5.png' alt='Slide 5' fill className='object-contain' priority sizes='100vw' />
    </div>
  );
}
