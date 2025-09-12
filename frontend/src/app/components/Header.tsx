'use client';

import { useAuth } from "@/context/AuthContext";
import { FaSignOutAlt } from "react-icons/fa";
import Image from "next/image";
import Link from "next/link";

export default function Header() {
  const { auth, logout } = useAuth();

  return (
    <header className="flex items-center justify-between mb-10 bg-white p-4 rounded-lg shadow-md">
      <div className="flex items-center">
        <Image src="/logo.png" alt="Logo Empresa" width={50} height={50} />
        <h1 className="text-xl md:text-3xl font-bold text-gray-800 ml-4">
          Clientes
        </h1>
        <nav className="ml-10">
          <Link href="/" className="text-gray-600 hover:text-gray-900 mr-4">
            Inicio
          </Link>
          <Link href="/requests" className="text-gray-600 hover:text-gray-900">
            Solicitudes
          </Link>
        </nav>
      </div>
      <div className="flex items-center">
        <span className="hidden sm:inline text-gray-700 mr-4">
          Hola, {auth?.user?.username || 'Usuario'}
        </span>
        <button
          onClick={logout}
          className="p-2 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          aria-label="Cerrar Sesión"
        >
          <FaSignOutAlt className="h-6 w-6 text-gray-600" />
        </button>
      </div>
    </header>
  );
}
