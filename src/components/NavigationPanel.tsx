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
    <div className="glass-card rounded-2xl p-5 space-y-3">
      <h2 className="text-lg font-semibold font-display flex items-center gap-2">
        <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Navigation className="h-4 w-4 text-primary" />
        </span>
        Navegación
      </h2>

      <button
        onClick={onOptimize}
        disabled={!hasMultiple}
        className="nav-action-btn gradient-accent-bg text-accent-foreground"
      >
        <Brain className="h-5 w-5" /> ¡Optimizar Ruta!
      </button>

      <button
        onClick={onWaze}
        disabled={!hasPoints}
        className="nav-action-btn bg-info text-info-foreground"
      >
        <Navigation className="h-5 w-5" /> Ir a Siguiente Parada
      </button>

      <button
        onClick={onGoogleMaps}
        disabled={!hasPoints}
        className="nav-action-btn bg-success text-success-foreground"
      >
        <Map className="h-5 w-5" /> Ver Ruta Completa
      </button>
    </div>
  );
}
