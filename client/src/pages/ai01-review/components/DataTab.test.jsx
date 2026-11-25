import React from 'react';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor,within} from '@testing-library/react';
import DataTab from './DataTab';
import {ai01ReviewService as api} from '../../../services/ai01ReviewService';
vi.mock('../../../services/ai01ReviewService',()=>({ai01ReviewService:{read:vi.fn(),fastImage:vi.fn()}}));
vi.mock('./ImageReview',()=>({default:({item,children})=><div aria-label="Trình xem bounding box">{item.id}{children}</div>}));
const catalog={categories:[{id:'water',name:'Sửa nước'},{id:'power',name:'Sửa điện'}],targets:[{id:'tap',categoryId:'water',name:'Vòi nước'},{id:'socket',categoryId:'power',name:'Ổ cắm'}]};
const rows=Array.from({length:14},(_,i)=>({id:`img-${String(i).padStart(2,'0')}`,dataset:'suanuoc',status:i===0?'confirmed':i===1?'uncertain':i===2?'rejected':'pending',sourceLabelsVi:['Vòi rò nước'],qualityReview:i===3?{pending:true}:null}));
beforeEach(()=>{vi.stubGlobal('URL',{createObjectURL:vi.fn(()=> 'blob:test'),revokeObjectURL:vi.fn()});api.fastImage.mockResolvedValue(new Blob());api.read.mockImplementation(async(op,{imageId}={})=>op==='fast_items'?{items:rows}:op==='fast_catalog'?catalog:op==='fast_mappings'?{entries:[{dataset:'suanuoc',displayVi:{labelVi:'Vòi rò nước'},catalogTargetCandidates:[{targetId:'tap'}]}]}:{id:imageId,annotation:imageId==='img-00'?{targetIds:['socket'],visibleSigns:[],visualCondition:'no_visible_fault'}:null});});
afterEach(()=>{cleanup();vi.clearAllMocks();vi.unstubAllGlobals();});
it('uses saved Admin taxonomy for filters instead of source suggestions; paginates and resets',async()=>{
 render(<DataTab onLabel={vi.fn()}/>);await screen.findByRole('table');
 expect(screen.getAllByRole('row')).toHaveLength(13);
 const saved=screen.getByText('img-00').closest('tr');expect(within(saved).getByText('Admin đã xác nhận')).toBeTruthy();expect(within(saved).getByText('Sửa điện')).toBeTruthy();expect(within(saved).getByText('Không thấy dấu hiệu lỗi')).toBeTruthy();
 fireEvent.change(screen.getByLabelText('Danh mục'),{target:{value:'power'}});expect(screen.getAllByRole('row')).toHaveLength(2);
 fireEvent.click(screen.getByText('Xóa bộ lọc'));fireEvent.click(screen.getByText('Trang tiếp'));expect(screen.getByText('img-13')).toBeTruthy();
 fireEvent.change(screen.getByLabelText('Trạng thái kiểm tra'),{target:{value:'correction'}});expect(screen.getByText('img-03')).toBeTruthy();expect(screen.getAllByRole('row')).toHaveLength(2);
 fireEvent.change(screen.getByLabelText('Tìm kiếm ảnh'),{target:{value:'không tồn tại'}});expect(screen.getByText('Không tìm thấy ảnh phù hợp')).toBeTruthy();
});
it('opens details, closes with Escape, and passes the selected image to labeling without saving',async()=>{
 const onLabel=vi.fn();render(<DataTab onLabel={onLabel}/>);await screen.findByRole('table');fireEvent.click(screen.getByRole('button',{name:'Xem ảnh img-01'}));
 const dialog=screen.getByRole('dialog');await within(dialog).findByLabelText('Trình xem bounding box');
 fireEvent.click(within(dialog).getByText('Gán nhãn / Chỉnh sửa'));expect(onLabel).toHaveBeenCalledWith('img-01');
 fireEvent.keyDown(document,{key:'Escape'});expect(screen.queryByRole('dialog')).toBeNull();
 await waitFor(()=>expect(URL.revokeObjectURL).toHaveBeenCalled());
});
it('shows a recoverable error when reading data fails',async()=>{api.read.mockRejectedValueOnce(new Error('Không thể tải dữ liệu'));render(<DataTab onLabel={vi.fn()}/>);expect(await screen.findByRole('alert')).toBeTruthy();fireEvent.click(screen.getByText('Thử lại'));expect(await screen.findByRole('table')).toBeTruthy();});
