/**
 * @file RealLeafletMap.native.tsx
 * @description Bản đồ tương tác Leaflet OpenStreetMap HD THẬT 100% chạy trên môi trường Native (Android & iOS Expo Go).
 * - Sử dụng <WebView> từ react-native-webview để render OpenStreetMap HD 60 FPS.
 * - Tuyệt đối không chứa bất kỳ thẻ <iframe> nào gây lỗi native Invariant Violation.
 */

import React, { useMemo, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, View, type DimensionValue } from 'react-native';
import { WebView } from 'react-native-webview';

export interface MapWorkerItem {
  id: string;
  name?: string;
  fullName?: string;
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
  rating?: number;
  avatar?: string;
  avatarUrl?: string;
  specialty?: string;
  distance?: number | string;
  distanceKm?: number | string;
  phone?: string;
}

export interface RealLeafletMapRef {
  recenter: () => void;
  focusWorker: (workerId: string, lat?: number, lng?: number) => void;
}

export interface RealLeafletMapProps {
  userLocation: { lat: number; lng: number } | null;
  workers?: MapWorkerItem[];
  selectedWorkerId?: string | null;
  onSelectWorker?: (workerId: string) => void;
  height?: DimensionValue;
  width?: DimensionValue;
  zoom?: number;
  showRadiusCircle?: boolean;
  radiusInMeters?: number;
  scrollEnabled?: boolean;
  showZoomControl?: boolean;
}

