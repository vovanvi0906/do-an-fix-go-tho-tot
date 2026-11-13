# Dự thảo consent và Android pilot — CHƯA PHÊ DUYỆT

Đây là đề xuất nghiên cứu khóa luận, chưa cho phép tuyển người hoặc thu dữ liệu. Chủ nhiệm, đơn vị kiểm soát dữ liệu, liên hệ rút consent, nơi lưu, người có quyền truy cập, ngày bắt đầu/kết thúc và mã phê duyệt phải được điền, rà soát và duyệt trước thử nghiệm. Không dùng form này như xác nhận đã đáp ứng mọi nghĩa vụ pháp lý.

## Mẫu đồng ý tiếng Việt

**Tên nghiên cứu:** Thử nghiệm xác minh khuôn mặt và chống giả mạo FixGo trên Android.

**Đơn vị/chủ nhiệm:** [điền]. **Liên hệ quyền dữ liệu/khiếu nại:** [điền]. **Mã tài liệu, phiên bản, ngày:** [điền]. **Mã người tham gia:** [mã ngẫu nhiên; không đưa tên vào tập đánh giá].

Tôi được giải thích rằng đây là thử nghiệm, có thể nhận nhầm/từ chối nhầm và chưa dùng để quyết định công việc hay quyền lợi. Hoạt động gồm chụp ảnh/video khuôn mặt của chính tôi bằng camera Android, tạo embedding mã hóa, so khớp 1:1 và đo PAD trên ảnh in/màn hình/video được tôi cho phép. Dữ liệu khuôn mặt và embedding là dữ liệu nhạy cảm; mã hóa không loại bỏ hoàn toàn rủi ro lộ lọt. Không có cam kết hệ thống chống được mọi giả mạo.

Tôi đủ 18 tuổi, tự nguyện, có thể từ chối, dừng phiên, bỏ qua hoạt động hoặc rút đồng ý mà không ảnh hưởng tài khoản, việc làm, đánh giá hay thù lao đã thỏa thuận. Tôi có thể hỏi, yêu cầu xem thông tin về dữ liệu của mình, sửa thông tin liên hệ và yêu cầu xóa qua đầu mối nêu trên. Tôi được nhận bản consent này.

Từng mục được chọn riêng, không đánh dấu sẵn:

- [ ] Đồng ý chụp và lưu ảnh/video gốc cho nghiên cứu này, theo thời hạn bên dưới.
- [ ] Đồng ý tạo, lưu mã hóa và dùng embedding của tôi để enrollment/so khớp trong DB nghiên cứu cô lập.
- [ ] Đồng ý dùng bản sao ảnh của chính tôi để tạo ảnh in và trình chiếu trên màn hình nhằm kiểm tra giả mạo.
- [ ] Đồng ý quay và phát lại video của chính tôi để kiểm tra replay.

Không có quyền dùng dữ liệu cho quảng cáo, huấn luyện model mới, chia sẻ công khai, bán/chuyển cho bên khác, truy vấn FixGo production hay đưa vào phụ lục khóa luận có thể nhận diện. Mục đích mới cần consent/phê duyệt riêng. Không thu người ngoài khung hình; không dùng ảnh người khác hoặc giấy tờ định danh. Nếu không đồng ý một hoạt động, không thực hiện hoạt động đó.

**Nơi lưu và thời hạn đã được duyệt:** [điền trước khi ký; dự thảo đề xuất bên dưới chưa phải cam kết đã vận hành]. **Cách rút đồng ý/xóa, thời hạn xử lý và giới hạn dữ liệu đã ẩn danh không thể liên kết lại:** [giải thích trước khi ký]. **Thù lao/chi phí nếu có:** [điền].

Tôi đã có thời gian hỏi và hiểu nội dung. Người tham gia ký/ngày [ ]; người giải thích ký/ngày [ ]. Không thu chữ ký vào file dữ liệu mô hình.

## Lưu/xóa đề xuất cần duyệt

