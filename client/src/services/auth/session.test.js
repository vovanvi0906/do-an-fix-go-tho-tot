import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { tokenStorage } from '../storage/tokenStorage';
import { refreshSession, ensureSession } from './session';
import { setupInterceptors } from '../api/interceptors';
const mock = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock('axios', async original => { const actual = await original(); return { ...actual, default: { ...actual.default, create: vi.fn(() => ({ post: mock.post })) } }; });
const jwt = seconds => `h.${btoa(JSON.stringify({exp:Math.floor(Date.now()/1000)+seconds}))}.s`;
beforeEach(() => { window.history.replaceState({}, '', '/login'); localStorage.clear(); sessionStorage.clear(); vi.clearAllMocks(); tokenStorage.setAccessToken(jwt(-10)); tokenStorage.setRefreshToken('refresh-old'); });
describe('refresh session', () => {
 it('shares a refresh across simultaneous requests and rotates tokens', async () => {
  let finish; mock.post.mockReturnValue(new Promise(resolve => {finish=resolve;}));
  const a=ensureSession(), b=ensureSession(), c=refreshSession();
  expect(mock.post).toHaveBeenCalledTimes(1);
  finish({data:{accessToken:jwt(900),refreshToken:'new',user:{id:'admin'}}});
  expect(await a).toBe(await b); await c;
  expect(tokenStorage.getRefreshToken()).toBe('new');
 });
 it('retains session after network/500 errors and allows retry', async () => {
  mock.post.mockRejectedValueOnce({response:{status:500}});
  await expect(refreshSession()).rejects.toEqual({response:{status:500}});
  expect(tokenStorage.getRefreshToken()).toBe('refresh-old');
  mock.post.mockResolvedValueOnce({data:{accessToken:jwt(900),refreshToken:'new'}});
  await refreshSession(); expect(mock.post).toHaveBeenCalledTimes(2);
 });
 it('never resurrects a session after logout', async () => {
  let finish; mock.post.mockReturnValue(new Promise(resolve=>{finish=resolve;}));
  const promise=refreshSession(); tokenStorage.clearAuth();
  finish({data:{accessToken:jwt(900),refreshToken:'new'}});
  await expect(promise).rejects.toThrow('đã thay đổi'); expect(tokenStorage.getAccessToken()).toBeNull();
 });
 it('clears authentication only on definitive refresh rejection', async () => {
  mock.post.mockRejectedValue({response:{status:401}});
  await expect(refreshSession()).rejects.toBeTruthy();
  expect(tokenStorage.getRefreshToken()).toBeNull();
 });
 it('retries a late 401 with the already refreshed token, without another refresh', async () => {
  tokenStorage.setAccessToken(jwt(900));
  const instance=vi.fn().mockResolvedValue('ok'); const handlers={};
  instance.interceptors={request:{use:vi.fn()},response:{use:(_,fail)=>{handlers.fail=fail;}}};
  setupInterceptors(instance);
  const config={url:'/admin/ai01',headers:{Authorization:'Bearer old'}};
  expect(await handlers.fail({response:{status:401,config,data:{}},config})).toBe('ok');
  expect(config.headers.Authorization).toBe(`Bearer ${tokenStorage.getAccessToken()}`);
  expect(config._authRetry).toBe(true); expect(mock.post).not.toHaveBeenCalled();
 });
});
it('refreshes concurrent 401 responses once and replays each request only once', async () => {
 const token=jwt(900); tokenStorage.setAccessToken(token);
 let finish; mock.post.mockReturnValue(new Promise(resolve=>{finish=resolve;}));
 const instance=vi.fn().mockResolvedValue('saved'), handlers={};
 instance.interceptors={request:{use:vi.fn()},response:{use:(_,fail)=>{handlers.fail=fail;}}};
 setupInterceptors(instance);
 const fail=()=>{const config={url:'/admin/ai01',headers:{Authorization:`Bearer ${token}`}}; return handlers.fail({config,response:{status:401,config,data:{}}});};
 const a=fail(),b=fail();expect(mock.post).toHaveBeenCalledTimes(1);
 finish({data:{accessToken:jwt(1800),refreshToken:'rotated'}});
 expect(await a).toBe('saved');expect(await b).toBe('saved');expect(instance).toHaveBeenCalledTimes(2);
});
it('does not refresh a login rejection or endlessly retry a protected 401', async () => {
 const handlers={},instance=vi.fn();instance.interceptors={request:{use:vi.fn()},response:{use:(_,fail)=>{handlers.fail=fail;}}};setupInterceptors(instance);
 const login={url:'/auth/login',headers:{}};
 await expect(handlers.fail({config:login,response:{status:401,config:login,data:{}}})).rejects.toBeTruthy();
 expect(tokenStorage.getRefreshToken()).toBe('refresh-old');
 const config={url:'/admin/ai01',headers:{},_authRetry:true};
 await expect(handlers.fail({config,response:{status:401,config,data:{}}})).rejects.toBeTruthy();
 expect(tokenStorage.getAccessToken()).toBeNull();expect(mock.post).not.toHaveBeenCalled();expect(instance).not.toHaveBeenCalled();
});
