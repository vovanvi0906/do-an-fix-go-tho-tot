import React, { useState } from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';

const messages = {
  disabled: 'Phân tích dấu hiệu lỗi từ ảnh hiện chưa được bật. Bạn vẫn có thể xác nhận thiết bị và mô tả tình trạng để tìm dịch vụ.',
  unavailable: 'Chưa thể phân tích dấu hiệu lỗi trong ảnh lúc này. Hãy mô tả tình trạng hoặc chọn dịch vụ thủ công.',
  no_evidence: 'AI chưa tìm thấy dấu hiệu đủ rõ để đề xuất dịch vụ từ ảnh. Điều này không có nghĩa thiết bị không có lỗi.',
  no_approved_match: 'Chưa có dịch vụ phù hợp được xác nhận cho dấu hiệu AI tìm thấy. Hãy bổ sung tình trạng hoặc chọn thủ công.',
};
const validBox = b => Array.isArray(b?.xyxy) && b.xyxy.length === 4 && b.xyxy.every(n => Number.isFinite(n) && n >= 0 && n <= 1) && b.xyxy[2] > b.xyxy[0] && b.xyxy[3] > b.xyxy[1];

export default function VisualAnalysisSummary({ result, imageUri }) {
  const [imageSize, setImageSize] = useState(null);
  const [width, setWidth] = useState(0);
  const [showBoxes, setShowBoxes] = useState(true);
  const [failed, setFailed] = useState(false);
  const status = result?.visualAnalysisStatus;
  if (!status) return null;
  const suggestions = status === 'suggestions' ? result?.visualServiceSuggestions || [] : [];
  const signs = [...new Set([...suggestions.flatMap(s => (s.visualEvidence || []).map(e => e.name).filter(Boolean)), ...(status === 'no_approved_match' ? result.observableSigns || [] : [])])];
  const boxes = [...new Map(suggestions.flatMap(s => (s.visualEvidence || []).flatMap(e => (e.boxes || []).filter(validBox).map(b => ({ ...b, name: e.name })))).map(b => [`${b.name}:${b.xyxy.join(',')}`, b])).values()].slice(0, 30);
  const height = 240;
  const scale = imageSize && width ? Math.min(width / imageSize.width, height / imageSize.height) : 0;
  const left = imageSize ? (width - imageSize.width * scale) / 2 : 0;
  const top = imageSize ? (height - imageSize.height * scale) / 2 : 0;
  return <View nativeID="visual-analysis-summary" style={styles.card}>
    <Text style={styles.title}>Dấu hiệu trong ảnh</Text>
    <Text>{messages[status] || 'Đây là gợi ý từ ảnh, cần bạn xác nhận và thợ kiểm tra thực tế.'}</Text>
    {!!signs.length && <Text style={styles.signs}>{signs.join(' · ')}</Text>}
    {!!imageUri && <View style={{ height, marginTop: 12, overflow: 'hidden', backgroundColor: '#F1F5F9', borderRadius: 8 }} onLayout={e => setWidth(e.nativeEvent.layout.width)}>
      <Image accessibilityLabel="Ảnh khách hàng gửi để phân tích" source={{ uri: imageUri }} resizeMode="contain" style={StyleSheet.absoluteFillObject}
        onLoad={e => { const { width: w, height: h } = e.nativeEvent.source; if (w > 0 && h > 0) setImageSize({ width: w, height: h }); }} onError={() => setFailed(true)} />
      {!failed && showBoxes && !!scale && boxes.map((b, i) => <View key={i} pointerEvents="none" testID="visual-evidence-box" style={{ position: 'absolute', left: left + b.xyxy[0] * imageSize.width * scale, top: top + b.xyxy[1] * imageSize.height * scale, width: (b.xyxy[2] - b.xyxy[0]) * imageSize.width * scale, height: (b.xyxy[3] - b.xyxy[1]) * imageSize.height * scale, borderWidth: 2, borderColor: '#C2410C' }}><Text numberOfLines={1} style={{ backgroundColor: '#FFF7ED', color: '#9A3412', fontSize: 11 }}>{b.name}</Text></View>)}
      {failed && <Text>Không tải được ảnh xem trước. Bạn có thể chọn lại ảnh.</Text>}
    </View>}
    {!!boxes.length && !failed && <Pressable accessibilityRole="button" onPress={() => setShowBoxes(v => !v)} style={{ paddingVertical: 12 }}><Text>{showBoxes ? 'Ẩn khung dấu hiệu' : 'Hiện khung dấu hiệu'}</Text></Pressable>}
  </View>;
}
const styles = StyleSheet.create({ card: { padding: 12, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, marginBottom: 12 }, title: { fontWeight: '700', marginBottom: 6 }, signs: { marginTop: 8, fontWeight: '600', color: '#9A3412' } });
