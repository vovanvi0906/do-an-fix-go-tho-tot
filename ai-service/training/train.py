"""
FixGo Pro - YOLOv8n-cls Training & Export Pipeline
Huấn luyện mô hình phân loại sự cố trên bộ dữ liệu FixGo-Cls 5 classes
Xuất file trọng số tối ưu về ai-service/weights/yolov8n-cls-fixgo.pt
"""

import os
import sys
import shutil
from pathlib import Path

# Đảm bảo UTF-8 cho Windows Console
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

from ultralytics import YOLO

BASE_DIR = Path(__file__).resolve().parent.parent
DATASET_DIR = BASE_DIR / "dataset"
WEIGHTS_DIR = BASE_DIR / "weights"
RUNS_DIR = BASE_DIR / "runs"


def train_model(epochs: int = 15, imgsz: int = 224, batch: int = 16, lr0: float = 0.01):
    print("=" * 70)
    print(" FIXGO PRO - YOLOV8 CLASSIFICATION TRAINING PIPELINE")
    print(f" Dataset: {DATASET_DIR}")
    print(f" Output Weights Dir: {WEIGHTS_DIR}")
    print(f" Config: Epochs={epochs}, ImageSize={imgsz}, Batch={batch}, LR0={lr0}")
    print("=" * 70)

    WEIGHTS_DIR.mkdir(parents=True, exist_ok=True)

    # 1. Khởi tạo pretrained model YOLOv8n-cls
    model_source = "yolov8n-cls.pt"
    if (WEIGHTS_DIR / "yolov8n-cls.pt").exists():
        model_source = str(WEIGHTS_DIR / "yolov8n-cls.pt")

    print(f"\n📦 [1/3] Nạp base model: {model_source}...")
    model = YOLO(model_source)

    # 2. Huấn luyện phân loại 5 classes trên dataset
    print(f"\n🔥 [2/3] Bắt đầu huấn luyện {epochs} epochs...")
    results = model.train(
        data=str(DATASET_DIR),
        epochs=epochs,
        imgsz=imgsz,
        batch=batch,
        lr0=lr0,
        project=str(RUNS_DIR / "classify"),
        name="fixgo_cls_v1",
        exist_ok=True,
        verbose=True,
        plots=True,
    )

    # 3. Xuất và lưu trữ model tốt nhất vào weights/
    best_pt = RUNS_DIR / "classify" / "fixgo_cls_v1" / "weights" / "best.pt"
    target_pt = WEIGHTS_DIR / "yolov8n-cls-fixgo.pt"

    if best_pt.exists():
        shutil.copy(str(best_pt), str(target_pt))
        print(f"\n✅ [3/3] Đã xuất trọng số tốt nhất về: {target_pt} ({target_pt.stat().st_size / 1024 / 1024:.2f} MB)")
    else:
        # Fallback lưu model trực tiếp
        model.save(str(target_pt))
        print(f"\n✅ [3/3] Đã lưu model về: {target_pt}")

    print("\n" + "=" * 70)
    print(" HUẤN LUYỆN HOÀN TẤT THÀNH CÔNG!")
    print(f" Model sẵn sàng phục vụ API tại: {target_pt}")
    print("=" * 70)


if __name__ == "__main__":
    epochs = int(sys.argv[1]) if len(sys.argv) > 1 else 10
    train_model(epochs=epochs)
