'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import RequestList from '../components/RequestList';
import { useAuth } from '@/context/AuthContext';
import Header from '../components/Header';

export default function RequestsPage() {
  const { auth, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !auth) {
      router.push('/login');
    }
  }, [auth, loading, router]);

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
        
        <div>
          <RequestList showControls={true} title="Solicitudes" />
        </div>
      </div>
    </main>
  );
}