- Dùng tài khoản nghiên cứu và DB/container riêng; không dùng tài khoản/ảnh thợ FixGo. Liên kết tên–mã và consent giữ riêng khỏi media, score và embedding. Quyền truy cập theo vai trò, không public URL, không Git/log/analytics chứa media hoặc embedding.
- Media lưu private mã hóa; template dùng cơ chế mã hóa/version/revocation hiện có, key nằm ngoài DB. Không dùng avatar. Không ghi đè template trực tiếp. Ghi audit truy cập/xóa chỉ bằng mã và thời gian.
- Đề xuất xóa media gốc, bản in và video replay chậm nhất 30 ngày sau phiên đo cuối; template xóa khi rút consent hoặc kết thúc nghiên cứu, mốc nào đến trước. Đề xuất xác nhận yêu cầu trong 3 ngày làm việc, hoàn tất xóa dữ liệu chủ động trong 7 ngày. Backup nghiên cứu mã hóa luân chuyển tối đa 30 ngày; bản phục hồi phải áp lại danh sách xóa trước truy cập. Chưa có vận hành bảo đảm các SLA này: phải duyệt và kiểm thử trước thu thập.
- Thu hồi template ngay khi nhận yêu cầu hợp lệ, chặn phiên mới và proof liên quan, xóa ciphertext và mọi bản cache/xuất; xác minh kiểm kê. Xóa ảnh cache trên Android, thùng rác và bản in bằng hủy vật lý. Không giữ bản copy trong báo cáo. Chỉ giữ tổng hợp thống kê đã khử liên kết nếu consent giải thích rõ giới hạn rút khỏi tổng hợp; giữ nhật ký xóa tối thiểu theo thời hạn được duyệt.

## Pilot và ngưỡng đánh giá đề xuất

1. Duyệt protocol, consent, vai trò/key/storage/backup/xóa, kinh phí thiết bị và điều kiện license nghiên cứu. Dry-run toàn quy trình quyền dữ liệu bằng dữ liệu không sinh trắc trước tuyển người.
2. Theo protocol hiện có: đề xuất 24 người lớn tự nguyện, 8 calibration và 16 held-out, tách theo người, hai ngày và ít nhất hai Android khác nhau. Tuyệt đối không dùng test set chọn threshold. Ghi camera, ánh sáng, crop/bounding-box policy, model/hash, preprocessing và timeout. Frame không được xem là mẫu độc lập.
3. YuNet chọn một mặt; SFace tạo embedding mã hóa/version sau Admin review record + consent. PAD chạy crop riêng và trả evidence độc lập. Trong giai đoạn thu score, vẫn NOT_EVALUATED và không cấp proof thành công. Không dùng detection thay PAD; không coi SFace MATCH là PAD PASS.
4. Calibration chọn cosine threshold và ngưỡng real-score PAD; chưa có số ngưỡng model hợp lệ để bật. Điểm nằm trong vùng bất định, no-face/multiple-face, chất lượng kém, timeout hoặc lỗi kỹ thuật đều từ chối an toàn và ghi nguyên nhân. Freeze thresholds/policy/version trước held-out.
5. Mục tiêu **đề xuất để thảo luận**, chưa là policy: FMR ≤1%, APCER từng loại ≤5%, BPCER ≤10%, tỷ lệ không kết luận/no acquisition ≤10%; PAD CPU p95 ≤50 ms trên CPU máy chủ hiện tại, Android end-to-end p95 ≤2 s trên mạng thử nghiệm được mô tả. Không lấy latency synthetic hiện tại thay kết quả pilot. Báo cáo cả point estimate và 95% CI theo người/phiên, số mẫu và operational rejection; không chọn mẫu đẹp để bỏ no-face.
6. Pilot nhỏ chỉ kiểm feasibility, không thể chứng minh FMR thấp: ví dụ 0 lỗi trong khoảng 299 phép thử độc lập mới cho cận trên một phía 95% gần1%; phép so cặp cùng người/phiên thường tương quan nên không được coi là 299 mẫu độc lập. Nếu CI chưa đạt hoặc thiếu attack coverage, kết luận thiếu bằng chứng, không mở gate. Báo cáo FMR/FNMR/TAR, APCER riêng print-matte/glossy, screen-static và video replay, BPCER; không gộp để che một loại tấn công yếu.
7. Sau báo cáo held-out và phê duyệt riêng: nối PAD được đánh giá vào HTTP contract, pin threshold/crop policy/provenance; Backend chỉ chấp nhận identity MATCH **và** PAD PASS đúng binding/session/version. Chạy enrollment → daily → order proof/atomic consumption trên DB cô lập; test sai worker/order/epoch, replay, hết hạn, revoke, mất mạng, retry/duplicate và timeout bằng Android thật. Không thay FSM hay dùng legacy timestamp.
8. Chỉ đề xuất production sau audit/báo cáo mới; schema drift/migration vẫn là quyết định riêng. Không có việc bật tự động sau pilot.

