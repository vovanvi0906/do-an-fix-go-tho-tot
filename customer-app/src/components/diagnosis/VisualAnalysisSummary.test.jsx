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
