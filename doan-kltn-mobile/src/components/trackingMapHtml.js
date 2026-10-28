export const getTrackingMapHtml = (custLat, custLng, workLat, workLng, polylineJson) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; background: #f8fafc; }
    .customer-pin {
      background: #0284C7; color: white; font-size: 16px; width: 34px; height: 34px;
      border-radius: 50%; display: flex; align-items: center; justify-content: center;
      border: 3px solid white; box-shadow: 0 4px 10px rgba(2, 132, 199, 0.4);
    }
    .worker-pin-wrap {
      position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;
    }
    .worker-pulse {
      position: absolute; width: 44px; height: 44px; border-radius: 50%;
      background: rgba(16, 185, 129, 0.35); animation: pulse 1.8s infinite ease-out;
    }
    .worker-pin {
      background: #10B981; color: white; font-size: 18px; width: 36px; height: 36px;
      border-radius: 50%; display: flex; align-items: center; justify-content: center;
      border: 3px solid white; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.5); z-index: 2;
    }
    @keyframes pulse { 0% { transform: scale(0.6); opacity: 1; } 100% { transform: scale(1.6); opacity: 0; } }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: false, attributionControl: false });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
    var custIcon = L.divIcon({ className: '', html: '<div class="customer-pin">🏠</div>', iconSize: [34, 34], iconAnchor: [17, 17] });
    L.marker([${custLat}, ${custLng}], { icon: custIcon }).addTo(map);
    var workIcon = L.divIcon({ className: '', html: '<div class="worker-pin-wrap"><div class="worker-pulse"></div><div class="worker-pin">🛵</div></div>', iconSize: [40, 40], iconAnchor: [20, 20] });
    L.marker([${workLat}, ${workLng}], { icon: workIcon }).addTo(map);
    var coords = ${polylineJson};
    L.polyline(coords, { color: '#0284C7', weight: 5, opacity: 0.9, lineJoin: 'round' }).addTo(map);
    var bounds = L.latLngBounds(coords);
    map.fitBounds(bounds, { padding: [40, 40] });
  </script>
</body>
</html>
`;

