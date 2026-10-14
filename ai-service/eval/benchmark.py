"""
FixGo Pro - AI Computer Vision Evaluation & Benchmark Suite
Đo đạc độ chính xác, thời gian phản hồi (Latency ms) và xác nhận trạng thái model/heuristic của AI Microservice.
"""

import os
import sys
import time
import json
from pathlib import Path

# Đảm bảo UTF-8 cho Windows Console
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

import requests
import numpy as np

try:
    import cv2
    HAS_CV2 = True
except Exception:
    HAS_CV2 = False

BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

EVAL_DIR = BASE_DIR / "eval"
IMAGES_DIR = EVAL_DIR / "images"
RESULTS_DIR = EVAL_DIR / "results"
AI_URL = os.environ.get("AI_SERVICE_URL", "http://localhost:8000")


def create_sample_images():
    """Tạo một số ảnh mẫu tổng hợp để chạy bài test thị giác máy tính"""
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)

    if not HAS_CV2:
        return

    # 1. Ảnh mẫu đồ gia dụng / điện lạnh (Mô phỏng tủ lạnh / lò vi sóng)
    appliance_img = np.ones((300, 300, 3), dtype=np.uint8) * 220
    # Thân tủ lạnh
    cv2.rectangle(appliance_img, (50, 40), (250, 260), (180, 180, 180), -1)
    cv2.line(appliance_img, (50, 140), (250, 140), (100, 100, 100), 2)
    cv2.rectangle(appliance_img, (230, 70), (240, 110), (50, 50, 50), -1)
    cv2.imwrite(str(IMAGES_DIR / "sample_appliance.jpg"), appliance_img)

    # 2. Cặp ảnh BEFORE và AFTER (mô phỏng bảng điện / đường ống có nền góc cạnh rõ ràng)
    # Tạo nền chung có nhiều góc cạnh cố định để ORB RANSAC căn chỉnh
    base_bg = np.ones((400, 400, 3), dtype=np.uint8) * 210
    # Vẽ các linh kiện xung quanh cố định
    for x in range(30, 380, 50):
        for y in range(30, 380, 50):
            cv2.rectangle(base_bg, (x, y), (x + 20, y + 20), (140, 140, 140), -1)
            cv2.circle(base_bg, (x + 10, y + 10), 4, (80, 80, 80), -1)
    cv2.putText(base_bg, "FIXGO PANEL 2026", (40, 370), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (40, 40, 40), 2)

    # Ảnh Before: Có vùng cháy đen / hỏng hóc ở trung tâm (150, 150) -> (250, 250)
    before_img = base_bg.copy()
    cv2.circle(before_img, (200, 200), 45, (30, 30, 30), -1)  # Vết cháy đen
    cv2.line(before_img, (170, 170), (230, 230), (0, 0, 200), 3)  # Dây đứt
    cv2.imwrite(str(IMAGES_DIR / "sample_before.jpg"), before_img)

    # Ảnh After: Đã thay linh kiện mới, dây đấu nối sạch sẽ
    after_img = base_bg.copy()
    cv2.rectangle(after_img, (165, 165), (235, 235), (240, 240, 240), -1)  # Aptomat mới
    cv2.rectangle(after_img, (165, 165), (235, 235), (50, 50, 50), 2)
    cv2.line(after_img, (175, 175), (225, 225), (40, 180, 40), 3)  # Dây mới màu xanh
    cv2.imwrite(str(IMAGES_DIR / "sample_after.jpg"), after_img)

    # Ảnh Khác góc chụp / Khác đối tượng (để test fail-safe khác góc)
    diff_angle_img = np.ones((400, 400, 3), dtype=np.uint8) * 100
    cv2.circle(diff_angle_img, (200, 200), 80, (200, 100, 50), -1)
    cv2.imwrite(str(IMAGES_DIR / "sample_diff_angle.jpg"), diff_angle_img)

    # 3. Ảnh giả lập khuôn mặt đơn giản
    face_img = np.ones((320, 320, 3), dtype=np.uint8) * 230
    cv2.ellipse(face_img, (160, 160), (70, 95), 0, 0, 360, (180, 200, 240), -1)  # Mặt
    cv2.circle(face_img, (135, 135), 8, (50, 50, 50), -1)  # Mắt trái
    cv2.circle(face_img, (185, 135), 8, (50, 50, 50), -1)  # Mắt phải
    cv2.line(face_img, (160, 150), (160, 175), (50, 50, 50), 2)  # Mũi
    cv2.ellipse(face_img, (160, 200), (25, 12), 0, 0, 180, (50, 50, 50), 2)  # Miệng
    cv2.imwrite(str(IMAGES_DIR / "sample_face.jpg"), face_img)


