import { RoutePoint, totalDistance } from '@/lib/route-utils';
import { Trash2, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface RouteListProps {
  points: RoutePoint[];
  isOptimized: boolean;
  onRemove: (index: number) => void;
}

export default function RouteList({ points, isOptimized, onRemove }: RouteListProps) {
  return (
    <div className="glass-card rounded-2xl p-5 space-y-4">
      <h2 className="text-lg font-semibold font-display flex items-center gap-2">
        <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Package className="h-4 w-4 text-primary" />
        </span>
        Paradas de la Ruta
      </h2>

      <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
        <AnimatePresence mode="popLayout">
          {points.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Escanea paquetes para ver las paradas aquí
            </p>
          ) : (
            points.map((point, idx) => (
              <motion.div
                key={`${point.coords[0]}-${point.coords[1]}`}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -40 }}
                className="route-point-card flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${
                      isOptimized
                        ? 'bg-success text-success-foreground'
                        : 'bg-primary text-primary-foreground'
                    }`}
                  >
                    {point.index}
                  </div>
                  <span className="text-sm font-medium truncate max-w-[160px]">
                    Parada {point.index}
                  </span>
                </div>
                <button
                  onClick={() => onRemove(idx)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <div className="pt-3 border-t border-border flex justify-between text-sm">
        <span className="font-medium text-muted-foreground">Total de paquetes:</span>
        <span className="font-bold text-primary">{points.length}</span>
      </div>
    </div>
  );
}
