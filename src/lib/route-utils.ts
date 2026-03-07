export interface RoutePoint {
  coords: [number, number];
  originalLink: string;
  index: number;
  label?: string;
}

export function extractCoordsFromText(text: string): { url: URL | null; rawText: string } {
  const urlMatch = text.match(/https?:\/\/[^\s]+/);
  if (urlMatch) {
    try {
      return { url: new URL(urlMatch[0]), rawText: text };
    } catch {
      return { url: null, rawText: text };
    }
  }
  return { url: null, rawText: text };
}

export function parseCoordsFromUrl(url: URL): [number, number] | null {
  if (url.hostname.includes('waze.com')) {
    const ll = url.searchParams.get('ll');
    if (ll) {
      const [lat, lon] = ll.split(',').map(Number);
      if (!isNaN(lat) && !isNaN(lon)) return [lat, lon];
    }
  }

  if (url.hostname.includes('google') || url.hostname.includes('maps')) {
    const ll = url.searchParams.get('ll');
    if (ll) {
      const [lat, lon] = ll.split(',').map(Number);
      if (!isNaN(lat) && !isNaN(lon)) return [lat, lon];
    }
    // Try @lat,lng pattern
    const atMatch = url.pathname.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (atMatch) {
      return [parseFloat(atMatch[1]), parseFloat(atMatch[2])];
    }
  }

  return null;
}

export async function geocodeText(query: string): Promise<[number, number] | null> {
  const clean = query
    .replace(/📦\s*\[Revisar\]\s*Dirección:/gi, '')
    .replace(/📍\s*PUNTO PARTIDA:/gi, '')
    .replace(/[^a-zA-Z0-9\s,áéíóúÁÉÍÓÚñÑ]/g, ' ')
    .trim();

  if (clean.length < 5) return null;

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(clean)}&limit=1&countrycodes=CR`,
      { headers: { 'User-Agent': 'RutaFlash-App/2.0' } }
    );
    const data = await res.json();
    if (data?.length > 0) {
      return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    }
  } catch {
    // ignore
  }
  return null;
}

export async function resolveCoords(line: string): Promise<[number, number] | null> {
  const { url, rawText } = extractCoordsFromText(line);
  if (url) {
    const coords = parseCoordsFromUrl(url);
    if (coords) return coords;
  }
  return geocodeText(rawText);
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
