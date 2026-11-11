/**
 * @file RealLeafletMap.tsx
 * @description Điểm vào chính của Component Bản đồ Leaflet OpenStreetMap.
 * Metro Bundler sẽ tự động điều phối:
 * - Nền tảng Web -> RealLeafletMap.web.tsx (Sử dụng <iframe> và Leaflet Web)
 * - Nền tảng Native -> RealLeafletMap.native.tsx (Sử dụng <WebView> từ react-native-webview)
 */

export * from './RealLeafletMap.native';
export { default } from './RealLeafletMap.native';
