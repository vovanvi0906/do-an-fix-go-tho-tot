// Inspect an actual APK before any adb install. No device/database access.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process'),{createHash}=require('node:crypto');
const [apk,tools,output]=process.argv.slice(2);
if(!apk||!tools)throw new Error('Usage: verify-research-apk.cjs <apk> <SDK build-tools directory> [report.json]');
const run=(tool,args)=>execFileSync(path.join(tools,tool),args,{encoding:'utf8',maxBuffer:16*1024*1024});
const badging=run('aapt',['dump','badging',apk]),xml=run('aapt',['dump','xmltree',apk,'AndroidManifest.xml']),entries=run('aapt',['list',apk]);
const signature=run('apksigner',['verify','--print-certs',apk]);
const applicationId=badging.match(/^package: name='([^']+)'/m)?.[1];
assert.equal(applicationId,'com.fixgo.faceresearch','Never install a Worker or unknown package');
assert.ok(xml.includes('"fixgoresearch"'),'Research scheme required');
assert.ok(xml.includes('expo.modules.devlauncher'),'Native dev-client launcher required');
assert.ok(xml.match(/android:allowBackup[^\n]*0x0\b/),'Research backup must be disabled');
assert.ok(xml.match(/android:usesCleartextTraffic[^\n]*0xffffffff/),'ADB loopback HTTP requires debug cleartext support');
const permissions=[...badging.matchAll(/^uses-permission: name='([^']+)'/gm)].map(m=>m[1]);
for(const permission of ['ACCESS_FINE_LOCATION','ACCESS_COARSE_LOCATION','READ_EXTERNAL_STORAGE','WRITE_EXTERNAL_STORAGE','READ_MEDIA_IMAGES','READ_MEDIA_VIDEO','RECORD_AUDIO'])assert.ok(!permissions.includes('android.permission.'+permission),'Unexpected research permission: '+permission);
assert.ok(entries.includes('lib/arm64-v8a/libhermes.so'),'ARM64 Hermes runtime missing');
const report={applicationId,scheme:'fixgoresearch',devClientPackaged:true,hermesArm64:true,backupEnabled:false,debugLoopbackHttp:true,permissions,
 apkBytes:fs.statSync(apk).size,apkSha256:createHash('sha256').update(fs.readFileSync(apk)).digest('hex'),
 signerSha256:signature.match(/Signer #1 certificate SHA-256 digest: ([a-f0-9]+)/)?.[1]??null,signatureVerified:true,installed:false,physicalDeviceQA:'ANDROID PENDING'};
if(output)fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
