import React, { useState } from 'react';
import { Settings, Phone, MessageSquare, HelpCircle, Shield, Globe, Bell, Send, CheckCircle2 } from 'lucide-react';

const FAQS = [
  { q: 'Thợ không đến đúng giờ thì phải làm sao?', a: 'Bạn có thể gọi trực tiếp cho thợ qua số điện thoại hiển thị trên đơn hoặc gọi hotline 1900.8888 để được hỗ trợ đổi thợ khác ngay lập tức.' },
  { q: 'Tôi có thể thanh toán bằng những hình thức nào?', a: 'Bạn có thể thanh toán tiền mặt trực tiếp cho thợ hoặc thanh toán qua ví điện tử FixGo Pay, VNPay QR và chuyển khoản ngân hàng.' },
  { q: 'Dịch vụ được bảo hành như thế nào?', a: 'Tất cả dịch vụ hoàn thành trên FixGo được bảo hành 30 ngày. Nếu sự cố tái diễn, thợ sẽ đến bảo hành miễn phí.' },
];

export default function SettingsSupportView() {
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmitFeedback = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setFeedback('');
    setTimeout(() => setSubmitted(false), 3500);
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl font-black text-white tracking-tight">Cài Đặt Hệ Thống & Trung Tâm Trợ Giúp</h1>
        <p className="text-xs text-slate-400 mt-1">
          Hỗ trợ khách hàng 24/7, câu hỏi thường gặp và tùy chỉnh thông báo.
        </p>
      </div>

      {/* Support Contacts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-950/60 to-slate-900 border border-blue-500/30 flex items-center gap-4 shadow-xl">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            <Phone className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-blue-300 uppercase">Tổng đài khẩn cấp 24/7</span>
            <p className="text-lg font-black text-white">1900 8888</p>
            <p className="text-[11px] text-slate-400">Miễn phí cước gọi từ mọi nhà mạng</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-500/30 flex items-center gap-4 shadow-xl">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-emerald-300 uppercase">Chat trực tuyến CSKH</span>
            <p className="text-lg font-black text-white">support@fixgo.vn</p>
            <p className="text-[11px] text-slate-400">Phản hồi trong vòng 5 phút</p>
          </div>
        </div>
      </div>

      {/* FAQs */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-amber-400" />
          <span>Câu hỏi thường gặp (FAQ)</span>
        </h3>

        <div className="space-y-2.5">
          {FAQS.map((faq, i) => (
            <div key={i} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5 shadow-md">
              <h4 className="text-xs font-bold text-white">❓ {faq.q}</h4>
              <p className="text-xs text-slate-400 leading-relaxed pl-5">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Feedback Form */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Gửi phản hồi / Khiếu nại dịch vụ</h3>

        {submitted && (
          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Phản hồi của bạn đã được tiếp nhận. Đội ngũ CSKH sẽ liên hệ lại sớm nhất!</span>
          </div>
        )}

        <form onSubmit={handleSubmitFeedback} className="space-y-3">
          <textarea
            rows={3}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            required
            placeholder="Nhập nội dung phản hồi, đánh giá thái độ thợ hoặc yêu cầu khiếu nại hoàn tiền..."
            className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25 flex items-center gap-2 cursor-pointer transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>GỬI PHẢN HỒI CHO BAN QUẢN TRỊ</span>
          </button>
        </form>
      </div>
    </div>
  );
}
