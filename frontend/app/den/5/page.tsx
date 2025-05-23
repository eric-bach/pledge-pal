'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className='relative w-full h-screen bg-gray-100 cursor-default'>
      <Image src='/images/den/5.jpg' alt='Slide 5' fill className='object-contain' priority sizes='100vw' />
    </div>
  );
}
