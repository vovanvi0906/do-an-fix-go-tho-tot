"""
FixGo Pro - Independent Model Evaluation & Error Analysis Suite
Đánh giá độ chính xác (Accuracy, Precision, Recall, F1) và tạo Ma trận Nhầm lẫn (Confusion Matrix)
trên tập kiểm thử độc lập (Test Split: 100 ảnh).
"""

import os
import sys
import json
import time
from pathlib import Path

# Đảm bảo UTF-8
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

import cv2
import numpy as np
from ultralytics import YOLO

BASE_DIR = Path(__file__).resolve().parent.parent
DATASET_DIR = BASE_DIR / "dataset"
WEIGHTS_DIR = BASE_DIR / "weights"
RESULTS_DIR = BASE_DIR / "eval" / "results"

CLASS_NAMES = ["dien_lanh", "other_unclear", "sua_dien", "sua_nuoc", "thiet_bi"]


def evaluate_test_set():
    print("=" * 70)
    print(" FIXGO PRO - INDEPENDENT CLASSIFICATION EVALUATION & ERROR ANALYSIS")
    print(f" Test Dataset: {DATASET_DIR / 'test'}")
    print("=" * 70)

    RESULTS_DIR.mkdir(parents=True, exist_ok=True)

    # Nạp mô hình đã train
    model_path = WEIGHTS_DIR / "yolov8n-cls-fixgo.pt"
    if not model_path.exists():
        model_path = WEIGHTS_DIR / "best.pt"
    if not model_path.exists():
        model_path = Path("yolov8n-cls.pt")

    print(f"\n📦 Nạp mô hình đánh giá: {model_path}...")
    model = YOLO(str(model_path))

    test_dir = DATASET_DIR / "test"
    if not test_dir.exists():
        print("❌ Chưa tìm thấy thư mục test! Vui lòng chạy training/prepare_dataset.py trước.")
        return

    y_true = []
    y_pred = []
    latencies = []
    misclassified_cases = []

    classes_found = sorted([d.name for d in test_dir.iterdir() if d.is_dir()])

    for cls_name in classes_found:
        cls_folder = test_dir / cls_name
        for img_path in cls_folder.glob("*.jpg"):
            t0 = time.time()
            results = model.predict(source=str(img_path), verbose=False)
            lat = (time.time() - t0) * 1000
            latencies.append(lat)

            if results and len(results) > 0:
                top1_idx = results[0].probs.top1
                pred_label = results[0].names[top1_idx]
                conf = float(results[0].probs.top1conf.item())

                y_true.append(cls_name)
                y_pred.append(pred_label)

                if cls_name != pred_label:
                    misclassified_cases.append({
                        "file": img_path.name,
                        "true_label": cls_name,
                        "pred_label": pred_label,
                        "confidence": round(conf, 3),
                    })

    # Tính toán các chỉ số
    total_samples = len(y_true)
    correct_samples = sum(1 for yt, yp in zip(y_true, y_pred) if yt == yp)
    accuracy = correct_samples / max(1, total_samples)
    avg_latency = np.mean(latencies) if latencies else 0.0

    print("\n" + "=" * 70)
    print(" 📊 KẾT QUẢ ĐÁNH GIÁ TRÊN TẬP TEST ĐỘC LẬP (100% UNSEEN SAMPLES):")
    print(f"  - Tổng số mẫu kiểm thử: {total_samples}")
    print(f"  - Số mẫu dự đoán chính xác: {correct_samples}/{total_samples}")
    print(f"  - Độ chính xác Top-1 Accuracy: {accuracy * 100:.2f}%")
    print(f"  - Thời gian xử lý trung bình (CPU Latency): {avg_latency:.2f} ms/ảnh")
    print("=" * 70)

    # Tính Precision & Recall từng class
    print("\n📋 CHI TIẾT THEO TỪNG CLASS SỰ CỐ:")
    print(f"{'Class Name':<16} | {'Samples':<8} | {'Precision':<10} | {'Recall':<10} | {'F1-Score':<10}")
    print("-" * 65)

    cls_metrics = {}
    for c in classes_found:
        tp = sum(1 for yt, yp in zip(y_true, y_pred) if yt == c and yp == c)
        fp = sum(1 for yt, yp in zip(y_true, y_pred) if yt != c and yp == c)
        fn = sum(1 for yt, yp in zip(y_true, y_pred) if yt == c and yp != c)
        n_samples = sum(1 for yt in y_true if yt == c)

        prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        rec = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = (2 * prec * rec) / (prec + rec) if (prec + rec) > 0 else 0.0

        cls_metrics[c] = {
            "samples": n_samples,
            "precision": round(prec, 3),
            "recall": round(rec, 3),
            "f1": round(f1, 3),
        }
        print(f"{c:<16} | {n_samples:<8} | {prec * 100:>8.1f}% | {rec * 100:>8.1f}% | {f1 * 100:>8.1f}%")

    # Phân tích ca dự đoán sai
    print(f"\n🔍 PHÂN TÍCH CÁC CA DỰ ĐOÁN SAI ({len(misclassified_cases)} ca):")
    if not misclassified_cases:
        print("  🎉 Hoàn hảo! Không có ca nào dự đoán sai trên tập test.")
    else:
        for mc in misclassified_cases[:5]:
            print(f"  - File: {mc['file']} | Nhãn thực: {mc['true_label']} -> AI đoán: {mc['pred_label']} (Conf: {mc['confidence'] * 100:.1f}%)")

    # Lưu báo cáo JSON
    report = {
        "model": str(model_path.name),
        "total_test_samples": total_samples,
        "accuracy_top1": round(accuracy, 4),
        "avg_latency_ms": round(avg_latency, 2),
        "class_metrics": cls_metrics,
        "misclassified_cases": misclassified_cases,
    }

    with open(RESULTS_DIR / "classification_test_report.json", "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    print(f"\n📁 Báo cáo đánh giá chi tiết đã lưu tại: {RESULTS_DIR / 'classification_test_report.json'}")


if __name__ == "__main__":
    evaluate_test_set()
