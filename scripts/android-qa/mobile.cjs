const path = require('node:path');
const { root, run, load } = require('./common.cjs');
const { mobileEnv } = require('./runtime.cjs');
const app = process.argv[2], action = process.argv[3];
if (!['customer', 'worker'].includes(app) || !['build', 'install'].includes(action)) throw new Error('Use: node scripts/android-qa/mobile.cjs customer|worker build|install');
const config = load(), appDir = path.join(root, `${app}-app`), qaEnv = mobileEnv(`${app}-app`, config), port = app === 'customer' ? '8081' : '8082';
if (action === 'build') run(path.join(appDir, 'android/gradlew'), [':app:assembleDebug', `-PreactNativeDevServerPort=${port}`, '--max-workers=2', '-Dorg.gradle.jvmargs=-Xmx2048m'], { cwd: path.join(appDir, 'android'), env: qaEnv, stdio: 'inherit' });
else {
  if (run('adb', ['-s', config.serial, 'get-state']).trim() !== 'device') throw new Error('VIVO_DEVICE_NOT_READY');
  // -r preserves app data. No uninstall, clear, downgrade or signature bypass fallback.
  run('adb', ['-s', config.serial, 'install', '-r', path.join(appDir, 'android/app/build/outputs/apk/debug/app-debug.apk')], { env: qaEnv, stdio: 'inherit' });
}
