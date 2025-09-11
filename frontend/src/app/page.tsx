'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import RequestList from './components/RequestList';
import { useAuth } from '@/context/AuthContext';
import Header from './components/Header';
import DashboardStats from './components/DashboardStats';

export default function Home() {
  const { auth, loading } = useAuth();
  const router = useRouter();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (!loading && !auth) {
      router.push('/login');
    }
  }, [auth, loading, router]);

  const handleDataChange = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  if (loading || !auth) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center">
        <p>Cargando...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-6 md:p-12">
      <div className="w-full max-w-6xl">
        <Header />
        
        <DashboardStats refreshTrigger={refreshTrigger} />

        <div>
          <RequestList limit={10} showControls={false} onDataChange={handleDataChange} />
        </div>
      </div>
    </main>
  );
}
