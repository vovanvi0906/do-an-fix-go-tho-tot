# ANDROID-RESEARCH-QA-01 — Ubuntu native build and physical QA

**Physical-device status: ANDROID PENDING.** `adb devices -l` returned no devices.
A JavaScript/Hermes export, Metro manifest or HTTP test is not a native device test.
Do not collect real photos. Research camera remains locked; every measurement has
`verified=false`, `enrolled=false`, `proof=null`.

## Ubuntu toolchain

Observed: Node20.20.2, Expo52.0.49, React Native0.76.9, OpenJDK17.0.21.0.3,
Android SDK `/home/vanvi/Android/Sdk`, platform35, build-tools35.0.0,
NDK26.1.10909125, Gradle wrapper8.10.2. No system `gradle` or `sdkmanager` on PATH;
installed SDK and wrapper suffice for this build. System adb34.0.5; no phone connected.
No SDK license auto-acceptance or model download performed.

## Prepare and build in a separate workspace

Run from repository root:

```sh
node worker-app/scripts/prepare-research-native.cjs > /tmp/fixgo-android-research-build.json
node -p "require('/tmp/fixgo-android-research-build.json').workspace"
```

Change directory to the printed workspace before the next commands. It is a fresh folder
under `~/.cache/fixgo-android-research/`, not `worker-app/`. The script copies only research
source/assets/config plus a private node_modules copy (Gradle writes dependency caches).
It copies no production app root, account config, `.env`, Google services JSON or existing
Android directory. The temporary package/RN configs exclude Google Sign-In, AsyncStorage,
SecureStore and location native modules. Expo SDK52 needs both Expo autolinking exclusions
and RN `platforms.android=null`; the Expo list alone did not exclude the two RN modules.

```sh
FACE_RESEARCH_APP=true EXPO_NO_DOTENV=1 ANDROID_HOME=/home/vanvi/Android/Sdk \
  node node_modules/expo/bin/cli prebuild --platform android --no-install > prebuild.log 2>&1
FACE_RESEARCH_APP=true EXPO_NO_DOTENV=1 ANDROID_HOME=/home/vanvi/Android/Sdk \
  ./android/gradlew -p android :app:assembleDebug --no-daemon --max-workers=2 \
  -Dorg.gradle.jvmargs='-Xmx1536m -XX:MaxMetaspaceSize=512m' \
  -PreactNativeArchitectures=arm64-v8a > gradle-build.log 2>&1
```

No native prebuild is run in the Worker worktree. Do not use `--clean`, publish with EAS
or install an APK before verifying its actual package. This build targets ARM64 phones;
check the device ABI before installation. `assembleDebug` does not install or launch it.
The dev-client APK needs Metro for JavaScript; it is not a standalone offline release.
The normal Worker package remains `com.fixgo.worker` and scheme `fixgoworker`.

From repository root, verify the actual APK (replace `<workspace>`):

```sh
node worker-app/scripts/verify-research-apk.cjs \
  <workspace>/android/app/build/outputs/apk/debug/app-debug.apk \
  /home/vanvi/Android/Sdk/build-tools/35.0.0 /tmp/fixgo-research-apk-verification.json
```

Verifier requires `com.fixgo.faceresearch`, research scheme, dev-launcher component,
ARM64 Hermes library, valid APK signature, backup disabled, debug loopback HTTP and
no location/storage/media/microphone permissions. Camera permission is declared for a
future approved phase; no capture is invoked or granted during synthetic QA.
Build logs, APK and debug keystore stay outside Git. Debug signing is development only.

## Install and connect when a physical phone is available

Enable developer options/USB debugging on a consenting device owner’s phone, connect USB
and accept that computer's debugging key. These steps authorize debugging, **not biometric
collection**. Use the exact serial shown as `device`; do not target an unknown/emulated device.

```sh
adb devices -l
adb -s <serial> shell getprop ro.product.cpu.abilist
adb -s <serial> install -r <verified-research-apk>
adb -s <serial> shell pm path com.fixgo.faceresearch
adb -s <serial> reverse tcp:3107 tcp:3107
adb -s <serial> reverse tcp:8087 tcp:8087
adb -s <serial> reverse --list
```

Start the synthetic lab from repository root, using the [existing lab runbook](research-e2e-runbook.md).
It creates only its owned PostgreSQL/AI containers. Use the private synthetic token/order ID
printed as file paths by the lab; never log or commit token values.

Start Metro **from the research build workspace**, with the same config used to build:

```sh
FACE_RESEARCH_APP=true EXPO_NO_DOTENV=1 EXPO_OFFLINE=1 \
  node node_modules/expo/bin/cli start --dev-client --localhost --port 8087
adb -s <serial> shell am start -a android.intent.action.VIEW \
  -d 'exp+fixgo-face-research://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8087' \
  com.fixgo.faceresearch
```

Research router redirects to its measurement screen; no Worker login or account token
should be requested. Backend URL is `http://127.0.0.1:3107`. Test only the synthetic button.
Direct app navigation scheme is `fixgoresearch://face-research`; native launch URI above
loads the dev-client's Metro project first.

## Physical test cases — all pending until device execution

