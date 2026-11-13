// Creates a fresh native-build workspace outside the repository. Never runs prebuild here.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const source = path.resolve(__dirname, '..');
const parent = process.argv[2] || path.join(os.homedir(), '.cache', 'fixgo-android-research');
fs.mkdirSync(parent, {recursive:true, mode:0o700});
const realParent = fs.realpathSync(parent), repository = fs.realpathSync(path.resolve(source,'..'));
if(realParent === repository || realParent.startsWith(repository + path.sep))throw new Error('Build parent must be outside repository');
const workspace = fs.mkdtempSync(path.join(parent, 'build-'));
if (workspace.startsWith(path.resolve(source, '..') + path.sep)) throw new Error('Build workspace must be outside repository');
for (const file of ['package.json','package-lock.json','app.json','app.config.js','babel.config.js','research-app','src/features/face-research','assets']) {
  fs.mkdirSync(path.dirname(path.join(workspace,file)), {recursive:true});
  fs.cpSync(path.join(source,file), path.join(workspace,file), {recursive:true});
}
// Gradle writes generated files into dependencies: copy rather than symlink them.
fs.cpSync(path.join(source,'node_modules'), path.join(workspace,'node_modules'), {recursive:true, mode:fs.constants.COPYFILE_FICLONE});
const packageFile = path.join(workspace,'package.json');
const pkg = JSON.parse(fs.readFileSync(packageFile,'utf8'));
pkg.expo = {...pkg.expo, autolinking: {...pkg.expo?.autolinking, exclude: [
  '@react-native-google-signin/google-signin', '@react-native-async-storage/async-storage',
  'expo-secure-store', 'expo-location',
]}};
fs.writeFileSync(packageFile,JSON.stringify(pkg,null,2)+'\n');
// Expo SDK52's RN resolver also needs explicit per-platform exclusions.
const rnConfig = {dependencies:Object.fromEntries(pkg.expo.autolinking.exclude.slice(0,2).map(name=>[name,{platforms:{android:null}}]))};
fs.writeFileSync(path.join(workspace,'react-native.config.js'),'module.exports = '+JSON.stringify(rnConfig,null,2)+';\n');
const manifest = {source, sourceDirty:execFileSync('git',['status','--porcelain'],{cwd:source,encoding:'utf8'}).trim().length>0, sourceHead:execFileSync('git',['rev-parse','HEAD'],{cwd:source,encoding:'utf8'}).trim(),
  workspace, applicationId:'com.fixgo.faceresearch', scheme:'fixgoresearch',routerRoot:'research-app',
  copiedNodeModules:true, researchNativeExclusions:pkg.expo.autolinking.exclude, productionAppCopied:false, nativePrebuildInSource:false};
fs.writeFileSync(path.join(workspace,'research-build.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify(manifest,null,2));
