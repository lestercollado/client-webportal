'use client';

import React, { useState, useEffect } from 'react';
import MultiSelectDropdown from './MultiSelectDropdown'; // Importar el nuevo componente

interface ApproveConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (customerCode: string, customerRole: string[]) => void;
  title: string;
  message: string;
  initialCustomerCode: string;
  initialCustomerRole: string[];
}

const customerRolesOptions = [
  "COMERCIAL",
  "NAV-INFO",
  "NAV-INFO-OPER",
  "TRANSPORTISTAS",
  "NAVIERAS",
  "IMPORT-INFO-OPER",
  "ZONA DE ACTIVIDADES LOG",
  "ASAT",
  "NO-TRANSFERENCIA",
  "IMPORT-INFO",
  "TRANSITARIA",
  "CF-INFO-OPER",
  "TRANS-IMPORT",
  "IMPORT-OPER",
];

const ApproveConfirmationModal: React.FC<ApproveConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  initialCustomerCode,
  initialCustomerRole,
}) => {
  const [customerCode, setCustomerCode] = useState(initialCustomerCode);
  const [customerRole, setCustomerRole] = useState<string[]>(initialCustomerRole);

  useEffect(() => {
    setCustomerCode(initialCustomerCode);
    setCustomerRole(initialCustomerRole);
  }, [initialCustomerCode, initialCustomerRole]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (customerCode && customerCode.trim() && customerRole && customerRole.length > 0) {
      onConfirm(customerCode, customerRole);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <p className="mt-2 text-sm text-gray-600">{message}</p>
        
        <div className="mt-4">
          <label htmlFor="customer_code" className="block text-sm font-medium text-gray-700">
            Código de Cliente
          </label>
          <input
            type="text"
            name="customer_code"
            id="customer_code"
            value={customerCode || ''}
            onChange={(e) => setCustomerCode(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <div className="mt-4">
          <label htmlFor="customer_role" className="block text-sm font-medium text-gray-700">
            Rol del Cliente
          </label>
          <MultiSelectDropdown
            options={customerRolesOptions}
            selectedOptions={customerRole}
            onChange={setCustomerRole}
            label="roles"
          />
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!customerCode || !customerCode.trim() || customerRole.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-300 disabled:cursor-not-allowed"
          >
            Confirmar y Aprobar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApproveConfirmationModal;
