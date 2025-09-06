'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
        
        <div className="flex justify-end mb-4">
          <Link href="/requests/new" className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Crear Nueva Solicitud
          </Link>
        </div>

        <div>
          <RequestList showControls={true} title="Solicitudes" />
        </div>
      </div>
    </main>
  );
}
