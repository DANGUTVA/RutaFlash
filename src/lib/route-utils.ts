export interface RoutePoint {
  coords: [number, number];
  originalLink: string;
  index: number;
  label?: string;
}

/** Resuelve links acortados de Waze siguiendo redirects */
async function resolveWazeShortUrl(url: URL): Promise<URL | null> {
  // Detectar si es un link acortado de Waze (formato /ul/xxxxx sin coordenadas)
  const isShortLink = url.hostname.includes('waze.com') && 
                      url.pathname.match(/\/ul\/[a-z0-9]+$/i) &&
                      !url.searchParams.get('ll');

  if (!isShortLink) return null;

  try {
    console.log('🔗 Resolviendo link acortado de Waze...');
    const res = await fetch(url.href, { method: 'HEAD', redirect: 'follow' });
    const finalUrl = new URL(res.url);
    
    if (finalUrl.href !== url.href) {
      console.log('✅ URL resuelta:', finalUrl.href);
      return finalUrl;
    }
  } catch (e) {
    console.log('❌ Error resolviendo redirect:', e);
  }
  
  return null;
}

/** Extrae coordenadas directamente de links de Waze */
export function parseWazeLink(text: string): [number, number] | null {
  try {
    // Primero intentar extraer una URL del texto
    const urlMatch = text.match(/https?:\/\/[^\s]+/);
    const urlString = urlMatch ? urlMatch[0] : text.trim();
    
    const url = new URL(urlString);
    
    // Solo procesar links de Waze
    if (!url.hostname.includes('waze.com')) {
      console.log('❌ No es un link de Waze:', url.hostname);
      return null;
    }

    console.log('🔍 Procesando Waze URL:', url.href);

    // Patrón 1: ?ll=lat,lon
    const ll = url.searchParams.get('ll');
    if (ll) {
      const [lat, lon] = ll.split(',').map(Number);
      if (!isNaN(lat) && !isNaN(lon)) {
        console.log('✅ Coordenadas extraídas (?ll):', lat, lon);
        return [lat, lon];
      }
    }

    // Patrón 2: ?q=lat,lon
    const q = url.searchParams.get('q');
    if (q) {
      const match = q.match(/(-?\d+\.?\d+)\s*,\s*(-?\d+\.?\d+)/);
      if (match) {
        const lat = parseFloat(match[1]);
        const lon = parseFloat(match[2]);
        if (!isNaN(lat) && !isNaN(lon)) {
          console.log('✅ Coordenadas extraídas (?q):', lat, lon);
          return [lat, lon];
        }
      }
    }

    // Patrón 3: /ul/lat,lon en el path
    const pathMatch = url.href.match(/waze\.com\/ul\/(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (pathMatch) {
      const coords: [number, number] = [parseFloat(pathMatch[1]), parseFloat(pathMatch[2])];
      console.log('✅ Coordenadas extraídas (path):', coords);
      return coords;
    }

    // Patrón 4: /ul?navigate=yes con otros parámetros
    const navigate = url.searchParams.get('navigate');
    if (navigate) {
      // Buscar en toda la URL
      const coordMatch = url.href.match(/(-?\d+\.?\d+),(-?\d+\.?\d+)/);
      if (coordMatch) {
        const coords: [number, number] = [parseFloat(coordMatch[1]), parseFloat(coordMatch[2])];
        console.log('✅ Coordenadas extraídas (navigate):', coords);
        return coords;
      }
    }

    console.log('⚠️ No se encontraron coordenadas directamente');
  } catch (e) {
    console.log('❌ Error parseando URL:', e);
    return null;
  }

  return null;
}

/** Procesa una línea de texto que debe contener un link de Waze */
export async function resolveCoords(line: string): Promise<[number, number] | null> {
  const trimmed = line.trim();
  
  console.log('🔄 Procesando línea:', trimmed.substring(0, 100));
  
  // Limpiar prefijos comunes
  const cleaned = trimmed
    .replace(/📦\s*\[Revisar\]\s*Dirección:/gi, '')
    .replace(/📍\s*PUNTO PARTIDA:/gi, '')
    .trim();

  // Intentar extraer coordenadas del link de Waze directamente
  let coords = parseWazeLink(cleaned);
  
  // Si no se encontraron coordenadas, intentar resolver link acortado
  if (!coords) {
    try {
      const urlMatch = cleaned.match(/https?:\/\/[^\s]+/);
      if (urlMatch) {
        const url = new URL(urlMatch[0]);
        const resolvedUrl = await resolveWazeShortUrl(url);
        
        if (resolvedUrl) {
          coords = parseWazeLink(resolvedUrl.href);
        }
      }
    } catch (e) {
      console.log('❌ Error resolviendo link acortado:', e);
    }
  }
  
  if (coords) {
    console.log('✅ Coordenadas finales:', coords);
  } else {
    console.log('❌ No se pudieron extraer coordenadas');
  }
  
  return coords;
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
