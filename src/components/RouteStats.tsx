import { RoutePoint, totalDistance } from '@/lib/route-utils';
import { TrendingUp } from 'lucide-react';

interface RouteStatsProps {
  points: RoutePoint[];
  isOptimized: boolean;
}

export default function RouteStats({ points, isOptimized }: RouteStatsProps) {
  const dist = totalDistance(points);
  const estimatedMinutes = Math.round((dist / 40) * 60); // ~40 km/h avg

  const stats = [
    {
      value: points.length.toString(),
      label: 'Paradas',
      color: 'bg-primary/10 text-primary',
    },
    {
      value: `${dist.toFixed(1)} km`,
      label: 'Distancia',
      color: 'bg-blue-500/10 text-blue-600',
    },
    {
      value: `${estimatedMinutes} min`,
      label: 'Tiempo estimado',
      color: 'bg-green-500/10 text-green-600',
    },
    {
      value: isOptimized ? 'Sí' : 'No',
      label: 'Optimizada',
      color: isOptimized ? 'bg-green-500/10 text-green-600' : 'bg-orange-500/10 text-orange-500',
    },
  ];

  return (
    <div className="glass-card rounded-2xl p-5">
      <h2 className="text-lg font-semibold font-display flex items-center gap-2 mb-4">
        <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <TrendingUp className="h-4 w-4 text-primary" />
        </span>
        Estadísticas de Ruta
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`rounded-xl p-4 text-center ${stat.color.split(' ')[0]}`}
          >
            <p className={`text-xl font-bold font-display ${stat.color.split(' ')[1]}`}>
              {stat.value}
            </p>
            <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
