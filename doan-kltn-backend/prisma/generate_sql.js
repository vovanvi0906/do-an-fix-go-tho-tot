const fs = require('fs');
const path = require('path');

const rawData = [
  {
    num: "01",
    target: "Ổ cắm điện",
    slug: "o-cam-dien",
    icon: "Zap",
    services: [
      { name: "Sửa ổ cắm không có điện", price: 100000, duration: 45, unit: "điểm" },
      { name: "Sửa ổ cắm chập chờn / tiếp xúc kém", price: 90000, duration: 30, unit: "điểm" },
      { name: "Sửa ổ cắm bị lỏng", price: 80000, duration: 30, unit: "điểm" },
      { name: "Thay ổ cắm cháy / hỏng", price: 120000, duration: 45, unit: "bộ" },
      { name: "Thay ổ cắm âm tường", price: 100000, duration: 40, unit: "bộ" },
      { name: "Thay ổ cắm nổi", price: 90000, duration: 30, unit: "bộ" },
      { name: "Lắp đặt ổ cắm mới", price: 150000, duration: 60, unit: "điểm" },
      { name: "Di dời vị trí ổ cắm", price: 180000, duration: 60, unit: "điểm" },
      { name: "Lắp đặt ổ cắm chống nước", price: 160000, duration: 45, unit: "bộ" },
      { name: "Lắp đặt ổ cắm có cổng USB / USB-C", price: 150000, duration: 40, unit: "bộ" },
      { name: "Kiểm tra ổ cắm phát nóng / có mùi khét", price: 120000, duration: 45, unit: "lần" }
    ]
  },
  {
    num: "02",
    target: "Công tắc điện",
    slug: "cong-tac-dien",
    icon: "ToggleLeft",
    services: [
      { name: "Sửa công tắc không hoạt động", price: 90000, duration: 30, unit: "bộ" },
      { name: "Sửa công tắc chập chờn", price: 90000, duration: 30, unit: "bộ" },
      { name: "Sửa công tắc bị kẹt", price: 80000, duration: 30, unit: "bộ" },
      { name: "Thay công tắc điện hỏng", price: 100000, duration: 35, unit: "bộ" },
      { name: "Thay công tắc âm tường / nổi", price: 100000, duration: 40, unit: "bộ" },
      { name: "Lắp đặt công tắc mới", price: 140000, duration: 45, unit: "điểm" },
      { name: "Di dời công tắc", price: 160000, duration: 60, unit: "điểm" },
      { name: "Lắp công tắc cảm ứng", price: 180000, duration: 45, unit: "bộ" },
      { name: "Lắp công tắc thông minh", price: 200000, duration: 50, unit: "bộ" },
      { name: "Sửa công tắc điều chỉnh độ sáng", price: 120000, duration: 40, unit: "bộ" },
      { name: "Sửa công tắc hai chiều / cầu thang", price: 150000, duration: 50, unit: "hệ thống" }
    ]
  },
  {
    num: "03",
    target: "Bóng đèn / Đèn chiếu sáng",
    slug: "bong-den-chieu-sang",
    icon: "Lightbulb",
    services: [
      { name: "Thay bóng đèn LED", price: 80000, duration: 25, unit: "bóng" },
      { name: "Thay bóng đèn tuýp", price: 90000, duration: 30, unit: "bóng" },
      { name: "Sửa đèn không sáng", price: 100000, duration: 35, unit: "bộ" },
      { name: "Sửa đèn chập chờn", price: 90000, duration: 30, unit: "bộ" },
      { name: "Sửa đèn sáng yếu", price: 90000, duration: 30, unit: "bộ" },
      { name: "Sửa đèn LED nhấp nháy", price: 100000, duration: 35, unit: "bộ" },
      { name: "Thay driver / bộ nguồn LED", price: 120000, duration: 40, unit: "bộ" },
      { name: "Thay đui đèn hỏng", price: 80000, duration: 30, unit: "cái" },
      { name: "Lắp đèn LED âm trần", price: 110000, duration: 35, unit: "bóng" },
      { name: "Lắp đèn LED ốp trần", price: 120000, duration: 40, unit: "bộ" },
      { name: "Lắp đèn tuýp / đèn thanh", price: 100000, duration: 35, unit: "bộ" },
      { name: "Lắp đèn tường / đèn trang trí", price: 140000, duration: 45, unit: "bộ" },
      { name: "Kiểm tra đèn bị chập / phát nóng", price: 120000, duration: 40, unit: "lần" }
    ]
  },
  {
    num: "04",
    target: "Đèn chùm / Đèn trang trí",
    slug: "den-chum-trang-tri",
    icon: "Sparkles",
    services: [
      { name: "Lắp đặt đèn chùm", price: 350000, duration: 90, unit: "bộ" },
      { name: "Tháo dỡ đèn chùm", price: 200000, duration: 60, unit: "bộ" },
      { name: "Sửa đèn chùm không sáng", price: 250000, duration: 75, unit: "bộ" },
      { name: "Thay bóng / đui đèn chùm", price: 150000, duration: 45, unit: "lần" },
      { name: "Thay bộ nguồn / driver đèn trang trí", price: 180000, duration: 45, unit: "bộ" },
      { name: "Lắp đèn thả trần", price: 180000, duration: 60, unit: "bộ" },
      { name: "Lắp đèn LED dây", price: 150000, duration: 60, unit: "cuộn" },
      { name: "Sửa đèn LED dây không sáng", price: 120000, duration: 45, unit: "lần" },
      { name: "Lắp đèn hắt trần", price: 160000, duration: 60, unit: "mét" },
      { name: "Sửa bộ điều khiển đèn RGB / LED", price: 150000, duration: 45, unit: "bộ" },
      { name: "Bảo dưỡng / vệ sinh đèn trang trí", price: 250000, duration: 90, unit: "bộ" }
    ]
  },
  {
    num: "05",
    target: "Đèn ngoài trời / Đèn sân vườn",
    slug: "den-ngoai-troi-san-vuon",
    icon: "Trees",
    services: [
      { name: "Lắp đèn sân vườn", price: 180000, duration: 60, unit: "trụ" },
      { name: "Lắp đèn cổng / đèn tường ngoài trời", price: 160000, duration: 50, unit: "bộ" },
      { name: "Lắp đèn pha LED", price: 180000, duration: 60, unit: "bộ" },
      { name: "Lắp đèn chống nước", price: 160000, duration: 50, unit: "bộ" },
      { name: "Sửa đèn ngoài trời không sáng", price: 140000, duration: 45, unit: "bộ" },
      { name: "Sửa đèn ngoài trời chập chờn", price: 130000, duration: 40, unit: "bộ" },
      { name: "Thay bộ nguồn / driver đèn", price: 140000, duration: 40, unit: "bộ" },
      { name: "Kiểm tra hệ thống dây đèn ngoài trời", price: 180000, duration: 60, unit: "hệ thống" },
      { name: "Thay đèn cảm biến chuyển động", price: 150000, duration: 45, unit: "bộ" },
      { name: "Lắp đèn tự bật khi trời tối", price: 170000, duration: 50, unit: "bộ" }
    ]
  },
  {
    num: "06",
    target: "Aptomat / CB / MCB",
    slug: "aptomat-cb-mcb",
    icon: "ShieldAlert",
    services: [
      { name: "Kiểm tra aptomat nhảy liên tục", price: 150000, duration: 45, unit: "lần" },
      { name: "Sửa lỗi mất điện do CB ngắt", price: 140000, duration: 40, unit: "lần" },
      { name: "Thay aptomat hỏng", price: 150000, duration: 40, unit: "cái" },
      { name: "Thay MCB nhánh", price: 130000, duration: 35, unit: "cái" },
      { name: "Thay CB tổng", price: 200000, duration: 50, unit: "cái" },
      { name: "Lắp đặt aptomat mới", price: 160000, duration: 45, unit: "cái" },
      { name: "Nâng cấp CB đúng tải thiết kế", price: 180000, duration: 45, unit: "cái" },
      { name: "Kiểm tra tiếp điểm CB phát nóng", price: 120000, duration: 35, unit: "lần" },
      { name: "Kiểm tra CB không đóng được", price: 130000, duration: 35, unit: "lần" },
      { name: "Kiểm tra hiện tượng quá tải / ngắn mạch", price: 200000, duration: 60, unit: "lần" },
      { name: "Bảo dưỡng tủ CB", price: 180000, duration: 60, unit: "tủ" }
    ]
  },
  {
    num: "07",
    target: "Thiết bị chống rò / Chống giật",
    slug: "chong-ro-chong-giat",
    icon: "ShieldCheck",
    services: [
      { name: "Kiểm tra RCCB / RCBO nhảy liên tục", price: 180000, duration: 50, unit: "lần" },
      { name: "Thay RCCB / RCBO hỏng", price: 180000, duration: 45, unit: "cái" },
      { name: "Lắp thiết bị chống rò điện", price: 220000, duration: 60, unit: "cái" },
      { name: "Kiểm tra chức năng nút TEST", price: 100000, duration: 25, unit: "lần" },
      { name: "Kiểm tra dòng rò hệ thống điện", price: 200000, duration: 60, unit: "lần" },
      { name: "Xác định nhánh điện bị rò", price: 250000, duration: 75, unit: "hệ thống" },
      { name: "Kiểm tra đấu nối trung tính và tiếp địa", price: 160000, duration: 45, unit: "lần" },
      { name: "Nâng cấp bảo vệ chống rò phù hợp", price: 250000, duration: 60, unit: "hệ thống" },
      { name: "Kiểm tra thiết bị chống giật không đóng được", price: 150000, duration: 40, unit: "lần" }
    ]
  },
  {
    num: "08",
    target: "Tủ điện / Bảng điện",
    slug: "tu-dien-bang-dien",
    icon: "LayoutGrid",
    services: [
      { name: "Sửa tủ điện mất nguồn", price: 220000, duration: 60, unit: "tủ" },
      { name: "Sửa bảng điện hỏng", price: 150000, duration: 45, unit: "bảng" },
      { name: "Thay vỏ tủ điện", price: 250000, duration: 75, unit: "tủ" },
      { name: "Lắp đặt tủ điện dân dụng", price: 350000, duration: 90, unit: "tủ" },
      { name: "Lắp đặt bảng điện mới", price: 180000, duration: 60, unit: "bảng" },
      { name: "Thay thanh đấu nối / terminal", price: 140000, duration: 40, unit: "thanh" },
      { name: "Thay dây dẫn hư hỏng trong tủ", price: 180000, duration: 50, unit: "tủ" },
      { name: "Sắp xếp lại dây điện trong tủ", price: 200000, duration: 60, unit: "tủ" },
      { name: "Dán nhãn và phân chia nhánh điện", price: 120000, duration: 40, unit: "tủ" },
      { name: "Xử lý tiếp điểm tủ điện phát nóng", price: 180000, duration: 45, unit: "lần" },
      { name: "Kiểm tra / bảo trì tủ điện định kỳ", price: 250000, duration: 60, unit: "tủ" },
      { name: "Nâng cấp tủ điện theo nhu cầu sử dụng", price: 400000, duration: 120, unit: "tủ" }
    ]
  },
  {
    num: "09",
    target: "Dây điện / Cáp điện",
    slug: "day-dien-cap-dien",
    icon: "Cable",
    services: [
      { name: "Kiểm tra dây điện bị đứt", price: 180000, duration: 60, unit: "lần" },
      { name: "Xử lý dây điện bị chập", price: 220000, duration: 60, unit: "điểm" },
      { name: "Thay dây điện cũ / xuống cấp", price: 200000, duration: 75, unit: "đoạn" },
      { name: "Thay dây điện bị cháy", price: 220000, duration: 60, unit: "đoạn" },
      { name: "Sửa điểm nối dây bị lỏng", price: 100000, duration: 35, unit: "điểm" },
      { name: "Thay cáp nguồn thiết bị", price: 140000, duration: 40, unit: "sợi" },
      { name: "Đi dây điện nổi", price: 120000, duration: 45, unit: "mét" },
      { name: "Đi dây điện âm tường", price: 180000, duration: 60, unit: "mét" },
      { name: "Đi dây trong ống luồn", price: 140000, duration: 45, unit: "mét" },
      { name: "Đi dây trong máng cáp", price: 150000, duration: 50, unit: "mét" },
      { name: "Bổ sung đường dây cấp điện", price: 200000, duration: 60, unit: "đường" },
      { name: "Kiểm tra khả năng chịu tải của đường dây", price: 160000, duration: 45, unit: "hệ thống" },
      { name: "Thay dây điện hở / mất cách điện", price: 150000, duration: 45, unit: "đoạn" }
    ]
  },
  {
    num: "10",
    target: "Hộp nối điện / Hộp kỹ thuật",
    slug: "hop-noi-dien-ky-thuat",
    icon: "Box",
    services: [
      { name: "Sửa mối nối điện bị lỏng", price: 110000, duration: 35, unit: "hộp" },
      { name: "Sửa hộp nối bị chập", price: 180000, duration: 50, unit: "hộp" },
      { name: "Thay hộp nối điện hỏng", price: 130000, duration: 40, unit: "hộp" },
      { name: "Thay đầu nối / terminal", price: 90000, duration: 30, unit: "bộ" },
      { name: "Lắp đặt hộp nối điện", price: 140000, duration: 45, unit: "hộp" },
      { name: "Lắp hộp kỹ thuật điện", price: 200000, duration: 60, unit: "hộp" },
      { name: "Sắp xếp dây điện trong hộp nối", price: 120000, duration: 40, unit: "hộp" },
      { name: "Xử lý nước xâm nhập hộp nối", price: 160000, duration: 45, unit: "hộp" },
      { name: "Kiểm tra / thay nắp hộp nối", price: 80000, duration: 25, unit: "cái" },
      { name: "Kiểm tra điểm nối phát nóng", price: 110000, duration: 35, unit: "lần" }
    ]
  },
  {
    num: "11",
    target: "Hệ thống điện phòng / Khu vực",
    slug: "dien-phong-khu-vuc",
    icon: "Home",
    services: [
      { name: "Sửa mất điện phòng ngủ", price: 180000, duration: 60, unit: "phòng" },
      { name: "Sửa mất điện phòng khách", price: 200000, duration: 60, unit: "phòng" },
      { name: "Sửa mất điện phòng bếp", price: 220000, duration: 60, unit: "phòng" },
      { name: "Sửa mất điện phòng tắm", price: 180000, duration: 50, unit: "phòng" },
      { name: "Sửa mất điện ban công", price: 140000, duration: 45, unit: "khu vực" },
      { name: "Sửa mất điện sân vườn", price: 180000, duration: 60, unit: "khu vực" },
      { name: "Lắp thêm ổ cắm / công tắc trong phòng", price: 160000, duration: 45, unit: "điểm" },
      { name: "Bổ sung mạch điện cho khu vực", price: 250000, duration: 75, unit: "mạch" },
      { name: "Kiểm tra điện chập chờn một phòng", price: 160000, duration: 45, unit: "phòng" },
      { name: "Kiểm tra quá tải điện khu vực", price: 180000, duration: 50, unit: "khu vực" },
      { name: "Nâng cấp hệ thống điện phòng", price: 350000, duration: 90, unit: "phòng" }
    ]
  },
  {
    num: "12",
    target: "Hệ thống điện toàn nhà",
    slug: "dien-toan-nha",
    icon: "Building",
    services: [
      { name: "Kiểm tra mất điện toàn nhà", price: 250000, duration: 60, unit: "lần" },
      { name: "Kiểm tra điện chập chờn", price: 220000, duration: 60, unit: "lần" },
      { name: "Kiểm tra điện áp bất thường", price: 180000, duration: 45, unit: "lần" },
      { name: "Kiểm tra hiện tượng sụt áp", price: 200000, duration: 50, unit: "lần" },
      { name: "Kiểm tra quá tải hệ thống điện", price: 250000, duration: 60, unit: "lần" },
      { name: "Kiểm tra rò điện toàn nhà", price: 300000, duration: 90, unit: "lần" },
      { name: "Kiểm tra / xử lý sự cố chập điện", price: 350000, duration: 90, unit: "lần" },
      { name: "Kiểm tra đường cấp nguồn chính", price: 200000, duration: 50, unit: "lần" },
      { name: "Kiểm tra các nhánh điện", price: 250000, duration: 60, unit: "hệ thống" },
      { name: "Bảo trì hệ thống điện định kỳ", price: 450000, duration: 120, unit: "nhà" },
      { name: "Cải tạo hệ thống điện nhà cũ", price: 800000, duration: 240, unit: "nhà" },
      { name: "Lắp đặt hệ thống điện nhà mới", price: 1200000, duration: 360, unit: "nhà" },
      { name: "Kiểm tra an toàn điện sau sửa chữa", price: 150000, duration: 45, unit: "lần" }
    ]
  },
  {
    num: "13",
    target: "Quạt trần / Quạt treo tường",
    slug: "quat-tran-treo-tuong",
    icon: "Disc",
    services: [
      { name: "Lắp đặt quạt trần", price: 250000, duration: 75, unit: "cây" },
      { name: "Tháo dỡ / di dời quạt trần", price: 180000, duration: 60, unit: "cây" },
      { name: "Lắp đặt quạt treo tường", price: 140000, duration: 45, unit: "cái" },
      { name: "Sửa quạt không quay", price: 150000, duration: 45, unit: "cái" },
      { name: "Sửa quạt quay chậm", price: 120000, duration: 40, unit: "cái" },
      { name: "Sửa quạt rung lắc / kêu to", price: 140000, duration: 45, unit: "cái" },
      { name: "Sửa bộ điều tốc quạt", price: 120000, duration: 35, unit: "bộ" },
      { name: "Thay tụ điện quạt", price: 100000, duration: 30, unit: "cái" },
      { name: "Sửa điều khiển quạt trần", price: 120000, duration: 35, unit: "bộ" },
      { name: "Thay công tắc quạt", price: 90000, duration: 30, unit: "cái" },
      { name: "Bảo dưỡng quạt trần", price: 150000, duration: 45, unit: "cây" }
    ]
  },
  {
    num: "14",
    target: "Quạt thông gió / Quạt hút",
    slug: "quat-thong-gio-hut",
    icon: "Wind",
    services: [
      { name: "Lắp đặt quạt thông gió", price: 160000, duration: 45, unit: "cái" },
      { name: "Lắp quạt hút nhà vệ sinh", price: 180000, duration: 50, unit: "cái" },
      { name: "Lắp quạt hút gắn tường / trần", price: 180000, duration: 50, unit: "cái" },
      { name: "Sửa quạt thông gió không chạy", price: 130000, duration: 40, unit: "cái" },
      { name: "Sửa quạt hút yếu", price: 110000, duration: 35, unit: "cái" },
      { name: "Sửa quạt kêu to / rung", price: 120000, duration: 40, unit: "cái" },
      { name: "Thay động cơ / tụ quạt", price: 150000, duration: 45, unit: "cái" },
      { name: "Thay công tắc / bộ điều khiển", price: 100000, duration: 30, unit: "bộ" },
      { name: "Vệ sinh quạt thông gió", price: 100000, duration: 30, unit: "cái" },
      { name: "Tháo dỡ / thay quạt hút", price: 150000, duration: 45, unit: "cái" }
    ]
  },
  {
    num: "15",
    target: "Chuông cửa / Nút nhấn chuông",
    slug: "chuong-cua-nut-nhan",
    icon: "Bell",
    services: [
      { name: "Sửa chuông cửa không kêu", price: 120000, duration: 35, unit: "bộ" },
      { name: "Sửa chuông cửa kêu liên tục", price: 110000, duration: 30, unit: "bộ" },
      { name: "Thay nút nhấn chuông", price: 90000, duration: 30, unit: "cái" },
      { name: "Thay bộ chuông cửa", price: 140000, duration: 40, unit: "bộ" },
      { name: "Lắp chuông cửa có dây", price: 160000, duration: 50, unit: "bộ" },
      { name: "Lắp chuông cửa không dây", price: 120000, duration: 30, unit: "bộ" },
      { name: "Lắp chuông cửa màn hình", price: 250000, duration: 75, unit: "bộ" },
      { name: "Lắp chuông cửa thông minh", price: 220000, duration: 60, unit: "bộ" },
      { name: "Sửa bộ cấp nguồn chuông", price: 120000, duration: 35, unit: "bộ" },
      { name: "Kiểm tra kết nối / tín hiệu chuông", price: 100000, duration: 30, unit: "lần" }
    ]
  },
  {
    num: "16",
    target: "Cảm biến / Thiết bị tự động",
    slug: "cam-bien-tu-dong",
    icon: "Radio",
    services: [
      { name: "Lắp cảm biến chuyển động", price: 160000, duration: 45, unit: "bộ" },
      { name: "Sửa cảm biến chuyển động", price: 130000, duration: 35, unit: "bộ" },
      { name: "Lắp cảm biến ánh sáng", price: 150000, duration: 40, unit: "bộ" },
      { name: "Sửa cảm biến ánh sáng", price: 120000, duration: 35, unit: "bộ" },
      { name: "Lắp công tắc hẹn giờ", price: 150000, duration: 40, unit: "bộ" },
      { name: "Sửa công tắc hẹn giờ", price: 120000, duration: 35, unit: "bộ" },
      { name: "Lắp cảm biến hiện diện", price: 180000, duration: 45, unit: "bộ" },
      { name: "Lắp bộ điều khiển đèn tự động", price: 200000, duration: 50, unit: "bộ" },
      { name: "Sửa bộ điều khiển tự động", price: 160000, duration: 45, unit: "bộ" },
      { name: "Cấu hình thiết bị điều khiển thông minh", price: 150000, duration: 40, unit: "thiết bị" }
    ]
  },
  {
    num: "17",
    target: "Công tắc thông minh / Relay",
    slug: "cong-tac-relay-thong-minh",
    icon: "Cpu",
    services: [
      { name: "Lắp công tắc thông minh Wi-Fi", price: 180000, duration: 45, unit: "bộ" },
      { name: "Lắp công tắc thông minh Zigbee", price: 200000, duration: 50, unit: "bộ" },
      { name: "Thay công tắc cơ bằng công tắc thông minh", price: 180000, duration: 45, unit: "bộ" },
      { name: "Sửa công tắc thông minh không hoạt động", price: 150000, duration: 40, unit: "bộ" },
      { name: "Sửa công tắc thông minh mất kết nối", price: 120000, duration: 35, unit: "bộ" },
      { name: "Lắp relay điều khiển điện", price: 180000, duration: 45, unit: "bộ" },
      { name: "Sửa relay không đóng / ngắt", price: 150000, duration: 40, unit: "bộ" },
      { name: "Cài đặt lịch bật / tắt", price: 100000, duration: 30, unit: "hệ thống" },
      { name: "Cấu hình điều khiển bằng ứng dụng", price: 120000, duration: 35, unit: "lần" },
      { name: "Kiểm tra tương thích dây trung tính / tải", price: 130000, duration: 35, unit: "lần" }
    ]
  },
  {
    num: "18",
    target: "Ổ cắm thông minh / Bộ hẹn giờ",
    slug: "o-cam-thong-minh-hen-gio",
    icon: "Watch",
    services: [
      { name: "Lắp ổ cắm thông minh", price: 150000, duration: 35, unit: "bộ" },
      { name: "Sửa ổ cắm thông minh không cấp điện", price: 120000, duration: 35, unit: "bộ" },
      { name: "Sửa ổ cắm thông minh mất kết nối", price: 100000, duration: 30, unit: "bộ" },
      { name: "Lắp ổ cắm hẹn giờ", price: 140000, duration: 35, unit: "bộ" },
      { name: "Sửa bộ hẹn giờ điện", price: 120000, duration: 35, unit: "bộ" },
      { name: "Cấu hình lịch bật / tắt", price: 100000, duration: 30, unit: "thiết bị" },
      { name: "Thay ổ cắm thông minh hỏng", price: 130000, duration: 35, unit: "bộ" },
      { name: "Kiểm tra quá tải ổ cắm thông minh", price: 110000, duration: 30, unit: "lần" }
    ]
  },
  {
    num: "19",
    target: "Nguồn điện / Adapter",
    slug: "nguon-dien-adapter",
    icon: "Plug",
    services: [
      { name: "Kiểm tra adapter không ra điện", price: 90000, duration: 25, unit: "cái" },
      { name: "Thay adapter hỏng", price: 110000, duration: 30, unit: "cái" },
      { name: "Kiểm tra bộ nguồn DC", price: 120000, duration: 35, unit: "bộ" },
      { name: "Thay bộ nguồn LED", price: 140000, duration: 40, unit: "bộ" },
      { name: "Sửa bộ nguồn không cấp điện", price: 150000, duration: 45, unit: "bộ" },
      { name: "Kiểm tra dây / đầu cắm nguồn", price: 80000, duration: 25, unit: "dây" },
      { name: "Thay bộ chuyển đổi điện áp", price: 150000, duration: 40, unit: "bộ" },
      { name: "Lắp đặt bộ nguồn phù hợp thiết bị", price: 160000, duration: 45, unit: "bộ" },
      { name: "Kiểm tra nguồn phát nóng bất thường", price: 110000, duration: 30, unit: "lần" }
    ]
  },
  {
    num: "20",
    target: "Ổn áp / UPS / Bộ lưu điện",
    slug: "on-ap-ups-luu-dien",
    icon: "BatteryCharging",
    services: [
      { name: "Kiểm tra ổn áp không hoạt động", price: 180000, duration: 45, unit: "máy" },
      { name: "Kiểm tra ổn áp không ổn định điện áp", price: 180000, duration: 45, unit: "máy" },
      { name: "Lắp đặt ổn áp", price: 250000, duration: 60, unit: "máy" },
      { name: "Kiểm tra UPS không cấp điện", price: 180000, duration: 45, unit: "bộ" },
      { name: "Thay ắc quy UPS", price: 200000, duration: 50, unit: "bình" },
      { name: "Kiểm tra UPS không sạc", price: 160000, duration: 40, unit: "bộ" },
      { name: "Kiểm tra UPS báo lỗi", price: 160000, duration: 40, unit: "bộ" },
      { name: "Lắp đặt bộ lưu điện", price: 250000, duration: 60, unit: "bộ" },
      { name: "Bảo dưỡng UPS / ổn áp", price: 220000, duration: 60, unit: "máy" },
      { name: "Kiểm tra khả năng cấp điện dự phòng", price: 180000, duration: 45, unit: "lần" }
    ]
  },
  {
    num: "21",
    target: "Hệ thống tiếp địa / Chống sét",
    slug: "tiep-dia-chong-set",
    icon: "ZapOff",
    services: [
      { name: "Kiểm tra hệ thống tiếp địa", price: 250000, duration: 60, unit: "hệ thống" },
      { name: "Đo điện trở tiếp địa", price: 300000, duration: 60, unit: "lần" },
      { name: "Kiểm tra dây tiếp địa bị đứt", price: 180000, duration: 45, unit: "đoạn" },
      { name: "Bổ sung dây tiếp địa cho ổ cắm", price: 150000, duration: 45, unit: "điểm" },
      { name: "Sửa mối nối tiếp địa", price: 140000, duration: 40, unit: "mối" },
      { name: "Lắp đặt hệ thống tiếp địa", price: 600000, duration: 180, unit: "hệ thống" },
      { name: "Kiểm tra thiết bị chống sét lan truyền SPD", price: 200000, duration: 45, unit: "bộ" },
      { name: "Thay SPD hỏng", price: 220000, duration: 50, unit: "bộ" },
      { name: "Kiểm tra / bảo trì hệ thống chống sét", price: 350000, duration: 90, unit: "hệ thống" },
      { name: "Kiểm tra liên kết đẳng thế", price: 220000, duration: 60, unit: "lần" }
    ]
  },
  {
    num: "22",
    target: "Đèn sự cố / Đèn thoát hiểm",
    slug: "den-su-co-exit",
    icon: "AlertOctagon",
    services: [
      { name: "Lắp đặt đèn sự cố", price: 150000, duration: 40, unit: "bộ" },
      { name: "Lắp đèn EXIT", price: 150000, duration: 40, unit: "bộ" },
      { name: "Sửa đèn sự cố không sáng", price: 120000, duration: 35, unit: "bộ" },
      { name: "Sửa đèn không sạc pin", price: 110000, duration: 35, unit: "bộ" },
      { name: "Thay pin đèn sự cố", price: 120000, duration: 30, unit: "bộ" },
      { name: "Thay bộ nguồn đèn EXIT", price: 130000, duration: 35, unit: "bộ" },
      { name: "Kiểm tra chức năng chiếu sáng dự phòng", price: 120000, duration: 30, unit: "lần" },
      { name: "Bảo dưỡng đèn sự cố định kỳ", price: 150000, duration: 45, unit: "hệ thống" }
    ]
  },
  {
    num: "23",
    target: "Điện cửa cuốn / Cổng tự động",
    slug: "dien-cua-cuon-cong-tu-dong",
    icon: "Sliders",
    services: [
      { name: "Kiểm tra cửa cuốn mất nguồn", price: 200000, duration: 50, unit: "cửa" },
      { name: "Sửa nút nhấn điều khiển cửa cuốn", price: 140000, duration: 35, unit: "bộ" },
      { name: "Sửa bộ nhận tín hiệu điều khiển", price: 180000, duration: 45, unit: "hộp" },
      { name: "Thay bộ nguồn điều khiển", price: 200000, duration: 45, unit: "bộ" },
      { name: "Kiểm tra motor không hoạt động", price: 220000, duration: 60, unit: "motor" },
      { name: "Sửa công tắc hành trình", price: 160000, duration: 45, unit: "bộ" },
      { name: "Kiểm tra cổng tự động không đóng / mở", price: 220000, duration: 60, unit: "cổng" },
      { name: "Kiểm tra cảm biến an toàn cửa", price: 160000, duration: 40, unit: "bộ" },
      { name: "Bảo dưỡng phần điện cửa cuốn / cổng", price: 250000, duration: 60, unit: "cửa" }
    ]
  },
  {
    num: "24",
    target: "Máy bơm nước – Phần điện",
    slug: "may-bom-nuoc-phan-dien",
    icon: "Gauge",
    services: [
      { name: "Sửa máy bơm không lên nguồn", price: 180000, duration: 45, unit: "máy" },
      { name: "Sửa bơm không khởi động", price: 180000, duration: 45, unit: "máy" },
      { name: "Sửa công tắc áp suất", price: 150000, duration: 40, unit: "cái" },
      { name: "Thay tụ khởi động máy bơm", price: 140000, duration: 35, unit: "tụ" },
      { name: "Kiểm tra động cơ bơm quá nhiệt", price: 160000, duration: 40, unit: "máy" },
      { name: "Sửa phao điện máy bơm", price: 150000, duration: 40, unit: "bộ" },
      { name: "Sửa bộ điều khiển bơm tự động", price: 180000, duration: 45, unit: "bộ" },
      { name: "Lắp mạch bảo vệ máy bơm", price: 200000, duration: 50, unit: "mạch" },
      { name: "Kiểm tra hệ thống dây điện cấp cho bơm", price: 150000, duration: 40, unit: "đường" }
    ]
  },
  {
    num: "25",
    target: "Bộ cấp nguồn thiết bị cố định",
    slug: "cap-nguon-thiet-bi-co-dinh",
    icon: "PowerSquare",
    services: [
      { name: "Lắp đường cấp điện riêng cho máy lạnh", price: 220000, duration: 60, unit: "đường" },
      { name: "Lắp đường cấp điện riêng cho bình nóng lạnh", price: 220000, duration: 60, unit: "đường" },
      { name: "Lắp đường cấp điện riêng cho bếp điện", price: 250000, duration: 60, unit: "đường" },
      { name: "Lắp đường cấp điện riêng cho máy giặt", price: 180000, duration: 50, unit: "đường" },
      { name: "Lắp bộ ngắt điện cô lập thiết bị", price: 160000, duration: 40, unit: "bộ" },
      { name: "Thay dây cấp nguồn cố định", price: 180000, duration: 50, unit: "đoạn" },
      { name: "Kiểm tra tiếp điểm cấp nguồn phát nóng", price: 130000, duration: 35, unit: "lần" },
      { name: "Kiểm tra bảo vệ quá tải nhánh thiết bị", price: 150000, duration: 40, unit: "nhánh" },
      { name: "Kiểm tra điện áp cấp cho thiết bị", price: 120000, duration: 30, unit: "lần" }
    ]
  },
  {
    num: "26",
    target: "Điện mặt trời / Inverter",
    slug: "dien-mat-troi-inverter",
    icon: "Sun",
    services: [
      { name: "Kiểm tra inverter báo lỗi", price: 300000, duration: 60, unit: "máy" },
      { name: "Kiểm tra inverter không phát điện", price: 350000, duration: 75, unit: "máy" },
      { name: "Kiểm tra thiết bị đóng cắt phía AC", price: 220000, duration: 45, unit: "tủ" },
      { name: "Kiểm tra thiết bị bảo vệ phía DC", price: 250000, duration: 50, unit: "tủ" },
      { name: "Kiểm tra hệ thống giám sát mất kết nối", price: 180000, duration: 45, unit: "hệ thống" },
      { name: "Kiểm tra dây dẫn / đầu nối hệ thống", price: 250000, duration: 60, unit: "hệ thống" },
      { name: "Bảo dưỡng phần điện hệ thống", price: 400000, duration: 90, unit: "hệ thống" },
      { name: "Kiểm tra hệ thống tiếp địa", price: 250000, duration: 50, unit: "hệ thống" },
      { name: "Kiểm tra tủ điện năng lượng mặt trời", price: 300000, duration: 60, unit: "tủ" }
    ]
  },
  {
    num: "27",
    target: "Bộ sạc xe điện / Ổ cắm sạc",
    slug: "bo-sac-xe-dien",
    icon: "Car",
    services: [
      { name: "Khảo sát vị trí lắp bộ sạc xe điện", price: 150000, duration: 45, unit: "lần" },
      { name: "Lắp đặt mạch cấp nguồn riêng cho bộ sạc", price: 350000, duration: 90, unit: "mạch" },
      { name: "Lắp đặt bộ sạc xe điện tại nhà", price: 400000, duration: 90, unit: "bộ" },
      { name: "Kiểm tra bộ sạc không cấp điện", price: 200000, duration: 45, unit: "bộ" },
      { name: "Kiểm tra bộ sạc báo lỗi", price: 200000, duration: 45, unit: "bộ" },
      { name: "Kiểm tra ổ cắm sạc phát nóng", price: 160000, duration: 40, unit: "ổ cắm" },
      { name: "Kiểm tra thiết bị bảo vệ nhánh sạc", price: 180000, duration: 40, unit: "nhánh" },
      { name: "Kiểm tra tiếp địa hệ thống sạc", price: 200000, duration: 45, unit: "hệ thống" },
      { name: "Bảo trì hệ thống cấp điện bộ sạc", price: 250000, duration: 60, unit: "hệ thống" }
    ]
  },
  {
    num: "28",
    target: "Dịch vụ kiểm tra / Khảo sát điện",
    slug: "khao-sat-kiem-tra-dien",
    icon: "ClipboardCheck",
    services: [
      { name: "Khảo sát sửa chữa điện tại nhà", price: 100000, duration: 45, unit: "lần" },
      { name: "Kiểm tra sự cố điện chưa xác định", price: 150000, duration: 60, unit: "lần" },
      { name: "Đo điện áp / dòng điện tải", price: 120000, duration: 35, unit: "lần" },
      { name: "Kiểm tra tình trạng cách điện", price: 180000, duration: 45, unit: "lần" },
      { name: "Kiểm tra điểm phát nóng bất thường", price: 150000, duration: 40, unit: "lần" },
      { name: "Đánh giá tải điện hiện tại", price: 180000, duration: 45, unit: "hệ thống" },
      { name: "Khảo sát nâng cấp hệ thống điện", price: 150000, duration: 60, unit: "nhà" },
      { name: "Kiểm tra an toàn điện trước khi sử dụng", price: 150000, duration: 45, unit: "lần" },
      { name: "Lập phương án sửa chữa / lắp đặt điện", price: 200000, duration: 60, unit: "bộ" },
      { name: "Kiểm tra nghiệm thu sau sửa chữa", price: 150000, duration: 45, unit: "lần" }
    ]
  }
];

