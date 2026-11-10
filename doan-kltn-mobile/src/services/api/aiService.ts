import { apiClient } from './apiClient';

export interface AiDiagnosisResponse {
  requestId: string;
  status: 'suggested' | 'needs_more_info' | 'manual_selection' | 'unavailable';
  source: 'model' | 'rules' | 'manual' | 'unavailable';
  suggestedCategoryId: string | null;
  categoryName: string;
  suggestedServiceId: string | null;
  suggestedServiceName: string | null;
  suggestedServiceConfidence: number | null;
  confidence: number | null;
  detectedLabels: string[];
  estimatedPriceRange: { min: number; max: number | null; formatted?: string } | null;
  estimatedPrice: { min: number; max: number | null };
  notes: string;
  imageUrl: string;
  requiresManualSelection: boolean;
  questions: Array<{ id: string; label: string; options: Array<{ value: string; label: string }> }>;
  availableCategories: Array<{ id: string; name: string; basePrice: number }>;
  availableServices: Array<{ id: string; name: string; basePrice: number; unit?: string }>;
}

export async function diagnoseIssueImage(
  imageUri: string,
  description = '',
  answers: Record<string, string> = {},
): Promise<AiDiagnosisResponse> {
  let response: any;
  const isLocal = /^(file:|content:|ph:|blob:)/.test(imageUri);
  if (isLocal) {
    const form = new FormData();
    if (imageUri.startsWith('blob:')) {
      const blob = await (await fetch(imageUri)).blob();
      form.append('image', blob, 'incident.jpg');
    } else {
      const name = imageUri.split('/').pop() || 'incident.jpg';
      const ext = name.split('.').pop()?.toLowerCase();
      form.append('image', { uri: imageUri, name,
        type: ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg' } as any);
    }
    form.append('description', description);
    form.append('answers', JSON.stringify(answers));
    response = await apiClient.post('/orders/diagnose-upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' }, timeout: 45000,
    });
  } else {
    response = await apiClient.post('/orders/diagnose', { imageUrl: imageUri, description, answers }, { timeout: 30000 });
  }
  // Không tự sinh chẩn đoán khi kết nối thất bại hoặc contract không hợp lệ.
  if (!response || !['suggested', 'needs_more_info', 'manual_selection', 'unavailable'].includes(response.status)) {
    throw new Error('Kết quả chẩn đoán chưa hợp lệ. Vui lòng thử lại.');
  }
  return {
    ...response,
    categoryName: response.suggestedCategoryName ?? 'Chọn dịch vụ',
    notes: response.message ?? '',
    confidence: response.confidence ?? null,
    estimatedPrice: { min: response.estimatedPriceMin ?? 0, max: response.estimatedPriceMax ?? null },
    imageUrl: response.imageUrl ?? imageUri,
  };
}
