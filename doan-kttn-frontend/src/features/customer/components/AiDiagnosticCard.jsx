import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Camera,
  Upload,
  AlertCircle,
  CheckCircle2,
  X,
  ChevronDown,
  ShieldAlert,
  Tag,
  DollarSign,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useOrderStore } from '../store/useOrderStore';
import { diagnoseImage } from '../services/orderApi';
import customerOrderService from '../services/customerOrderService';
import { formatCurrency } from '../../../utils/formatCurrency';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function AiDiagnosticCard({ onContinueBooking }) {
  const {
    aiDiagnosisResult,
    isLoading,
    error,
    setDiagnosisResult,
    setLoading,
    setError,
  } = useOrderStore();

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [fileError, setFileError] = useState('');
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [services, setServices] = useState([]);

  const fileInputRef = useRef(null);
  const previewUrlRef = useRef('');

  // Tải danh sách dịch vụ từ customerOrderService đã có sẵn để dùng cho dropdown thủ công
  useEffect(() => {
    let isMounted = true;
    customerOrderService
      .getServices()
      .then((data) => {
        if (isMounted && Array.isArray(data)) {
          setServices(data);
        }
      })
      .catch((err) => {
        console.warn('Lỗi tải danh mục dịch vụ:', err.message);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Cleanup Object URL khi unmount tránh leak memory
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  // Xử lý khi người dùng chọn ảnh
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setFileError('');
    setError(null);

    if (!file) return;

    // Validate định dạng file
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setFileError('Định dạng ảnh không hợp lệ. Vui lòng chỉ chọn ảnh PNG hoặc JPEG/JPG.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validate kích thước file <= 5MB
    if (file.size > MAX_FILE_SIZE) {
      const currentSizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setFileError(`Dung lượng ảnh vượt quá giới hạn 5MB (kích thước hiện tại: ${currentSizeMb}MB). Vui lòng chọn ảnh nhẹ hơn.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Thu hồi URL cũ nếu có
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }

    const newUrl = URL.createObjectURL(file);
    previewUrlRef.current = newUrl;
    setSelectedFile(file);
    setPreviewUrl(newUrl);
  };

  // Xoá ảnh đã chọn
  const handleRemoveFile = (e) => {
    e.stopPropagation();
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = '';
    }
    setSelectedFile(null);
    setPreviewUrl('');
    setFileError('');
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Kích hoạt phân tích AI
  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setFileError('Vui lòng chọn hoặc chụp ảnh hiện trường trước khi phân tích.');
      return;
    }

    setFileError('');
    setError(null);
    setLoading(true);

    try {
      const result = await diagnoseImage(selectedFile);
      setDiagnosisResult(result);
    } catch (err) {
      const errMsg =
        err.friendlyMessage ||
        err.response?.data?.message ||
        err.message ||
        'Không thể phân tích ảnh qua AI. Vui lòng kiểm tra lại kết nối mạng.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Người dùng tự chọn dịch vụ thủ công thay thế AI
  const handleSelectManualCategory = (serviceItem) => {
    setDiagnosisResult({
      suggestedCategoryId: serviceItem.id,
      categoryName: serviceItem.name || serviceItem.category,
      confidence: 1.0,
      detectedLabels: [serviceItem.category || 'Tự chọn thủ công'],
      estimatedPrice: serviceItem.basePrice || 150000,
      isManualSelection: true,
    });
    setIsManualOpen(false);
    setError(null);
  };

  // Tính toán màu cho thanh độ tin cậy (Confidence Bar)
  const confidencePercent = Math.round((aiDiagnosisResult?.confidence || 0) * 100);
  const getConfidenceLevel = (confidence) => {
    const val = (confidence || 0) * 100;
    if (val >= 80) {
      return {
        label: 'Độ tin cậy cao',
        barColor: 'bg-accent-green',
        textColor: 'text-accent-green',
        badgeBg: 'bg-accent-green/15 text-accent-green border-accent-green/30',
      };
    }
    if (val >= 50) {
      return {
        label: 'Độ tin cậy trung bình',
        barColor: 'bg-accent-amber',
        textColor: 'text-accent-amber',
        badgeBg: 'bg-accent-amber/15 text-accent-amber border-accent-amber/30',
      };
    }
    return {
      label: 'Độ tin cậy thấp (< 50%)',
      barColor: 'bg-accent-red',
      textColor: 'text-accent-red',
      badgeBg: 'bg-accent-red/15 text-accent-red border-accent-red/30',
    };
  };

  const confidenceMeta = getConfidenceLevel(aiDiagnosisResult?.confidence);

  return (
    <section className="relative overflow-hidden rounded-3xl bg-bg-surface border border-border-subtle p-6 sm:p-8 shadow-2xl space-y-6">
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-accent-purple/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-60 h-60 bg-accent-blue/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-accent-blue to-accent-purple flex items-center justify-center text-white shadow-lg shadow-accent-purple/20 shrink-0">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-text-primary tracking-tight">
                AI Chẩn Đoán Sự Cố & Phân Loại
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-accent-purple/20 text-accent-purple border border-accent-purple/30">
                FixGo AI 2.0
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-0.5">
              Chụp hoặc tải ảnh hiện trường để Computer Vision nhận diện sự cố và đề xuất thợ chuyên môn
            </p>
          </div>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/png,image/jpeg,image/jpg"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Upload Box / Image Preview */}
      {!previewUrl ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="relative group border-2 border-dashed border-border-subtle hover:border-accent-blue/60 rounded-2xl p-8 bg-bg-base/60 hover:bg-bg-base/90 transition-all text-center cursor-pointer space-y-3"
        >
          <div className="w-14 h-14 rounded-2xl bg-accent-blue/10 border border-accent-blue/20 text-accent-blue flex items-center justify-center mx-auto group-hover:scale-110 transition-transform shadow-md">
            <Camera className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-bold text-text-primary group-hover:text-accent-blue transition-colors">
              Chụp ảnh hoặc Kéo thả hình ảnh thiết bị hư hỏng tại đây
            </p>
            <p className="text-xs text-text-secondary mt-1">
              Hỗ trợ định dạng PNG, JPG, JPEG (Tối đa 5MB)
            </p>
          </div>
        </div>
      ) : (
        <div className="relative rounded-2xl overflow-hidden border border-border-subtle bg-bg-base group aspect-video sm:aspect-[21/9] max-h-64 flex items-center justify-center">
          <img
            src={previewUrl}
            alt="Hiện trường sự cố"
            className="w-full h-full object-contain"
          />
          <button
            type="button"
            onClick={handleRemoveFile}
            className="absolute top-3 right-3 p-2 rounded-xl bg-bg-base/80 hover:bg-accent-red text-text-secondary hover:text-white transition-all backdrop-blur-md cursor-pointer shadow-lg"
            title="Xóa ảnh này"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-bg-base/80 backdrop-blur-md text-[11px] text-text-secondary border border-border-subtle">
            {selectedFile?.name} ({(selectedFile?.size / (1024 * 1024)).toFixed(2)} MB)
          </div>
        </div>
      )}

      {/* Validation Error Message */}
      {fileError && (
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-accent-red/10 border border-accent-red/30 text-accent-red text-xs font-semibold animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{fileError}</span>
        </div>
      )}

      {/* API Error Message */}
      {error && (
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-accent-red/10 border border-accent-red/30 text-accent-red text-xs font-semibold animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Action Button */}
      <button
        type="button"
        onClick={handleAnalyze}
        disabled={isLoading || !selectedFile}
        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-accent-blue via-accent-purple to-pink-600 hover:from-accent-blue/90 hover:to-pink-500 text-white font-bold text-xs shadow-lg shadow-accent-blue/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>MẠNG NƠ-RON COMPUTER VISION ĐANG PHÂN TÍCH...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>PHÂN TÍCH HIỆN TRƯỜNG BẰNG AI</span>
          </>
        )}
      </button>

      {/* ======================================================== */}
      {/* AI RESULT PRESENTATION CARD */}
      {/* ======================================================== */}
      {aiDiagnosisResult && (
        <div className="p-5 rounded-2xl bg-bg-base border border-border-subtle space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-accent-green" />
              <span className="text-xs font-bold text-text-primary">
                {aiDiagnosisResult.isManualSelection
                  ? 'Danh mục đã chọn thủ công'
                  : 'Kết quả phân tích từ AI Model'}
              </span>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${confidenceMeta.badgeBg}`}>
              {confidenceMeta.label} ({confidencePercent}%)
            </span>
          </div>

          {/* Confidence Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-text-secondary">Độ tin cậy thuật toán:</span>
              <span className={`font-bold ${confidenceMeta.textColor}`}>{confidencePercent}%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${confidenceMeta.barColor}`}
                style={{ width: `${Math.min(100, Math.max(8, confidencePercent))}%` }}
              />
            </div>
          </div>

          {/* Low confidence alert */}
          {aiDiagnosisResult.confidence < 0.5 && !aiDiagnosisResult.isManualSelection && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-accent-red/10 border border-accent-red/30 text-accent-red text-xs">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Độ tin cậy quá thấp (&lt; 50%)</p>
                <p className="text-[11px] opacity-90 mt-0.5">
                  Hình ảnh có thể bị mờ hoặc góc chụp chưa bao quát. Vui lòng kiểm tra lại ảnh hoặc chọn dịch vụ thủ công bên dưới.
                </p>
              </div>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-bg-surface border border-border-subtle">
              <span className="text-[11px] text-text-secondary flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-accent-blue" />
                Dịch vụ đề xuất:
              </span>
              <p className="text-sm font-bold text-text-primary mt-1">
                {aiDiagnosisResult.categoryName || 'Chưa nhận diện danh mục'}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-bg-surface border border-border-subtle">
              <span className="text-[11px] text-text-secondary flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-accent-green" />
                Chi phí ước tính:
              </span>
              <p className="text-sm font-bold text-accent-green mt-1">
                {aiDiagnosisResult.estimatedPrice
                  ? formatCurrency(aiDiagnosisResult.estimatedPrice)
                  : 'Chờ thợ khảo sát'}
              </p>
            </div>
          </div>

          {/* Detected Object Labels */}
          {Array.isArray(aiDiagnosisResult.detectedLabels) && aiDiagnosisResult.detectedLabels.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] text-text-secondary">Dấu hiệu nhận dạng:</span>
              <div className="flex flex-wrap gap-1.5">
                {aiDiagnosisResult.detectedLabels.map((lbl, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-lg bg-bg-surface border border-border-subtle text-[11px] text-text-primary font-medium"
                  >
                    #{lbl}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Manual Selection Dropdown Toggle */}
          <div className="pt-2 border-t border-border-subtle">
            <button
              type="button"
              onClick={() => setIsManualOpen(!isManualOpen)}
              className="text-xs text-accent-blue hover:text-accent-purple font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Không đúng? Tự chọn dịch vụ</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  isManualOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isManualOpen && (
              <div className="mt-3 space-y-2 p-3 rounded-xl bg-bg-surface border border-border-subtle animate-in fade-in duration-200 max-h-56 overflow-y-auto">
                <p className="text-[11px] text-text-secondary font-medium">
                  Chọn dịch vụ bạn cần trong danh sách khả dụng:
                </p>
                <div className="grid grid-cols-1 gap-1.5">
                  {services.map((srv) => (
                    <button
                      key={srv.id}
                      type="button"
                      onClick={() => handleSelectManualCategory(srv)}
                      className="w-full p-2.5 rounded-lg hover:bg-bg-base border border-transparent hover:border-border-subtle text-left flex items-center justify-between transition-colors cursor-pointer group"
                    >
                      <div>
                        <div className="text-xs font-bold text-text-primary group-hover:text-accent-blue">
                          {srv.name}
                        </div>
                        <div className="text-[10px] text-text-secondary">
                          {srv.category} {srv.basePrice ? `• Từ ${formatCurrency(srv.basePrice)}` : ''}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-accent-blue opacity-0 group-hover:opacity-100 transition-opacity">
                        Chọn
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
