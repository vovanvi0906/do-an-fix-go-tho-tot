import React, { useEffect, useRef, useState } from 'react';
import { AppState, View, Text, TouchableOpacity, Modal, Image, Linking, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { orderService } from '../../../services/api/orderService';
import { deleteCaptureFile } from '../../face-verification/utils/captureFiles';
import { faceErrorMessage } from '../../face-verification/utils/faceErrors';

// Scene camera, never the face detector: the photo must show the work before repair.
export function BeforePhotoCapture({ orderId, enabled, onSaved, draft, onRejected }) {
  const camera = useRef(null), lock = useRef(false), alive = useRef(true), generation = useRef(0);
  const localDraft = useRef({ uri: null, url: null, error: '' });
  // The job owns this RAM-only draft so a refetch/proof refresh can remount the panel safely.
  // It contains scene media, never biometric proof, nonce or embedding.
  const captureDraft = draft || localDraft.current;
  const request = useRef(null);
  const allowed = useRef(enabled); allowed.current = enabled;
  const [permission, askPermission] = useCameraPermissions();
  const [visible, setVisible] = useState(false), [ready, setReady] = useState(false);
  const [uri, setUri] = useState(captureDraft.uri), [busy, setBusy] = useState(false);
  const [error, setError] = useState(captureDraft.error || '');
  useEffect(() => {
    alive.current = true;
    const listener = AppState.addEventListener('change', state => {
      if (state !== 'active') {
        generation.current++; setVisible(false); setReady(false); request.current?.abort();
      }
    });
    return () => {
      alive.current = false; generation.current++; listener.remove(); request.current?.abort();
      if (!draft) void deleteCaptureFile(captureDraft.uri);
    };
  }, [captureDraft, draft]);
  useEffect(() => { if (!enabled) { setVisible(false); setReady(false); } }, [enabled]);
  const take = async () => {
    if (lock.current || !allowed.current || !ready || !camera.current) return;
    const attempt = generation.current;
    lock.current = true; setBusy(true); setError(''); captureDraft.error = '';
    try {
      const photo = await camera.current.takePictureAsync({ quality: .85, skipProcessing: false });
      if (!alive.current || attempt !== generation.current || !allowed.current) {
        await deleteCaptureFile(photo?.uri); return;
      }
      if (!photo?.uri) throw new Error('CAMERA_CAPTURE_EMPTY');
      const previous = captureDraft.uri;
      captureDraft.uri = photo.uri; captureDraft.url = null;
      setUri(photo.uri); setVisible(false); setReady(false);
      void deleteCaptureFile(previous);
    } catch (_) {
      if (alive.current && attempt === generation.current) {
        captureDraft.error = 'Chưa chụp được ảnh BEFORE. Vui lòng thử lại.'; setError(captureDraft.error);
      }
    } finally { lock.current = false; if (alive.current) setBusy(false); }
  };
  const save = async () => {
    if (lock.current || !allowed.current || !captureDraft.uri) return;
    const attempt = generation.current;
    lock.current = true; setBusy(true); setError(''); captureDraft.error = '';
    const controller = new AbortController(); request.current = controller;
    const isCurrent = () => alive.current && attempt === generation.current && !controller.signal.aborted;
    try {
      if (!captureDraft.url) {
        const response = await orderService.uploadBeforeMedia(orderId, captureDraft.uri, controller.signal);
        if (!isCurrent()) return;
        const media = response.data || response;
        if (!media.url?.startsWith('https://')) throw new Error('Storage chưa xác nhận URL ảnh BEFORE.');
        captureDraft.url = media.url;
      }
      if (!isCurrent() || !allowed.current) return;
      const response = await orderService.uploadImage(orderId, { type: 'BEFORE', url: captureDraft.url }, controller.signal);
      if (!isCurrent()) return;
      if (!response.success || response.image?.orderId !== orderId || response.image.type !== 'BEFORE' ||
          response.image.url !== captureDraft.url)
        throw new Error('Máy chủ chưa xác nhận đã lưu ảnh BEFORE.');
      const previous = captureDraft.uri;
      captureDraft.uri = null; captureDraft.url = null; captureDraft.error = ''; setUri(null);
      void deleteCaptureFile(previous);
      await onSaved(); // Only a new backend snapshot may enable Start.
    } catch (error) {
      if (isCurrent()) {
        captureDraft.error = faceErrorMessage(error, error.message || 'Chưa lưu được ảnh BEFORE.');
        setError(`${captureDraft.error} Có thể thử lại hoặc tải lại trạng thái đơn.`);
        // An expired/revoked/foreign proof must not leave a stale enabled camera on screen.
        if ([400, 401, 403, 409].includes(error.status || error.response?.status))
          onRejected?.(captureDraft.error);
      }
    } finally { lock.current = false; if (alive.current) setBusy(false); }
  };
  return <View style={styles.panel} nativeID="worker-before-panel">
    <Text>Ảnh BEFORE — chụp hiện trạng trước khi làm việc.</Text>
    <TouchableOpacity nativeID="worker-before-open" disabled={!enabled || busy}
      onPress={() => { if (!allowed.current || lock.current) return; setReady(false); setError(''); setVisible(true); }} style={styles.button}>
      <Text>{uri ? 'Chụp lại ảnh BEFORE' : 'Chụp ảnh trước khi làm'}</Text>
    </TouchableOpacity>
    {uri ? <><Image source={{ uri }} style={styles.preview} />
      <TouchableOpacity nativeID="worker-before-save" disabled={!enabled || busy} onPress={save} style={styles.button}>
        <Text>{busy ? 'Đang lưu ảnh BEFORE…' : 'Lưu ảnh BEFORE'}</Text>
      </TouchableOpacity></> : null}
    {error ? <Text accessibilityRole="alert">{error}</Text> : null}
    <Modal visible={visible && enabled} onRequestClose={() => setVisible(false)}>
      <View style={styles.camera}>
        <TouchableOpacity onPress={() => setVisible(false)}><Text>Đóng camera BEFORE</Text></TouchableOpacity>
        {!permission?.granted ? <TouchableOpacity onPress={async () => {
          try { if (permission?.canAskAgain === false) await Linking.openSettings(); else await askPermission(); }
          catch (_) { setError('Chưa cấp được quyền camera.'); }
        }}><Text>{permission?.canAskAgain === false ? 'Mở cài đặt camera BEFORE' : 'Cho phép camera BEFORE'}</Text></TouchableOpacity> : visible && enabled ?
          <CameraView ref={camera} style={{ flex: 1 }} facing="back" mode="picture"
            onCameraReady={() => setReady(true)}
            onMountError={() => { setReady(false); setError('Không mở được camera BEFORE.'); }} /> : null}
        {error ? <Text accessibilityRole="alert">{error}</Text> : null}
        <TouchableOpacity nativeID="worker-before-shutter" disabled={!ready || busy || !enabled} onPress={take} style={styles.button}>
          <Text>Chụp BEFORE</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  </View>;
}
const styles = StyleSheet.create({
  panel: { gap: 12, padding: 16, backgroundColor: '#FFF', borderRadius: 12 },
  button: { padding: 16, backgroundColor: '#DBEAFE', borderRadius: 12 },
  preview: { width: '100%', height: 180, borderRadius: 12 },
  camera: { flex: 1, padding: 20, paddingTop: 48, backgroundColor: '#FFF', gap: 16 },
});
