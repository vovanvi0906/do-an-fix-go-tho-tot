import React from 'react';
import {render,fireEvent,act} from '@testing-library/react-native';
import {LiveFaceCamera} from '../src/features/face-verification/components/LiveFaceCamera';
import FaceDetection from '@react-native-ml-kit/face-detection';
const mockTake=jest.fn();
jest.mock('base64-js',()=>({toByteArray:()=>new Uint8Array()}));
jest.mock('jpeg-js',()=>({decode:()=>({data:new Uint8Array(4),width:1,height:1})}));
jest.mock('expo-camera',()=>{
 const React=require('react'),{View}=require('react-native');
 return {useCameraPermissions:()=>[{granted:true},jest.fn()],CameraView:React.forwardRef((props,ref)=>{
 React.useImperativeHandle(ref,()=>({takePictureAsync:mockTake,getAvailablePictureSizesAsync:async()=>['640x480']}));return <View testID="camera" {...props}/>;
 })};
});
jest.mock('@react-native-ml-kit/face-detection',()=>({detect:jest.fn()}));
jest.mock('../src/features/face-verification/utils/captureFiles',()=>({deleteCaptureFile:jest.fn(async()=>{})}));
jest.mock('../src/features/face-verification/utils/captureQuality',()=>({assessNativeFaces:()=>({ok:true,message:'Ready'}),captureStability:()=>({progress:0,since:Date.now()}),assessFaceLighting:()=>({ok:true}),choosePictureSize:()=>undefined}));
beforeEach(()=>{jest.useFakeTimers();jest.clearAllMocks();mockTake.mockResolvedValue({uri:'file:///test.jpg',width:160,height:160});FaceDetection.detect.mockResolvedValue([]);});
afterEach(()=>jest.useRealTimers());
it('queues a manual shutter during detection and returns one final photo instead of ignoring the tap',async()=>{
 const captured=jest.fn();const ui=render(<LiveFaceCamera visible onCapture={captured} onClose={jest.fn()}/>);
 expect(ui.getByTestId('camera').props.animateShutter).toBe(false);
 await act(async()=>fireEvent(ui.getByTestId('camera'),'cameraReady'));
 let finishDetection;
 FaceDetection.detect.mockImplementationOnce(()=>new Promise(resolve=>{finishDetection=resolve;}));
 await act(async()=>jest.advanceTimersByTime(250));
 fireEvent.press(ui.getByText('Chụp khuôn mặt'));
 expect(ui.getByText('Đang chụp…')).toBeTruthy();
 expect(captured).not.toHaveBeenCalled();
 expect(mockTake.mock.calls.every(([options])=>options.shutterSound===false)).toBe(true);
 await act(async()=>finishDetection([]));
 expect(captured).toHaveBeenCalledTimes(1);
 expect(captured).toHaveBeenCalledWith('file:///test.jpg');
 expect(mockTake).toHaveBeenLastCalledWith({quality:.85,shutterSound:false,skipProcessing:false});
 ui.unmount();
});

it('automatically captures once after three continuous seconds of valid guidance',async()=>{
 const helpers=require('../src/features/face-verification/utils/captureQuality');
 const actual=jest.requireActual('../src/features/face-verification/utils/captureQuality');
 const spy=jest.spyOn(helpers,'captureStability').mockImplementation(actual.captureStability);
 const captured=jest.fn();
 const ui=render(<LiveFaceCamera visible onCapture={captured} onClose={jest.fn()}/>);
 await act(async()=>fireEvent(ui.getByTestId('camera'),'cameraReady'));
 expect(ui.getByText('Ready — 3')).toBeTruthy();
 for(let n=0;n<11;n++)await act(async()=>jest.advanceTimersByTime(250));
 expect(captured).not.toHaveBeenCalled();
 await act(async()=>jest.advanceTimersByTime(250));
 expect(captured).toHaveBeenCalledTimes(1);
 ui.unmount();spy.mockRestore();
});

it('slow two-second detector results still finish automatic capture instead of staying at three',async()=>{
 const helpers=require('../src/features/face-verification/utils/captureQuality');
 const actual=jest.requireActual('../src/features/face-verification/utils/captureQuality');
 const spy=jest.spyOn(helpers,'captureStability').mockImplementation(actual.captureStability);
 const completions=[];
 for(let n=0;n<3;n++)FaceDetection.detect.mockImplementationOnce(()=>new Promise(resolve=>completions.push(resolve)));
 const captured=jest.fn();const ui=render(<LiveFaceCamera visible onCapture={captured} onClose={jest.fn()}/>);
 await act(async()=>fireEvent(ui.getByTestId('camera'),'cameraReady'));
 for(let n=0;n<3;n++){
   await act(async()=>jest.advanceTimersByTime(2000));
   await act(async()=>completions[n]([]));
   if(n<2)await act(async()=>jest.advanceTimersByTime(250));
 }
 expect(captured).toHaveBeenCalledTimes(1);
 ui.unmount();spy.mockRestore();
});
