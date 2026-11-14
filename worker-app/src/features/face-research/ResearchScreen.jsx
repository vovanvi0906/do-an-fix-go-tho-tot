import React,{useMemo,useState} from 'react';
import {ScrollView,Text,TextInput,TouchableOpacity,Image,StyleSheet} from 'react-native';
import {useRouter} from 'expo-router';
import {createResearchClient} from './client';
import {useFaceResearch} from './useFaceResearch';
export default function FaceResearch(){
  const router=useRouter();const [url,setUrl]=useState('http://127.0.0.1:3107'),[token,setToken]=useState(''),[connection,setConnection]=useState(null),[purpose,setPurpose]=useState('ENROLLMENT'),[orderId,setOrderId]=useState(''),[connectionError,setConnectionError]=useState('');
  const client=useMemo(()=>connection?createResearchClient(connection.url,connection.token):null,[connection]);
  const flow=useFaceResearch(client,purpose,purpose==='ORDER'?orderId:null);
  const connect=()=>{try{createResearchClient(url,token);setConnection({url,token});setConnectionError('');}catch(e){setConnectionError(e.message);}};
  const button=(id,label,fn,disabled=false)=><TouchableOpacity key={id} nativeID={`face-research-${id}`} accessibilityRole="button" disabled={disabled} onPress={fn} style={[styles.button,disabled&&{opacity:.4}]}><Text>{label}</Text></TouchableOpacity>;
  return <ScrollView nativeID="face-research-screen" contentContainerStyle={styles.container}>
    {button('back','← Hủy và quay lại',async()=>{await flow.cancel();setToken('');setConnection(null);router.back();})}
    <Text nativeID="face-research-title" accessibilityRole="header" style={styles.title}>Face ID — nghiên cứu cô lập</Text>
    <Text>Chỉ đo lường. Không đăng ký mẫu tin cậy, không check-in và không cấp bằng chứng công việc. Chưa thu ảnh người thật khi consent/protocol chưa được duyệt.</Text>
    <TextInput nativeID="face-research-url" accessibilityLabel="URL máy chủ nghiên cứu" value={url} onChangeText={setUrl} autoCapitalize="none" style={styles.input}/>
    <TextInput nativeID="face-research-token" accessibilityLabel="Token nghiên cứu riêng" value={token} onChangeText={setToken} secureTextEntry autoCapitalize="none" autoCorrect={false} style={styles.input}/>
    {button('connect','Kết nối nghiên cứu',connect,flow.busy)}
    <Text nativeID="face-research-error" accessibilityLiveRegion="polite">{connectionError||flow.error}</Text>
    {['ENROLLMENT','DAILY','ORDER'].map(p=>button(`purpose-${p.toLowerCase()}`,p,()=>{void flow.cancel();setPurpose(p);},flow.busy))}
    {purpose==='ORDER'?<TextInput nativeID="face-research-order" accessibilityLabel="Order ID trong DB nghiên cứu" value={orderId} onChangeText={setOrderId} autoCapitalize="none" style={styles.input}/>:null}
    <Text nativeID="face-research-capabilities">{flow.caps?flow.caps.cameraAllowed?'Camera nghiên cứu đã được duyệt riêng.':'Camera khóa — chỉ chạy ảnh tổng hợp phía máy chủ.':'Chưa kết nối.'}</Text>
    {button('synthetic','Đo ảnh tổng hợp — không mở camera',flow.synthetic,!flow.caps||flow.busy||(purpose==='ORDER'&&!orderId))}
    <Text>{purpose==='ENROLLMENT'?'Một ảnh camera để đo acquisition; không lưu template.':'Hai ảnh camera trong cùng phiên: ảnh tham chiếu trước, ảnh kiểm tra sau. Đây là so cặp nghiên cứu; chưa dùng template enrollment lưu bền vững.'}</Text>
    {button('capture','Chụp camera trước',flow.capture,!flow.caps?.cameraAllowed||flow.busy)}
    {flow.photos.map((uri,i)=><Image key={uri} nativeID={`face-research-preview-${i}`} source={{uri}} style={{width:120,height:160}} accessibilityLabel={`Ảnh camera ${i+1}`}/>)}
    <Text nativeID="face-research-session">{flow.session?`Phiên ${flow.session.id}; hết hạn ${flow.session.expiresAt}`:''}</Text>
    {button('submit','Gửi số đo nghiên cứu',flow.submit,!flow.caps?.cameraAllowed||flow.busy||flow.photos.length!==(purpose==='ENROLLMENT'?1:2))}
    {flow.result?<Text nativeID="face-research-measurements" selectable>{JSON.stringify(flow.result,null,2)}</Text>:null}
    {button('erase','Xóa phiên, số đo và ảnh cache nghiên cứu',flow.erase,!flow.caps||flow.busy)}
  </ScrollView>;
}
const styles=StyleSheet.create({container:{padding:24,paddingTop:48,gap:12},title:{fontSize:22,fontWeight:'700'},input:{borderWidth:1,borderColor:'#94a3b8',padding:12,borderRadius:8},button:{padding:14,backgroundColor:'#e2e8f0',borderRadius:8}});
