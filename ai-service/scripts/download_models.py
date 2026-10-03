"""
FixGo Pro - AI Model Weights Downloader
Tải các trọng số mô hình thị giác máy tính siêu nhẹ (chạy CPU laptop) về thư mục weights/
- YOLOv8n (Object Detection & Incident Diagnosis): ~6.2 MB
- YuNet (Face Detection ONNX): ~336 KB
- SFace (Face Recognition & Embeddings ONNX): ~1.28 MB
"""

import os
import sys
import shutil
import requests
from pathlib import Path

# Đảm bảo in tiếng Việt không lỗi trên Windows Console (cp1252)
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

BASE_DIR = Path(__file__).resolve().parent.parent
WEIGHTS_DIR = BASE_DIR / "weights"

MODELS = {
    "yolov8n.pt": {
        "url": "https://github.com/ultralytics/assets/releases/download/v8.3.0/yolov8n.pt",
        "description": "YOLOv8 Nano (Pretrained COCO for Appliance & Object Detection)",
        "expected_min_size": 5_000_000,  # ~6.2 MB
    },
    "face_detection_yunet_2023mar.onnx": {
        "url": "https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx",
        "description": "OpenCV YuNet Face Detector (Ultra-fast ONNX)",
        "expected_min_size": 300_000,  # ~336 KB
    },
    "face_recognition_sface_2021dec.onnx": {
        "url": "https://github.com/opencv/opencv_zoo/raw/main/models/face_recognition_sface/face_recognition_sface_2021dec.onnx",
        "description": "OpenCV SFace Face Feature Extractor (128-D Cosine Embeddings)",
        "expected_min_size": 1_000_000,  # ~1.28 MB
    },
}


def download_file(url: str, dest_path: Path, desc: str, min_size: int) -> bool:
    if dest_path.exists() and dest_path.stat().st_size >= min_size:
        print(f"  [OK] Đã tồn tại: {dest_path.name} ({dest_path.stat().st_size / 1024 / 1024:.2f} MB)")
        return True

    print(f"  [DOWNLOAD] Đang tải {dest_path.name} ({desc})...")
    try:
        response = requests.get(url, stream=True, timeout=60)
        response.raise_for_status()
        total_length = int(response.headers.get("content-length", 0))

        temp_path = dest_path.with_suffix(".tmp")
        with open(temp_path, "wb") as f:
            downloaded = 0
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
                    downloaded += len(chunk)
                    if total_length > 0:
                        percent = (downloaded / total_length) * 100
                        sys.stdout.write(f"\r    Tiến trình: {percent:.1f}% ({downloaded / 1024 / 1024:.2f} MB)")
                        sys.stdout.flush()

        sys.stdout.write("\n")
        temp_path.replace(dest_path)
        print(f"  [SUCCESS] Đã lưu thành công: {dest_path.name}")
        return True
    except Exception as e:
        print(f"  [ERROR] Lỗi khi tải {dest_path.name}: {e}")
        # Fallback đặc biệt cho YOLOv8: dùng ultralytics native download nếu tải qua url lỗi
        if "yolov8" in dest_path.name:
            try:
                print("  [FALLBACK] Đang thử tải YOLOv8 qua thư viện Ultralytics...")
                from ultralytics import YOLO
                model = YOLO("yolov8n.pt")
                # copy file yolov8n.pt vừa được ultralytics tải vào weights/
                downloaded_file = Path("yolov8n.pt")
                if downloaded_file.exists():
                    shutil.move(str(downloaded_file), str(dest_path))
                    print(f"  [SUCCESS] Đã chuyển yolov8n.pt vào {dest_path}")
                    return True
            except Exception as fallback_err:
                print(f"  [ERROR] Fallback YOLOv8 thất bại: {fallback_err}")
        return False


def main():
    print("=" * 65)
    print(" FIXGO PRO - AI MODEL WEIGHTS DOWNLOADER")
    print(f" Thư mục đích: {WEIGHTS_DIR}")
    print("=" * 65)

    WEIGHTS_DIR.mkdir(parents=True, exist_ok=True)

    success_count = 0
    for filename, info in MODELS.items():
        dest = WEIGHTS_DIR / filename
        if download_file(info["url"], dest, info["description"], info["expected_min_size"]):
            success_count += 1

    print("\n" + "=" * 65)
    print(f" Kết quả: {success_count}/{len(MODELS)} mô hình đã sẵn sàng trong thư mục weights/")
    print("=" * 65)


if __name__ == "__main__":
    main()
