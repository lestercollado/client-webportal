import React from 'react';
import { UserRequest } from '@/services/api';
import { FaFilePdf, FaFileWord, FaFileImage, FaFile } from 'react-icons/fa';

interface Props {
  request: UserRequest;
}

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

const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'Completado': return 'bg-green-100 text-green-800';
      case 'Rechazado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

const DetailItem: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => (
    <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="text-lg text-gray-900">{value || 'N/A'}</p>
    </div>
);

const RequestDetails: React.FC<Props> = ({ request }) => {
  return (
    <div>
      {/* Request Status and Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 pb-6 border-b border-gray-200">
        <div>
            <p className="text-sm font-medium mb-2 text-gray-500">Estado</p>
            <div className="text-lg font-semibold text-gray-900 flex items-center">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(request.status)}`}>
                    {request.status}
                </span>
                {request.status === 'Rechazado' && request.note_reject && (
                    <span className="ml-2 text-sm font-normal text-gray-500">({request.note_reject})</span>
                )}
            </div>
        </div>
        <DetailItem label="Fecha de Creación" value={new Date(request.created_at).toLocaleString()} />
        {/* <DetailItem label="Creado por" value={request.created_by_username ?? 'WebTCM'} /> */}
        <DetailItem label="IP de Origen" value={request.created_from_ip} />
      </div>

      {/* Company Details */}
      <div className="mb-6 pb-6 border-b border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Detalles de la Empresa</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <DetailItem label="Nombre de la Empresa" value={request.company_name} />
            <DetailItem label="NIT" value={request.tax_id} />
            {request.customer_code && <DetailItem label="Código de Cliente" value={request.customer_code} />}
            <DetailItem label="Teléfono" value={request.phone} />
            <DetailItem label="Email" value={request.email} />
            <DetailItem label="Dirección" value={`${request.address}, ${request.city}, ${request.state}`} />
            {request.customer_role && request.customer_role.length > 0 && (
                <div className="md:col-span-3">
                    <p className="text-sm font-medium text-gray-500">Roles de la Empresa</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                        {request.customer_role.map((role, index) => (
                            <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {role}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* Contact Details */}
      <div className="mb-6 pb-6 border-b border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Persona de Contacto</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <DetailItem label="Nombre" value={request.contact_name} />
            <DetailItem label="Cargo" value={request.contact_position} />
            <DetailItem label="Teléfono" value={request.contact_phone} />
            <DetailItem label="Email" value={request.contact_email} />
        </div>
      </div>      

      {/* Authorized Persons */}
      {request.authorized_persons && request.authorized_persons.length > 0 && (
        <div className="mb-6 pb-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Personas Autorizadas</h3>
          <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md">
            {request.authorized_persons.map(person => (
              <li key={person.id} className="px-4 py-4 hover:bg-gray-50">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-2">
                    <div className="sm:col-span-1">
                        <p className="text-sm font-bold text-gray-800">{person.name}</p>
                        <p className="text-xs text-gray-500">{person.position}</p>
                    </div>
                    <div className="sm:col-span-1">
                        <p className="text-sm text-gray-600">{person.email || 'N/A'}</p>
                        <p className="text-sm text-gray-600">{person.phone}</p>
                    </div>
                    <div className="sm:col-span-1 flex items-center space-x-4">
                        {person.informational && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Informativo</span>}
                        {person.operational && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Operacional</span>}
                    </div>
                </div>
                {person.associated_with && <p className="text-xs text-gray-500 mt-2">Asociado con: {person.associated_with}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Attachments */}
      {request.uploaded_files && request.uploaded_files.length > 0 && (
        <div className="mb-6 pb-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Archivos Adjuntos</h3>
          <div className="flex flex-wrap gap-4">
            {request.uploaded_files.map(att => (
              <a
                key={att}
                href={`https://www.tcmariel.cu/wp-content/uploads/users-webportal/${att}`}
                target="_blank"
                rel="noopener noreferrer"
                title={att || 'Descargar'}
                className="flex items-center space-x-2 text-gray-500 hover:text-indigo-600 transition-colors"
              >
                <span>{getFileIcon(att)}</span>
                <span>{att}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {request.notes && (
        <div className="mb-6 pb-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Notas Adicionales</h3>
          <p className="text-lg text-gray-900 whitespace-pre-wrap bg-gray-50 p-4 rounded-md">{request.notes}</p>
        </div>
      )}

      {/* History */}
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
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(item.changed_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 break-words max-w-md">
                      {item.action}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {item.changed_by_username || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
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