def run_benchmark():
    print("=" * 70)
    print(f" FIXGO PRO - AI COMPUTER VISION BENCHMARK & EVALUATION SUITE")
    print(f" Target Service: {AI_URL}")
    print("=" * 70)

    create_sample_images()

    # Kiểm tra kết nối Live URL, nếu không có thì dùng FastAPI TestClient
    use_live = False
    try:
        r = requests.get(f"{AI_URL}/health", timeout=2)
        if r.status_code == 200 and r.json().get("version") == "2.0.0":
            use_live = True
            print("  🌐 Đang kết nối tới LIVE AI Service v2.0 trên cổng 8000.")
    except Exception:
        pass

    from fastapi.testclient import TestClient
    from main import app

    def run_tests_with_client(client, is_live_conn):
        def do_get(endpoint):
            if is_live_conn:
                return requests.get(f"{AI_URL}{endpoint}", timeout=5)
            return client.get(endpoint)

        def do_post(endpoint, files=None, data=None, json_body=None):
            if is_live_conn:
                return requests.post(f"{AI_URL}{endpoint}", files=files, data=data, json=json_body, timeout=10)
            return client.post(endpoint, files=files, data=data, json=json_body)

        results = {
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "target_url": AI_URL if is_live_conn else "In-Process TestClient (Lifespan Enabled)",
            "tests": [],
        }

        # TEST 1: Health Check & Model Lifespan Verification
        print("\n🔍 [Test 1] Kiểm tra trạng thái Service & Nạp Lifespan Models (/health)...")
        try:
            t0 = time.time()
            res = do_get("/health")
            latency = (time.time() - t0) * 1000
            health_data = res.json()
            print(f"  Status Code: {res.status_code} ({latency:.1f}ms)")
            print(f"  Trạng thái: {health_data.get('status')}")
            print(f"  Engine: {health_data.get('engine')}")
            print(f"  Models nạp trong RAM: {health_data.get('models_loaded')}")
            print(f"  Weights sẵn sàng: {health_data.get('weights_available')}")

            results["tests"].append({
                "name": "Health Check & Lifespan Models",
                "passed": res.status_code == 200 and health_data.get("status") == "online",
                "latency_ms": round(latency, 2),
                "data": health_data,
            })
        except Exception as e:
            print(f"  ❌ Lỗi kết nối tới /health: {e}")
            return results

        # TEST 2: Endpoint /ai/diagnose (Tải ảnh thật qua YOLOv8n)
        print("\n🔍 [Test 2] Đánh giá Endpoint Chẩn đoán sự cố (/ai/diagnose)...")
        appliance_path = IMAGES_DIR / "sample_appliance.jpg"
        try:
            t0 = time.time()
            with open(appliance_path, "rb") as f:
                res = do_post(
                    "/ai/diagnose",
                    files={"file": ("sample_appliance.jpg", f.read(), "image/jpeg")},
                    data={"description": "Tủ lạnh gia đình bị hỏng mạch điện"},
                )
            latency = (time.time() - t0) * 1000
            diag_data = res.json()
            print(f"  Status Code: {res.status_code} ({latency:.1f}ms)")
            print(f"  Engine sử dụng: {diag_data.get('engine')}")
            print(f"  Category đề xuất: {diag_data.get('suggestedCategoryName')} ({diag_data.get('suggestedCategoryId')})")
            print(f"  Độ tin cậy: {diag_data.get('confidence')}")
            print(f"  Nhãn phát hiện: {diag_data.get('detectedLabels')}")

            results["tests"].append({
                "name": "AI Diagnose (YOLOv8 & Heuristic)",
                "passed": res.status_code == 200 and diag_data.get("confidence", 0) >= 0.6,
                "latency_ms": round(latency, 2),
                "engine": diag_data.get("engine"),
                "data": diag_data,
            })
        except Exception as e:
            print(f"  ❌ Lỗi Test 2: {e}")

        # TEST 3: Endpoint /ai/compare-before-after (Thuần OpenCV ORB + RANSAC + Diff Analysis)
        print("\n🔍 [Test 3] Đánh giá So sánh nghiệm thu Before-After (/ai/compare-before-after)...")
        before_path = IMAGES_DIR / "sample_before.jpg"
        after_path = IMAGES_DIR / "sample_after.jpg"
        diff_angle_path = IMAGES_DIR / "sample_diff_angle.jpg"

        # Case 3.1: Ca sửa chữa hợp lệ (Cùng góc chụp + Có sửa chữa + Sạch sẽ)
        print("  🔹 [Case 3.1] Ca sửa chữa hợp lệ (Cùng góc chụp + Có sửa đổi tích cực):")
        try:
            t0 = time.time()
            with open(before_path, "rb") as fb, open(after_path, "rb") as fa:
                res = do_post(
                    "/ai/compare-before-after",
                    files={
                        "beforeFile": ("before.jpg", fb.read(), "image/jpeg"),
                        "afterFile": ("after.jpg", fa.read(), "image/jpeg"),
                    },
                )
            latency = (time.time() - t0) * 1000
            cmp_data = res.json()
            print(f"    Status: {res.status_code} ({latency:.1f}ms) | Engine: {cmp_data.get('engine')}")
            print(f"    Điểm Match Score: {cmp_data.get('matchScore')} | Nghiệm thu Đạt: {cmp_data.get('passed')}")
            print(f"    ORB Inliers: {cmp_data.get('inliersCount')} | Điểm Căn chỉnh: {cmp_data.get('alignmentScore')}")
            print(f"    Tỷ lệ thay đổi (Diff Ratio): {cmp_data.get('diffRatio')} | SSIM: {cmp_data.get('ssimScore')}")
            print(f"    Điểm Sạch sẽ (Cleanliness): {cmp_data.get('cleanlinessScore')}")
            print(f"    Giải thích: {cmp_data.get('notes')}")

            results["tests"].append({
                "name": "AI Compare - Valid Repair Case",
                "passed": res.status_code == 200 and cmp_data.get("passed") is True,
                "latency_ms": round(latency, 2),
                "engine": cmp_data.get("engine"),
                "data": cmp_data,
            })
        except Exception as e:
            print(f"    ❌ Lỗi Case 3.1: {e}")

        # Case 3.2: Ca khác góc chụp / Không cùng đối tượng (Ít điểm khớp -> passed: False)
        print("  🔹 [Case 3.2] Ca khác góc chụp / Khác đối tượng (ORB Inliers < 10):")
        try:
            with open(before_path, "rb") as fb, open(diff_angle_path, "rb") as fa:
                res = do_post(
                    "/ai/compare-before-after",
                    files={
                        "beforeFile": ("before.jpg", fb.read(), "image/jpeg"),
                        "afterFile": ("diff_angle.jpg", fa.read(), "image/jpeg"),
                    },
                )
            cmp_diff = res.json()
            print(f"    Nghiệm thu Đạt: {cmp_diff.get('passed')} (Kỳ vọng: False)")
            print(f"    ORB Inliers: {cmp_diff.get('inliersCount')} | Giải thích: {cmp_diff.get('notes')}")
            results["tests"].append({
                "name": "AI Compare - Different Angle Fail-Safe",
                "passed": res.status_code == 200 and cmp_diff.get("passed") is False,
                "engine": cmp_diff.get("engine"),
                "data": cmp_diff,
            })
        except Exception as e:
            print(f"    ❌ Lỗi Case 3.2: {e}")

        # Case 3.3: Ca gian lận tải trùng ảnh (Chưa sửa gì -> SSIM cao -> passed: False)
        print("  🔹 [Case 3.3] Ca tải trùng 1 ảnh (Chưa sửa gì / SSIM cao):")
        try:
            with open(before_path, "rb") as fb1, open(before_path, "rb") as fb2:
                res = do_post(
                    "/ai/compare-before-after",
                    files={
                        "beforeFile": ("before1.jpg", fb1.read(), "image/jpeg"),
                        "afterFile": ("before2.jpg", fb2.read(), "image/jpeg"),
                    },
                )
            cmp_same = res.json()
            print(f"    Nghiệm thu Đạt: {cmp_same.get('passed')} (Kỳ vọng: False)")
            print(f"    SSIM: {cmp_same.get('ssimScore')} | Giải thích: {cmp_same.get('notes')}")
            results["tests"].append({
                "name": "AI Compare - Identical Image Fail-Safe",
                "passed": res.status_code == 200 and cmp_same.get("passed") is False,
                "engine": cmp_same.get("engine"),
                "data": cmp_same,
            })
        except Exception as e:
            print(f"    ❌ Lỗi Case 3.3: {e}")

        # TEST 4: Endpoint /ai/face-verify (OpenCV YuNet & SFace)
        print("\n🔍 [Test 4] Đánh giá Xác thực sinh trắc học khuôn mặt (/ai/face-verify)...")
        face_path = IMAGES_DIR / "sample_face.jpg"
        try:
            t0 = time.time()
            with open(face_path, "rb") as f:
                res = do_post(
                    "/ai/face-verify",
                    files={"file": ("face.jpg", f.read(), "image/jpeg")},
                    data={"workerId": "worker-demo-001"},
                )
            latency = (time.time() - t0) * 1000
            face_data = res.json()
            print(f"  Status Code: {res.status_code} ({latency:.1f}ms)")
            print(f"  Engine sử dụng: {face_data.get('engine')}")
            print(f"  Kết quả xác thực: {face_data.get('verified')}")
            print(f"  Độ tin cậy: {face_data.get('confidence')}")
            print(f"  Thông điệp: {face_data.get('message')}")

            results["tests"].append({
                "name": "AI Face Verification (OpenCV YuNet/SFace)",
                "passed": res.status_code == 200 and "verified" in face_data,
                "latency_ms": round(latency, 2),
                "engine": face_data.get("engine"),
                "data": face_data,
            })
        except Exception as e:
            print(f"  ❌ Lỗi Test 4: {e}")

        return results

    if use_live:
        results = run_tests_with_client(None, True)
    else:
        print("  ⚡ Chạy trực tiếp với Lifespan Context Manager trong process...")
        with TestClient(app) as test_client:
            results = run_tests_with_client(test_client, False)

    # Ghi báo cáo JSON
    report_file = RESULTS_DIR / "benchmark_report.json"
    with open(report_file, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print("\n" + "=" * 70)
    passed_count = sum(1 for t in results["tests"] if t.get("passed"))
    print(f" TỔNG KẾT BENCHMARK: {passed_count}/{len(results['tests'])} bài kiểm thử thành công")
    print(f" Báo cáo chi tiết đã lưu tại: {report_file}")
    print("=" * 70)


if __name__ == "__main__":
    run_benchmark()

