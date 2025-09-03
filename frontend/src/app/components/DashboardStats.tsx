'use client';

import { useEffect, useState } from 'react';
import { getStats, Stats } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

const DashboardStats = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { auth } = useAuth();

  useEffect(() => {
    if (auth?.token) {
      const fetchStats = async () => {
        try {
          setLoading(true);
          const data = await getStats();
          setStats(data);
          setError(null);
        } catch (err) {
          setError('Error al cargar las estadísticas');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };

      fetchStats();
    }
  }, [auth?.token]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-md animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-gray-300 rounded w-1/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="text-red-500 text-center mb-8">{error}</p>;
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatCard title="Total" value={stats.total} color="bg-blue-500" />
      <StatCard title="Pendientes" value={stats.pending} color="bg-yellow-500" />
      <StatCard title="Completadas" value={stats.completed} color="bg-green-500" />
      <StatCard title="Rechazadas" value={stats.rejected} color="bg-red-500" />
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: number;
  color: string;
}

const StatCard = ({ title, value, color }: StatCardProps) => (
  <div className={`p-6 rounded-xl shadow-lg text-white ${color}`}>
    <h3 className="text-lg font-semibold">{title}</h3>
    <p className="text-4xl font-bold mt-2">{value}</p>
  </div>
);

export default DashboardStats;