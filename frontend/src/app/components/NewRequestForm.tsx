'use client';
import { useState, FormEvent, DragEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createRequest, ApiError } from '@/services/api';
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const NewRequestForm = () => {
  const [customerCode, setCustomerCode] = useState('');
  const [customerRole, setCustomerRole] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const { auth } = useAuth();
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(prev => [...prev, ...Array.from(e.target.files as Iterable<File>)]);
    }
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setAttachments(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };
  
  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!customerCode || !contactEmail || attachments.length === 0) {
      toast.error('Todos los campos son obligatorios, incluyendo al menos un archivo adjunto.');
      return;
    }
    if (!auth?.token) {
      toast.error('No estás autenticado.');
      return;
    }

    setIsLoading(true);

    const formData = new FormData();
    formData.append('customer_code', customerCode);
    formData.append('contact_email', contactEmail);
    formData.append('customer_role', customerRole);
    formData.append('notes', notes);
    attachments.forEach(file => {
      formData.append('attachments', file);
    });

    try {
      await createRequest(formData);
      toast.success("Solicitud creada con éxito.");
      router.push("/");
      router.refresh()
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error('Ocurrió un error al crear la solicitud.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Crear Nueva Solicitud</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <label htmlFor="customerRole" className="block text-sm font-medium text-gray-700">
              Grupo
            </label>
            <select
              id="customerRole"
              value={customerRole}
              onChange={(e) => setCustomerRole(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            >
              <option value="">Selecciona un grupo</option>
              <option value="Cliente Final">Cliente Final</option>
              <option value="Importador">Importador</option>
              <option value="Transportista">Transportista</option>
              <option value="IMPORT-TRANSP">IMPORT-TRANSP</option>
              <option value="NAV-INFO-OPER">NAV-INFO-OPER</option>
              <option value="IMPORT-INFO-OPER">IMPORT-INFO-OPER</option>
              <option value="Navieras">Navieras</option>
            </select>
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
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Adjuntar Planillas
          </label>
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${isDragging ? 'border-indigo-500' : 'border-gray-300'} border-dashed rounded-md`}
          >
            <div className="space-y-1 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="flex text-sm text-gray-600">
                <label htmlFor="attachments" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                  <span>Sube tus archivos</span>
                  <input id="attachments" name="attachments" type="file" multiple className="sr-only" onChange={handleFileChange} accept=".jpg,.jpeg,.png,.pdf,.doc,.docx" />
                </label>
                <p className="pl-1">o arrástralos aquí</p>
              </div>
              <p className="text-xs text-gray-500">JPG, PNG, PDF, DOC, DOCX hasta 10MB</p>
            </div>
          </div>
        </div>

        {attachments.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700">Archivos a Subir</h3>
            <ul className="mt-2 divide-y divide-gray-200 border rounded-md">
              {attachments.map((file, index) => (
                <li key={index} className="px-3 py-2 flex justify-between items-center text-sm">
                  <span>{file.name}</span>
                  <button type="button" onClick={() => handleRemoveAttachment(index)} className="text-gray-600 hover:text-gray-900">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
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