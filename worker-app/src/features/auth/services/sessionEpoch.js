// Identity changes invalidate all requests started by the previous session.
let epoch = 0;
let writes = Promise.resolve();
export const sessionEpoch = {
  current: () => epoch,
  begin: () => ++epoch,
  assert(value) {
    if (value !== epoch) throw new Error('Phiên đăng nhập đã thay đổi. Vui lòng thử lại.');
  },
  write(value, action) {
    const next = writes.catch(() => {}).then(async () => {
      sessionEpoch.assert(value);
      await action();
      sessionEpoch.assert(value);
    });
    writes = next;
    return next;
  },
};
