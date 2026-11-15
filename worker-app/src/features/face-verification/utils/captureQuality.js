export function assessNativeFaces(faces, width, height) {
  if (faces.length !== 1)
    return {
      ok: false,
      message: faces.length
        ? "Chỉ một người trong khung hình"
        : "Đưa khuôn mặt vào khung",
    };
  const face = faces[0],
    box = face.frame;
  if (!box || !width || !height)
    return { ok: false, message: "Chưa đọc được khuôn mặt" };
  const ratio = box.width / width,
    cx = (box.left + box.width / 2) / width,
    cy = (box.top + box.height / 2) / height;
  const geometry = { cx, cy, ratio };
  if (ratio < 0.16 || Math.min(box.width, box.height) < 80)
    return { ...geometry, ok: false, message: "Đưa mặt gần camera hơn" };
  if (ratio > 0.8)
    return { ...geometry, ok: false, message: "Lùi xa camera một chút" };
  if (
    box.left < 0 ||
    box.top < 0 ||
    box.left + box.width > width ||
    box.top + box.height > height
  )
    return { ...geometry, ok: false, message: "Giữ trọn khuôn mặt trong hình" };
  if (Math.abs(cx - 0.5) > 0.18 || Math.abs(cy - 0.5) > 0.22)
    return { ...geometry, ok: false, message: "Căn mặt vào giữa khung" };
  if (!Number.isFinite(face.rotationY) || !Number.isFinite(face.rotationZ))
    return { ...geometry, ok: false, message: "Nhìn thẳng vào camera" };
  if (Math.abs(face.rotationZ) > 22)
    return { ...geometry, ok: false, message: "Giữ đầu thẳng" };
  if (Math.abs(face.rotationY) > 25)
    return { ...geometry, ok: false, message: "Nhìn thẳng vào camera" };
  return { ...geometry, ok: true, message: "Giữ yên khuôn mặt" };
}
export function captureStability(previous, quality, now, durationMs = 1300, {processingMs = 0, minSamples = 4} = {}) {
  if (!quality.ok)
    return { since: null, lastAt: now, quality, progress: 0, samples: 0 };
  const old = previous?.quality;
  const moved =
    old &&
    (Math.abs(quality.cx - old.cx) > 0.04 ||
      Math.abs(quality.cy - old.cy) > 0.04 ||
      Math.abs(quality.ratio - old.ratio) > 0.08);
  // Camera/ML work is serialized. Slow inference is not evidence of movement.
  // Still reset for idle gaps and very stale observations.
  const idleGap = previous ? Math.max(0, now - previous.lastAt - processingMs) : 0;
  const fresh = previous?.since == null || idleGap > 1500 || processingMs > 5000 || moved;
  const since = fresh ? now : previous.since;
  const samples = fresh ? 1 : previous.samples + 1;
  return {
    since,
    lastAt: now,
    quality,
    samples,
    progress:
      samples >= minSamples
        ? Math.min(1, (now - since) / durationMs)
        : Math.min(0.9, (now - since) / durationMs),
  };
}

// Measure the face area, not the bright background. Local guidance is not PAD.
export function assessFaceLighting(image, face) {
  const box = face?.frame;
  if (!image?.data || !image.width || !image.height || !box)
    return { ok: false, message: 'Đang kiểm tra ánh sáng trên khuôn mặt' };
  const orientation = readJpegOrientation(image.exifBuffer);
  const rotated = orientation >= 5;
  const width = rotated ? image.height : image.width;
  const height = rotated ? image.width : image.height;
  const x0=Math.max(0,Math.floor(box.left)), y0=Math.max(0,Math.floor(box.top));
  const x1=Math.min(width,Math.ceil(box.left+box.width)), y1=Math.min(height,Math.ceil(box.top+box.height));
  let sum=0,count=0;
  const step=Math.max(1,Math.floor(Math.min(x1-x0,y1-y0)/64));
  for(let y=y0;y<y1;y+=step) for(let x=x0;x<x1;x+=step){
    let px=x,py=y;
    if(orientation===2)px=image.width-1-x;
    if(orientation===3){px=image.width-1-x;py=image.height-1-y;}
    if(orientation===4)py=image.height-1-y;
    if(orientation===5){px=y;py=x;}
    if(orientation===6){px=y;py=image.height-1-x;}
    if(orientation===7){px=image.width-1-y;py=image.height-1-x;}
    if(orientation===8){px=image.width-1-y;py=x;}
    const i=(py*image.width+px)*4;
    sum+=.299*image.data[i]+.587*image.data[i+1]+.114*image.data[i+2]; count++;
  }
  if (!count || !Number.isFinite(sum)) return {ok:false,message:'Giữ trọn khuôn mặt trong khung'};
  const brightness=sum/count;
  if(brightness<40) return {ok:false,brightness,message:'Khuôn mặt quá tối. Di chuyển đến chỗ sáng hơn và quay mặt về nguồn sáng'};
  if(brightness>220) return {ok:false,brightness,message:'Khuôn mặt quá sáng. Tránh ánh nắng hoặc đèn chiếu trực tiếp'};
  return {ok:true,brightness};
}

export function choosePictureSize(sizes) {
  const valid=(sizes||[]).filter(s=>/^\d+x\d+$/.test(s)).map(value=>{const [w,h]=value.split('x').map(Number);return {value,w,h,area:w*h};}).filter(s=>s.w>0&&s.h>0).sort((a,b)=>a.area-b.area);
  return (valid.find(s=>Math.min(s.w,s.h)>=480&&s.area<=1500000)||valid[0])?.value;
}


// jpeg-js exposes EXIF metadata but does not rotate its decoded pixels.
// ML Kit honors EXIF, so map face coordinates back to raw pixels when sampling.
export function readJpegOrientation(bytes) {
  if (!bytes?.buffer || bytes.length < 8) return 1;
  try {
    const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
    let start=-1;
    for(let n=0;n<=Math.min(8,bytes.length-8);n++) {
      if ((bytes[n]===73 && bytes[n+1]===73 && bytes[n+2]===42 && bytes[n+3]===0) ||
          (bytes[n]===77 && bytes[n+1]===77 && bytes[n+2]===0 && bytes[n+3]===42)) {start=n;break;}
    }
    if(start<0)return 1;
    const little=bytes[start]===73;
    const directory=start+view.getUint32(start+4,little);
    const count=view.getUint16(directory,little);
    for(let n=0;n<Math.min(count,256);n++) {
      const entry=directory+2+n*12;
      if(entry+12>bytes.length)return 1;
      if(view.getUint16(entry,little)===0x112 && view.getUint16(entry+2,little)===3 && view.getUint32(entry+4,little)===1){
        const value=view.getUint16(entry+8,little);
        return value>=1&&value<=8?value:1;
      }
    }
  }catch { /* Invalid optional metadata: use the original pixel orientation. */ }
  return 1;
}
