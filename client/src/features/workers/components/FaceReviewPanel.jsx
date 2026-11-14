import React, { useEffect, useRef, useState } from "react";
import { faceReviewService } from "../services/faceReviewService";

export default function FaceReviewPanel({ workerId }) {
  const [request, setRequest] = useState(null),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false);
  const [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [reference, setReference] = useState(""),
    [digest, setDigest] = useState(""),
    [reason, setReason] = useState(""),
    [reviewed, setReviewed] = useState(false);
  const generation = useRef(0);
  const load = async (signal) => {
    const attempt = ++generation.current;
    setLoading(true);
    setError("");
    try {
      const result = await faceReviewService.pending(workerId, signal);
      if (attempt === generation.current) setRequest(result.request);
    } catch (e) {
      if (attempt === generation.current && !signal?.aborted)
        setError(e.response?.data?.message || "Chưa tải được yêu cầu FaceID.");
    } finally {
      if (attempt === generation.current) setLoading(false);
    }
  };
  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => {
      generation.current++;
      controller.abort();
    };
  }, [workerId]);
  const approve = async (event) => {
    event.preventDefault();
    if (busy || !request || !reviewed) return;
    setBusy(true);
    setError("");
    const attempt = generation.current;
    try {
      await faceReviewService.approve(workerId, {
        requestId: request.id,
        kind: request.kind,
        reviewedIdentity: true,
        evidenceReference: reference.trim(),
        evidenceDigest: digest.trim(),
        reason: reason.trim(),
        expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      });
      if (attempt !== generation.current) return;
      setRequest(null);
      setNotice(
        "Đã ghi nhận kiểm tra danh tính. Thợ có thể đăng ký khi các điều kiện AI đã sẵn sàng.",
      );
    } catch (e) {
      if (attempt === generation.current)
        setError(
          e.response?.data?.message || "Chưa lưu được kiểm tra danh tính.",
        );
    } finally {
      if (attempt === generation.current) setBusy(false);
    }
  };
  const reject = async () => {
    if (busy || !request || !reason.trim()) return;
    setBusy(true);
    setError("");
    const attempt = generation.current;
    try {
      await faceReviewService.reject(workerId, {
        requestId: request.id,
        reason: reason.trim(),
      });
      if (attempt === generation.current) {
        setRequest(null);
        setNotice("Đã từ chối yêu cầu. Mẫu hiện có được giữ nguyên.");
      }
    } catch (e) {
      if (attempt === generation.current)
        setError(e.response?.data?.message || "Chưa từ chối được yêu cầu.");
    } finally {
      if (attempt === generation.current) setBusy(false);
    }
  };
  const input =
    "w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent p-2 text-xs";
  return (
    <section className="border border-emerald-800/40 rounded-xl p-4 space-y-3 text-slate-700 dark:text-slate-200">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-sm">Kiểm tra danh tính FaceID</h3>
        <button
          type="button"
          disabled={loading || busy}
          onClick={() => load()}
          className="text-xs text-emerald-600"
        >
          Tải lại
        </button>
      </div>
      {loading ? (
        <div
          className="h-8 rounded bg-slate-400/20 animate-pulse"
          aria-label="Đang tải yêu cầu FaceID"
        />
      ) : request ? (
        <form onSubmit={approve} className="space-y-3">
          <p className="text-xs">
            {request.kind === "REENROLLMENT"
              ? "Yêu cầu cấp lại mẫu"
              : "Yêu cầu đăng ký lần đầu"}{" "}
            · {new Date(request.submittedAt).toLocaleString("vi-VN")}
          </p>
          <p className="text-xs text-amber-600">
            Chỉ xác nhận sau khi đã kiểm tra danh tính thực tế. Duyệt cấp lại sẽ
            thu hồi và xóa mẫu/proof cũ. Phiếu duyệt có hiệu lực 7 ngày.
          </p>
          <label className="block text-xs">
            Mã bằng chứng kiểm tra
            <input
              aria-label="Mã bằng chứng kiểm tra"
              required
              pattern="[a-zA-Z0-9:_-]{1,128}"
              maxLength={128}
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className={input}
            />
          </label>
          <label className="block text-xs">
            SHA-256 của bằng chứng
            <input
              aria-label="SHA-256 của bằng chứng"
              required
              pattern="[a-f0-9]{64}"
              maxLength={64}
              value={digest}
              onChange={(e) => setDigest(e.target.value)}
              className={input}
            />
          </label>
          <label className="block text-xs">
            Ghi chú / lý do
            <textarea
              aria-label="Ghi chú kiểm tra FaceID"
              required
              maxLength={160}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={input}
            />
          </label>
          <label className="flex gap-2 text-xs">
            <input
              type="checkbox"
              checked={reviewed}
              onChange={(e) => setReviewed(e.target.checked)}
            />
            Tôi đã đối chiếu danh tính của người đăng ký
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!reviewed || busy || !reason.trim()}
              className="rounded-lg px-3 py-2 bg-emerald-600 text-white text-xs disabled:opacity-40"
            >
              Ghi nhận đã kiểm tra
            </button>
            <button
              type="button"
              disabled={busy || !reason.trim()}
              onClick={reject}
              className="rounded-lg px-3 py-2 border border-red-500 text-red-500 text-xs disabled:opacity-40"
            >
              Từ chối yêu cầu
            </button>
          </div>
        </form>
      ) : (
        <p className="text-xs text-slate-500">
          {notice || "Không có yêu cầu FaceID đang chờ."}
        </p>
      )}
      {error && (
        <p role="alert" className="text-xs text-red-500">
          {typeof error === "string" ? error : "Chưa xử lý được yêu cầu."}
        </p>
      )}
    </section>
  );
}
