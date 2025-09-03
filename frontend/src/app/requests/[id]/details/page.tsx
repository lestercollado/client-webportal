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
    <main className="flex min-h-screen flex-col items-center justify-start p-6 md:p-12">
      <div className="w-full max-w-6xl">
        <Header />
        <div className="flex justify-end mb-4">
          <Link href="/requests" className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    &larr; Volver a Solicitudes
            </Link>
        </div>
        <div className="bg-white p-8 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
                <h1 className="text-2xl font-bold text-gray-800">
                    Detalles de la Solicitud #{id}
                </h1>
                <Link href={`/requests/${id}/edit`} title="Editar Solicitud" className="text-blue-600 hover:text-blue-900">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                </Link>
                
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
