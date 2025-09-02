'use client';
import { useState, FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createRequest } from '@/services/api';

const NewRequestForm = () => {
  const [customerCode, setCustomerCode] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [attachments, setAttachments] = useState<FileList | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { auth } = useAuth();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(e.target.files);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!customerCode || !contactEmail || !attachments || attachments.length === 0) {
      setError('Todos los campos son obligatorios, incluyendo al menos un archivo adjunto.');
      return;
    }
    if (!auth?.token) {
      setError('No estás autenticado.');
      return;
    }

    setIsLoading(true);
    setError('');
    setMessage('');

    const formData = new FormData();
    formData.append('customer_code', customerCode);
    formData.append('contact_email', contactEmail);
    formData.append('notes', notes);
    for (let i = 0; i < attachments.length; i++) {
      formData.append('attachments', attachments[i]);
    }

    try {
      await createRequest(formData, auth.token);
      setMessage('¡Solicitud creada con éxito!');
      setCustomerCode('');
      setContactEmail('');
      setNotes('');
      setAttachments(null);
      const fileInput = document.getElementById('attachments') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      window.dispatchEvent(new Event('requestCreated'));
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al crear la solicitud.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Crear Nueva Solicitud</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="customerCode" className="block text-sm font-medium text-gray-700">
            Código del Cliente
          </label>
          <input
            type="text"
            id="customerCode"
            value={customerCode}
            onChange={(e) => setCustomerCode(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700">
            Correo Electrónico de Contacto
          </label>
          <input
            type="email"
            id="contactEmail"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
            Notas
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="attachments" className="block text-sm font-medium text-gray-700">
            Adjuntar Planillas
          </label>
          <input
            type="file"
            id="attachments"
            onChange={handleFileChange}
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100"
            accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
            required
            multiple
          />
        </div>
        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
          >
            {isLoading ? 'Enviando...' : 'Enviar Solicitud'}
          </button>
        </div>
        {message && <p className="text-green-600 text-sm mt-2">{message}</p>}
        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      </form>
    </div>
  );
};

export default NewRequestForm;
