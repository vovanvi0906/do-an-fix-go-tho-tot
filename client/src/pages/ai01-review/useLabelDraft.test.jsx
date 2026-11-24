import React, {useState} from 'react';
import {render,fireEvent,screen,cleanup} from '@testing-library/react';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {useLabelDraft,draftKey,readDraft} from './useLabelDraft';
import {tokenStorage} from '../../services/storage/tokenStorage';
function Editor(){const [value,set]=useState({reason:''}); const draft=useLabelDraft('bbox','img-1','revision-1',value,set);return <><input aria-label="note" value={value.reason} onChange={e=>set({reason:e.target.value})}/><button onClick={draft.clear}>save</button><span>{draft.notice}</span></>;}
beforeEach(()=>{sessionStorage.clear();localStorage.clear();tokenStorage.setUser({id:'admin-1'});});
afterEach(cleanup);
it('restores unsaved work after unmount and login by the same account',()=>{const first=render(<Editor/>);fireEvent.change(screen.getByLabelText('note'),{target:{value:'Ổ cắm cháy'}});first.unmount();render(<Editor/>);expect(screen.getByLabelText('note').value).toBe('Ổ cắm cháy');expect(screen.getByText(/Đã khôi phục/)).toBeTruthy();});
it('isolates accounts and clears a saved draft',()=>{render(<Editor/>);fireEvent.change(screen.getByLabelText('note'),{target:{value:'private'}});const key=draftKey('bbox','img-1');expect(readDraft(key).value.reason).toBe('private');fireEvent.click(screen.getByText('save'));expect(readDraft(key)).toBeNull();cleanup();tokenStorage.setUser({id:'admin-2'});render(<Editor/>);expect(screen.getByLabelText('note').value).toBe('');});

it('does not silently replace a newer server revision with an old draft',()=>{const key=draftKey('bbox','img-1');sessionStorage.setItem(key,JSON.stringify({revision:'older',value:{reason:'old work'}}));const confirm=vi.spyOn(window,'confirm').mockReturnValue(false);render(<Editor/>);expect(screen.getByLabelText('note').value).toBe('');expect(readDraft(key).value.reason).toBe('old work');confirm.mockRestore();});
it('removes an abandoned draft when edits are undone to the original value',()=>{render(<Editor/>);fireEvent.change(screen.getByLabelText('note'),{target:{value:'edit'}});fireEvent.change(screen.getByLabelText('note'),{target:{value:''}});expect(readDraft(draftKey('bbox','img-1'))).toBeNull();});