function generateSlug(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/([^0-9a-z-\s])/g, '')
    .replace(/(\s+)/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

let sql = `-- =========================================================================================
-- FIXGO PRO: SQL SEED CHO 28 ĐỐI TƯỢNG VÀ 286 DỊCH VỤ THUỘC DANH MỤC "SỬA ĐIỆN" (sua-dien)
-- Hỗ trợ Postgres / PostGIS - Tương thích 100% với Prisma Schema FixGo Pro
-- Tự động sinh UUID bằng gen_random_uuid() và kiểm tra tồn tại (ON CONFLICT DO UPDATE)
-- =========================================================================================

DO $$
DECLARE
    v_category_id UUID;
    v_target_id UUID;
BEGIN
    -- 1. Tìm hoặc khởi tạo Danh mục 'Sửa điện'
    SELECT id INTO v_category_id FROM service_categories WHERE slug = 'sua-dien';
    
    IF v_category_id IS NULL THEN
        v_category_id := gen_random_uuid();
        INSERT INTO service_categories (id, name, slug, description, "basePrice", unit, "estimatedMinutes", "warrantyDays", "isActive", "createdAt", "updatedAt")
        VALUES (
            v_category_id,
            'Sửa điện',
            'sua-dien',
            'Khắc phục sự cố điện dân dụng, chập cháy, thay thế công tắc ổ cắm an toàn 100%.',
            80000,
            'lần',
            60,
            30,
            true,
            NOW(),
            NOW()
        );
    END IF;

`;

let targetIndex = 1;
for (const item of rawData) {
  const targetSlug = item.slug;
  const targetName = item.target.replace(/'/g, "''");
  const targetIcon = item.icon;
  const targetDesc = `Các gói dịch vụ chuyên trách cho ${targetName.toLowerCase()}`;

  sql += `    -- -------------------------------------------------------------------------------------\n`;
  sql += `    -- ${item.num}. ĐỐI TƯỢNG: ${item.target} (${item.services.length} dịch vụ)\n`;
  sql += `    -- -------------------------------------------------------------------------------------\n`;
  sql += `    SELECT id INTO v_target_id FROM service_targets WHERE slug = '${targetSlug}';\n`;
  sql += `    IF v_target_id IS NULL THEN\n`;
  sql += `        v_target_id := gen_random_uuid();\n`;
  sql += `        INSERT INTO service_targets (id, "categoryId", name, slug, icon, description, "isActive", "sortOrder", "createdAt", "updatedAt")\n`;
  sql += `        VALUES (v_target_id, v_category_id, '${targetName}', '${targetSlug}', '${targetIcon}', '${targetDesc}', true, ${targetIndex}, NOW(), NOW());\n`;
  sql += `    ELSE\n`;
  sql += `        UPDATE service_targets SET name = '${targetName}', icon = '${targetIcon}', description = '${targetDesc}', "sortOrder" = ${targetIndex}, "updatedAt" = NOW() WHERE id = v_target_id;\n`;
  sql += `    END IF;\n\n`;

  for (const s of item.services) {
    const sName = s.name.replace(/'/g, "''");
    const sSlug = generateSlug(s.name);
    const sPrice = s.price;
    const sDuration = s.duration;
    const sUnit = s.unit;
    const sDesc = `${sName} chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.`;

    sql += `    -- Dịch vụ: ${s.name}\n`;
    sql += `    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")\n`;
    sql += `    VALUES (gen_random_uuid(), v_category_id, v_target_id, '${sName}', '${sSlug}', '${sDesc}', ${sPrice}, '${sUnit}', ${sDuration}, true, NOW(), NOW())\n`;
    sql += `    ON CONFLICT (slug) DO UPDATE SET\n`;
    sql += `        "categoryId" = v_category_id,\n`;
    sql += `        "targetId" = v_target_id,\n`;
    sql += `        name = '${sName}',\n`;
    sql += `        description = '${sDesc}',\n`;
    sql += `        "basePrice" = ${sPrice},\n`;
    sql += `        unit = '${sUnit}',\n`;
    sql += `        "estimatedDurationMin" = ${sDuration},\n`;
    sql += `        "isActive" = true,\n`;
    sql += `        "updatedAt" = NOW();\n\n`;
  }

  targetIndex++;
}

sql += `    RAISE NOTICE 'Hoàn thành seed 28 đối tượng và 286 dịch vụ ngành Sửa điện thành công!';
END $$;
`;

fs.writeFileSync(path.join(__dirname, 'seed_28_targets_286_services_sua_dien.sql'), sql, 'utf8');
console.log('Generated SQL file: seed_28_targets_286_services_sua_dien.sql');
