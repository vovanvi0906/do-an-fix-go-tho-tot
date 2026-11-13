# Giới hạn Kỹ thuật và Định hướng Phát triển (Limitations & Future Roadmap)

## 1. Các Giới hạn Kỹ thuật Hiện tại (Current Limitations)

1. **Dữ liệu Huấn luyện Thiếu Ảnh Thực địa (Domain Gap)**:
   - Dữ liệu lịch sử 1.200 ảnh là dữ liệu tổng hợp bằng script. Hiện tại hệ thống vận hành dựa trên mô hình zero-shot pretrained (CLIP ViT-B/32) kết hợp với bộ prompts chuẩn hóa từ cơ sở dữ liệu.
   - Chưa có bộ dữ liệu ảnh chụp điện thoại thực tế quy mô lớn của các hộ gia đình Việt Nam trong nhiều điều kiện ánh sáng và góc chụp khác nhau.

2. **Chưa có Bounding Box Detection**:
   - Hệ thống hiện phân tích toàn bộ khung hình ảnh (`whole-image feature vector`) và dựa vào cơ chế tương tác người dùng (Human-in-the-loop candidate selection) để xử lý ảnh có nhiều thiết bị.
   - Chưa tích hợp mô hình Object Detection (YOLOv8-detect) để cắt vùng quan tâm (ROI crop). Việc này là chủ ý kỹ thuật để tránh tăng chi phí tính toán khi chưa có benchmark chứng minh sự vượt trội.

3. **Phụ thuộc Kết nối Mạng (Cloud Inference)**:
   - Toàn bộ pipeline phân tích ảnh Deep Learning chạy trên FastAPI backend. Ứng dụng di động không hỗ trợ suy luận offline trực tiếp trên thiết bị (On-device Edge AI).

4. **Bản chất của Sự cố Ẩn (Hidden Faults)**:
   - Các sự cố hỏng hóc bên trong (ví dụ: đứt ngầm dây điện, cháy cuộn dây motor máy bơm, rò rỉ gas máy lạnh) không thể phát hiện chỉ qua hình ảnh chụp bên ngoài thiết bị.
   - Hệ thống không thể và không được phép tự bịa ra nguyên nhân hư hỏng ẩn. Việc kiểm tra và báo giá chính thức bắt buộc phải do thợ thực địa tiến hành trực tiếp.

5. **Cấu hình Trọng số và Ngưỡng là Baseline Chưa Hiệu chuẩn (Uncalibrated Baseline)**:
   - Các tham số ensemble ($w_{\text{clip}}=0.6, w_{\text{yolo}}=0.4$, hệ số prior từ khóa $1.8$, ngưỡng tin cậy $0.48$, margin cách biệt $0.10$, ngưỡng tương đồng cosine tối thiểu $0.20$) hiện được cố định như một cấu hình cơ sở (baseline).
   - Các trọng số này được thiết kế để bảo đảm tính ổn định cấu trúc và khả năng từ chối ảnh lạ (OOD), chưa qua quá trình hiệu chuẩn thống kê (Platt scaling / Isotonic regression) trên tập dữ liệu thực địa độc lập.
   - Không được tiếp tục tinh chỉnh ad-hoc dựa trên một vài ảnh mẫu đơn lẻ khi chưa có test set thực nghiệm chuẩn hóa.

## 2. Định hướng Phát triển (Roadmap)

1. **Thu thập Dữ liệu Thực tế**:
   - Xây dựng quy trình thu thập ảnh sự cố từ đơn hàng thực tế của khách hàng (có thỏa thuận bảo mật và đồng ý của người dùng).
   - Tổ chức gán nhãn chuyên gia cho 70 thiết bị và các triệu chứng quan sát được.

2. **Fine-tune Multimodal Retrieval**:
   - Khi có đủ 3.000+ cặp ảnh-văn bản thực tế, tiến hành contrastive fine-tuning cho CLIP Vision/Text encoder trên tập dữ liệu đồ gia dụng Việt Nam.

3. **Tích hợp ROI Detection Khi Cần thiết**:
   - Nếu dữ liệu thực địa cho thấy tỷ lệ ảnh chụp nhiều thiết bị trong cùng một phòng gây nhiễu similarity, triển khai YOLOv8-detect để phát hiện bounding box của từng thiết bị trước khi đưa vào bộ so khớp CLIP.
