/**
 * @file WorkerTrackingMapView.jsx
 * @description Component hien thi ban do Leaflet truc tiep tren WebView cho khach hang.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { getTrackingMapHtml } from './trackingMapHtml';

export default function WorkerTrackingMapView({
  customerCoord,
  workerCoord,
  routeCoordinates = [],
  formattedEta = '~8 - 10 phut (1.5 km)',
}) {
  const custLat = customerCoord?.latitude || 10.7769;
  const custLng = customerCoord?.longitude || 106.7009;
  const workLat = workerCoord?.latitude || (custLat + 0.008);
  const workLng = workerCoord?.longitude || (custLng - 0.009);

  const polylineJson = useMemo(() => {
    if (routeCoordinates && routeCoordinates.length > 0) {
      return JSON.stringify(routeCoordinates);
    }
    return JSON.stringify([[workLat, workLng], [custLat, custLng]]);
  }, [routeCoordinates, workLat, workLng, custLat, custLng]);

  const mapHtml = useMemo(
    () => getTrackingMapHtml(custLat, custLng, workLat, workLng, polylineJson),
    [custLat, custLng, workLat, workLng, polylineJson]
  );

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html: mapHtml }}
        style={styles.map}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scrollEnabled={false}
      />
      <View style={styles.floatingEtaBadge}>
        <Ionicons name="bicycle" size={16} color="#0284C7" />
        <Text style={styles.etaText}>Tho dang den: {formattedEta}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#E2E8F0',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginVertical: 12,
  },
  map: { flex: 1 },
  floatingEtaBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  etaText: { fontSize: 12.5, fontWeight: '700', color: '#0F172A' },
});

