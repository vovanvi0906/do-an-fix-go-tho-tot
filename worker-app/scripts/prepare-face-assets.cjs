const { readFile, writeFile, mkdir, copyFile } = require('node:fs/promises');
const path = require('node:path');
const { createHash } = require('node:crypto');
(async () => {
  const output = path.resolve(__dirname, '../public/faceid');
  await mkdir(output, { recursive: true });
  const name = 'blaze_face_short_range.tflite';
  let bytes;
  try { bytes = await readFile(path.resolve(__dirname, '../../ai-service/weights', name)); }
  catch {
    const response = await fetch('https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite');
    if (!response.ok) throw Error('BlazeFace download failed');
    bytes = Buffer.from(await response.arrayBuffer());
  }
  if (createHash('sha256').update(bytes).digest('hex') !== 'b4578f35940bf5a1a655214a1cce5cab13eba73c1297cd78e1a04c2380b0152f') throw Error('BlazeFace checksum mismatch');
  await writeFile(path.join(output, name), bytes);
  const directory = path.dirname(require.resolve('@mediapipe/tasks-vision'));
  for (const file of ['vision_wasm_internal.js', 'vision_wasm_internal.wasm', 'vision_wasm_nosimd_internal.js', 'vision_wasm_nosimd_internal.wasm']) {
    await copyFile(path.join(directory, 'wasm', file), path.join(output, file));
  }
  console.log('Worker FaceID web assets ready (local WASM and pinned BlazeFace).');
})().catch(error => { console.error(error.message); process.exitCode = 1; });
