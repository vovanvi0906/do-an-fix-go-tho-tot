import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import VisualAnalysisSummary from './VisualAnalysisSummary';
const result={visualAnalysisStatus:'suggestions',visualServiceSuggestions:[{visualEvidence:[{name:'Vết cháy/xém',boxes:[{xyxy:[.2,.1,.4,.3],confidence:.9}]}]}]};
it('shows server evidence and correctly fits boxes to a portrait image',()=>{
 const screen=render(<VisualAnalysisSummary result={result} imageUri="file:///outlet.jpg"/>);
 fireEvent(screen.getByLabelText('Ảnh khách hàng gửi để phân tích'),'load',{nativeEvent:{source:{width:100,height:200}}});
 const image=screen.getByLabelText('Ảnh khách hàng gửi để phân tích');
 fireEvent(image.parent,'layout',{nativeEvent:{layout:{width:300}}});
 const box=screen.getByTestId('visual-evidence-box');
 expect(box.props.style.left).toBeCloseTo(114);expect(box.props.style.top).toBeCloseTo(24);
 fireEvent.press(screen.getByText('Ẩn khung dấu hiệu'));expect(screen.queryByTestId('visual-evidence-box')).toBeNull();
});
it('reports unavailable analysis without treating the device as fault-free',()=>{
 const screen=render(<VisualAnalysisSummary result={{...result,visualAnalysisStatus:'unavailable'}}/>);
 expect(screen.getByText(/Chưa thể phân tích/)).toBeTruthy();expect(screen.queryByTestId('visual-evidence-box')).toBeNull();expect(screen.queryByText('Vết cháy/xém')).toBeNull();
});
it('does not invent labels when the API has no fault evidence',()=>{
 const screen=render(<VisualAnalysisSummary result={{visualAnalysisStatus:'no_evidence'}}/>);
 expect(screen.getByText(/không có nghĩa thiết bị không có lỗi/)).toBeTruthy();
});
it('ignores malformed or out-of-image boxes',()=>{
 const screen=render(<VisualAnalysisSummary result={{visualAnalysisStatus:'suggestions',visualServiceSuggestions:[{visualEvidence:[{name:'Test',boxes:[{xyxy:[0,0,2,2]},{xyxy:[.5,.5,.1,.1]}]}]}]}}/>);
 expect(screen.queryByText('Ẩn khung dấu hiệu')).toBeNull();
});
it('shows unverified multiservice regions even when approved service analysis is disabled',()=>{
 const raw={status:'proposed',labelStatus:'AI_UNVERIFIED',proposals:[{name:'Vết nứt',xyxy:[.2,.1,.4,.3],geometryType:'visible_region'}]};
 const screen=render(<VisualAnalysisSummary result={{visualAnalysisStatus:'disabled',observableAnalysis:raw}} imageUri="file:///wall.jpg"/>);
 expect(screen.getByText(/Dấu hiệu AI nghi ngờ: Vết nứt/)).toBeTruthy();expect(screen.queryByText(/hiện chưa được bật/)).toBeNull();
 fireEvent(screen.getByLabelText('Ảnh khách hàng gửi để phân tích'),'load',{nativeEvent:{source:{width:100,height:200}}});
 fireEvent(screen.getByLabelText('Ảnh khách hàng gửi để phân tích').parent,'layout',{nativeEvent:{layout:{width:300}}});
 expect(screen.getByTestId('visual-evidence-box')).toBeTruthy();expect(screen.getByText('Nghi: Vết nứt')).toBeTruthy();
});
it('does not imply normal when the multiservice observer finds no evidence',()=>{
 const screen=render(<VisualAnalysisSummary result={{observableAnalysis:{status:'no_detection',labelStatus:'AI_UNVERIFIED',proposals:[]}}}/>);
 expect(screen.getByText(/không có nghĩa thiết bị không có lỗi/)).toBeTruthy();
});
it('explains whole-device context boxes and partial analysis without confirming a fault',()=>{
 const screen=render(<VisualAnalysisSummary result={{observableAnalysis:{status:'proposed',labelStatus:'AI_UNVERIFIED',degradedModels:['crack'],proposals:[{name:'Ổ cắm có dấu cháy',xyxy:[0,0,1,1],geometryType:'device_context'}]}}}/>);
 expect(screen.getByText(/chưa khoanh riêng vùng hỏng/)).toBeTruthy();expect(screen.getByText(/Một phần phân tích/)).toBeTruthy();
});
it('discloses unsupported signs instead of implying a complete fault inspection',()=>{
 const screen=render(<VisualAnalysisSummary result={{observableAnalysis:{status:'no_detection',labelStatus:'AI_UNVERIFIED',proposals:[],unavailableSigns:[{name:'Tia nước'}]}}}/>);
 expect(screen.getByText(/Chưa nhận diện đủ tin cậy: Tia nước/)).toBeTruthy();
});
it('keeps the limited-evaluation warning instead of presenting tested AI as a complete inspection',()=>{
 const screen=render(<VisualAnalysisSummary result={{observableAnalysis:{status:'no_detection',labelStatus:'AI_UNVERIFIED',proposals:[],evaluationStatus:'limited_scope_evaluated',evaluationSampleCount:91}}}/>);
 expect(screen.getByText(/AI còn có thể bỏ sót dấu hiệu/)).toBeTruthy();expect(screen.getByText(/không có nghĩa thiết bị không có lỗi/)).toBeTruthy();
});
it('dismisses a wrong image proposal locally, supports undo, and resets for another request',()=>{
 const proposal={code:'crack',name:'Vết nứt',xyxy:[.2,.1,.4,.3]};const result={requestId:'first',observableAnalysis:{status:'proposed',labelStatus:'AI_UNVERIFIED',proposals:[proposal]}};
 const screen=render(<VisualAnalysisSummary result={result} imageUri="file:///wall.jpg"/>);
 fireEvent.press(screen.getByLabelText('Bỏ gợi ý Vết nứt'));expect(screen.queryByText(/Dấu hiệu AI nghi ngờ: Vết nứt/)).toBeNull();expect(screen.getByText(/Bạn đã bỏ các gợi ý chưa đúng/)).toBeTruthy();
 fireEvent.press(screen.getByText('Hoàn tác bỏ gợi ý (1)'));expect(screen.getByText(/Dấu hiệu AI nghi ngờ: Vết nứt/)).toBeTruthy();
 fireEvent.press(screen.getByLabelText('Bỏ gợi ý Vết nứt'));screen.rerender(<VisualAnalysisSummary result={{...result,requestId:'second'}} imageUri="file:///wall.jpg"/>);expect(screen.getByText(/Dấu hiệu AI nghi ngờ: Vết nứt/)).toBeTruthy();
});
