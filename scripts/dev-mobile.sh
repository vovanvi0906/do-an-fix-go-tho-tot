#!/usr/bin/env bash
set -euo pipefail
case "${1:-}" in
  customer) app=customer-app; port=8081 ;;
  worker) app=worker-app; port=8082 ;;
  --help|-h) echo 'Dùng: bash scripts/dev-mobile.sh customer|worker (mỗi app một terminal, USB + adb reverse).'; exit 0 ;;
  *) echo 'Dùng: bash scripts/dev-mobile.sh customer|worker' >&2; exit 2 ;;
esac
[[ $# == 1 ]] || { echo 'Không nhận thêm tham số; cổng cố định theo app.' >&2; exit 2; }
root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
cd "$root/$app"
[[ -x node_modules/.bin/expo ]] || { echo 'Chưa có Expo local; cài dependencies của app trước.' >&2; exit 1; }
# Kiểm tra trước để trả mã lỗi rõ khi cổng đã bận; CI vẫn chặn race đổi cổng.
node - "$port" <<'JS'
const net = require('node:net');
const port = Number(process.argv[2]);
const server = net.createServer();
server.once('error', (error) => {
  console.error(`Không thể dùng cổng Metro ${port}: ${error.code}. Dừng đúng tiến trình đang giữ cổng rồi chạy lại.`);
  process.exit(1);
});
server.listen(port, '0.0.0.0', () => server.close());
JS
# Chỉ áp dụng cho tiến trình này, ưu tiên hơn mọi .env; không ghi cấu hình release.
export EXPO_PUBLIC_API_URL=http://127.0.0.1:3000/api
export EXPO_PUBLIC_SOCKET_URL=http://127.0.0.1:3000
export NODE_ENV=development
export CI=1
# Expo CI mode từ chối cổng bận thay vì hỏi/chọn cổng khác.
echo "$app: API=$EXPO_PUBLIC_API_URL; Socket=$EXPO_PUBLIC_SOCKET_URL; Metro=127.0.0.1:$port"
echo 'Mở Dev Client tương ứng, nhập http://127.0.0.1:'"$port"'. Ctrl+C để dừng Metro này.'
exec node_modules/.bin/expo start --dev-client --localhost --port "$port"
