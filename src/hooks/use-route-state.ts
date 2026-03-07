import { useState, useRef, useCallback } from 'react';
import { RoutePoint, resolveCoords, optimizeRoute } from '@/lib/route-utils';
import { toast } from 'sonner';

export function useRouteState() {
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const [isOptimized, setIsOptimized] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputText, setInputText] = useState('');
  const [ocrProgress, setOcrProgress] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processAddresses = useCallback(async () => {
    const lines = inputText.split('\n').filter((l) => l.trim());
    if (lines.length === 0) {
      toast.warning('Sin datos', { description: 'Pega links o escanea una etiqueta primero.' });
      return;
    }

    setIsProcessing(true);
    const points: RoutePoint[] = [];

    for (const line of lines) {
      try {
        const coords = await resolveCoords(line);
        if (coords) {
          points.push({
            coords,
            originalLink: line.trim(),
            index: points.length + 1,
            label: line.trim().substring(0, 50),
          });
        }
      } catch (e) {
        console.error('Error procesando:', line, e);
      }
    }

    if (points.length === 0) {
      toast.error('Sin coordenadas', {
        description: 'No pudimos ubicar las direcciones. Asegúrate de que el texto sea claro.',
      });
      setIsProcessing(false);
      return;
    }

    setRoutePoints(points);
    setIsOptimized(false);
    setIsProcessing(false);
    toast.success(`¡${points.length} paradas mapeadas!`);
  }, [inputText]);

  const optimize = useCallback(() => {
    if (routePoints.length < 2) return;
    const optimized = optimizeRoute(routePoints);
    setRoutePoints(optimized);
    setIsOptimized(true);
    toast.success('¡Ruta optimizada!', { description: 'Orden ajustado para menor recorrido.' });
  }, [routePoints]);

  const removePoint = useCallback((index: number) => {
    setRoutePoints((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.map((p, i) => ({ ...p, index: i + 1 }));
    });
  }, []);

  const clearAll = useCallback(() => {
    setRoutePoints([]);
    setIsOptimized(false);
    setInputText('');
  }, []);

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('Tu navegador no soporta GPS');
      return;
    }
    toast.info('Buscando GPS...', { description: 'Obteniendo tu ubicación actual.' });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const link = `https://waze.com/ul?ll=${pos.coords.latitude},${pos.coords.longitude}`;
        setInputText((prev) => `📍 PUNTO PARTIDA: ${link}\n${prev}`);
        toast.success('GPS listo', { description: 'Tu ubicación se añadió como punto de partida.' });
      },
      () => toast.error('Error GPS', { description: 'Activa la ubicación en tu dispositivo.' }),
      { enableHighAccuracy: true }
    );
  }, []);

  const scanImage = useCallback(async (file: File) => {
    setOcrProgress('Inicializando IA...');
    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('spa', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setOcrProgress(`Leyendo imagen... ${Math.round(m.progress * 100)}%`);
          }
        },
      });
      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();

      const clean = text.trim();
      if (clean) {
        setInputText((prev) => `${prev}${prev ? '\n\n' : ''}📦 [Revisar] Dirección: ${clean}`);
        toast.success('Escaneo listo', { description: 'Revisa y corrige el texto antes de procesar.' });
      } else {
        toast.warning('Sin resultados', { description: 'Intenta con mejor iluminación.' });
      }
    } catch {
      toast.error('Error OCR', { description: 'Hubo un fallo al analizar la imagen.' });
    } finally {
      setOcrProgress(null);
    }
  }, []);

  const openWaze = useCallback(() => {
    if (routePoints.length === 0) return;
    const target = routePoints[1] || routePoints[0];
    window.open(`https://waze.com/ul?ll=${target.coords[0]},${target.coords[1]}&navigate=yes`, '_blank');
  }, [routePoints]);

  const openGoogleMaps = useCallback(() => {
    if (routePoints.length === 0) return;
    let url = 'https://www.google.com/maps/dir/';
    routePoints.forEach((p) => (url += `${p.coords[0]},${p.coords[1]}/`));
    window.open(url, '_blank');
  }, [routePoints]);

  return {
    routePoints,
    isOptimized,
    isProcessing,
    inputText,
    setInputText,
    ocrProgress,
    fileInputRef,
    processAddresses,
    optimize,
    removePoint,
    clearAll,
    getLocation,
    scanImage,
    openWaze,
    openGoogleMaps,
  };
}
