// Memory only: never put credentials in routes or storage.
export function createRegistrationFlow() {
  let proof;
  let busy = false;
  return {
    clear() { proof = undefined; },
    verify(phone, response) {
      proof = undefined;
      const data = response?.data || response;
      if (data?.verified !== true || !data.registrationProof || !Number.isFinite(data.registrationProofExpiresIn) || data.registrationProofExpiresIn <= 0) throw new Error('Xác thực OTP không thành công.');
      proof = { phone, registrationProof: data.registrationProof, expiresAt: Date.now() + data.registrationProofExpiresIn * 1000 };
    },
    payload(phone) {
      if (!proof || proof.phone !== phone || Date.now() >= proof.expiresAt) {
        proof = undefined;
        throw Object.assign(new Error('Vui lòng xác thực OTP lại.'), { code: 'REGISTRATION_PROOF_INVALID' });
      }
      return { phone, registrationProof: proof.registrationProof };
    },
    async run(action) {
      if (busy) return;
      busy = true;
      try { return await action(); } finally { busy = false; }
    },
  };
}
let pendingSocial;
export const socialSignup = {
  set(provider, idToken) { pendingSocial = { provider, idToken, expiresAt: Date.now() + 600000 }; },
  get() { if (pendingSocial?.expiresAt <= Date.now()) pendingSocial = undefined; return pendingSocial; },
  clear() { pendingSocial = undefined; },
};
export const isProofInvalid = (error) => (error?.response?.data?.code || error?.code) === 'REGISTRATION_PROOF_INVALID';
