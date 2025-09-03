import { getRequestDetails } from '@/services/api';
import RequestDetails from '@/app/components/RequestDetails';

interface Props {
  params: { id: string };
}

export default async function RequestDetailsPage({ params }: Props) {
  // Aquí puedes obtener el token desde cookies/session si lo necesitas
  // Por ahora, se asume que getRequestDetails maneja la autenticación
  const request = await getRequestDetails(params.id);

  if (!request) {
    return <div className="p-6 text-red-600">No se encontró la solicitud.</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Detalles de la Solicitud</h1>
      <RequestDetails request={request} />
    </div>
  );
}