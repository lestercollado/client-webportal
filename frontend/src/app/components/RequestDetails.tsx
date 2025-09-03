import React from 'react';
import { UserRequest } from '@/services/api';

interface Props {
  request: UserRequest;
}

const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'Completado': return 'bg-green-100 text-green-800';
      case 'Rechazado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

const RequestDetails: React.FC<Props> = ({ request }) => {
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <p className="text-sm font-medium text-gray-500">Código Cliente</p>
          <p className="text-lg text-gray-900">{request.customer_code}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Email de Contacto</p>
          <p className="text-lg text-gray-900">{request.contact_email}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Estado</p>
          <p className="text-lg font-semibold text-gray-900">
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(request.status)}`}>
                {request.status}
            </span>
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Fecha de Creación</p>
          <p className="text-lg text-gray-900">{new Date(request.created_at).toLocaleString()}</p>
        </div>
        {request.notes && (
          <div className="md:col-span-2">
            <p className="text-sm font-medium text-gray-500">Notas Adicionales</p>
            <p className="text-lg text-gray-900 whitespace-pre-wrap">{request.notes}</p>
          </div>
        )}
      </div>

      {request.attachments && request.attachments.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Archivos Adjuntos</h3>
          <ul className="list-disc list-inside bg-gray-50 p-4 rounded-md">
            {request.attachments.map(att => (
              <li key={att.id}>
                <a
                  href={`${process.env.NEXT_PUBLIC_API_URL}${att.file_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:underline"
                >
                  {att.original_filename || `Archivo ${att.id}`}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {request.history && request.history.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Historial de Cambios</h3>
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha del cambio
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acción
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {request.history.map(item => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(item.changed_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.action}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {item.changed_by_username || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {item.changed_from_ip || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestDetails;