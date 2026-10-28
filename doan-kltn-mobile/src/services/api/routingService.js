/**
 * @file routingService.js
 * @description Dich vu dinh tuyen lo trinh di chuyen OSRM (Open Source Routing Machine).
 * Tinh toan duong di thuc te, khoang cach va uoc tinh thoi gian di chuyen (ETA).
 */

const OSRM_BASE_URL = 'https://router.project-osrm.org/route/v1/driving';

export const routingService = {
  /**
   * Lay lo trinh chi tiet giua 2 diem toa do GPS
   * @param {{ latitude: number, longitude: number }} origin - Toa do diem xuat phat (Tho)
   * @param {{ latitude: number, longitude: number }} destination - Toa do diem den (Khach hang)
   * @returns {Promise<{ coordinates: [number, number][], distanceKm: number, durationMin: number, formattedEta: string }>}
   */
  async getRoute(origin, destination) {
    if (!origin?.latitude || !origin?.longitude || !destination?.latitude || !destination?.longitude) {
      return null;
    }

    const { longitude: oLng, latitude: oLat } = origin;
    const { longitude: dLng, latitude: dLat } = destination;

    try {
      const url = `${OSRM_BASE_URL}/${oLng},${oLat};${dLng},${dLat}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`OSRM HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const distanceMeters = route.distance || 0;
        const durationSeconds = route.duration || 0;

        const distanceKm = Math.round((distanceMeters / 1000) * 10) / 10;
        const durationMin = Math.max(1, Math.round(durationSeconds / 60));

        // Chu y: OSRM tra ve [lng, lat] -> chuyen ve [lat, lng] cho Leaflet map
        const leafletCoords = (route.geometry?.coordinates || []).map(([lng, lat]) => [lat, lng]);

        return {
          coordinates: leafletCoords,
          distanceKm,
          durationMin,
          formattedEta: `~${durationMin} phut (${distanceKm} km)`,
        };
      }
    } catch (err) {
      console.warn('⚠️ [RoutingService] Khong the tai OSRM route, dung fallback:', err.message);
    }

    // Fallback duong thang neu mat mang hoac OSRM bi loi
    const fallbackCoords = [
      [origin.latitude, origin.longitude],
      [destination.latitude, destination.longitude],
    ];
    return {
      coordinates: fallbackCoords,
      distanceKm: 1.5,
      durationMin: 8,
      formattedEta: '~8 - 12 phut (1.5 km)',
    };
  },
};
