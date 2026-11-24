import React from 'react';
import {render,fireEvent,waitFor} from '@testing-library/react-native';
import DiagnosisChoices from './DiagnosisChoices';
import {diagnoseIssueImage} from '../../services/api/aiService';
jest.mock('../../services/api/aiService',()=>({diagnoseIssueImage:jest.fn()}));
jest.mock('../../services/api/catalogService',()=>({catalogService:{getCategories:jest.fn().mockResolvedValue([])}}));
const result={imageUrl:'https://example.test/outlet.jpg',status:'needs_more_info',suggestedCategoryId:'electrical',target:null,availableCategories:[{id:'electrical',name:'Sửa điện'}],availableTargets:[],visualServiceSuggestions:[{id:'inspect',categoryId:'electrical',targetId:'outlet',targetName:'Ổ cắm',name:'Kiểm tra ổ cắm',reason:'Dấu hiệu cháy sém, cần thợ kiểm tra',confidence:null,requiresInspection:true}]};
beforeEach(()=>{jest.clearAllMocks();diagnoseIssueImage.mockResolvedValue({status:'suggested',suggestedServiceId:'inspect'});});
it('shows suggestions immediately, but never auto-selects or confirms a symptom',async()=>{
 const onResult=jest.fn();const screen=render(<DiagnosisChoices result={result} onResult={onResult}/>);
 expect(screen.getByText('Dịch vụ gợi ý từ dấu hiệu trong ảnh')).toBeTruthy();expect(screen.getByText('Kiểm tra ổ cắm')).toBeTruthy();expect(diagnoseIssueImage).not.toHaveBeenCalled();
 fireEvent.press(screen.getByText('Chọn dịch vụ này'));await waitFor(()=>expect(onResult).toHaveBeenCalled());
 expect(diagnoseIssueImage).toHaveBeenCalledWith(result.imageUrl,'',{categoryId:'electrical',targetId:'outlet',serviceId:'inspect'});
});
it('has no visual fault suggestion when evidence or a model is unavailable',()=>{const screen=render(<DiagnosisChoices result={{...result,visualServiceSuggestions:[],visualAnalysisStatus:'unavailable'}} onResult={jest.fn()}/>);expect(screen.queryByText('Dịch vụ gợi ý từ dấu hiệu trong ảnh')).toBeNull();expect(screen.getByText('Đổi / chọn danh mục')).toBeTruthy();});
it('keeps an API rejection visible rather than claiming a successful service selection',async()=>{diagnoseIssueImage.mockRejectedValueOnce(new Error('Dịch vụ đã ngừng hoạt động'));const onResult=jest.fn();const screen=render(<DiagnosisChoices result={result} onResult={onResult}/>);fireEvent.press(screen.getByText('Chọn dịch vụ này'));await waitFor(()=>expect(screen.getByText('Dịch vụ đã ngừng hoạt động')).toBeTruthy());expect(onResult).not.toHaveBeenCalled();});
