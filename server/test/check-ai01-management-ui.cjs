// Isolated JWT/DB fixtures and temporary state only. Never uses the owner's session.
const {spawn}=require('child_process'),path=require('path'),fs=require('fs'),{createRequire}=require('module');
const {chromium}=createRequire(path.resolve(__dirname,'../../client/package.json'))('@playwright/test');
(async()=>{let child,browser;const evidence=path.resolve(__dirname,'../../docs/ai01-admin/evidence/management');fs.mkdirSync(evidence,{recursive:true});try{
 child=spawn(process.execPath,[path.join(__dirname,'ai01-admin-harness.cjs')],{env:{...process.env,AI01_TEST_PORT:'3041'},stdio:['ignore','pipe','pipe']});let logs='';child.stdout.on('data',d=>logs+=d);child.stderr.on('data',d=>logs+=d);
 for(let n=0;n<100;n++){try{if((await fetch('http://127.0.0.1:3041/api/admin/ai01/access')).status===401)break;}catch{}if(child.exitCode!==null)throw Error(logs);await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({headless:true});const ctx=await browser.newContext({viewport:{width:1500,height:1080},acceptDownloads:true});
 await ctx.route('http://localhost:3000/api/**',async route=>{const u=new URL(route.request().url());const response=await route.fetch({url:'http://127.0.0.1:3041'+u.pathname+u.search});await route.fulfill({response});});
 const page=await ctx.newPage(),errors=[],writes=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.method()==='POST'&&r.url().includes('/actions/'))writes.push(r.url());});page.setDefaultTimeout(30000);
 await page.goto('http://127.0.0.1:5173/login');await page.locator('#account').fill('unassigned@ai01.invalid');await page.locator('#password').fill('Isolated-test-password-123');await page.getByRole('button',{name:/^đăng nhập$/i}).click();await page.waitForURL('**/admin/dashboard');
 await page.goto('http://127.0.0.1:5173/admin/ai01');await page.getByRole('heading',{name:'Quản lý AI',exact:true}).waitFor();
 await page.getByRole('tab',{name:'Dữ liệu',exact:true}).waitFor();
 if(await page.getByRole('tab').count()!==5)throw Error('Expected exactly five tabs');
 if(await page.locator('aside a[href^="/admin/ai01"]').count()!==1)throw Error('Sidebar was not consolidated');
 await page.getByRole('heading',{name:'Chuẩn hóa dataset & chuẩn bị training',exact:true}).waitFor();
 await page.getByRole('button',{name:'Xem ảnh cần duyệt chuẩn hóa',exact:true}).waitFor();
 await page.getByRole('button',{name:'Xem ảnh cần duyệt chuẩn hóa',exact:true}).click();
 if(await page.getByLabel('Lọc ảnh',{exact:true}).inputValue()!=='prepared')throw Error('Preparation queue filter failed');
 await page.getByText('Ảnh cần xem sau kiểm tra tự động',{exact:true}).waitFor();
 await page.getByLabel('Lọc ảnh',{exact:true}).selectOption('all');
 await page.getByText('Tra cứu toàn bộ 54 mapping TASK03B').waitFor();await page.waitForFunction(()=>document.querySelector('canvas')?.width>0);
 if(await page.getByRole('button',{name:'Lưu & ảnh tiếp theo',exact:true}).count())throw Error('Data view starts editing without an explicit action');
 await page.keyboard.press('c');if(writes.length)throw Error('Data view keyboard saved a label');
 await page.getByText('Điều hòa âm trần cassette',{exact:true}).first().waitFor();
 await page.screenshot({path:path.join(evidence,'01-data.png'),fullPage:true});
 await page.getByRole('button',{name:'Gán nhãn ngay tại ảnh này',exact:true}).click();
 if(await page.getByRole('tab',{name:'Dữ liệu',exact:true}).getAttribute('aria-selected')!=='true')throw Error('Inline annotation switched tabs');
 const first=await page.getByLabel('Chọn ảnh pilot',{exact:true}).inputValue();
 for(const name of ['Xác nhận nhãn','Sửa nhãn','Chưa chắc chắn','Loại ảnh'])await page.getByRole('radio',{name,exact:true}).waitFor();
 await page.getByRole('button',{name:'Lưu tại ảnh này',exact:true}).click();await page.getByRole('alert').filter({hasText:'Hãy chọn tình trạng quan sát'}).waitFor();if(writes.length)throw Error('Unreviewed observation was saved');
 await page.getByLabel('Dấu hiệu quan sát được',{exact:true}).selectOption('no_visible_fault');
 await page.getByRole('checkbox',{name:'Ảnh quảng cáo',exact:true}).check();await page.getByRole('checkbox',{name:'Ảnh tổng hợp / ghép nhiều ảnh',exact:true}).check();
 await page.getByRole('group',{name:'Đối tượng FixGo',exact:true}).locator('input[type="checkbox"]:not(:checked)').first().check();
 await page.getByRole('textbox',{name:'Ghi chú / lý do sửa'}).fill('TEMP UI fixture only: c r s u o');if(writes.length)throw Error('Typing triggered shortcut');
 await page.getByRole('textbox',{name:'Ghi chú / lý do sửa'}).blur();await page.keyboard.press('c');if(writes.length)throw Error('Choosing confirm auto-saved');await page.keyboard.press('e');
 await page.getByRole('textbox',{name:'Ghi chú / lý do sửa'}).blur();
 await page.screenshot({path:path.join(evidence,'07-inline-vietnamese-labeling.png'),fullPage:true});
 const saved=page.waitForResponse(r=>r.url().includes('/actions/fast_save'));await page.keyboard.press('Enter');const response=await saved;if(response.status()!==201)throw Error('Correction failed');
 const event=(await response.json()).data;if(event.reviewAction!=='correct'||event.visualCondition!=='no_visible_fault'||event.imageFlags.length!==2||event.visibleSigns.length)throw Error('Observation flags not saved');
 await page.waitForFunction(id=>document.querySelector('select[aria-label="Chọn ảnh pilot"]')?.value!==id,first);
 await page.getByRole('tab',{name:'Huấn luyện',exact:true}).click();await page.getByRole('button',{name:'Xuất solo-development đủ điều kiện',exact:true}).waitFor();if(await page.getByRole('button',{name:'Xuất solo-development đủ điều kiện',exact:true}).isEnabled())throw Error('Unreviewed label exported');
 await page.getByRole('button',{name:'Kiểm tra ảnh',exact:true}).first().click();await page.getByText('Kiểm tra điều kiện xuất (sau khi lưu nhãn)',{exact:true}).click();await page.getByRole('button',{name:'Đã kiểm tra — cho phép xuất SOLO',exact:true}).waitFor();
 if(await page.getByLabel('Chọn ảnh pilot',{exact:true}).inputValue()!==first)throw Error('Readiness link selected wrong image');
 for(const name of ['Bằng chứng quyền ảnh / license / attribution','Bằng chứng đã kiểm nguồn ảnh','Bằng chứng đã kiểm nhóm trùng / cùng cảnh','Kết luận kiểm tra nhãn và điều kiện xuất'])await page.getByRole('textbox',{name,exact:true}).fill('TEMP fixture evidence only, not real provenance');
 const checked=page.waitForResponse(r=>r.url().includes('/actions/fast_check'));await page.getByRole('button',{name:'Đã kiểm tra — cho phép xuất SOLO',exact:true}).click();if((await checked).status()!==201)throw Error('Evidence recheck failed');
 await page.getByText('Đã kiểm tra và ghi bằng chứng.',{exact:false}).waitFor();
 await page.getByText(/Lịch sử ảnh \(/).click();await page.getByText('Kiểm tra điều kiện xuất',{exact:true}).waitFor();await page.screenshot({path:path.join(evidence,'02-label-history.png'),fullPage:true});
 await page.getByRole('tab',{name:'Huấn luyện',exact:true}).click();const exportButton=page.getByRole('button',{name:'Xuất solo-development đủ điều kiện',exact:true});await exportButton.waitFor();await page.waitForFunction(()=>Array.from(document.querySelectorAll('button')).some(b=>b.textContent==='Xuất solo-development đủ điều kiện'&&!b.disabled));
 const downloading=page.waitForEvent('download');await exportButton.click();const download=await downloading;const records=fs.readFileSync(await download.path(),'utf8').trim().split('\n').map(JSON.parse);if(records.length!==1||records[0].datasetType!=='solo-development'||records[0].approvedGroundTruth!==false||records[0].developmentCheck.partition!=='development'||records[0].visualCondition!=='no_visible_fault'||records[0].imageFlags.length!==2)throw Error('Wrong export contract');
 await page.getByRole('status').waitFor();await page.screenshot({path:path.join(evidence,'03-training-export.png'),fullPage:true});
 await page.getByRole('tab',{name:'Gán nhãn',exact:true}).click();
 await page.getByLabel('Lọc ảnh',{exact:true}).selectOption('pending');
 await page.getByRole('button',{name:'Lưu tại ảnh này',exact:true}).waitFor();
 await page.waitForFunction(id=>document.querySelector('select[aria-label="Chọn ảnh pilot"]')?.value!==id,first);
 const stayed=await page.getByLabel('Chọn ảnh pilot',{exact:true}).inputValue();
 await page.getByRole('radio',{name:'Chưa chắc chắn',exact:true}).check();
 const savedHere=page.waitForResponse(r=>r.url().includes('/actions/fast_save'));await page.getByRole('button',{name:'Lưu tại ảnh này',exact:true}).click();if((await savedHere).status()!==201)throw Error('Save without advancing failed');
 await page.getByRole('status').waitFor();if(await page.getByLabel('Chọn ảnh pilot',{exact:true}).inputValue()!==stayed)throw Error('Save at current image advanced under pending filter');
 if(await page.getByLabel('Lọc ảnh',{exact:true}).inputValue()!=='all')throw Error('Current image is hidden by pending filter after save');
 for(const [tab,title,file] of [['Đánh giá','Tập kiểm thử độc lập','04-evaluation.png'],['Triển khai','Chọn model, thử inference và triển khai','05-deployment.png']]){
  await page.getByRole('tab',{name:tab,exact:true}).click();await page.getByRole('heading',{name:title,exact:true}).waitFor();await page.getByText('Chưa hỗ trợ từ Admin Web',{exact:true}).waitFor();
  if(await page.getByRole('tabpanel').getByRole('button').count())throw Error('Unsupported tab has action buttons');await page.screenshot({path:path.join(evidence,file),fullPage:true});
 }
 for(const [legacy,tab] of [['solo','Gán nhãn'],['export','Huấn luyện'],['permissions','Dữ liệu']]){await page.goto('http://127.0.0.1:5173/admin/ai01/'+legacy);await page.getByRole('tab',{name:tab,exact:true}).waitFor();if(await page.getByRole('tab',{name:tab,exact:true}).getAttribute('aria-selected')!=='true')throw Error('Legacy route did not redirect');}
 // Narrow viewport: the single AI entry and scrollable tab bar remain usable.
 await page.setViewportSize({width:390,height:844});await page.waitForFunction(()=>document.querySelector('aside')?.getBoundingClientRect().right<=1);await page.getByRole('tab',{name:'Triển khai',exact:true}).click();await page.getByRole('heading',{name:'Chọn model, thử inference và triển khai',exact:true}).waitFor();await page.screenshot({path:path.join(evidence,'06-mobile.png'),fullPage:true});
 if(errors.length)throw Error(errors.join(';'));
 const result={status:'passed',tabs:5,sidebarAiEntries:1,readOnlyDataByDefault:true,inlineLabelingInDataTab:true,preparedDatasetProgress:true,preparedQueueFilter:true,vietnameseLabels:true,explicitSave:true,saveWithoutAdvance:true,imageFlags:true,visualCondition:true,mappingCount:54,manualCorrection:true,shortcut:true,saveAndNext:true,quarantineBlocksExport:true,evidenceCheck:true,history:true,soloExport:true,noUnsupportedActionButtons:true,legacyRedirects:true,mobile:true,jsErrors:errors,isolatedAuthAndTemporaryState:true};fs.writeFileSync(path.join(evidence,'browser-results.json'),JSON.stringify(result,null,2));console.log('PASS unified management browser workflow',JSON.stringify(result));
 }catch(e){if(browser){const p=browser.contexts()[0]?.pages()[0];if(p)await p.screenshot({path:path.join(evidence,'failure.png'),fullPage:true}).catch(()=>{});}throw e;}
 finally{if(browser){for(const context of browser.contexts())await context.unrouteAll({behavior:'wait'});await browser.close();}if(child&&child.exitCode===null){child.kill('SIGTERM');await new Promise(r=>child.once('exit',r));}}})().catch(e=>{console.error(e);process.exitCode=1;});
