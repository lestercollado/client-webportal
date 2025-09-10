'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getRequestDetails, UserRequest, updateRequestDetails, deleteRequest } from '@/services/api';
import RequestDetails from '@/app/components/RequestDetails';
import Header from '@/app/components/Header';
import { toast } from 'sonner';
import ApproveConfirmationModal from '@/app/components/ApproveConfirmationModal';
import ConfirmationModal from '@/app/components/ConfirmationModal';

export default function RequestDetailsPage() {
  const { auth, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);

  const [request, setRequest] = useState<UserRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const fetchRequest = () => {
    if (auth?.token && id) {
      setLoading(true);
      getRequestDetails(id)
        .then(data => setRequest(data))
        .catch(err => {
          toast.error('No se pudo cargar la solicitud.');
          console.error(err);
        })
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    if (!authLoading && !auth) {
      router.push('/login');
    }
  }, [auth, authLoading, router]);

  useEffect(() => {
    fetchRequest();
  }, [auth?.token, id]);

  const handleApprove = (customerCode: string) => {
    updateRequestDetails(id, { customer_code: customerCode, status: 'Completado' })
      .then(() => {
        toast.success('Solicitud aprobada con éxito!');
        fetchRequest();
        setIsApproveModalOpen(false);
      })
      .catch(err => {
        toast.error('No se pudo aprobar la solicitud.');
        console.error(err);
      });
  };

  const handleReject = (reason: string) => {
    updateRequestDetails(id, { status: 'Rechazado', notes: reason })
      .then(() => {
        toast.success('Solicitud rechazada con éxito.');
        fetchRequest();
        setIsRejectModalOpen(false);
      })
      .catch(err => {
        toast.error('No se pudo rechazar la solicitud.');
        console.error(err);
      });
  };

  const handleDelete = () => {
    deleteRequest(id)
      .then(() => {
        toast.success('Solicitud eliminada con éxito.');
        router.push('/requests');
      })
      .catch(err => {
        toast.error('No se pudo eliminar la solicitud.');
        console.error(err);
      });
  };

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
                <div className="flex items-center space-x-4">
                    <Link href={`/requests/${id}/edit`} title="Editar Solicitud" className={request?.status === 'Completado' ? "text-gray-400 cursor-not-allowed" : "text-blue-600 hover:text-blue-900"}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </Link>
                    <button
                        title="Aprobar Solicitud"
                        disabled={request?.status === 'Completado'}
                        onClick={() => setIsApproveModalOpen(true)}
                        className="text-green-600 hover:text-green-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </button>
                    <button
                        title="Rechazar Solicitud"
                        disabled={request?.status === 'Rechazado'}
                        onClick={() => setIsRejectModalOpen(true)}
                        className="text-red-600 hover:text-red-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </button>
                    <button
                        title="Eliminar Solicitud"
                        disabled={request?.status === 'Completado'}
                        onClick={() => setIsDeleteModalOpen(true)}
                        className="text-gray-600 hover:text-gray-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
                
            </div>
          {request ? (
            <RequestDetails request={request} />
          ) : (
            <p>No se encontraron datos de la solicitud.</p>
          )}
        </div>
      </div>

      <ApproveConfirmationModal
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
        onConfirm={handleApprove}
      />

      <ConfirmationModal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        onConfirm={handleReject}
        title="Rechazar Solicitud"
        description="¿Estás seguro de que quieres rechazar esta solicitud? Por favor, proporciona un motivo."
        confirmText="Rechazar"
        cancelText="Cancelar"
        requiresReason
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Eliminar Solicitud"
        description="¿Estás seguro de que quieres eliminar esta solicitud? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
      />
    </main>
  );
}
