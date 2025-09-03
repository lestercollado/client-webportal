import React from 'react';
import { UserRequest } from '@/services/api';

interface Props {
  request: UserRequest;
}

const RequestDetails: React.FC<Props> = ({ request }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-4">
        <strong>Código Cliente:</strong> {request.customer_code}
      </div>
      <div className="mb-4">
        <strong>Email:</strong> {request.contact_email}
      </div>
      <div className="mb-4">
        <strong>Estado:</strong> {request.status}
      </div>
      <div className="mb-4">
        <strong>Fecha de creación:</strong> {new Date(request.created_at).toLocaleString()}
      </div>
      {request.notes && (
        <div className="mb-4">
          <strong>Notas:</strong> {request.notes}
        </div>
      )}
      {request.attachments && request.attachments.length > 0 && (
        <div className="mb-4">
          <strong>Adjuntos:</strong>
          <ul className="list-disc ml-6">
            {request.attachments.map(att => (
              <li key={att.id}>
                <a
                  href={`${process.env.NEXT_PUBLIC_API_URL}${att.file_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 underline"
                >
                  {att.original_filename || att.file_url}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      {request.history && request.history.length > 0 && (
        <div>
          <strong>Historial:</strong>
          <ul className="mt-2 border-l-2 border-indigo-200 pl-4">
            {request.history.map(item => (
              <li key={item.id} className="mb-2">
                <div>
                  <span className="font-semibold">{item.action}</span> - {new Date(item.changed_at).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default RequestDetails;