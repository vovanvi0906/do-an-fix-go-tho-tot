export const AI01_PAGES = {
  permissions: 'Quản lý nhân sự AI / Phân quyền AI',
  overview: 'Tổng quan Dataset', mapping: 'Duyệt Mapping', annotation: 'Gán nhãn ảnh',
  adjudication: 'Phân xử nhãn', sources: 'Kiểm nguồn / ảnh trùng', export: 'Kiểm điều kiện & xuất Ground Truth',
};
export const PAGE_ROLES = { overview: ['coordinator','reviewer_a','reviewer_b','adjudicator','viewer'], mapping: ['coordinator'], annotation: ['reviewer_a','reviewer_b'], adjudication: ['coordinator','adjudicator'], sources: ['coordinator'], export: ['coordinator'] };
export const ROLE_LABELS = { coordinator: 'Điều phối', reviewer_a: 'Reviewer A', reviewer_b: 'Reviewer B', adjudicator: 'Người phân xử', viewer: 'Chỉ xem' };
export const DECISIONS = { submitted:'Nộp nhãn độc lập', uncertain:'Chưa chắc', needsExpertReview:'Cần chuyên gia', reject:'Loại ảnh', approved:'Duyệt nhãn cuối', accepted:'Xác nhận đề xuất', revised:'Chỉnh mapping', rejected:'Từ chối mapping', pending:'Chờ duyệt' };
export const CONDITIONS = { abnormal_visible:'Có bất thường nhìn thấy', no_abnormality_visible:'Không thấy bất thường (không khẳng định thiết bị tốt)', difficult:'Ảnh khó / thiếu bằng chứng', out_of_scope:'Ngoài phạm vi' };
export const SIGNS = { water_drip:'Nước nhỏ giọt',water_spray:'Nước phun/rò nhìn thấy',wet_surface:'Bề mặt ướt',stain_or_discoloration:'Vết ố/đổi màu',crack:'Vết nứt',broken_part:'Chi tiết gãy/vỡ',surface_soiling:'Bụi/bẩn',bird_droppings:'Vết giống phân chim',leaf_debris:'Lá/rác bám',leaf_spots_or_damage:'Đốm/tổn thương lá',burn_mark:'Vết cháy',exposed_wire:'Dây điện hở',other_visible_sign:'Dấu hiệu khác (ghi lý do)' };
export const EMPTY_LABELS = { category:null,target:null,visibleFault:null,symptom:null,recommendedService:null,unknown:null,needsInspection:null };
export const SOURCE_FIELDS = { licenseOrConsent:'License/consent thực tế',rightsEvidence:'Bằng chứng quyền sử dụng/attribution',sourceEvidence:'Bằng chứng nguồn ảnh',deviceId:'deviceId do nguồn cung cấp (không có thì trống)',sessionId:'sessionId do nguồn cung cấp',siteId:'siteId do nguồn cung cấp (không bắt buộc)',identityEvidence:'Bằng chứng ID do nguồn cung cấp',duplicateGroup:'duplicateGroup đã duyệt (không phải deviceId)',groupEvidence:'Bằng chứng duyệt SHA/pHash/nhóm nguồn' };
export const message = e => e.response?.data?.message || e.friendlyMessage || e.message || 'Không hoàn tất yêu cầu review.';
