import React from 'react';
import { render,fireEvent } from '@testing-library/react-native';
import SymptomQuestionSection from './SymptomQuestionSection';
const questions=[{id:'symptomId',label:'Thiết bị đang gặp tình trạng nào?',options:[{value:'approved-crack-id',label:'Vết nứt nhìn thấy',code:'crack',kind:'VISUAL_OBSERVABLE'},{value:'reported-power-id',label:'Không lên nguồn',kind:'USER_REPORTED'}]}];
it('requires an explicit observation and submits the approved symptom ID',()=>{
 const answer=jest.fn();const screen=render(<SymptomQuestionSection questions={questions} onAnswerQuestion={answer}/>);
 expect(answer).not.toHaveBeenCalled();fireEvent.press(screen.getByText('Vết nứt nhìn thấy'));expect(answer).toHaveBeenCalledWith('symptomId','approved-crack-id');
});
it('unknown observations do not confirm a symptom or mark a device normal',()=>{
 const answer=jest.fn();const screen=render(<SymptomQuestionSection questions={questions} onAnswerQuestion={answer}/>);
 fireEvent.press(screen.getByText('Không thấy rõ / chưa xác định'));expect(answer).not.toHaveBeenCalled();expect(screen.getByText(/Không cần đoán dấu hiệu/)).toBeTruthy();fireEvent.press(screen.getByText('Không lên nguồn'));expect(answer).toHaveBeenCalledWith('symptomId','reported-power-id');
});
