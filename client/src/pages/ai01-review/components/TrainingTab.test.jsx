import React from 'react';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor,within} from '@testing-library/react';
import TrainingTab from './TrainingTab';
import {ai01ReviewService as api} from '../../../services/ai01ReviewService';
vi.mock('../../../services/ai01ReviewService',()=>({ai01ReviewService:{read:vi.fn(),save:vi.fn(),fastDownload:vi.fn()}}));
const stats=(train,val,ok)=>({images:train+val,trainImages:train,valImages:val,groupOverlap:0,allClassesMeetTrialMinimum:ok,classes:[{key:'a',name:'Lớp thử nghiệm',trainImages:train,valImages:val,enoughForExploratoryTrial:ok}]});
let prepared,readiness;
beforeEach(()=>{prepared={available:true,summary:{exportRoot:'/immutable/ai01-prepared-v1',createdAt:'2026-11-22T00:00:00Z',tasks:{object_detection:stats(20,4,false),category_classification:stats(40,10,true),visible_sign_detection:stats(0,0,false)}}};readiness={items:[{imageId:'img-00000',eligible:false,decision:'confirmed',blockers:['Quarantine: thiếu bằng chứng quyền ảnh']}],eligibleCount:0,quarantineCount:1,totalImages:100};api.read.mockImplementation(async op=>op==='fast_preparation'?prepared:readiness);});
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.clearAllMocks();vi.unstubAllGlobals();});
it('shows four sections, real per-task counts, only supported dataset tasks and honest unavailable training',async()=>{
 render(<TrainingTab capability={{supported:false}}/>);await screen.findByText('ai01-prepared-v1 · Nhãn nguồn phát triển');
 for(const name of ['A. Bộ dữ liệu','B. Mô hình và tác vụ','C. Cấu hình huấn luyện','D. Tiến trình và lịch sử'])expect(screen.getByRole('heading',{name})).toBeTruthy();
 expect(within(screen.getByLabelText('Tác vụ')).queryByText('Nhận diện dấu hiệu lỗi')).toBeNull();expect(screen.getByText('Chưa đạt điều kiện dữ liệu cho thử nghiệm')).toBeTruthy();
 expect(screen.getByLabelText('Epochs').value).toBe('10');expect(screen.getByLabelText('Image size').value).toBe('640');expect(screen.getByLabelText('Batch size').value).toBe('8');expect(screen.getByLabelText('Thiết bị CPU/GPU').value).toBe('CPU');
 expect(screen.getByRole('button',{name:'Bắt đầu huấn luyện'}).disabled).toBe(true);expect(screen.getByLabelText('Model pretrained').disabled).toBe(true);expect(api.save).not.toHaveBeenCalled();
 fireEvent.change(screen.getByLabelText('Tác vụ'),{target:{value:'category_classification'}});expect(screen.getByLabelText('Image size').value).toBe('224');expect(screen.getByText('Đạt ngưỡng số lượng cho thử nghiệm')).toBeTruthy();expect(screen.getByText('Accuracy / F1')).toBeTruthy();expect(screen.queryByRole('progressbar')).toBeNull();expect(screen.getByRole('button',{name:'Bắt đầu huấn luyện'}).disabled).toBe(true);
});
it('explains blockers and rechecks only existing read APIs; keeps review links and export gate',async()=>{
 const onReview=vi.fn();render(<TrainingTab onReview={onReview}/>);await screen.findByLabelText('Tác vụ');await waitFor(()=>expect(screen.getByRole('button',{name:'Kiểm tra dữ liệu'}).disabled).toBe(false));
 fireEvent.click(screen.getByRole('button',{name:'Xem lý do chưa thể train'}));expect(screen.getByText(/1 lớp chưa đạt ngưỡng thử nghiệm/)).toBeTruthy();fireEvent.click(screen.getByRole('button',{name:'Mở tab Gán nhãn'}));expect(onReview).toHaveBeenCalledWith();
 fireEvent.click(screen.getByRole('button',{name:'Kiểm tra ảnh'}));expect(onReview).toHaveBeenCalledWith('img-00000');expect(screen.getByRole('button',{name:'Xuất solo-development đủ điều kiện'}).disabled).toBe(true);
 fireEvent.click(screen.getByRole('button',{name:'Kiểm tra dữ liệu'}));await screen.findByRole('status');expect(api.read.mock.calls.filter(([op])=>op==='fast_preparation')).toHaveLength(2);expect(api.read.mock.calls.filter(([op])=>op==='fast_readiness')).toHaveLength(2);expect(api.save).not.toHaveBeenCalled();
});
it('handles a preparation failure independently and recovers without inventing datasets or history',async()=>{
 api.read.mockImplementation(async op=>{if(op==='fast_preparation')throw new Error('Báo cáo không hợp lệ');return readiness;});render(<TrainingTab/>);await screen.findByRole('alert');expect(screen.getByLabelText('Tác vụ').disabled).toBe(true);expect(screen.getByText('Chưa kết nối lịch sử huấn luyện.')).toBeTruthy();expect(screen.getByRole('button',{name:'Kiểm tra ảnh'})).toBeTruthy();api.read.mockImplementation(async op=>op==='fast_preparation'?prepared:readiness);fireEvent.click(screen.getByRole('button',{name:'Kiểm tra dữ liệu'}));await screen.findByText('ai01-prepared-v1 · Nhãn nguồn phát triển');expect(screen.queryByRole('alert')).toBeNull();
});
it('does not call a prepared dataset trainable when leakage is reported',async()=>{prepared.summary.tasks.object_detection={...stats(30,10,true),groupOverlap:2};render(<TrainingTab/>);await screen.findByText('Chưa đạt điều kiện dữ liệu cho thử nghiệm');fireEvent.click(screen.getByRole('button',{name:'Xem lý do chưa thể train'}));expect(screen.getByText(/Có nhóm ảnh giao giữa train và validation/)).toBeTruthy();});
it('preserves explicit gated export through the old API, including server rejections',async()=>{
 readiness.eligibleCount=1;readiness.items[0].eligible=true;api.save.mockRejectedValueOnce(new Error('Checksum không khớp'));render(<TrainingTab/>);await waitFor(()=>expect(screen.getByRole('button',{name:'Xuất solo-development đủ điều kiện'}).disabled).toBe(false));fireEvent.click(screen.getByRole('button',{name:'Xuất solo-development đủ điều kiện'}));await screen.findByText('Checksum không khớp');expect(api.save).toHaveBeenCalledWith('fast_export',{});expect(api.fastDownload).not.toHaveBeenCalled();expect(screen.queryByText(/Đã xuất 1 ảnh/)).toBeNull();
});