## Phụ lục cho FACE-RESEARCH-E2E — vẫn chưa cho phép thu dữ liệu

Bản lab hiện tại chỉ nhận ảnh tổng hợp do máy chủ tạo. Camera khóa ở cả hai dịch vụ. Luồng camera đã được viết để kiểm thử sau phê duyệt; không được mở khóa chỉ vì cần quay demo.

Ở giai đoạn **đo lường ban đầu**, không lưu template và không hoàn tất đăng ký khuôn mặt. Embedding chỉ tồn tại tạm thời trong tiến trình xử lý. Enrollment đo một ảnh; Daily/Order nghiên cứu so hai ảnh camera trong cùng phiên, không dùng mẫu đã đăng ký tin cậy. Chỉ lưu score, quality, version, latency và metadata phiên trong DB nghiên cứu riêng; đây vẫn là dữ liệu nghiên cứu có thể liên kết với người tham gia, không mặc nhiên coi là vô danh. Checkbox lưu template trong mẫu consent chỉ áp dụng nếu một giai đoạn lưu mẫu riêng đã được phê duyệt; không yêu cầu người tham gia đồng ý gộp để được tham gia đo ảnh.

Bổ sung mục chọn trước khi ký cho giai đoạn này:

- [ ] Tôi đồng ý việc xử lý tạm thời ảnh camera để tạo embedding/score và lưu số đo nghiên cứu, không tạo đăng ký Face ID có hiệu lực. Tôi đã được thông báo thời hạn giữ số đo và cách yêu cầu xóa.

Quy trình kỹ thuật đề xuất: người phụ trách kiểm consent phiên bản/ngày/hạn và từng quyền tùy chọn; ghi reference của bản consent ngoài tập số đo; kiểm review record Admin còn hiệu lực, epoch hiện tại và consent chưa rút; sau đó mới đưa người tham gia vào danh sách nghiên cứu được duyệt. Không dùng tài khoản fixture làm người tham gia, không coi checkbox UI hoặc `approvalStatus` là chứng cứ review/consent. Chưa có chức năng công khai để tự thêm vào danh sách này.

Ảnh cache Android được xóa sau phản hồi hợp lệ, hủy phiên, chuyển nền (ngoài lúc camera hệ thống mở), đổi mục đích và unmount. Nếu lỗi xóa, dừng nghiên cứu, kiểm kê và xóa dữ liệu ứng dụng trước tiếp tục; không hứa xóa pháp chứng khỏi bộ nhớ flash. Server không chủ động ghi ảnh/embedding ra ổ đĩa. Nếu đồng ý lưu media để đánh giá replay, phải xây dựng và duyệt kho mã hóa riêng; lab hiện tại **chưa có kho đó** và không giữ media ngầm.

DELETE `/face-research/sessions` xóa phiên/số đo theo người đăng nhập; khi rút consent người quản trị đồng thời tắt quyền capture và thu hồi consent trong state. Dừng lab xóa container DB tạm và file token/config. Bản xuất số đo, ảnh in/video, consent giấy và backup (nếu được tạo trong giai đoạn sau) phải có kiểm kê/xóa riêng, không được coi teardown container là đã xóa mọi bản sao. Đề xuất giữ số đo liên kết tối đa30 ngày sau phiên cuối như media; thời hạn consent giấy và nhật ký xóa phải được đơn vị kiểm soát dữ liệu điền, giải thích và duyệt trước thu thập.

**Thông tin còn cần chủ nhiệm cung cấp để phát hành form:** tên đơn vị/chủ nhiệm, đầu mối liên hệ, nơi lưu/custodian/key holder, ngày bắt đầu/kết thúc, mã phê duyệt, thù lao nếu có và thời hạn consent giấy/backup. Không tự điền bằng suy đoán hoặc ghi rằng đã có phê duyệt.
