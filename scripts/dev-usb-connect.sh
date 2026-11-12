#!/usr/bin/env bash
set -euo pipefail
usage() {
  echo 'Dùng: bash scripts/dev-usb-connect.sh [--device SERIAL] [--help]'
  echo 'Reverse 3000/8081/8082, giữ nguyên các mapping khác; không chạy backend/build.'
}
serial=''
while (($#)); do
  case "$1" in
    --help|-h) usage; exit 0 ;;
    --device) [[ $# -ge 2 && -n "$2" && "$2" != -* ]] || { usage >&2; exit 2; }; serial=$2; shift 2 ;;
    *) usage >&2; exit 2 ;;
  esac
done
adb=''
if [[ -n ${ANDROID_HOME:-} && -x "$ANDROID_HOME/platform-tools/adb" ]] && "$ANDROID_HOME/platform-tools/adb" version >/dev/null 2>&1; then
  adb="$ANDROID_HOME/platform-tools/adb"
elif command -v adb >/dev/null 2>&1 && adb version >/dev/null 2>&1; then
  adb=$(command -v adb)
else
  echo 'Không tìm thấy ADB hợp lệ. Đặt ANDROID_HOME tới Android SDK hoặc cài platform-tools vào PATH.' >&2
  exit 1
fi
echo "ADB: $adb"
"$adb" start-server
listing=$("$adb" devices -l)
printf '%s\n' "$listing"
if [[ "$listing" == *unauthorized* ]]; then echo 'Thiết bị unauthorized: mở khóa điện thoại và chấp nhận Allow USB debugging.' >&2; fi
if [[ "$listing" == *offline* ]]; then echo 'Thiết bị offline: cắm lại cáp, bật lại USB debugging rồi thử lại.' >&2; fi
mapfile -t devices < <(awk '$2 == "device" {print $1}' <<< "$listing")
if [[ -z "$serial" ]]; then
  case ${#devices[@]} in
    0) echo 'Không có thiết bị sẵn sàng. Kiểm tra cáp dữ liệu, USB debugging và quyền udev (không mặc định dùng sudo).' >&2; exit 1 ;;
    1) serial=${devices[0]} ;;
    *)
      if [[ ! -t 0 ]]; then echo 'Có nhiều thiết bị: truyền --device SERIAL.' >&2; exit 1; fi
      PS3='Chọn số thiết bị: '
      select serial in "${devices[@]}"; do [[ -n "$serial" ]] && break; done
      ;;
  esac
fi
found=false
for candidate in "${devices[@]}"; do [[ "$candidate" != "$serial" ]] || found=true; done
if [[ "$found" != true ]]; then echo "Thiết bị $serial chưa sẵn sàng/không kết nối; xem trạng thái ở trên." >&2; exit 1; fi
for port in 3000 8081 8082; do "$adb" -s "$serial" reverse "tcp:$port" "tcp:$port"; done
mappings=$("$adb" -s "$serial" reverse --list)
printf '%s\n' "$mappings"
for port in 3000 8081 8082; do
  if ! awk -v p="tcp:$port" '$2 == p && $3 == p {ok=1} END {exit !ok}' <<< "$mappings"; then
    echo "Không xác minh được reverse cổng $port." >&2; exit 1
  fi
done
echo "ADB Reverse sẵn sàng trên $serial."
if ! command -v curl >/dev/null 2>&1; then
  echo 'Chưa kiểm tra backend: cần cài curl.' >&2
elif code=$(curl --noproxy '*' --silent --show-error --output /dev/null --write-out '%{http_code}' --max-time 5 http://127.0.0.1:3000) && [[ "$code" =~ ^[1-5][0-9][0-9]$ ]]; then
  echo "Cổng backend phản hồi HTTP $code (kể cả 404); chưa xác minh API/DB."
else
  echo 'ADB Reverse thành công; backend chưa phản hồi HTTP. Kiểm tra cấu hình DB/Redis rồi tự chạy backend.' >&2
fi
