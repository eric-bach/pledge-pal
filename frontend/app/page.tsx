import Image from 'next/image';

interface PledgerData {
  name: string;
  amount: number;
  rank: number;
}

const mockPledgers: PledgerData[] = [
  { name: 'John Doe', amount: 1000, rank: 1 },
  { name: 'Jane Smith', amount: 850, rank: 2 },
  { name: 'Bob Johnson', amount: 750, rank: 3 },
  { name: 'Alice Brown', amount: 600, rank: 4 },
  { name: 'Charlie Wilson', amount: 500, rank: 5 },
];

const DUMMY_URL = 'https://pledge-pal.example.com/leaderboard';

export default function Home() {
  return (
    <div className='min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-3xl mx-auto'>
        <h1 className='text-4xl font-bold text-center text-gray-900 mb-8'>Task Genie Leaderboard</h1>

        <div className='bg-white rounded-lg shadow-xl overflow-hidden mb-8'>
          {mockPledgers.map((pledger) => (
            <div
              key={pledger.rank}
              className='flex items-center px-6 py-4 border-b border-gray-200 last:border-0 hover:bg-gray-50 transition-colors'
            >
              <div className='flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold'>
                {pledger.rank}
              </div>
              <div className='ml-4 flex-1'>
                <div className='text-lg font-semibold text-gray-900'>{pledger.name}</div>
              </div>
              <div className='text-xl font-bold text-blue-600'>${pledger.amount.toLocaleString()}</div>
            </div>
          ))}
        </div>

        <div className='text-center'>
          <h2 className='text-2xl font-semibold text-gray-900 mb-4'>Join the Leaderboard</h2>
          <div className='bg-white p-6 rounded-lg shadow-lg inline-block'>
            <Image
              src={`https://images.unsplash.com/photo-1739179418349-f62f722d7e27?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwzfHx8ZW58MHx8fHx8`}
              alt='QR Code to join'
              width={200}
              height={200}
              className='mx-auto'
            />
            <p className='mt-4 text-sm text-gray-600'>Scan to make your pledge</p>
          </div>
        </div>
      </div>
    </div>
  );
}
