import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { RoutePoint } from '@/lib/route-utils';
import { Camera, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function FitBounds({ points }: { points: RoutePoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 0) {
      const bounds = L.latLngBounds(points.map((p) => p.coords));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [points, map]);
  return null;
}

interface RouteMapProps {
  points: RoutePoint[];
  isOptimized: boolean;
  isProcessing: boolean;
}

export default function RouteMap({ points, isOptimized, isProcessing }: RouteMapProps) {
  const hasPoints = points.length > 0;

  return (
    <div className="glass-card rounded-2xl p-5 h-full flex flex-col">
      <h2 className="text-lg font-semibold font-display flex items-center gap-2 mb-4">
        <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Camera className="h-4 w-4 text-primary" />
        </span>
        Mapa Inteligente
      </h2>

      <div className="flex-1 min-h-[400px] rounded-xl overflow-hidden relative">
        <AnimatePresence mode="wait">
          {isProcessing ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-secondary/50 z-10"
            >
              <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
              <p className="font-medium text-foreground">Buscando coordenadas...</p>
            </motion.div>
          ) : !hasPoints ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-secondary/30 border-2 border-dashed border-border rounded-xl p-8 text-center z-10"
            >
              <Camera className="h-16 w-16 text-primary/30 mb-4" />
              <h3 className="text-xl font-bold font-display text-foreground mb-2">
                Paso 1: Toma la foto
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Toma una foto clara a la etiqueta del paquete asegurándote de que haya buena luz.
                La IA extraerá la dirección por ti.
              </p>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <MapContainer
          center={[9.9281, -84.0907]}
          zoom={12}
          className="h-full w-full"
          style={{ minHeight: 400 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {points.map((p) => (
            <Marker key={`${p.coords[0]}-${p.coords[1]}-${p.index}`} position={p.coords}>
              <Popup>
                <b>Parada {p.index}</b>
              </Popup>
            </Marker>
          ))}
          {points.length > 1 && (
            <Polyline
              positions={points.map((p) => p.coords)}
              pathOptions={{
                color: isOptimized ? 'hsl(155, 70%, 40%)' : 'hsl(258, 60%, 55%)',
                weight: 4,
                opacity: 0.8,
              }}
            />
          )}
          <FitBounds points={points} />
        </MapContainer>
      </div>
    </div>
  );
}
