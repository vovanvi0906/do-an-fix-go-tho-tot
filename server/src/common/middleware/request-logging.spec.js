import { requestLogging } from './request-logging';

describe('HTTP request correlation', () => {
  afterEach(() => jest.restoreAllMocks());
  it.each(['mobile-123', 'bad\nheader', undefined])('correlates request and response for %p', (supplied) => {
    const req = { headers: { 'x-request-id': supplied }, method: 'POST', path: '/api/orders' };
    const callbacks = {};
    const res = { setHeader: jest.fn(), on: (event, callback) => { callbacks[event] = callback; }, statusCode: 409 };
    const next = jest.fn();
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    requestLogging(req, res, next);
    expect(req.requestId).toMatch(/^[a-zA-Z0-9_-]{1,100}$/);
    if (supplied === 'mobile-123') expect(req.requestId).toBe(supplied);
    expect(res.setHeader).toHaveBeenCalledWith('X-Request-ID', req.requestId);
    expect(next).toHaveBeenCalledTimes(1);
    callbacks.finish();
    expect(JSON.parse(log.mock.calls[0][0])).toMatchObject({ requestId: req.requestId, status: 409, path: '/api/orders' });
  });
});
