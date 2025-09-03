'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getRequestDetails, UserRequest } from '@/services/api';
import RequestDetails from '@/app/components/RequestDetails';
import Header from '@/app/components/Header';
import { toast } from 'sonner';

export default function RequestDetailsPage() {
  const { auth, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);

  const [request, setRequest] = useState<UserRequest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !auth) {
      router.push('/login');
    }
  }, [auth, authLoading, router]);

  useEffect(() => {
    if (auth?.token && id) {
      getRequestDetails(id)
        .then(data => {
          setRequest(data);
        })
        .catch(err => {
          toast.error('No se pudo cargar la solicitud.');
          console.error(err);
        })
        .finally(() => setLoading(false));
    }
  }, [auth?.token, id]);

  if (authLoading || loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center">
        <p>Cargando...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-6 md:p-12 bg-gray-50">
      <div className="w-full max-w-6xl">
        <Header />
        <div className="bg-white p-8 rounded-lg shadow-md">
            <Link href="/requests" className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    &larr; Volver a Solicitudes
            </Link>
            <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
                <h1 className="text-2xl font-bold text-gray-800">
                    Detalles de la Solicitud #{id}
                </h1>
                
            </div>
          {request ? (
            <RequestDetails request={request} />
          ) : (
            <p>No se encontraron datos de la solicitud.</p>
          )}
        </div>
      </div>
    </main>
  );
}
