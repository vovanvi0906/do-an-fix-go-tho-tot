/**
 * @file AiScanModal.tsx
 * @description Dialog chẩn đoán sự cố thông minh bằng AI Vision FixGo.
 * Hỗ trợ chọn ảnh mô phỏng, quét phân tích và đưa ra ước tính chi phí kèm đề xuất dịch vụ.
 */

import React, { useState } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  X,
  CheckCircle2,
  AlertCircle,
  Wrench,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import type { AiDiagnosisResultDTO } from '../../types/home.types';

interface AiScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDiagnose: (image?: string) => Promise<AiDiagnosisResultDTO>;
  onProceedBooking?: (category: string, service: string) => void;
}

const SAMPLE_ISSUES = [
  {
    label: 'Máy lạnh chảy nước',
    img: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80',
  },
  {
    label: 'Chập điện ổ cắm',
    img: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&q=80',
  },
  {
    label: 'Rò rỉ vòi nước',
    img: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&q=80',
  },
];

/**
 * Component `AiScanModal`
 */
export default function AiScanModal({
  isOpen,
  onClose,
  onDiagnose,
  onProceedBooking,
}: AiScanModalProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<AiDiagnosisResultDTO | null>(null);

  if (!isOpen) return null;

  const handleStartAnalysis = async (imgUrl: string) => {
    setSelectedImage(imgUrl);
    setIsAnalyzing(true);
    setResult(null);

    try {
      const res = await onDiagnose(imgUrl);
      setResult(res);
    } catch (error) {
      console.error('Lỗi phân tích AI:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setResult(null);
    setIsAnalyzing(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-sm rounded-3xl bg-white border border-slate-200/80 shadow-2xl p-5 space-y-4 overflow-hidden relative">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          aria-label="Đóng"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2 pr-8">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-400 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">AI Chẩn đoán sự cố</h3>
            <p className="text-[11px] text-slate-500">Phân tích hình ảnh bằng AI Vision</p>
          </div>
        </div>

        {/* Step 1: Chọn ảnh / Mẫu sự cố nếu chưa có ảnh */}
        {!selectedImage && (
          <div className="space-y-3">
            <div className="border-2 border-dashed border-sky-300/80 rounded-2xl p-6 text-center bg-sky-50/50 hover:bg-sky-50 transition-colors cursor-pointer">
              <Camera className="w-8 h-8 text-sky-500 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-800">Chụp ảnh hoặc tải ảnh lên</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Hỗ trợ JPG, PNG, HEIC (Max 10MB)</p>
            </div>

            {/* Quick Sample Selector */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-600">Hoặc chọn ảnh mẫu thử nghiệm:</span>
              <div className="grid grid-cols-3 gap-2">
                {SAMPLE_ISSUES.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => handleStartAnalysis(item.img)}
                    className="flex flex-col items-center gap-1 p-1.5 rounded-xl border border-slate-200 hover:border-sky-400 bg-white hover:bg-sky-50/50 transition-all text-center"
                  >
                    <img
                      src={item.img}
                      alt={item.label}
                      className="w-full h-14 object-cover rounded-lg"
                    />
                    <span className="text-[10px] font-semibold text-slate-700 line-clamp-1">
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Đang phân tích (Analyzing State) */}
        {selectedImage && isAnalyzing && (
          <div className="space-y-4 py-4 text-center">
            <div className="relative w-28 h-28 mx-auto rounded-2xl overflow-hidden border-2 border-sky-400 shadow-md">
              <img src={selectedImage} alt="Scanning" className="w-full h-full object-cover" />
              <div className="absolute inset-x-0 h-1 bg-sky-400 shadow-[0_0_12px_#38bdf8] animate-bounce top-1/2" />
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>FixGo AI đang phân tích dữ liệu...</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Đang quét các điểm bất thường và đối soát biểu phí
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Kết quả phân tích (Diagnosis Result) */}
        {result && !isAnalyzing && (
          <div className="space-y-3.5 animate-in fade-in duration-200">
            {/* Image Preview & Confidence Badge */}
            <div className="flex items-center gap-3 p-2 rounded-2xl bg-slate-50 border border-slate-200/80">
              <img
                src={selectedImage || ''}
                alt="Analyzed"
                className="w-14 h-14 rounded-xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="text-xs font-bold text-slate-900 truncate">
                    {result.issueCategory}
                  </span>
                </div>
                <span className="inline-block mt-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                  Độ tin cậy {(result.confidence * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="p-3 rounded-2xl bg-sky-50/70 border border-sky-200/70 space-y-1">
              <div className="text-[11px] font-bold text-sky-900 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-sky-600" />
                <span>Nguyên nhân chẩn đoán:</span>
              </div>
              <p className="text-xs text-sky-800 leading-relaxed">{result.description}</p>
            </div>

            {/* Price Estimation */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900 text-white">
              <div>
                <span className="text-[10px] text-slate-400">Chi phí sửa chữa ước tính</span>
                <div className="text-sm font-extrabold text-amber-400">
                  {result.estimatedCostMin.toLocaleString('vi-VN')} -{' '}
                  {result.estimatedCostMax.toLocaleString('vi-VN')} đ
                </div>
              </div>
              <Wrench className="w-5 h-5 text-sky-400" />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 py-2 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 active:scale-95 transition-all"
              >
                Quét ảnh khác
              </button>

              <button
                type="button"
                onClick={() => {
                  onProceedBooking?.(result.issueCategory, result.recommendedServices[0] || '');
                  onClose();
                }}
                className="flex-1 py-2 rounded-full bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 active:scale-95 transition-all inline-flex items-center justify-center gap-1 shadow-md shadow-blue-500/20"
              >
                <span>Đặt thợ ngay</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
