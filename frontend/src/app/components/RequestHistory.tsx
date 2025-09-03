// frontend/src/app/components/RequestHistory.tsx
import React from 'react';

interface HistoryItem {
  id: number;
  action: string;
  changed_by: {
    username: string;
  } | null;
  changed_at: string;
  changed_from_ip: string;
}

interface RequestHistoryProps {
  history: HistoryItem[];
}

const RequestHistory: React.FC<RequestHistoryProps> = ({ history }) => {
  if (!history || history.length === 0) {
    return <p>No hay historial de cambios para esta solicitud.</p>;
  }

  return (
    <div className="mt-8">
      <h3 className="text-xl font-semibold mb-4">Historial de Cambios</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4 border-b text-left">Acción</th>
              <th className="py-2 px-4 border-b text-left">Usuario</th>
              <th className="py-2 px-4 border-b text-left">Fecha</th>
              <th className="py-2 px-4 border-b text-left">Dirección IP</th>
            </tr>
          </thead>
          <tbody>
            {history.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="py-2 px-4 border-b">{item.action}</td>
                <td className="py-2 px-4 border-b">{item.changed_by?.username || 'Sistema'}</td>
                <td className="py-2 px-4 border-b">{new Date(item.changed_at).toLocaleString()}</td>
                <td className="py-2 px-4 border-b">{item.changed_from_ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RequestHistory;
