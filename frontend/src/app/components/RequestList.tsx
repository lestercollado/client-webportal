'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getRequests, UserRequest, deleteRequest, updateRequestDetails } from '@/services/api';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import ApproveConfirmationModal from './ApproveConfirmationModal';
import RejectConfirmationModal from './RejectConfirmationModal';
import { FaStickyNote, FaFilePdf, FaFileWord, FaFileImage, FaFile, FaExclamationTriangle, FaCheck, FaTimes, FaEye } from 'react-icons/fa';

interface RequestListProps {
  limit?: number;
  showControls?: boolean;
  title?: string;
  onDataChange?: () => void;
}

// Interfaz para la respuesta paginada
interface PaginatedRequests {
  items: UserRequest[];
  total_pages: number;
  current_page?: number;
  total_items?: number;
}

// Type guard para verificar si es una respuesta paginada
function isPaginatedResponse(data: any): data is PaginatedRequests {
  return data && 
         typeof data === 'object' && 
         'items' in data && 
         Array.isArray(data.items) && 
         'total_pages' in data && 
         typeof data.total_pages === 'number';
}

const RequestList = ({ 
  limit, 
  showControls = true, 
  title = "Últimas Solicitudes",
  onDataChange
}: RequestListProps) => {
  const [requests, setRequests] = useState<UserRequest[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const { auth } = useAuth();

  // Estados para paginación y filtros
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    customer_code: '',
    contact_email: '',
    customer_role: ''
  });

  const [confirmationState, setConfirmationState] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const [approveModalState, setApproveModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    initialCustomerCode: '',
    initialCustomerRole: [] as string[],
    onConfirm: (customerCode: string, customerRole: string[]) => {},
  });

  const [rejectModalState, setRejectModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: (reason: string) => {},
  });

  const fetchRequests = async () => {
    if (!auth?.token) {
      setError('No estás autenticado.');
      setIsLoading(false);
      return;
    }

    try {
      setIsFetching(true);
      // Construir query params
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      if (limit) params.append('limit', limit.toString());
      if (filters.status) params.append('status', filters.status);
      if (filters.customer_code) params.append('customer_code', filters.customer_code);
      if (filters.contact_email) params.append('contact_email', filters.contact_email);
      if (filters.customer_role) params.append('customer_role', filters.customer_role);

      const data = await getRequests(params);
      
      // Usar type guard para manejar ambos tipos de respuesta
      if (isPaginatedResponse(data)) {
        // Es una respuesta paginada
        setRequests(data.items);
        setTotalPages(data.total_pages);
      } else if (Array.isArray(data)) {
        // Es un array simple de UserRequest
        setRequests(data);
        setTotalPages(1);
      } else {
        // Caso de error - datos en formato inesperado
        console.error('Formato de respuesta inesperado:', data);
        setRequests([]);
        setTotalPages(1);
        setError('Los datos recibidos tienen un formato inesperado.');
      }

    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al cargar las solicitudes.');
      setRequests([]);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [auth?.token, currentPage, filters]);
  
  const router = useRouter();
  
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setCurrentPage(1); // Resetear a la primera página al cambiar filtros
  };

  const updateRequestInList = (updatedRequest: UserRequest) => {
    setRequests(requests.map(req => req.id === updatedRequest.id ? updatedRequest : req));
  };

  const handleApprove = async (id: number) => {
    const requestToApprove = requests.find(req => req.id === id);
    if (!requestToApprove) return;

    setApproveModalState({
      isOpen: true,
      title: 'Confirmar Aprobación',
      message: `Vas a aprobar la solicitud. Por favor, escriba el código de cliente, creado previamente en el CiTOS`,
      initialCustomerCode: requestToApprove.customer_code,
      initialCustomerRole: requestToApprove.customer_role || [],
      onConfirm: async (customerCode: string, customerRole: string[]) => {
        if (!auth?.token) return toast.error('No estás autenticado.');
        try {
          const updatedRequest = await updateRequestDetails(id, { 
            status: 'Completado',
            customer_code: customerCode,
            customer_role: customerRole
          });
          updateRequestInList(updatedRequest);
          toast.success('Solicitud aprobada con éxito.');
          if (onDataChange) onDataChange();
        } catch (error: any) {
          toast.error(error.message || 'Error al aprobar la solicitud.');
        }
        setApproveModalState({ isOpen: false, title: '', message: '', initialCustomerCode: '', initialCustomerRole: [], onConfirm: () => {} });
      },
    });
  };

  const handleReject = (id: number) => {
    setRejectModalState({
      isOpen: true,
      title: 'Confirmar Rechazo',
      message: 'Por favor, especifique el motivo del rechazo para esta solicitud.',
      onConfirm: async (reason: string) => {
        if (!auth?.token) {
          toast.error('No estás autenticado.');
          return;
        }
        try {
          const updatedRequest = await updateRequestDetails(id, { status: 'Rechazado', note_reject: reason });
          updateRequestInList(updatedRequest);
          toast.success('Solicitud rechazada con éxito.');
          if (onDataChange) onDataChange();
        } catch (error: any) {
          toast.error(error.message || 'Error al rechazar la solicitud.');
        }
        setRejectModalState({ isOpen: false, title: '', message: '', onConfirm: () => {} });
      },
    });
  };

  const handleDelete = (id: number) => {
    setConfirmationState({
      isOpen: true,
      title: 'Confirmar Eliminación',
      message: '¿Estás seguro de que quieres eliminar esta solicitud?',
      onConfirm: async () => {
        if (!auth?.token) return toast.error('No estás autenticado.');
        try {
          await deleteRequest(id);
          setRequests(requests.filter((req) => req.id !== id));
          toast.success("Solicitud eliminada con éxito.");
          if (onDataChange) onDataChange();
        } catch (error: any) {
          toast.error(error.message || "Hubo un error al eliminar la solicitud.");
        }
        setConfirmationState({ isOpen: false, title: '', message: '', onConfirm: () => {} });
      },
    });
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
      case 'pdf':
        return <FaFilePdf className="h-6 w-6" />;
      case 'doc':
      case 'docx':
        return <FaFileWord className="h-6 w-6" />;
      case 'png':
      case 'jpg':
      case 'jpeg':
        return <FaFileImage className="h-6 w-6" />;
      default:
        return <FaFile className="h-6 w-6" />;
    }
  };

  if (isLoading) return <div className="text-center p-6">Cargando solicitudes...</div>;
  if (error) return <div className="text-red-600 text-center p-6">{error}</div>;

  return (
    <>
      <ApproveConfirmationModal
        isOpen={approveModalState.isOpen}
        onClose={() => setApproveModalState({ isOpen: false, title: '', message: '', initialCustomerCode: '', initialCustomerRole: [], onConfirm: () => {} })}
        onConfirm={approveModalState.onConfirm}
        title={approveModalState.title}
        message={approveModalState.message}
        initialCustomerCode={approveModalState.initialCustomerCode}
        initialCustomerRole={approveModalState.initialCustomerRole}
      />
      <RejectConfirmationModal
        isOpen={rejectModalState.isOpen}
        onClose={() => setRejectModalState({ isOpen: false, title: '', message: '', onConfirm: () => {} })}
        onConfirm={rejectModalState.onConfirm}
        title={rejectModalState.title}
        message={rejectModalState.message}
      />
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">{title}</h2>
      
      {showControls && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <input
            type="text"
            name="customer_code"
            placeholder="Filtrar por código..."
            value={filters.customer_code}
            onChange={handleFilterChange}
            className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          <input
            type="text"
            name="contact_email"
            placeholder="Filtrar por email..."
            value={filters.contact_email}
            onChange={handleFilterChange}
            className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          <select
            name="customer_role"
            value={filters.customer_role}
            onChange={handleFilterChange}
            className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="">Todos los grupos</option>
            <option value="Cliente Final">Cliente Final</option>
              <option value="Importador">Importador</option>
              <option value="Transportista">Transportista</option>
              <option value="IMPORT-TRANSP">IMPORT-TRANSP</option>
              <option value="NAV-INFO-OPER">NAV-INFO-OPER</option>
              <option value="IMPORT-INFO-OPER">IMPORT-INFO-OPER</option>
              <option value="Navieras">Navieras</option>
          </select>
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="">Todos los estados</option>
            <option value="Pendiente">Pendiente</option>
            <option value="Completado">Completado</option>
            <option value="Rechazado">Rechazado</option>
          </select>
        </div>
      )}

      <div className="overflow-x-auto relative">
        {isFetching && (
          <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center z-10">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        )}
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-2 py-3"></th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Código Cliente
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Empresa
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Adjuntos
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Enviada
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {requests.length > 0 ? (
              requests.map((req) => (
                <tr key={req.id}>
                  <td className="px-2 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <div className="flex items-center space-x-2">
                      {req.different && (
                        <FaExclamationTriangle className="h-5 w-5 text-red-500" title="Cliente existente" />
                      )}
                      {req.notes && (
                        <FaStickyNote className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{req.customer_code}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{req.company_name}</td>                
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center space-x-2">
                      {req.uploaded_files && req.uploaded_files.length > 0 ? (
                        req.uploaded_files.map((att) => (
                          console.log(att),
                          <a
                            key={att}
                            href={`https://www.tcmariel.cu/wp-content/uploads/users-webportal/${att}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={att || 'Descargar'}
                            className="text-gray-500 hover:text-indigo-600"
                          >
                            {getFileIcon(att)}
                          </a>
                        ))
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(req.status)}`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(req.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-3">
                      {req.status !== 'Completado' && (
                        <>
                          <button onClick={() => handleApprove(req.id)} title="Aprobar" className="text-green-600 hover:text-green-900">
                            <FaCheck className="h-5 w-5" />
                          </button>

                          {req.status !== 'Rechazado' && (
                            <button onClick={() => handleReject(req.id)} title="Rechazar" className="text-red-600 hover:text-red-900">
                              <FaTimes className="h-5 w-5" />
                            </button>
                          )} 
                          {/* <button onClick={() => router.push(`/requests/${req.id}/edit`)} title="Editar" className="text-blue-600 hover:text-blue-900">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                              <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                            </svg>
                          </button> */}

                        </>
                      )}
                      
                      {/* Botón Detalles */}
                      <button
                        onClick={() => router.push(`/requests/${req.id}/details`)}
                        title="Ver detalles"
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <FaEye className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                  No hay solicitudes para mostrar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showControls && totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="py-2 px-4 border rounded-md disabled:opacity-50"
          >
            Anterior
          </button>
          <span>
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="py-2 px-4 border rounded-md disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
    </>
  );
};

export default RequestList;