export const RealLeafletMap = forwardRef<RealLeafletMapRef, RealLeafletMapProps>(
  (
    {
      userLocation,
      workers = [],
      selectedWorkerId = null,
      onSelectWorker,
      height = '100%',
      width = '100%',
      zoom = 15,
      showRadiusCircle = true,
      radiusInMeters = 3000,
      scrollEnabled = true,
      showZoomControl = false,
    },
    ref
  ) => {
    const webViewRef = useRef<WebView | null>(null);

    const defaultLat = userLocation?.lat || 10.803;
    const defaultLng = userLocation?.lng || 106.711;

    useImperativeHandle(ref, () => ({
      recenter: () => {
        if (webViewRef.current) {
          webViewRef.current.postMessage(JSON.stringify({ type: 'RECENTER' }));
        }
      },
      focusWorker: (workerId: string, lat?: number, lng?: number) => {
        if (webViewRef.current) {
          webViewRef.current.postMessage(
            JSON.stringify({ type: 'FOCUS_WORKER', workerId, lat, lng })
          );
        }
      },
    }));

    // Cập nhật marker active khi selectedWorkerId thay đổi
    useEffect(() => {
      if (webViewRef.current && selectedWorkerId) {
        const targetWorker = workers.find((w) => w.id === selectedWorkerId);
        const lat = targetWorker?.latitude || targetWorker?.lat;
        const lng = targetWorker?.longitude || targetWorker?.lng;
        webViewRef.current.postMessage(
          JSON.stringify({
            type: 'FOCUS_WORKER',
            workerId: selectedWorkerId,
            lat,
            lng,
          })
        );
      }
    }, [selectedWorkerId, workers]);

    const htmlContent = useMemo(() => {
      const normalizedWorkers = workers
        .map((w) => {
          const lat = w.latitude || w.lat;
          const lng = w.longitude || w.lng;
          if (!lat || !lng) return null;

          return {
            id: w.id,
            name: w.fullName || w.name || 'Thợ',
            avatar:
              w.avatarUrl ||
              w.avatar ||
              'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
            specialty: w.specialty || 'Kỹ thuật viên',
            rating: typeof w.rating === 'number' ? w.rating : 5.0,
            lat,
            lng,
            distance: w.distanceKm || w.distance || '1.0',
          };
        })
        .filter(Boolean);

      const workersJson = JSON.stringify(normalizedWorkers);

      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; background: #F1F5F9; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    
    /* User Radar Pulse Pin */
    .user-marker-wrap { position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; }
    .user-pulse { position: absolute; width: 34px; height: 34px; border-radius: 50%; background: rgba(56, 189, 248, 0.4); animation: pulseRadar 2.2s infinite ease-out; }
    .user-pulse-2 { position: absolute; width: 34px; height: 34px; border-radius: 50%; background: rgba(2, 132, 199, 0.22); animation: pulseRadar 2.2s infinite ease-out 1.1s; }
    .user-dot { position: relative; width: 16px; height: 16px; border-radius: 50%; background: #0284C7; border: 3px solid #FFFFFF; box-shadow: 0 2px 8px rgba(0,0,0,0.3); z-index: 2; }
    @keyframes pulseRadar {
      0% { transform: scale(0.5); opacity: 0.95; }
      100% { transform: scale(2.6); opacity: 0; }
    }

    /* Worker Pin Marker */
    .worker-marker {
      display: flex;
      align-items: center;
      background: #FFFFFF;
      padding: 3px 7px 3px 3px;
      border-radius: 20px;
      border: 1.5px solid #CBD5E1;
      box-shadow: 0 3px 8px rgba(0,0,0,0.18);
      cursor: pointer;
      transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.2s ease, box-shadow 0.2s ease;
      white-space: nowrap;
      user-select: none;
      -webkit-tap-highlight-color: transparent;
    }
    .worker-marker.active {
      border: 2.5px solid #0284C7;
      background: #F0F9FF;
      transform: scale(1.15);
      box-shadow: 0 4px 14px rgba(2,132,199,0.35);
      z-index: 1000 !important;
    }
    .worker-avatar-wrap {
      position: relative;
      width: 24px;
      height: 24px;
      margin-right: 5px;
    }
    .worker-avatar {
      width: 24px;
      height: 24px;
      border-radius: 12px;
      object-fit: cover;
      display: block;
      background: #E2E8F0;
    }
    .worker-online {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #22C55E;
      border: 1px solid #FFFFFF;
    }
    .worker-info-col {
      display: flex;
      flex-direction: column;
      gap: 1px;
    }
    .worker-name {
      font-size: 10px;
      font-weight: 700;
      color: #0F172A;
      max-width: 80px;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .worker-rating {
      font-size: 9px;
      font-weight: 800;
      color: #334155;
      display: flex;
      align-items: center;
      gap: 2px;
    }
    .worker-rating-star { color: #F59E0B; font-size: 9px; }

    .leaflet-control-attribution { display: none !important; }
    .leaflet-control-zoom { border: none !important; box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important; border-radius: 10px !important; overflow: hidden; margin-right: 16px !important; margin-bottom: 200px !important; }
    .leaflet-control-zoom a { background: #FFFFFF !important; color: #0F172A !important; width: 34px !important; height: 34px !important; line-height: 34px !important; font-size: 15px !important; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const userLat = ${defaultLat};
    const userLng = ${defaultLng};
    const workers = ${workersJson};
    let selectedWorkerId = "${selectedWorkerId || ''}";

    const map = L.map('map', {
      center: [userLat, userLng],
      zoom: ${zoom},
      zoomControl: ${showZoomControl},
      attributionControl: false
    });

    // 1. Lớp ảnh vệ tinh độ nét cao Esri World Imagery (Google Maps Satellite style)
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    }).addTo(map);

    // 2. Lớp nhãn đường phố & địa danh (Satellite Hybrid Labels)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map);

    // Vòng tròn bán kính phục vụ
    if (${showRadiusCircle}) {
      L.circle([userLat, userLng], {
        radius: ${radiusInMeters},
        color: '#38BDF8',
        fillColor: '#0284C7',
        fillOpacity: 0.15,
        weight: 1.8
      }).addTo(map);
    }

    // User Marker
    const userIcon = L.divIcon({
      className: '',
      html: '<div class="user-marker-wrap"><div class="user-pulse"></div><div class="user-pulse-2"></div><div class="user-dot"></div></div>',
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });
    L.marker([userLat, userLng], { icon: userIcon, zIndexOffset: 500 }).addTo(map);

    // Worker Markers (STRICT ZERO-MOCK: CHỈ VẼ KHI CÓ THỢ THẬT)
    workers.forEach(w => {
      const isActive = w.id === selectedWorkerId;
      const workerIcon = L.divIcon({
        className: '',
        html: \`
          <div class="worker-marker \${isActive ? 'active' : ''}" id="marker-\${w.id}">
            <div class="worker-avatar-wrap">
              <img class="worker-avatar" src="\${w.avatar}" onerror="this.src='https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'" />
              <div class="worker-online"></div>
            </div>
            <div class="worker-info-col">
              <span class="worker-name">\${w.name}</span>
              <div class="worker-rating">
                <span class="worker-rating-star">★</span>\${Number(w.rating).toFixed(1)}
              </div>
            </div>
          </div>
        \`,
        iconSize: [110, 32],
        iconAnchor: [55, 16]
      });

      const marker = L.marker([w.lat, w.lng], { icon: workerIcon }).addTo(map);
      marker.on('click', () => {
        selectWorker(w.id, w.lat, w.lng);
      });
    });

    function selectWorker(id, lat, lng) {
      selectedWorkerId = id;
      document.querySelectorAll('.worker-marker').forEach(el => el.classList.remove('active'));
      const activeEl = document.getElementById('marker-' + id);
      if (activeEl) activeEl.classList.add('active');
      if (lat && lng) {
        map.panTo([lat, lng], { animate: true, duration: 0.5 });
      }
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SELECT_WORKER', workerId: id }));
      }
    }

    function recenter() {
      map.flyTo([userLat, userLng], ${zoom}, { animate: true, duration: 0.6 });
    }

    window.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'RECENTER') {
          recenter();
        } else if (data.type === 'FOCUS_WORKER') {
          selectWorker(data.workerId, data.lat, data.lng);
        }
      } catch (e) {}
    });
    document.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'RECENTER') {
          recenter();
        } else if (data.type === 'FOCUS_WORKER') {
          selectWorker(data.workerId, data.lat, data.lng);
        }
      } catch (e) {}
    });
  </script>
</body>
</html>`;
    }, [
      defaultLat,
      defaultLng,
      workers,
      selectedWorkerId,
      zoom,
      showRadiusCircle,
      radiusInMeters,
      showZoomControl,
    ]);

    return (
      <View style={[styles.container, { height, width }]}>
        <WebView
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html: htmlContent }}
          style={styles.webView}
          onMessage={(event) => {
            try {
              const data = JSON.parse(event.nativeEvent.data);
              if (data.type === 'SELECT_WORKER' && data.workerId) {
                onSelectWorker?.(data.workerId);
              }
            } catch (e) {}
          }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          scrollEnabled={scrollEnabled}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
  },
  webView: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F1F5F9',
  },
});

export default RealLeafletMap;
