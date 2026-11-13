import {useState,useRef,useEffect,useCallback} from 'react';
import {AppState} from 'react-native';
import * as Crypto from 'expo-crypto';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
const live=s=>s&&Date.parse(s.expiresAt)>Date.now();
export function useFaceResearch(client,purpose='ENROLLMENT',orderId=null){
  const [caps,setCaps]=useState(null),[session,setSession]=useState(null),[photos,setPhotos]=useState([]),[result,setResult]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  const lock=useRef(false),current=useRef(null),key=useRef(null),files=useRef([]),generation=useRef(0),controller=useRef(null),camera=useRef(false);
  const clearFiles=useCallback(async()=>{
    const uris=files.current;setPhotos([]);
    const outcomes=await Promise.allSettled(uris.map(uri=>FileSystem.deleteAsync(uri,{idempotent:true})));
    files.current=uris.filter((_,i)=>outcomes[i].status==='rejected');
    if(files.current.length){const message='Không xóa được ảnh cache. Dừng thử nghiệm và xóa dữ liệu ứng dụng.';setError(message);throw new Error(message);}
  },[]);
  const cancel=useCallback(async()=>{++generation.current;controller.current?.abort();current.current=null;key.current=null;lock.current=false;setBusy(false);setSession(null);setResult(null);try{await clearFiles();}catch(_){}},[clearFiles]);
  useEffect(()=>{
    const g=++generation.current;const abort=new AbortController();controller.current=abort;
    setCaps(null);setError('');current.current=null;key.current=null;lock.current=false;setBusy(false);setSession(null);setPhotos([]);setResult(null);
    if(client)client.get('/capabilities',{signal:abort.signal}).then(c=>{if(g===generation.current)setCaps(c);}).catch(()=>{if(g===generation.current&&!abort.signal.aborted)setError('Không kết nối được API nghiên cứu. Kiểm tra địa chỉ, token và máy chủ.');});
    const listener=AppState.addEventListener('change',state=>{if(state!=='active'&&!camera.current)void cancel();});
    return()=>{++generation.current;controller.current?.abort();listener.remove();const uris=files.current;files.current=[];for(const uri of uris)void FileSystem.deleteAsync(uri,{idempotent:true}).catch(()=>{});current.current=null;key.current=null;};
  },[client,purpose,orderId,cancel]);
  async function ensureSession(signal,g){
    if(current.current&&!live(current.current)){current.current=null;key.current=null;await clearFiles();throw new Error('Phiên hết hạn. Tạo phiên mới và chụp lại.');}
    if(!current.current){
      key.current ||= Crypto.randomUUID();
      const s=await client.post('/sessions',{purpose,requestKey:key.current,...(purpose==='ORDER'?{orderId}:{})},{signal});
      if(g!==generation.current)throw new Error('Phiên đã hủy.');
      if(!live(s)||!s.id||!s.nonce||s.researchOnly!==true||s.purpose!==purpose||(s.orderId??null)!==(purpose==='ORDER'?orderId:null))throw new Error('Phiên nghiên cứu không hợp lệ.');
      current.current=s;setSession(s);
    }
    return current.current;
  }
  async function action(fn){
    if(lock.current||!client)return;
    lock.current=true;setBusy(true);setError('');const g=generation.current,abort=new AbortController();controller.current=abort;
    try{await fn(abort.signal,g);}catch(e){if(g===generation.current&&!abort.signal.aborted)setError(e.response?.data?.message||e.message||'Mất mạng hoặc quá thời gian chờ. Thử lại cùng phiên.');}
    finally{if(g===generation.current){lock.current=false;setBusy(false);}}
  }
  const capture=()=>action(async(signal,g)=>{
    if(!caps?.cameraAllowed)throw new Error('Chưa phê duyệt thu ảnh người tham gia. Camera đang khóa.');
    const s=await ensureSession(signal,g);if(g!==generation.current)return;
    const permission=await ImagePicker.requestCameraPermissionsAsync();if(g!==generation.current)return;
    if(!permission.granted)throw new Error('Cần quyền camera; không dùng thư viện ảnh.');
    camera.current=true;
    let image;
    try{image=await ImagePicker.launchCameraAsync({cameraType:ImagePicker.CameraType.front,allowsEditing:false,quality:.8,exif:false,base64:false,mediaTypes:['images']});}finally{camera.current=false;}
    const uri=image?.canceled?null:image?.assets?.[0]?.uri;
    if(!uri)return;
    if(g!==generation.current||!live(s)){await FileSystem.deleteAsync(uri,{idempotent:true});throw new Error('Phiên đã hết hạn hoặc bị hủy; ảnh đã xóa.');}
    if(!/^(file|content):/.test(uri))throw new Error('Chỉ nhận ảnh camera cục bộ trên Android.');
    if(files.current.length>=(purpose==='ENROLLMENT'?1:2))await clearFiles();
    files.current=[...files.current,uri];setPhotos([...files.current]);
  });
  function accept(r,s){
    if(r?.sessionId!==s.id||r?.purpose!==s.purpose||(r?.orderId??null)!==(s.orderId??null)||r?.researchOnly!==true||r.verified!==false||r.enrolled!==false||r.proof!==null||r.padDecision!=='NOT_EVALUATED')throw new Error('Phản hồi không đúng hợp đồng nghiên cứu.');
    setResult(r);
  }
  const synthetic=()=>action(async(signal,g)=>{const s=await ensureSession(signal,g);if(g!==generation.current)return;const r=await client.post(`/sessions/${s.id}/synthetic`,{nonce:s.nonce},{signal});if(g!==generation.current)return;accept(r,s);current.current=null;key.current=null;setSession(null);});
  const submit=()=>action(async(signal,g)=>{
    if(!caps?.cameraAllowed)throw new Error('Camera chưa được duyệt.');
    const s=current.current,count=purpose==='ENROLLMENT'?1:2;
    if(!live(s)||files.current.length!==count){if(!live(s)){current.current=null;key.current=null;setSession(null);await clearFiles();}throw new Error('Phiên hết hạn hoặc thiếu ảnh camera. Chụp lại.');}
    const form=new FormData();
    form.append('image',{uri:files.current[count-1],name:'capture.jpg',type:'image/jpeg'});
    if(count===2)form.append('reference',{uri:files.current[0],name:'reference.jpg',type:'image/jpeg'});
    const r=await client.post(`/sessions/${s.id}/capture`,form,{signal,timeout:20000,headers:{'Content-Type':'multipart/form-data','x-research-nonce':s.nonce}});
    if(g!==generation.current)return;
    accept(r,s);await clearFiles();current.current=null;key.current=null;setSession(null);
  });
  const erase=()=>action(async(signal,g)=>{await client.erase({signal});if(g===generation.current){await clearFiles();current.current=null;key.current=null;setSession(null);setResult(null);}});
  return {caps,session,photos,result,error,busy,capture,submit,synthetic,cancel,erase};
}
