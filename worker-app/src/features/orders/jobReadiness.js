import { isCurrentFaceProof } from '../face-verification/services/proof';

// Display only. The backend checks the proof again on both BEFORE persistence and Start.
export function jobReadiness(order, face, now = Date.now()) {
  const arrival = order?.statusHistory?.filter(item => item.status === 'ARRIVED')
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))[0];
  const hasBefore = !!arrival && !!order?.images?.some(image => image.type === 'BEFORE' &&
    Number.isFinite(Date.parse(image.uploadedAt)) && Date.parse(image.uploadedAt) >= Date.parse(arrival.createdAt));
  const proofValid = order?.status === 'ARRIVED' && face?.canUseOrderProof === true &&
    isCurrentFaceProof(face.orderProof, 'ORDER', order.id, now);
  return { hasBefore, proofValid,
    step: order?.status !== 'ARRIVED' ? 'WORK' : !proofValid ? 'FACE' : !hasBefore ? 'BEFORE' : 'START' };
}
