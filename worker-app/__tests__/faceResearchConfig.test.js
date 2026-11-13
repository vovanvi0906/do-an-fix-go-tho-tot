const build = require('../app.config');
const config = {slug:'worker-original',scheme:'fixgoworker',android:{package:'com.fixgo.worker',googleServicesFile:'original.json'},plugins:['expo-router'],extra:{eas:{projectId:'existing'}}};
let previous;
beforeEach(()=>{previous=process.env.FACE_RESEARCH_APP;});
afterEach(()=>{if(previous===undefined)delete process.env.FACE_RESEARCH_APP;else process.env.FACE_RESEARCH_APP=previous;});
it('normal Worker configuration keeps its application identity and plugins',()=>{
  process.env.FACE_RESEARCH_APP='false';const normal=build({config});
  expect(normal.android).toEqual(config.android);expect(normal.scheme).toBe(config.scheme);expect(normal.plugins).toEqual(config.plugins);expect(normal.extra.eas.projectId).toBe('existing');
});
it('research configuration selects a separate package/router without project credentials',()=>{
  process.env.FACE_RESEARCH_APP='true';const research=build({config});
  expect(research.android.package).toBe('com.fixgo.faceresearch');expect(research.scheme).toBe('fixgoresearch');expect(research.extra.router.root).toBe('research-app');
  expect(research.android.googleServicesFile).toBeUndefined();expect(research.extra.eas).toBeUndefined();
  expect(research.plugins).toEqual(expect.arrayContaining([['expo-router',{root:'research-app'}]]));
  expect(config.android.package).toBe('com.fixgo.worker');
});
