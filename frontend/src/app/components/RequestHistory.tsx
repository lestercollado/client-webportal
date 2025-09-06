import React from 'react';

interface HistoryItem {
  id: number;
  action: string;
  changed_by_username?: string;
  changed_at: string;
  changed_from_ip?: string;
}

interface RequestHistoryProps {
  history: HistoryItem[];
}

const RequestHistory: React.FC<RequestHistoryProps> = ({ history }) => {
  if (!history || history.length === 0) {
    return (
        <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Historial de Cambios</h3>
            <p>No hay historial de cambios para esta solicitud.</p>
        </div>
    );
  }

  return (
    <div className="mt-8">
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
            {history.map(item => (
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
  );
};

export default RequestHistory;