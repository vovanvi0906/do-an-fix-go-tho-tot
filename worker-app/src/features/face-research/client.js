import axios from 'axios';
/** Dedicated client: no project token refresh, analytics or remote error logging. */
export function createResearchClient(baseUrl, token) {
  const url=baseUrl.trim().replace(/\/+$/,'');
  if(!/^http:\/\/(127\.0\.0\.1|localhost|10\.0\.2\.2):\d+$/.test(url)||!token.trim())throw new Error('Chỉ kết nối máy chủ nghiên cứu qua localhost/adb reverse.');
  const client=axios.create({baseURL:url,timeout:20000,headers:{Authorization:`Bearer ${token.trim()}`}});
  const get=async(path,options)=> (await client.get('/face-research'+path,options)).data.data;
  const post=async(path,body,options)=> (await client.post('/face-research'+path,body,options)).data.data;
  return {get,post,erase:async options=>(await client.delete('/face-research/sessions',options)).data.data};
}