| Case | Action / expected evidence | Status |
|---|---|---|
| Device/ABI | USB-authorized physical serial, Android version, ARM64 ABI | PENDING |
| Install/coexistence | Verified research APK installed; Worker package unchanged | PENDING |
| Native launch | Dev-launcher/Activity starts without crash; scoped logcat | PENDING |
| Metro/Hermes/navigation | Research root loads through8087; no Worker auth/socket/log traffic | PENDING |
| Capabilities | Backend3107 responds; camera false, proofAllowed false | PENDING |
| Three purposes | Enrollment/Daily/Order synthetic; session/nonce real; NO_FACE, null scores and false/null authority | PENDING |
| Retry/idempotency | Interrupt response then retry same scoped session; no duplicate inference/grant | PENDING |
| Expiration | Let120s elapse; old session/nonce cannot be used | PENDING |
| Timeout | Controlled owned lab AI timeout yields504/failure, never success; HTTP runner already covers it but phone must exercise it | PENDING |
| Network loss | Remove research3107 reverse, submit, observe error; restore reverse and retry; USB reverse may work even in airplane mode | PENDING |
| Close/reopen | Force-stop research package only, reopen; token/result are not persisted, no automatic capture/verification | PENDING |
| Cleanup | Delete research measurements, verify camera never invoked; remove only owned lab resources/reverses | PENDING |

Use `adb -s <serial> shell am force-stop com.fixgo.faceresearch` for the reopen case.
For deterministic network loss, remove only `tcp:3107`, then recreate it. Do not confuse a
connection error with a timeout. Save app-PID-scoped logcat privately, sanitize before sharing;
do not clear the whole phone's log buffer or record other apps' traffic/user data.
Record actual outcomes, device/build/APK hashes, timing and failures; never check boxes
from mocks or from desktop HTTP success. No genuine/impostor/PAD metrics in this phase.

## Cleanup and boundaries

Stop owned lab and Metro with Ctrl+C; verify their exact containers/network/processes stop.
Remove only the research reverses3107/8087 if created by this test. Optional uninstall applies
only to `com.fixgo.faceresearch`; never uninstall/clear data of `com.fixgo.worker`.
APK/logs/source snapshot may be retained outside Git as QA artifacts. Native build workspaces
may be deleted only by their exact owned path after retaining the verified APK/report.
No Docker prune, global Gradle stop, project DB commands, model downloads or production gates.

References: [Expo development builds](https://docs.expo.dev/develop/development-builds/introduction/),
[Android ADB](https://developer.android.com/tools/adb). Commands are validated against the
installed SDK52 tools, rather than assuming the latest Expo SDK has identical autolinking.

## Kết quả thực thi QA-01

**APK/dev-client: BUILD SUCCESSFUL; chưa cài thiết bị.** Bản ARM64 cuối cùng:
`/home/vanvi/.cache/fixgo-android-research/build-GVZjt0/android/app/build/outputs/apk/debug/app-debug.apk`
(127.303.787 bytes). SHA-256:
`2078133738f9075f3bac81fc62436a3f9dd460376dc25bdcb06493de04b6801f`.
Xem [APK verification](android-research-qa-01-apk.json) và [build/test evidence](android-research-qa-01-results.json).

| Kiểm tra đã chạy | PASS | FAIL | SKIP / chưa chạy |
|---|---:|---:|---|
| Worker research config/flow + FaceCoreFlow/FaceScreen Jest | 27 | 0 | 0 |
| HTTP/PostgreSQL research runner, actual model loading | 24 | 0 | 0 |
| Native Gradle cuối, signature/APK manifest/Hermes verification | PASS | 0 | không cài thiết bị |
| Android JS/Hermes export + source map isolation | PASS | 0 | không phải device E2E |
| Metro từ build workspace + Android manifest HTTP200 | PASS | 0 | chưa khởi chạy Activity |
| Physical QA matrix12 ca ở trên | 0 | 0 | 12 PENDING, không phải automated SKIP |

Hai lượt build chuẩn bị trước đó cũng thành công (3m56s và3m41s); lượt incremental cuối
loại RN autolinking dư thành công trong1m06s. Không có Gradle FAILURE. 652 Gradle tasks
không phải652 tests. Chỉ APK cuối đã qua strict verifier được bàn giao.
SDK/Gradle caches và hai workspace build nằm ngoài Git; workspace đầu là prototype,
không dùng APK đó để cài. Không có native `worker-app/android/` được tạo trong source.

Log thực tế ở `<workspace>/prebuild.log`, `gradle-build-before-rn-filter.log`,
`gradle-build.log`. Những warning đã gặp gồm Java/Kotlin deprecated API từ thư viện,
`Detected multiple Kotlin daemon sessions at kotlin/sessions` và compiler unchecked
operations; không phải build error. Lượt trước khi sửa RN config vẫn compile Google
Sign-In: đây là phát hiện autolinking đã sửa, không phải kết quả loại module thành công.
Generated RN/Expo package lists cuối đã kiểm không còn Google Sign-In/AsyncStorage/
SecureStore/Location. Không có device crash/logcat hoặc adb-install log vì chưa có thiết bị.

Sau kiểm thử, Metro và HTTP lab đã dừng; container/network nghiên cứu tự dọn, container
FixGo có sẵn không bị thay đổi. Cache build/APK/logs được chủ động giữ làm artifacts.
`adb devices -l` lần cuối vẫn rỗng. Không kiểm thử genuine/impostor/PAD accuracy.
Python/backend suites khác không chạy lại trong QA-01 vì không đổi AI/backend source;
không ghi lại số PASS của phiên cũ như tests mới.

Blocker còn lại: cần điện thoại ARM64 được USB-authorize và research dev-client đã cài
để chạy matrix native. Synthetic physical QA không cần phê duyệt ảnh khuôn mặt; camera,
người tham gia, lưu media/embedding hoặc enrollment/proof thành công vẫn cần consent/
protocol/PAD evaluation được duyệt riêng. Không có migration hoặc model/license request mới.
