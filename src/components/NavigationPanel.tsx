import { Brain, Navigation, Map } from 'lucide-react';

interface NavigationPanelProps {
  hasPoints: boolean;
  hasMultiple: boolean;
  onOptimize: () => void;
  onWaze: () => void;
  onGoogleMaps: () => void;
}

export default function NavigationPanel({
  hasPoints,
  hasMultiple,
  onOptimize,
  onWaze,
  onGoogleMaps,
}: NavigationPanelProps) {
  return (
    <div className="glass-card rounded-2xl p-4 md:p-5 space-y-3">
      <h2 className="text-base md:text-lg font-semibold font-display flex items-center gap-2">
        <span className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Navigation className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
        </span>
        Navegación
      </h2>

      <button
        onClick={onOptimize}
        disabled={!hasMultiple}
        className="nav-action-btn gradient-accent-bg text-accent-foreground text-sm md:text-base h-12"
      >
        <Brain className="h-5 w-5" /> ¡Optimizar Ruta!
      </button>

      <button
        onClick={onWaze}
        disabled={!hasPoints}
        className="nav-action-btn bg-info text-info-foreground text-sm md:text-base h-12"
      >
        <Navigation className="h-5 w-5" /> Ir a Siguiente Parada
      </button>

      <button
        onClick={onGoogleMaps}
        disabled={!hasPoints}
        className="nav-action-btn bg-success text-success-foreground text-sm md:text-base h-12"
      >
        <Map className="h-5 w-5" /> Abrir en Google Maps
      </button>
    </div>
  );
}
