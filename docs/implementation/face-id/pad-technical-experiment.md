# Thử nghiệm kỹ thuật anti-spoof-mn3 — 2026-11-13

Trạng thái: **model chạy được; chưa chứng minh hiệu quả PAD tại FixGo**. Không sử dụng ảnh người, dữ liệu FixGo, database hay camera. Không cấp template/proof. Thử nghiệm được người dùng phê duyệt riêng, không mở rộng thành phê duyệt dữ liệu hoặc production.

## Provenance và license

Artifact duy nhất: OMZ `public/2022.1/anti-spoof-mn3/anti-spoof-mn3.onnx`, 12.270.179 byte. Kiểm SHA-384 upstream trước khi ghi; SHA-256 `c4c99af04603b62d7e44f6f4daeb33e0daeccc696008c0b1d62f6f5cebbb3262`. Descriptor pin commit `2c9b5c563ab3a202d085a42e2bbfc48f77961f4b`. Xem [manifest](pad-mn3-manifest.json), [metadata nguồn](pad-mn3-source-metadata.json) và [license hashes](pad-mn3-license-manifest.json).

[README OMZ tại commit đã pin](https://github.com/openvinotoolkit/open_model_zoo/blob/2c9b5c563ab3a202d085a42e2bbfc48f77961f4b/models/public/anti-spoof-mn3/README.md) nêu model gốc MIT; [descriptor](https://github.com/openvinotoolkit/open_model_zoo/blob/2c9b5c563ab3a202d085a42e2bbfc48f77961f4b/models/public/anti-spoof-mn3/model.yml) trỏ license training_extensions Apache-2.0. Đã giữ cả hai notice bên ngoài Git và hash chúng; không tự diễn giải thành quyền thương mại không giới hạn. Model được huấn luyện trên CelebA-Spoof; điều kiện dataset và khả năng tổng quát hóa vẫn cần đánh giá riêng. Không tải dataset. ACER do upstream công bố không phải kết quả FixGo.

Weights, IR, license texts và venv ở `/home/vanvi/.cache/fixgo-pad-mn3/`, ngoài Git. `pad-mn3-source-metadata.json` và runtime-package metadata là snapshot **trước phê duyệt tải**, giữ nguyên để truy vết; manifest và báo cáo này thể hiện trạng thái mới.

## Preprocessing, output và provider

`ai-service/pad_mn3.py` triển khai interface `PadProvider.assess`. Nhận crop BGR uint8 **đúng 128×128×3**; caller tương lai chịu trách nhiệm chọn crop/resize đã được đánh giá. Đổi RGB, float32, trừ mean `[151.2405,119.5950,107.8395]`, chia `[63.0105,56.4570,55.0035]`, NCHW `[1,3,128,128]`. Không tự phát hiện mặt, không dùng detection thay PAD. Unit test dùng kênh màu khác nhau để kiểm công thức; không thể nhận biết một ảnh RGB bị caller khai nhầm là BGR chỉ qua nội dung.

Output bắt buộc `[1,2]`, finite, mỗi giá trị trong [0,1], tổng xấp xỉ 1. Theo hợp đồng nguồn: **0=real, 1=spoof**; không suy diễn nhãn từ ảnh tổng hợp. Đây là score chưa hiệu chuẩn, chưa có ngưỡng quyết định FixGo. Version gồm SHA-256; measurement ghi preprocessing version và `evaluated=false`.

`measure()` chỉ dùng nghiên cứu. `assess()` luôn NOT_EVALUATED với output hợp lệ, INCONCLUSIVE khi lỗi; không bao giờ PASS/FAIL. Không có cờ mở khóa. Loader xác minh hash và parse chính bytes đã xác minh. Async timeout có giới hạn; timeout hủy request và đánh dấu provider không dùng lại, không tiêu thụ kết quả đến muộn. Đồng thời chỉ một request; busy từ chối an toàn. Constructor/config/dependency lỗi không tạo evidence thành công.

Provider hiện được tích hợp ở boundary Python và benchmark, **chưa gắn vào HTTP phục vụ người dùng**. `face_core.py`, YuNet/SFace, gateway Backend, enrollment/proof gate, Face Core v2/v3, FSM và Recommendation giữ nguyên. Identity MATCH vẫn không đồng nghĩa PAD PASS; không phát hành embedding enrollment qua gate chưa được đánh giá.

## Kết quả CPU thực đo

Intel i5-13420H, host 12 logical CPU. Container Python 3.11, image digest `sha256:07d4824036af339fa1b6ef769cc99d9c10a141769538b52b3b597c84f7a7b535`, giới hạn `--cpus 2 --memory 1g --network none`; mount source read-only. Dependency cài vào venv riêng, không sửa AI Service đang chạy. Có openvino-telemetry dependency nhưng container inference không có egress. [Lock dependencies](pad-mn3-requirements.lock); venv 424 MiB, bao gồm ONNX Runtime chỉ dùng đối chiếu. Không phải footprint deploy tối thiểu. [Manifest SHA-256 của weights, IR và 11 wheel](pad-mn3-artifacts-sha256.json) giữ ngoài Git các binary; wheel OpenVINO đã đối chiếu đúng SHA-256 package metadata đã pin.

Sáu pattern không sinh trắc: đen, trắng, màu BGR bất đối xứng, nhiễu seed42, gradient, checkerboard. Mỗi cấu hình warmup10, đo100 lần, batch1, stream1, FP32. Đơn vị ms:

| Threads | Load + compile | p50 | p95 |
|---|---:|---:|---:|
| 1 | 243,97 | 2,83 | 4,27 |
| 2 | 243,64 | 2,25 | 3,86 |
| 4 | 217,81 | 2,74 | 9,34 |

Thời gian gồm kiểm input, preprocessing, async inference và kiểm output. Không gồm decode/resize/detection/SFace/PAD crop selection/network/DB. 4 thread chạy trong quota2 CPU nên có oversubscription. Peak RSS của **toàn tiến trình đối chiếu nhiều runtime/model** 379.220 KiB, không phải RSS provider đơn lẻ. Kết quả phụ thuộc tải host, chưa phải SLA. Xem [JSON thực đo](pad-mn3-benchmark.json).

ONNX Runtime CPU so với IR OpenVINO FP32 có preprocessing tường minh: max absolute difference **5,364418×10⁻⁷**. IR riêng nhận BGR uint8 NHWC và bake RGB/normalization/layout bằng PrePostProcessor: **4,172325×10⁻⁷**. Cả sáu input đều output hợp lệ; tolerance kỹ thuật 1e-4. IR không nén FP16; không khẳng định giống bit hay parity trên dữ liệu người. IR BGR là conversion bằng API hiện hành, không phải artifact IR upstream.

## Tests đã chạy

- 11 Python tests PASS (9 provider mới + 2 contract): missing model, checksum mismatch, công thức kênh màu, profile/dtype/shape sai, NaN/Inf/shape/range/sum output sai, timeout và late-result rejection, busy, technical exception, score cực trị cũng không authorize. Error paths dùng mocks, **không phải metric PAD**.
- Benchmark thực: ONNX Runtime + hai IR OpenVINO, 6 input tổng hợp; 300 lần đo provider sau warmup; assert parity và NOT_EVALUATED.
- Backend regression: 42 tests / 3 suites PASS (`face-live-contract face-template face-security`). Không chạy PostgreSQL tests lại vì không thay backend/schema; không thực hiện migration nào.

Chạy lại (cache/venv đã thiết lập):

```sh
docker run --rm --network none --cpus 2 --memory 1g -e PYTHONDONTWRITEBYTECODE=1 \
  -v /home/vanvi/.cache/fixgo-pad-mn3:/experiment \
  -v /home/vanvi/Work/fixgo-codex/ai-service:/app:ro python:3.11-slim \
  /experiment/venv/bin/python /app/eval/benchmark_pad_mn3.py /experiment
```

## Giới hạn và bước cần duyệt

Chưa có FMR/FNMR/TAR/APCER/BPCER thực đo, chưa có bằng chứng chống print/screen/video replay trên Android, chưa chọn ngưỡng hoặc crop policy, chưa đánh giá camera injection/deepfake/mask hay fairness. Không dùng input tổng hợp làm bằng chứng real/spoof. Chưa bật chuỗi thành công. [Dự thảo consent/pilot](consent-and-android-pilot-draft.md) cần duyệt riêng trước tuyển người, thu ảnh, tạo template hoặc chạy phiên đánh giá có người. Chỉ sau đánh giá chấp nhận được mới đề xuất gate/version/policy và pilot proof trên DB cô lập; production và migration vẫn cần phê duyệt khác.
