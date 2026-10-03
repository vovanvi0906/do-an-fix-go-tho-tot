import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';

/**
 * eSMS Service – Tích hợp gửi SMS OTP qua eSMS.vn API
 * Endpoint: http://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_post_json
 */
@Injectable()
export class EsmsService {
  constructor() {
    this.logger = new Logger(EsmsService.name);
    this.apiUrl =
      process.env.ESMS_API_URL ||
      'http://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_post_json';
  }

  /**
   * 1. Chuẩn hóa số điện thoại trước khi gửi sang eSMS:
   * Hỗ trợ các định dạng:
   * - "0366192248"  -> "0366192248"
   * - "+84366192248" -> "0366192248"
   * - "84366192248"  -> "0366192248"
   * - "366192248"    -> "0366192248" (tự thêm số 0 ở đầu)
   * - Kèm khoảng trắng, dấu gạch ngang, v.v.
   *
   * @param {string} phone
   * @returns {string} Số điện thoại chuẩn 10 chữ số tại Việt Nam
   */
  normalizePhone(phone) {
    if (!phone) return '';

    // Loại bỏ toàn bộ ký tự không phải số
    let cleaned = phone.toString().replace(/\D/g, '');

    // Nếu bắt đầu bằng 84 (ví dụ 84366192248) -> chuyển thành 0366192248
    if (cleaned.startsWith('84') && cleaned.length >= 11) {
      cleaned = '0' + cleaned.slice(2);
    }
    // Nếu người dùng nhập 9 số (ví dụ 366192248) -> tự bổ sung 0 ở đầu
    else if (!cleaned.startsWith('0') && cleaned.length === 9) {
      cleaned = '0' + cleaned;
    }

    return cleaned;
  }

  /**
   * 2. Gửi tin nhắn SMS OTP qua eSMS API
   * @param {string} phone - Số điện thoại người nhận
   * @param {string} otpCode - Mã OTP 6 chữ số
   * @returns {Promise<{ success: boolean, smsId: string, codeResult: string, message: string }>}
   */
  async sendOtpSms(phone, otpCode) {
    const apiKey = process.env.ESMS_API_KEY || '82571DA6FC34F8BD5A1CFCD5F7951D';
    const secretKey =
      process.env.ESMS_SECRET_KEY || '76CB6899A3234645B37696368681D2';
    const brandname = (process.env.ESMS_BRANDNAME || '').trim();
    const smsType = process.env.ESMS_SMS_TYPE || '2';
    const sandbox = process.env.ESMS_SANDBOX || '0';

    // Chuẩn hóa số điện thoại
    const recipientPhone = this.normalizePhone(phone);
    if (!recipientPhone || recipientPhone.length < 10) {
      const err = `Số điện thoại "${phone}" không đúng định dạng (yêu cầu 10 chữ số).`;
      this.logger.error(err);
      throw new BadRequestException(err);
    }

    // Nội dung tin nhắn khớp 100% từng chữ với template Brandname Baotrixemay đã duyệt (TempId: 458)
    const content = `${otpCode} la ma xac minh dang ky Baotrixemay cua ban`;
    const requestId = crypto.randomUUID
      ? crypto.randomUUID()
      : crypto.randomBytes(16).toString('hex');

    // Cấu hình Payload theo đặc tả eSMS API
    const payload = {
      ApiKey: apiKey,
      SecretKey: secretKey,
      Phone: recipientPhone,
      Content: content,
      SmsType: smsType,
      Brandname: brandname || 'Baotrixemay', // Brandname CSKH đã duyệt trên eSMS
      IsUnicode: '0',
      Sandbox: sandbox,
      RequestId: requestId,
    };

    this.logger.log(
      `📨 [eSMS] Đang gửi SMS OTP đến số: ${recipientPhone} (Brandname: "${payload.Brandname}", Content: "${content}")`,
    );

    let response;
    try {
      response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (networkError) {
      console.error(
        '❌ [eSMS Network Error] Không thể kết nối tới máy chủ eSMS:',
        networkError,
      );
      throw new BadRequestException(
        `Lỗi kết nối tới máy chủ eSMS: ${networkError.message}`,
      );
    }

    if (!response.ok) {
      const httpError = `eSMS HTTP Error: ${response.status} ${response.statusText}`;
      console.error('❌ [eSMS HTTP Error]:', httpError);
      throw new BadRequestException(httpError);
    }

    const data = await response.json();
    this.logger.log(`📬 [eSMS Response]: ${JSON.stringify(data)}`);

    // 3. Xử lý phản hồi từ eSMS (Error Handling):
    // Chỉ coi là thành công khi CodeResult === "100" hoặc CodeResult === 100
    const isSuccess = data?.CodeResult === '100' || data?.CodeResult === 100;

    if (isSuccess) {
      this.logger.log(
        `✅ [eSMS] Gửi SMS OTP thành công tới: ${recipientPhone}, SMSID: ${data.SMSID}`,
      );
      return {
        success: true,
        smsId: data.SMSID,
        codeResult: String(data.CodeResult),
        message: 'Gửi tin nhắn SMS thành công qua eSMS',
      };
    }

    // Nếu CodeResult !== "100" -> In console.error chi tiết và throw Exception
    const errorMap = {
      101: 'Đăng nhập thất bại (ApiKey hoặc SecretKey không chính xác)',
      102: 'Tài khoản eSMS đã bị khóa',
      103: 'Tài khoản eSMS không đủ tiền để gửi tin nhắn (Số dư dưới mức tối thiểu)',
      104: `Brandname "${brandname || 'Baotrixemay'}" chưa được duyệt hoặc không tồn tại trên tài khoản eSMS`,
      105: 'Nội dung tin nhắn chứa từ ngữ bị chặn/spam',
      106: 'Loại tin nhắn (SmsType) không hợp lệ',
      118: 'Loại tin nhắn (SmsType) không được cấp quyền cho tài khoản này',
      146: 'Sai template Brandname CSKH (Nội dung tin nhắn không khớp với mẫu template đã được duyệt)',
      99: 'Lỗi không xác định từ hệ thống eSMS',
    };

    const errorDesc =
      data?.ErrorMessage ||
      errorMap[data?.CodeResult] ||
      `Lỗi eSMS mã: ${data?.CodeResult}`;
    const detailedMessage = `Gửi SMS thất bại qua eSMS: [Mã ${data?.CodeResult}] ${errorDesc}`;

    console.error('❌ [eSMS API Error Details]:', {
      codeResult: data?.CodeResult,
      errorMessage: data?.ErrorMessage,
      errorDesc,
      phone: recipientPhone,
      brandname: payload.Brandname,
      smsType: payload.SmsType,
      endpoint: this.apiUrl,
    });

    // Ném lỗi trực tiếp để Controller bắt và báo lỗi rõ ràng về Mobile
    throw new BadRequestException(detailedMessage);
  }
}
