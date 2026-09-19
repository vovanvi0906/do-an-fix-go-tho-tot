import React from 'react';
import { Cpu, CheckCircle2, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import AiDiagnosticCard from '../components/AiDiagnosticCard';
import { useOrderStore } from '../store/useOrderStore';

const COMMON_ISSUES = [
  { id: 1, name: 'Aptomat tự nhảy liên tục, có mùi khét', tag: 'Điện dân dụng', risk: 'Khẩn cấp' },
  { id: 2, name: 'Máy lạnh thổi gió nhưng không lạnh', tag: 'Điện lạnh', risk: 'Trung bình' },
  { id: 3, name: 'Vòi nước bị rỉ nước liên tục, bục ống', tag: 'Ống nước', risk: 'Cần sửa sớm' },
  { id: 4, name: 'Khóa cửa vân tay báo pin yếu / kẹt chốt', tag: 'Khóa cửa', risk: 'Trung bình' },
];

export default function AiDiagnosisView({ setActiveTab }) {
  // Đọc dữ liệu từ global Zustand store qua hook, không dùng useState cục bộ cho kết quả chẩn đoán
  const { aiDiagnosisResult, currentOrder } = useOrderStore();

  const handleProceedToBooking = () => {
    if (setActiveTab) {
      setActiveTab('services');
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl pb-10">
      {/* Header Container */}
      <div className="pb-4 border-b border-border-subtle">
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-black text-text-primary tracking-tight">
            AI Chẩn Đoán Sự Cố & Dự Báo Chi Phí
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-accent-purple/20 text-accent-purple border border-accent-purple/30">
            FixGo Vision AI
          </span>
        </div>
        <p className="text-xs text-text-secondary mt-1">
          Chụp ảnh thiết bị hư hỏng, hệ thống Computer Vision sẽ nhận diện mức độ hư hại, ước tính chi phí và tự động kết nối thợ phù hợp.
        </p>
      </div>

      {/* Main Diagnostic Card Component */}
      <AiDiagnosticCard />

      {/* Next Step Banner when diagnosis is available */}
      {aiDiagnosisResult && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-accent-blue/15 via-accent-purple/15 to-bg-surface border border-accent-blue/30 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-blue/20 text-accent-blue flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-text-primary">
                Đã có kết quả phân loại: <span className="text-accent-blue font-extrabold">{aiDiagnosisResult.categoryName || 'Dịch vụ chuẩn'}</span>
              </p>
              <p className="text-[11px] text-text-secondary mt-0.5">
                Bạn có thể tiếp tục tiến trình để chọn kỹ thuật viên và địa chỉ phục vụ.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleProceedToBooking}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-accent-blue hover:bg-accent-blue/90 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all shrink-0"
          >
            <span>Tiếp tục đặt lịch</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Common Symptoms / Guide section */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-2">
          <Cpu className="w-4 h-4 text-accent-purple" />
          <span>Các sự cố thường gặp được AI tối ưu hóa nhận diện</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {COMMON_ISSUES.map((issue) => (
            <div
              key={issue.id}
              className="p-4 rounded-2xl bg-bg-surface border border-border-subtle flex items-center justify-between gap-3 shadow-sm hover:border-border-subtle/80 transition-colors"
            >
              <div>
                <h4 className="text-xs font-bold text-text-primary">{issue.name}</h4>
                <p className="text-[11px] text-text-secondary mt-0.5">Lĩnh vực: {issue.tag}</p>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                  issue.risk === 'Khẩn cấp'
                    ? 'bg-accent-red/15 text-accent-red border border-accent-red/30'
                    : 'bg-accent-amber/15 text-accent-amber border border-accent-amber/30'
                }`}
              >
                {issue.risk}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
