import { Readable } from 'node:stream';
import {
  DiagnosisImageStorage,
  mapDiagnosisUploadError,
  validateDiagnosisImage,
} from './diagnosis-upload.interceptor';
jest.mock('../../../config/cloudinary.config', () => ({ incidentStorage: {} }));
describe('Diagnosis upload boundary', () => {
  it.each([
    ['image/jpeg', [255, 216, 255]],
    ['image/png', [137, 80, 78, 71, 13, 10, 26, 10]],
    ['image/webp', [82, 73, 70, 70, 0, 0, 0, 0, 87, 69, 66, 80]],
  ])('validates %s', (mime, data) =>
    expect(() => validateDiagnosisImage(Buffer.from(data), mime)).not.toThrow(),
  );
  it('rejects disguised/empty images before storage', () => {
    expect(() =>
      validateDiagnosisImage(Buffer.from('bad'), 'image/jpeg'),
    ).toThrow();
    expect(() =>
      validateDiagnosisImage(Buffer.alloc(0), 'image/png'),
    ).toThrow();
  });
  it.each([
    [
      { http_code: 400, message: 'An unknown file format not allowed' },
      400,
      'IMAGE_INVALID',
    ],
    [
      { http_code: 401, message: 'secret credential' },
      502,
      'STORAGE_UNAVAILABLE',
    ],
    [{ http_code: 503, message: 'upstream stack' }, 502, 'STORAGE_UNAVAILABLE'],
    [{ http_code: 499, message: 'timeout' }, 504, 'STORAGE_TIMEOUT'],
  ])('maps only image errors to 4xx', (err, status, code) => {
    const mapped = mapDiagnosisUploadError(err);
    expect(mapped.getStatus()).toBe(status);
    expect(mapped.getResponse().code).toBe(code);
    expect(JSON.stringify(mapped.getResponse())).not.toContain(err.message);
  });
  it('never uploads corrupt content', (done) => {
    const storage = { _handleFile: jest.fn() };
    new DiagnosisImageStorage(storage)._handleFile(
      {},
      { mimetype: 'image/jpeg', stream: Readable.from(Buffer.from('bad')) },
      (error) => {
        expect(error.getStatus()).toBe(400);
        expect(storage._handleFile).not.toHaveBeenCalled();
        done();
      },
    );
  });
  it('preserves storage result after validation', (done) => {
    const storage = {
      _handleFile: jest.fn((_req, _file, cb) =>
        cb(null, { path: 'https://storage.test/image' }),
      ),
    };
    new DiagnosisImageStorage(storage)._handleFile(
      {},
      {
        mimetype: 'image/jpeg',
        stream: Readable.from(Buffer.from([255, 216, 255])),
      },
      (error, result) => {
        expect(error).toBeUndefined();
        expect(result.path).toBeTruthy();
        done();
      },
    );
  });
});

it('maps decoder rejection of a malformed PNG to safe 400', () => {
  expect(
    mapDiagnosisUploadError({
      http_code: 400,
      message: 'Invalid PNG file',
    }).getStatus(),
  ).toBe(400);
});
