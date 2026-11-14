import { cameraErrorCode, openCamera, CameraError } from './camera';

test.each([
  ['NotAllowedError', 'CAMERA_PERMISSION_DENIED'], ['SecurityError', 'CAMERA_PERMISSION_DENIED'],
  ['NotFoundError', 'CAMERA_NOT_FOUND'], ['NotReadableError', 'CAMERA_IN_USE'], ['NotSupportedError', 'CAMERA_UNSUPPORTED'], ['Weird', 'CAMERA_CAPTURE_FAILED'],
])('%s -> %s', (name, code) => expect(cameraErrorCode({ name })).toBe(code));

test('permission denied rejects with CAMERA_PERMISSION_DENIED', async () => {
  const media = { getUserMedia: () => Promise.reject(Object.assign(new Error('denied'), { name: 'NotAllowedError' })) } as unknown as MediaDevices;
  await expect(openCamera(media)).rejects.toEqual(new CameraError('CAMERA_PERMISSION_DENIED'));
});
test('missing mediaDevices (insecure origin) is unsupported', async () => {
  await expect(openCamera(undefined)).rejects.toEqual(new CameraError('CAMERA_UNSUPPORTED'));
});
test('requests front camera without audio', async () => {
  let constraints: MediaStreamConstraints | undefined;
  const media = { getUserMedia: (c: MediaStreamConstraints) => { constraints = c; return Promise.resolve({} as MediaStream); } } as unknown as MediaDevices;
  await openCamera(media);
  expect(constraints).toMatchObject({ audio: false, video: { facingMode: 'user' } });
});
