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
import RejectConfirmationModal from '@/app/components/RejectConfirmationModal';

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

  const handleApprove = (customerCode: string, customerRole: string[]) => {
    updateRequestDetails(id, { customer_code: customerCode, customer_role: customerRole, status: 'Completado' })
      .then(() => {
        toast.success('Solicitud aprobada con éxito!');
        fetchRequest();
        setIsApproveModalOpen(false);
      })
      .catch(err => {
        toast.error("Ya existe una solicitud con este código de cliente.");
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
                    {request?.status !== 'Completado' && (
                        <>
                            <button 
                                onClick={() => setIsApproveModalOpen(true)} 
                                title="Aprobar" 
                                className="text-green-600 hover:text-green-900"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </button>

                            {request?.status !== 'Rechazado' && (
                                <button 
                                    onClick={() => setIsRejectModalOpen(true)} 
                                    title="Rechazar" 
                                    className="text-red-600 hover:text-red-900"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            )}

                            {/* <Link 
                                href={`/requests/${id}/edit`} 
                                title="Editar" 
                                className="text-blue-600 hover:text-blue-900"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                                    <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                                </svg>
                            </Link> */}
                            
                            {/* <button 
                                onClick={() => setIsDeleteModalOpen(true)} 
                                title="Eliminar" 
                                className="text-gray-600 hover:text-gray-900"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </button> */}
                        </>
                    )}
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
        title="Confirmar Aprobación"
        message="Vas a aprobar la solicitud. Por favor, escriba el código de cliente y el rol del cliente, creado previamente en el CiTOS."
        initialCustomerCode={request?.customer_code || ''}
        initialCustomerRole={request?.customer_role || []}
      />

      <RejectConfirmationModal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        onConfirm={handleReject}
        title="Confirmar Rechazo"
        message="Por favor, especifique el motivo del rechazo para esta solicitud."
      />
    </main>
  );
}
