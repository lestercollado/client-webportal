"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { updateRequest, UserRequest } from "@/services/api";
import { useRouter } from "next/navigation";

interface Attachment {
  id: number;
  file_url: string;
  original_filename?: string;
}

interface EditRequestFormProps {
  requestData: UserRequest;
}

export default function EditRequestForm({ requestData }: EditRequestFormProps) {
  const [customerCode, setCustomerCode] = useState(requestData.customer_code);
  const [contactEmail, setContactEmail] = useState(requestData.contact_email);
  const [notes, setNotes] = useState(requestData.notes || '');
  const [existingAttachments, setExistingAttachments] = useState<Attachment[]>(requestData.attachments);
  const [attachmentsToDelete, setAttachmentsToDelete] = useState<number[]>([]);
  const [newAttachments, setNewAttachments] = useState<File[]>([]);
  
  const { auth } = useAuth();
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setNewAttachments(prev => [...prev, ...Array.from(e.target.files as Iterable<File>)]);
    }
  };

  const handleRemoveExistingAttachment = (id: number) => {
    setExistingAttachments(prev => prev.filter(att => att.id !== id));
    setAttachmentsToDelete(prev => [...prev, id]);
  };

  const handleRemoveNewAttachment = (index: number) => {
    setNewAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!auth?.token) return toast.error("No estás autenticado.");

    const formData = new FormData();
    formData.append("customer_code", customerCode);
    formData.append("contact_email", contactEmail);
    formData.append("notes", notes);
    
    // Append new files
    newAttachments.forEach(file => {
      formData.append("attachments", file);
    });

    // Append IDs of attachments to delete
    if (attachmentsToDelete.length > 0) {
      formData.append("attachments_to_delete", JSON.stringify(attachmentsToDelete));
    }

    try {
      await updateRequest(requestData.id, formData);
      toast.success("Solicitud actualizada con éxito.");
      router.push("/");
      router.refresh(); // To see the changes
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar la solicitud.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="customerCode" className="block text-sm font-medium text-gray-700">
          Código del Cliente
        </label>
        <input
          type="text"
          id="customerCode"
          value={customerCode}
          onChange={(e) => setCustomerCode(e.target.value)}
          className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm"
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
          className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm"
        />
      </div>      
      
      {/* Existing Attachments */}
      {existingAttachments.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700">Archivos Adjuntos Actuales</h3>
          <ul className="mt-2 divide-y divide-gray-200 border rounded-md">
            {existingAttachments.map(att => (
              <li key={att.id} className="px-3 py-2 flex justify-between items-center text-sm">
                <a href={`${process.env.NEXT_PUBLIC_API_URL}${att.file_url}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                  {att.original_filename || att.id}
                </a>
                <button
                  type="button"
                  onClick={() => handleRemoveExistingAttachment(att.id)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* New Attachments to Upload */}
      {newAttachments.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700">Nuevos Archivos a Subir</h3>
          <ul className="mt-2 divide-y divide-gray-200 border rounded-md">
            {newAttachments.map((file, index) => (
              <li key={index} className="px-3 py-2 flex justify-between items-center text-sm">
                <span>{file.name}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveNewAttachment(index)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* File Upload Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Añadir Nuevos Archivos
        </label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
          <div className="space-y-1 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="flex text-sm text-gray-600">
              <label
                htmlFor="attachments"
                className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
              >
                <span>Sube tus archivos</span>
                <input
                  id="attachments"
                  name="attachments"
                  type="file"
                  multiple
                  className="sr-only"
                  onChange={handleFileChange}
                  accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                />
              </label>
              <p className="pl-1">o arrástralos aquí</p>
            </div>
            <p className="text-xs text-gray-500">
              JPG, PNG, PDF, DOC, DOCX hasta 10MB
            </p>
          </div>
        </div>
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
          className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm"
        />
      </div>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => router.back()}
          className="py-2 px-4 mr-2 border rounded-md"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Guardar Cambios
        </button>
      </div>
    </form>
  );
}