import { resolveConnection } from '../src/config/connection';
it('uses explicit localhost and normalizes trailing slashes for all services', () => {
  expect(resolveConnection({ apiUrl: 'http://localhost:3000/api/', platform: 'android' })).toEqual({ API_BASE_URL: 'http://localhost:3000/api', SOCKET_BASE_URL: 'http://localhost:3000', LOG_ENDPOINT: 'http://localhost:3000/api/logs/client' });
});
it('uses the Expo LAN host when endpoints are absent', () => {
  expect(resolveConnection({ hostUri: '192.168.1.23:8081', platform: 'android' }).API_BASE_URL).toBe('http://192.168.1.23:3000/api');
});
it('respects a separate socket origin and removes namespace suffix', () => {
  expect(resolveConnection({ socketUrl: 'https://socket.example.com/orders/' }).SOCKET_BASE_URL).toBe('https://socket.example.com');
});
it('falls back to the Android emulator host', () => {
  expect(resolveConnection({ platform: 'android' }).API_BASE_URL).toBe('http://10.0.2.2:3000/api');
});
