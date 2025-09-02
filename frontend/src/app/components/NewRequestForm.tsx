"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { createRequest } from "@/services/api";
import { useRouter } from "next/navigation";

export default function NewRequestForm() {
  const [customerCode, setCustomerCode] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const { auth } = useAuth();
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prevFiles) => [...prevFiles, ...newFiles]);
    }
  };

  const removeFile = (fileName: string) => {
    setFiles(files.filter((file) => file.name !== fileName));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!customerCode || !contactEmail) {
      toast.error("Por favor, complete todos los campos.");
      return;
    }

    if (files.length === 0) {
      toast.error("Por favor, suba al menos un archivo.");
      return;
    }

    if (!auth?.token) {
      toast.error("No estás autenticado. Por favor, inicia sesión.");
      return;
    }

    const formData = new FormData();
    formData.append("customer_code", customerCode);
    formData.append("contact_email", contactEmail);
    files.forEach((file) => {
      formData.append("attachments", file);
    });

    try {
      await createRequest(formData, auth.token);
      toast.success("Solicitud creada con éxito.");
      setCustomerCode("");
      setContactEmail("");
      setFiles([]);
      router.push("/"); // Redirigir a la página principal
    } catch (error: any) {
      toast.error(error.message || "Error al crear la solicitud.");
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-4">
        <div>
          <label
            htmlFor="customerCode"
            className="block text-sm font-medium text-gray-700"
          >
            Código del Cliente
          </label>
          <input
            type="text"
            id="customerCode"
            value={customerCode}
            onChange={(e) => setCustomerCode(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="contactEmail"
            className="block text-sm font-medium text-gray-700"
          >
            Correo Electrónico de Contacto
          </label>
          <input
            type="email"
            id="contactEmail"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Planilla(s)
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
                  htmlFor="file-upload"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                >
                  <span>Sube tus archivos</span>
                  <input
                    id="file-upload"
                    name="file-upload"
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
      </div>

      {files.length > 0 && (
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Archivos Seleccionados
          </h3>
          <ul className="mt-2 divide-y divide-gray-200">
            {files.map((file) => (
              <li
                key={file.name}
                className="flex items-center justify-between py-2"
              >
                <span className="text-sm font-medium text-gray-900">
                  {file.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(file.name)}
                  className="ml-4 text-gray-600 hover:text-gray-900"
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

      <div>
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Enviar Solicitud
        </button>
      </div>
    </form>
  );
}
