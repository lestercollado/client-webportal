'use client';

import NewRequestForm from "@/app/components/NewRequestForm";
import Header from "@/app/components/Header";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function NewRequestPage() {
  const { auth, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !auth) {
      router.push('/login');
    }
  }, [auth, loading, router]);

  if (loading || !auth) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center">
        <p>Cargando...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-6 md:p-12 bg-gray-50">
      <div className="w-full max-w-6xl">
        <Header />

        <div className="flex justify-end mb-4">
          <Link href="/" className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
            Regresar al Inicio
          </Link>
        </div>

        <NewRequestForm />
      </div>
    </main>
  );
}
