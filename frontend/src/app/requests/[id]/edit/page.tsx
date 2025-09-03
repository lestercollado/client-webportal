'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getRequestById, UserRequest } from '@/services/api';
import Header from '@/app/components/Header';
import EditRequestForm from '@/app/components/EditRequestForm';
import RequestHistory from '@/app/components/RequestHistory';
import { toast } from 'sonner';
export default function EditRequestPage() {
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
      getRequestById(id)
        .then(setRequest)
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
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            Editar Solicitud #{id}
          </h1>
          {request ? (
            <>
              <EditRequestForm requestData={request} />
              {/* Integrar el componente de historial */}
              <RequestHistory history={request.history || []} />
            </>
          ) : (
            <p>No se encontraron datos de la solicitud.</p>
          )}
        </div>
      </div>
    </main>
  );
}
