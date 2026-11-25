import {SIGNS} from './constants';
export const DATASET_NAMES = {admin_upload:'Ảnh Admin bổ sung',dienlanh:'Điện lạnh',giupviec:'Giúp việc',lamvuon:'Làm vườn',suadien:'Sửa điện',suanuoc:'Sửa nước',thietbigiadinh:'Thiết bị gia dụng'};
export const VISIBLE_SIGNS = {...SIGNS,standing_water:'Nước đọng / ứ nước'};
export const IMAGE_FLAGS = {advertisement:'Ảnh quảng cáo',composite:'Ảnh tổng hợp / ghép nhiều ảnh'};
export const VISUAL_CONDITIONS = {not_reviewed:'Chưa xem dấu hiệu',abnormal_visible:'Có dấu hiệu nhìn thấy',no_visible_fault:'Không thấy dấu hiệu lỗi',uncertain:'Chưa chắc về dấu hiệu'};
export const REVIEW_ACTIONS = {confirm:'Xác nhận nhãn',correct:'Sửa nhãn',uncertain:'Chưa chắc chắn',reject:'Loại ảnh'};
export const STATUS_NAMES = {pending:'Chưa duyệt',confirmed:'Đã xác nhận nhãn',uncertain:'Chưa chắc chắn',rejected:'Đã loại ảnh',skipped:'Đã bỏ qua',out_of_scope:'Ngoài phạm vi'};
