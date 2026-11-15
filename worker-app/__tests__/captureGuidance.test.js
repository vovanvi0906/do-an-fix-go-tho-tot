import {assessNativeFaces,assessFaceLighting,captureStability,choosePictureSize} from '../src/features/face-verification/utils/captureQuality';
const face={frame:{left:30,top:30,width:100,height:100},rotationY:0,rotationZ:0};
const image=value=>({width:160,height:160,data:new Uint8Array(160*160*4).fill(value)});
it('guides near/far, position, pose, lighting and multiple faces',()=>{
 expect(assessNativeFaces([],160,160).ok).toBe(false);
 expect(assessNativeFaces([face,face],160,160).ok).toBe(false);
 expect(assessNativeFaces([{...face,frame:{left:70,top:60,width:15,height:30}}],160,160).message).toContain('gần');
 expect(assessNativeFaces([{...face,frame:{left:0,top:0,width:145,height:145}}],160,160).message).toContain('xa');
 expect(assessNativeFaces([{...face,rotationY:40}],160,160).ok).toBe(false);
 expect(assessFaceLighting(image(15),face).message).toContain('sáng hơn');
 expect(assessFaceLighting(image(245),face).ok).toBe(false);
 expect(assessFaceLighting(image(120),face).ok).toBe(true);
});
it('counts three seconds and restarts when the face moves or lighting fails',()=>{
 const q=assessNativeFaces([face],160,160);
 let state=captureStability(null,q,1000,3000);
 for(const at of [1500,2000,2500,3000,3500])state=captureStability(state,q,at,3000);
 expect(state.progress).toBeLessThan(1);
 expect(captureStability(state,q,4000,3000).progress).toBe(1);
 expect(captureStability(state,{...q,ok:false},4000,3000).progress).toBe(0);
 expect(captureStability(state,{...q,cx:q.cx+.1},4000,3000).progress).toBe(0);
});
it('selects a supported bounded image size for live detection',()=>{
 expect(choosePictureSize(['4000x3000','1280x960','640x480'])).toBe('640x480');
 expect(choosePictureSize([])).toBeUndefined();
});

it('measures the face in oriented JPEG coordinates instead of a dark background',()=>{
 const exif=new Uint8Array(26);const v=new DataView(exif.buffer);
 exif[0]=73;exif[1]=73;v.setUint16(2,42,true);v.setUint32(4,8,true);v.setUint16(8,1,true);
 v.setUint16(10,0x112,true);v.setUint16(12,3,true);v.setUint32(14,1,true);v.setUint16(18,6,true);
 const pixels=new Uint8Array(4*2*4);
 for(let x=0;x<4;x++)for(let c=0;c<3;c++)pixels[(4+x)*4+c]=120;
 const result=assessFaceLighting({data:pixels,width:4,height:2,exifBuffer:exif},{frame:{left:0,top:0,width:1,height:4}});
 expect(result.ok).toBe(true);expect(result.brightness).toBeCloseTo(120);
});

it('slow valid inference does not restart countdown, but idle gaps and stale results do',()=>{
 const q=assessNativeFaces([face],160,160);
 let state=captureStability(null,q,2000,3000,{processingMs:2000,minSamples:3});
 state=captureStability(state,q,4250,3000,{processingMs:2000,minSamples:3});
 expect(state.since).toBe(2000);
 state=captureStability(state,q,6500,3000,{processingMs:2000,minSamples:3});
 expect(state.progress).toBe(1);
 expect(captureStability(state,q,10000,3000,{processingMs:0,minSamples:3}).progress).toBe(0);
 expect(captureStability(state,q,13000,3000,{processingMs:6000,minSamples:3}).progress).toBe(0);
});
