// Verify an actual Expo config introspection and Android source map, not a grep of source code.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');
const [directory, configFile, output] = process.argv.slice(2);
if (!directory || !configFile) throw new Error('Usage: node scripts/verify-research-export.cjs <export-dir> <introspected-config.json> [report.json]');
const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
assert.equal(config.android.package, 'com.fixgo.faceresearch');
assert.equal(config.scheme, 'fixgoresearch');
assert.equal(config.extra.router.root, 'research-app');
assert.equal(config._internal.modResults.android.manifest.manifest.$.package, 'com.fixgo.faceresearch');
assert.equal(config.android.googleServicesFile, undefined);
assert.equal(config.extra.eas, undefined);
assert.equal(config.plugins.some(p => (Array.isArray(p) ? p[0] : p).includes('google-signin')), false);
function files(dir) {
  return fs.readdirSync(dir, {withFileTypes:true}).flatMap(e => e.isDirectory() ? files(path.join(dir,e.name)) : [path.join(dir,e.name)]);
}
const maps = files(directory).filter(p => p.endsWith('.hbc.map'));
assert.equal(maps.length, 1, 'Expected one Android Hermes bundle source map');
const mapFile = maps[0], bundleFile = mapFile.slice(0, -4);
const sources = JSON.parse(fs.readFileSync(mapFile, 'utf8')).sources.map(s => s.replaceAll('\\', '/'));
for (const required of ['research-app/_layout.jsx', 'research-app/face-research.jsx', 'src/features/face-research/ResearchScreen.jsx', 'src/features/face-research/client.js', 'src/features/face-research/useFaceResearch.js']) {
  assert.ok(sources.some(s => s.endsWith(required)), 'Missing research module: ' + required);
}
const forbidden = [/(^|\/)app\//, /src\/features\/auth\//, /src\/services\/(api|socket|storage)\//, /src\/utils\/remoteLogger/, /src\/config\/connection/, /socket.io-client/, /firebase\//];
const violations = sources.filter(s => forbidden.some(p => p.test(s)));
assert.deepEqual(violations, [], 'Production Worker modules leaked into research bundle');
const sha = p => createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const report = {applicationId:config.android.package, scheme:config.scheme, entrypoint:'expo-router/entry', routerRoot:config.extra.router.root,
  introspectedManifestPackage:config._internal.modResults.android.manifest.manifest.$.package,
  androidHermesExport:true, nativeApkBuilt:false, physicalDeviceTest:false, sourceCount:sources.length,
  forbiddenWorkerModules:violations, bundleBytes:fs.statSync(bundleFile).size, bundleSha256:sha(bundleFile), sourceMapSha256:sha(mapFile)};
if (output) fs.writeFileSync(output, JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
