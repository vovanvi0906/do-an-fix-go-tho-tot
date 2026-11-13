import { BadRequestException } from '@nestjs/common';

const ALLOWED_ANSWER_KEYS = ['categoryId', 'targetId', 'serviceId', 'symptom'];

export function validateDiagnosisInput(input) {
  const { imageUrl, description = '', answers = {} } = input || {};
  if (
    typeof imageUrl !== 'string' ||
    !imageUrl.trim() ||
    typeof description !== 'string' ||
    !answers ||
    typeof answers !== 'object' ||
    Array.isArray(answers)
  ) {
    throw new BadRequestException('Dữ liệu chẩn đoán không hợp lệ');
  }

  for (const key of Object.keys(answers)) {
    if (!ALLOWED_ANSWER_KEYS.includes(key) || typeof answers[key] !== 'string') {
      throw new BadRequestException('Câu trả lời không hợp lệ');
    }
  }

  if (answers.serviceId && answers.symptom) {
    throw new BadRequestException('Chỉ chọn một dịch vụ hoặc một triệu chứng');
  }

  if ((answers.serviceId || answers.symptom) && !answers.categoryId) {
    throw new BadRequestException('Vui lòng chọn danh mục trước');
  }
}
