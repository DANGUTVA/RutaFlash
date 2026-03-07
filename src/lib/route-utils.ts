export interface RoutePoint {
  coords: [number, number];
  originalLink: string;
  index: number;
  label?: string;
}

export function extractCoordsFromText(text: string): { urls: URL[]; rawText: string } {
  const urlMatches = text.match(/https?:\/\/[^\s]+/g) || [];
  const urls: URL[] = [];
  for (const m of urlMatches) {
    try { urls.push(new URL(m)); } catch { /* skip */ }
  }
  return { urls, rawText: text };
}

/** Try to extract lat,lon from raw coordinate text like "9.9281, -84.0907" */
function parseCoordsFromRawText(text: string): [number, number] | null {
  const match = text.match(/(-?\d+\.?\d+)\s*[,\s]\s*(-?\d+\.?\d+)/);
  if (match) {
    const a = parseFloat(match[1]);
    const b = parseFloat(match[2]);
    if (!isNaN(a) && !isNaN(b) && Math.abs(a) <= 90 && Math.abs(b) <= 180) return [a, b];
    if (!isNaN(a) && !isNaN(b) && Math.abs(b) <= 90 && Math.abs(a) <= 180) return [b, a];
  }
  return null;
}

export function parseCoordsFromUrl(url: URL): [number, number] | null {
  const href = url.href;

  // Waze: ?ll=lat,lon or /ul?ll=lat,lon
  if (url.hostname.includes('waze.com')) {
    const ll = url.searchParams.get('ll');
    if (ll) {
      const [lat, lon] = ll.split(',').map(Number);
      if (!isNaN(lat) && !isNaN(lon)) return [lat, lon];
    }
    // waze.com/ul?q=lat,lon
    const q = url.searchParams.get('q');
    if (q) {
      const coords = parseCoordsFromRawText(q);
      if (coords) return coords;
    }
    // waze.com/ul/lat,lon in path
    const pathMatch = href.match(/waze\.com\/ul\/(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (pathMatch) return [parseFloat(pathMatch[1]), parseFloat(pathMatch[2])];
  }

  // Google Maps patterns
  if (url.hostname.includes('google') || url.hostname.includes('goo.gl') || url.hostname.includes('maps')) {
    // ?q=lat,lon or ?ll=lat,lon or ?center=lat,lon
    for (const param of ['ll', 'q', 'center', 'query']) {
      const val = url.searchParams.get(param);
      if (val) {
        const coords = parseCoordsFromRawText(val);
        if (coords) return coords;
      }
    }
    // @lat,lng pattern in path
    const atMatch = url.pathname.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (atMatch) return [parseFloat(atMatch[1]), parseFloat(atMatch[2])];

    // /place/.../ with coords in path
    const placeMatch = href.match(/place\/[^/]*\/(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (placeMatch) return [parseFloat(placeMatch[1]), parseFloat(placeMatch[2])];

    // data=!3d...!4d... pattern
    const dataMatch = href.match(/!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/);
    if (dataMatch) return [parseFloat(dataMatch[1]), parseFloat(dataMatch[2])];

    // dir/lat,lon/lat,lon pattern
    const dirMatch = url.pathname.match(/dir\/(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (dirMatch) return [parseFloat(dirMatch[1]), parseFloat(dirMatch[2])];
  }

  // Generic: any URL with coords in query or fragment
  const generic = parseCoordsFromRawText(url.search + url.hash);
  if (generic) return generic;

  return null;
}

/** Follow short URL redirects (goo.gl, maps.app.goo.gl, waze.com/ul/...) to get final URL */
async function resolveShortUrl(url: URL): Promise<URL | null> {
  const isShort =
    url.hostname.includes('goo.gl') ||
    url.hostname.includes('maps.app') ||
    (url.hostname.includes('waze.com') && url.pathname.startsWith('/ul/') && !url.searchParams.get('ll'));

  if (!isShort) return null;

  try {
    const res = await fetch(url.href, { method: 'HEAD', redirect: 'follow' });
    const finalUrl = new URL(res.url);
    if (finalUrl.href !== url.href) return finalUrl;
  } catch { /* ignore */ }
  return null;
}

export async function geocodeText(query: string): Promise<[number, number] | null> {
  const clean = query
    .replace(/📦\s*\[Revisar\]\s*Dirección:/gi, '')
    .replace(/📍\s*PUNTO PARTIDA:/gi, '')
    .replace(/[^a-zA-Z0-9\s,áéíóúÁÉÍÓÚñÑ#\-.]/g, ' ')
    .replace(/\s+/g, ' ')
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
  } catch { /* ignore */ }
  return null;
}

export async function resolveCoords(line: string): Promise<[number, number] | null> {
  // 1. Try raw coordinate text first
  const rawCoords = parseCoordsFromRawText(line);
  if (rawCoords) return rawCoords;

  // 2. Extract URLs and try to parse coords directly
  const { urls, rawText } = extractCoordsFromText(line);
  for (const url of urls) {
    const coords = parseCoordsFromUrl(url);
    if (coords) return coords;
  }

  // 3. Try resolving short URLs (goo.gl, maps.app.goo.gl, waze short links)
  for (const url of urls) {
    try {
      const resolved = await resolveShortUrl(url);
      if (resolved) {
        const coords = parseCoordsFromUrl(resolved);
        if (coords) return coords;
      }
    } catch { /* ignore */ }
  }

  // 4. Fallback to geocoding
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
