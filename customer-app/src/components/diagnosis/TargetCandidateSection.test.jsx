import React from 'react';
import { render,fireEvent } from '@testing-library/react-native';
import TargetCandidateSection from './TargetCandidateSection';
const targets=[{id:'socket-id',name:'Ổ cắm điện',slug:'o-cam-dien'},{id:'ac-id',name:'Máy lạnh / Điều hòa',slug:'may-lanh'}];
it('searches without Vietnamese accents and sends the actual catalog ID',()=>{
 const choose=jest.fn();const screen=render(<TargetCandidateSection result={{availableTargets:targets}} onSelectTarget={choose}/>);
 fireEvent.changeText(screen.getByLabelText('Tìm thiết bị'),'o cam');
 expect(screen.queryByText('Máy lạnh / Điều hòa')).toBeNull();fireEvent.press(screen.getByText('Ổ cắm điện'));expect(choose).toHaveBeenCalledWith('socket-id');
});
it('offers correction when the suggested device is wrong, with a no-match state',()=>{
 const screen=render(<TargetCandidateSection result={{suggestedTargetId:'ac-id',suggestedTargetName:'Máy lạnh',availableTargets:targets}} onSelectTarget={jest.fn()}/>);
 fireEvent.press(screen.getByText('Không đúng thiết bị'));fireEvent.changeText(screen.getByLabelText('Tìm thiết bị'),'không có thiết bị này');expect(screen.getByText(/Không tìm thấy thiết bị phù hợp/)).toBeTruthy();
});
it('shows ambiguous AI options first without preselecting one',()=>{
 const choose=jest.fn();const screen=render(<TargetCandidateSection result={{aiTargetOptions:[{id:'socket-id',name:'Ổ cắm điện'},{id:'smart-id',name:'Ổ cắm thông minh'}],availableTargets:targets}} onSelectTarget={choose}/>);
 expect(screen.getByText(/AI chưa chắc chắn/)).toBeTruthy();expect(screen.queryByText('Đúng thiết bị này')).toBeNull();
 fireEvent.press(screen.getByText('Ổ cắm thông minh'));expect(choose).toHaveBeenCalledWith('smart-id');
});
