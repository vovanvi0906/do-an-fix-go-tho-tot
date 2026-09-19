/**
 * Utility functions for date and time formatting in FixGo Pro
 */

/**
 * Định dạng ngày giờ chuẩn Việt Nam: HH:mm • DD/MM/YYYY (ví dụ: 22:33 • 04/09/2026)
 * @param {string | Date} dateString - Chuỗi ISO hoặc đối tượng Date
 * @returns {string} Chuỗi ngày giờ rõ ràng, tránh nhầm lẫn ngày/tháng
 */
export const formatVietnameseDateTime = (dateString) => {
  if (!dateString) return '--:-- • --/--/----';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return String(dateString);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${hours}:${minutes} • ${day}/${month}/${year}`;
  } catch {
    return String(dateString);
  }
};

/**
 * Định dạng ngày tháng tổng quát
 * @param {string | Date} dateString
 * @returns {string}
 */
export const formatDate = (dateString) => {
  return formatVietnameseDateTime(dateString);
};

export default formatVietnameseDateTime;
