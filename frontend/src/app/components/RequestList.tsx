'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getRequests, UserRequest, deleteRequest, updateRequestDetails } from '@/services/api';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import ConfirmationModal from './ConfirmationModal'; // Importar el modal

// --- Interfaces y Type Guards ---
interface RequestListProps {
  limit?: number;
  showControls?: boolean;
  title?: string;
}

interface PaginatedRequests {
  items: UserRequest[];
  total_pages: number;
  current_page?: number;
  total_items?: number;
}

function isPaginatedResponse(data: any): data is PaginatedRequests {
  return data && typeof data === 'object' && 'items' in data && Array.isArray(data.items) && 'total_pages' in data;
}

// --- Componente Principal ---
const RequestList = ({ 
  limit, 
  showControls = true, 
  title = "Últimas Solicitudes"
}: RequestListProps) => {
  // --- Estados del Componente ---
  const [requests, setRequests] = useState<UserRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState('');
  const { auth } = useAuth();
  const router = useRouter();

  // Estados para paginación y filtros
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({ status: '', customer_code: '', contact_email: '' });

  // Estado para el modal de confirmación
  const [modalState, setModalState] = useState({
    isOpen: false,
    requestId: null as number | null,
    action: null as 'approve' | 'reject' | 'delete' | null,
    title: '',
    message: '',
  });

  // --- Efectos ---
  useEffect(() => {
    fetchRequests();
  }, [auth?.token, currentPage, filters]);

  // --- Lógica de Datos ---
  const fetchRequests = async () => {
    if (!auth?.token) {
      setError('No estás autenticado.');
      setIsLoading(false);
      return;
    }
    setIsFetching(true);
    try {
      const params = new URLSearchParams({ page: currentPage.toString(), ...filters });
      if (limit) params.append('limit', limit.toString());
      
      const data = await getRequests(params);
      if (isPaginatedResponse(data)) {
        setRequests(data.items);
        setTotalPages(data.total_pages);
      } else if (Array.isArray(data)) {
        setRequests(data);
        setTotalPages(1);
      } else {
        throw new Error('Los datos recibidos tienen un formato inesperado.');
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al cargar las solicitudes.');
      setRequests([]);
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  };

  const updateRequestInList = (updatedRequest: UserRequest) => {
    setRequests(prevRequests => 
      prevRequests.map(req => req.id === updatedRequest.id ? updatedRequest : req)
    );
  };

  // --- Manejadores de Acciones (abren el modal) ---
  const handleApprove = (id: number) => {
    setModalState({
      isOpen: true,
      requestId: id,
      action: 'approve',
      title: 'Confirmar Aprobación',
      message: '¿Estás seguro de que quieres marcar esta solicitud como completada?',
    });
  };

  const handleReject = (id: number) => {
    setModalState({
      isOpen: true,
      requestId: id,
      action: 'reject',
      title: 'Confirmar Rechazo',
      message: '¿Estás seguro de que quieres rechazar esta solicitud?',
    });
  };

  const handleDelete = (id: number) => {
    setModalState({
      isOpen: true,
      requestId: id,
      action: 'delete',
      title: 'Confirmar Eliminación',
      message: '¿Estás seguro de que quieres eliminar esta solicitud? Esta acción es irreversible.',
    });
  };

  // --- Lógica del Modal ---
  const handleCloseModal = () => {
    setModalState({ isOpen: false, requestId: null, action: null, title: '', message: '' });
  };

  const handleConfirmAction = async () => {
    if (!modalState.requestId || !modalState.action || !auth?.token) return;

    try {
      switch (modalState.action) {
        case 'approve': {
          const updatedRequest = await updateRequestDetails(modalState.requestId, { status: 'Completado' });
          console.log('API response for approve:', updatedRequest); // DEBUGGING
          updateRequestInList(updatedRequest);
          toast.success('Solicitud aprobada con éxito.');
          break;
        }
        case 'reject': {
          const updatedRequest = await updateRequestDetails(modalState.requestId, { status: 'Rechazado' });
          console.log('API response for reject:', updatedRequest); // DEBUGGING
          updateRequestInList(updatedRequest);
          toast.success('Solicitud rechazada con éxito.');
          break;
        }
        case 'delete': {
          await deleteRequest(modalState.requestId);
          setRequests(prev => prev.filter(req => req.id !== modalState.requestId));
          toast.success('Solicitud eliminada con éxito.');
          break;
        }
      }
    } catch (error: any) {
      toast.error(error.message || `Error al ejecutar la acción.`);
    } finally {
      handleCloseModal();
    }
  };
  
  // --- Renderizado ---
  // (El resto del JSX se mantiene igual, solo se cambian los onClick de los botones)
  // ...

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setCurrentPage(1);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'Completado': return 'bg-green-100 text-green-800';
      case 'Rechazado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFileIcon = (fileUrl: string) => {
    const extension = fileUrl.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': return <svg>...</svg>; // SVGs omitidos por brevedad
      default: return <svg>...</svg>;
    }
  };

  if (isLoading) return <div className="text-center p-6">Cargando solicitudes...</div>;
  if (error) return <div className="text-red-600 text-center p-6">{error}</div>;

  return (
    <>
      <ConfirmationModal 
        isOpen={modalState.isOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmAction}
        title={modalState.title}
        message={modalState.message}
      />

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">{title}</h2>
        
        {showControls && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                {/* Inputs de filtro */}
            </div>
        )}

        <div className="overflow-x-auto relative">
            {isFetching && <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center z-10"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div></div>}
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">{/* ... Encabezados de tabla ... */}</thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {requests.length > 0 ? (
                    requests.map((req) => (
                        <tr key={req.id}>
                        {/* ... celdas de datos ... */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-3">
                            <button onClick={() => handleApprove(req.id)} title="Aprobar" className="text-green-600 hover:text-green-900">{/* SVG */}</button>
                            <button onClick={() => handleReject(req.id)} title="Rechazar" className="text-red-600 hover:text-red-900">{/* SVG */}</button>
                            <button onClick={() => router.push(`/requests/${req.id}/edit`)} title="Editar" className="text-blue-600 hover:text-blue-900">{/* SVG */}</button>
                            <button onClick={() => handleDelete(req.id)} title="Eliminar" className="text-gray-600 hover:text-gray-900">{/* SVG */}</button>
                            <button onClick={() => router.push(`/requests/${req.id}/details`)} title="Ver detalles" className="text-indigo-600 hover:text-indigo-900">{/* SVG */}</button>
                            </div>
                        </td>
                        </tr>
                    ))
                    ) : (
                    <tr><td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">No hay solicitudes para mostrar.</td></tr>
                    )}
                </tbody>
            </table>
        </div>

        {showControls && totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">{/* Controles de paginación */}</div>
        )}
      </div>
    </>
  );
};

export default RequestList;
