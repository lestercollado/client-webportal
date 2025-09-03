"use client";

import { useState, useRef, ChangeEvent, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';

const VerifyPage = () => {
  const [code, setCode] = useState<string[]>(['', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();
  const { verify } = useAuth();

  const handleChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    const { value } = e.target;
    if (/^[0-9]$/.test(value)) {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);
      if (index < 3) {
        inputsRef.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && code[index] === '' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const verificationCode = code.join('');
    if (verificationCode.length === 4) {
      try {
        await verify(verificationCode);
        router.push('/');
      } catch (err) {
        setError('Invalid or expired code. Please try again.');
      }
    } else {
      setError('Please enter the complete 4-digit code.');
    }
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 overflow-hidden">
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: "url(/bg.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.1,
        }}
      ></div>
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
            <Image src="/logo.png" alt="Logo Empresa" width={60} height={60} className="mx-auto" />
            <h1 className="text-3xl font-bold text-gray-800 mt-4">
                Clientes v1.0
            </h1>
        </div>
        <div className="flex items-center justify-center">
          <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-center text-gray-900">Ingresa el código de verificación</h2>
            <p className="text-center text-gray-600">Se ha enviado un código de 4 dígitos a tu correo electrónico.</p>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex justify-center space-x-4">
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputsRef.current[index] = el; }}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(e, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    className="w-16 h-16 text-3xl text-center border-2 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                ))}
              </div>
              {error && <p className="text-sm text-center text-red-500">{error}</p>}
              <div>
                <button
                  type="submit"
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Verificar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
};

export default VerifyPage;
