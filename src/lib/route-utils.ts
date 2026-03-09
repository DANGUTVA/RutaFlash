export interface RoutePoint {
  coords: [number, number];
  originalLink: string;
  index: number;
  label?: string;
}

/** Extrae coordenadas directamente de links de Waze */
export function parseWazeLink(text: string): [number, number] | null {
  try {
    const url = new URL(text.trim());
    
    // Solo procesar links de Waze
    if (!url.hostname.includes('waze.com')) return null;

    // Patrón 1: ?ll=lat,lon
    const ll = url.searchParams.get('ll');
    if (ll) {
      const [lat, lon] = ll.split(',').map(Number);
      if (!isNaN(lat) && !isNaN(lon)) return [lat, lon];
    }

    // Patrón 2: ?q=lat,lon
    const q = url.searchParams.get('q');
    if (q) {
      const match = q.match(/(-?\d+\.?\d+)\s*,\s*(-?\d+\.?\d+)/);
      if (match) {
        const lat = parseFloat(match[1]);
        const lon = parseFloat(match[2]);
        if (!isNaN(lat) && !isNaN(lon)) return [lat, lon];
      }
    }

    // Patrón 3: /ul/lat,lon en el path
    const pathMatch = url.href.match(/waze\.com\/ul\/(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (pathMatch) {
      return [parseFloat(pathMatch[1]), parseFloat(pathMatch[2])];
    }
  } catch {
    return null;
  }

  return null;
}

/** Procesa una línea de texto que debe contener un link de Waze */
export async function resolveCoords(line: string): Promise<[number, number] | null> {
  const trimmed = line.trim();
  
  // Limpiar prefijos comunes
  const cleaned = trimmed
    .replace(/📦\s*\[Revisar\]\s*Dirección:/gi, '')
    .replace(/📍\s*PUNTO PARTIDA:/gi, '')
    .trim();

  // Intentar extraer coordenadas del link de Waze
  return parseWazeLink(cleaned);
}

// Haversine distance in km
export function haversine(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLon = ((b[1] - a[1]) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a[0] * Math.PI) / 180) *
      Math.cos((b[0] * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export function totalDistance(points: RoutePoint[]): number {
  let dist = 0;
  for (let i = 1; i < points.length; i++) {
    dist += haversine(points[i - 1].coords, points[i].coords);
  }
  return dist;
}

export function optimizeRoute(points: RoutePoint[]): RoutePoint[] {
  if (points.length <= 2) return points;

  const remaining = [...points];
  const optimized: RoutePoint[] = [remaining.shift()!];

  while (remaining.length > 0) {
    const current = optimized[optimized.length - 1];
    let nearestIdx = 0;
    let minDist = haversine(current.coords, remaining[0].coords);

    for (let i = 1; i < remaining.length; i++) {
      const d = haversine(current.coords, remaining[i].coords);
      if (d < minDist) {
        minDist = d;
        nearestIdx = i;
      }
    }

    optimized.push(remaining.splice(nearestIdx, 1)[0]);
  }

  return optimized.map((p, i) => ({ ...p, index: i + 1 }));
}
